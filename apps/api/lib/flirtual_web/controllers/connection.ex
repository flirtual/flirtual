defmodule FlirtualWeb.ConnectionController do
  use FlirtualWeb, :controller
  use Flirtual.Logger, :connection

  import Plug.Conn
  import Phoenix.Controller
  import Ecto.Changeset
  import Flirtual.Utilities

  alias Flirtual.{Connection, Discord, Flag, Hash, Jwt, Repo, User, Users}
  alias Flirtual.User.Login
  alias FlirtualWeb.SessionController

  action_fallback(FlirtualWeb.FallbackController)

  def list_available(conn, _) do
    conn
    |> json(Connection.list_available(conn.assigns[:session].user))
  end

  # JSON authorize is only used by the native app: the provider redirects to
  # the app-scheme deep link, resolved by openSecureWindow.
  def authorize(
        conn,
        %{"type" => type, "prompt" => prompt, "next" => next, "json" => json} = params
      )
      when not is_nil(json) do
    type = to_atom(type)

    with {:ok, provider} <- Connection.provider(type),
         {:ok, state} <- generate_oauth_state(conn, next, truthy?(params["notifications"])),
         {:ok, authorize_url} <-
           provider.authorize_url(conn, %{prompt: prompt, redirect: :app, state: state}) do
      conn
      |> json(%{
        authorize_url: authorize_url |> URI.to_string(),
        redirect_uri: provider.redirect_url!(redirect: :app)
      })
    else
      {:error, :provider_not_found} ->
        {:error, {:not_found, :provider_not_found, %{type: type}}}

      {:error, :not_supported} ->
        {:error, {:bad_request, :authorize_not_supported, %{type: type}}}

      reason ->
        reason
    end
  end

  def authorize(conn, %{"type" => type, "prompt" => prompt, "next" => next} = params) do
    type = to_atom(type)

    with {:ok, provider} <- Connection.provider(type),
         {:ok, state} <- generate_oauth_state(conn, next, truthy?(params["notifications"])),
         {:ok, authorize_url} <- provider.authorize_url(conn, %{prompt: prompt, state: state}) do
      conn
      |> redirect(external: authorize_url |> URI.to_string())
    else
      {:error, :provider_not_found} ->
        {:error, {:not_found, :provider_not_found, %{type: type}}}

      {:error, :not_supported} ->
        {:error, {:bad_request, :authorize_not_supported, %{type: type}}}

      reason ->
        reason
    end
  end

  # Query parameters arrive as strings, JSON bodies as booleans.
  defp truthy?(value), do: value in [true, "true", "1"]

  # Generate a signed state token containing user_id, next URL, and newsletter
  # opt-in. This preserves context across OAuth callbacks that don't send
  # cookies (e.g., Apple's form_post).
  defp generate_oauth_state(conn, next, notifications) do
    user_id = if conn.assigns[:session], do: conn.assigns[:session].user_id, else: nil

    %{
      "user_id" => user_id,
      "next" => next,
      "notifications" => if(notifications, do: true)
    }
    |> Map.reject(fn {_, value} -> is_nil(value) end)
    |> then(&Jwt.sign(Jwt.config("oauth-state"), &1))
  end

  # Decode and verify the state token from OAuth callback
  defp verify_oauth_state(state) when is_binary(state) do
    case Jwt.verify(Jwt.config("oauth-state"), state) do
      {:ok, claims} ->
        {:ok,
         %{
           user_id: claim(claims, "user_id"),
           next: claim(claims, "next"),
           notifications: truthy?(claim(claims, "notifications"))
         }}

      error ->
        error
    end
  end

  defp claim(claims, key) do
    case claims[key] do
      :null -> nil
      value -> value
    end
  end

  defp verify_oauth_state(_state), do: {:error, :invalid_state}

  def delete(conn, %{"type" => type}) do
    type = to_atom(type)

    with :ok <- Connection.delete(conn.assigns[:session].user.id, type) do
      conn |> json(%{deleted: true})
    end
  end

  defp grant_next(conn, redirect_type, next \\ nil) do
    next = if(next, do: next, else: get_session(conn, :next))

    conn
    |> delete_session(:next)
    |> put_resp_header("access-control-expose-headers", "location")
    |> put_resp_header(
      "location",
      next || Application.fetch_env!(:flirtual, :frontend_origin)
    )
    |> resp(if(redirect_type == "app", do: 200, else: 303), "")
    |> halt()
  end

  defp grant_error(conn, redirect_type, message, type \\ nil, connection \\ nil, next \\ nil) do
    if type do
      user_id = if connection && connection.user, do: connection.user.id, else: nil
      Flirtual.User.Login.log_login_attempt(conn, user_id, nil, method: type)
    end

    conn
    |> delete_session(:next)
    |> put_resp_header("access-control-expose-headers", "location")
    |> put_resp_header(
      "location",
      Application.fetch_env!(:flirtual, :frontend_origin)
      |> URI.merge(next || get_session(conn, :next) || "/login")
      |> URI.append_query("error=" <> to_string(message))
      |> URI.to_string()
    )
    |> resp(if(redirect_type == "app", do: 200, else: 303), "")
    |> halt()
  end

  defp app_grant_redirect(conn, params) do
    query =
      params
      |> Map.reject(fn {_, value} -> is_nil(value) end)
      |> URI.encode_query()

    conn
    |> redirect(
      external: Application.fetch_env!(:flirtual, :app_scheme) <> "://apple-login?" <> query
    )
    |> halt()
  end

  # Native Android flow - Apple form_posts the authorization code here; exchange
  # it and send the tokens back to the app via deep link, where the SocialLogin
  # plugin resolves them and the app then calls the JSON grant with the id_token.
  # Android must be specified in the type instead of a separate query parameter
  # because the plugin embeds the redirect in the authorize URL without encoding
  # and drops extra &params.
  def grant(conn, %{"type" => "apple_android", "code" => code}) do
    case Flirtual.Apple.exchange_code(code, platform: :android) do
      {:ok, tokens} ->
        app_grant_redirect(conn, %{
          success: true,
          id_token: tokens.id_token,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token
        })

      {:error, reason} ->
        log(:error, [:grant, :apple_android], reason: reason)
        app_grant_redirect(conn, %{success: false})
    end
  end

  # The user cancelled or Apple returned an error
  def grant(conn, %{"type" => "apple_android"}) do
    app_grant_redirect(conn, %{success: false})
  end

  # OAuth redirect flow - error from provider
  def grant(conn, %{"error" => error}) do
    grant_error(conn, "auto", error)
  end

  # OAuth redirect flow - exchange code for tokens
  def grant(conn, %{"type" => type, "code" => code} = params) do
    type = to_atom(type)
    redirect_type = params["redirect"] || "auto"

    case verify_oauth_state(params["state"]) do
      {:ok, state_data} ->
        # Errors while linking return to the originating page; errors while
        # logging in fall back to /login.
        error_next = if state_data.user_id, do: state_data.next

        # `redirect=app` grants are fetch calls from the native app: the token
        # exchange's redirect_uri must match the app-scheme deep link used at
        # authorization, and the response is a 200 whose location header the
        # app reads itself (a 303 would make fetch follow it).
        with {:ok, provider} <- Connection.provider(type),
             {:ok, authorization} <-
               provider.exchange_code(code,
                 redirect: if(redirect_type == "app", do: :app, else: true),
                 state: params["state"]
               ),
             {:ok, profile} <- provider.get_profile(authorization) do
          # Try session first, fall back to user_id from state (for Apple's form_post)
          user =
            cond do
              conn.assigns[:session] ->
                conn.assigns[:session].user

              state_data.user_id ->
                Users.get(state_data.user_id)

              true ->
                nil
            end

          handle_grant(conn, user, profile, type,
            response: :redirect,
            redirect_type: redirect_type,
            next: state_data.next,
            notifications: state_data.notifications
          )
        else
          {:error, :unverified_email} ->
            grant_error(conn, redirect_type, :connection_verify_email, nil, nil, error_next)

          {:error, :provider_not_found} ->
            grant_error(conn, redirect_type, :provider_not_found, nil, nil, error_next)

          {:error, :not_supported} ->
            grant_error(conn, redirect_type, :authorize_not_supported, nil, nil, error_next)

          {:error, :invalid_grant} ->
            grant_error(conn, redirect_type, :invalid_grant, type, nil, error_next)

          {:error, :upstream} ->
            grant_error(conn, redirect_type, :upstream_error, type, nil, error_next)

          {:error, {status, message}} when is_atom(status) and is_binary(message) ->
            grant_error(conn, redirect_type, message, type, nil, error_next)

          reason ->
            log(:error, [:grant], reason: reason)
            grant_error(conn, redirect_type, :internal_server_error, type, nil, error_next)
        end

      _ ->
        grant_error(conn, redirect_type, :state_mismatch, type)
    end
  end

  # Native SDK flow - verify id_token directly
  def grant(conn, %{"type" => type, "id_token" => _} = params) do
    type = to_atom(type)

    with {:ok, _provider} <- Connection.provider(type),
         {:ok, profile} <- verify_token(type, params) do
      user = conn.assigns[:session] && conn.assigns[:session].user

      handle_grant(conn, user, profile, type,
        response: :json,
        device_id: params["device_id"],
        notifications: truthy?(params["notifications"])
      )
    else
      {:error, :provider_not_found} ->
        {:error, {:bad_request, :provider_not_found, %{type: type}}}

      {:error, :not_supported} ->
        {:error, {:bad_request, :native_login_not_supported, %{type: type}}}

      {:error, :invalid_token} ->
        Login.log_login_attempt(conn, nil, nil, method: type)
        {:error, {:unauthorized, :invalid_token}}

      {:error, :token_expired} ->
        Login.log_login_attempt(conn, nil, nil, method: type)
        {:error, {:unauthorized, :token_expired}}

      {:error, :unverified_email} ->
        {:error, {:bad_request, :connection_verify_email}}

      {:error, :missing_token} ->
        {:error, {:bad_request, :missing_token}}

      {:error, reason} when is_atom(reason) ->
        log(:error, [:grant], reason: reason)
        {:error, {:unauthorized, reason}}
    end
  end

  # Verify id_token from native SDK (Apple, Google, etc.)
  defp verify_token(:apple, params) do
    id_token = params["id_token"]

    if is_nil(id_token) or id_token == "" do
      {:error, :missing_token}
    else
      case Flirtual.Apple.verify_native_token(id_token, params["authorization_code"]) do
        {:ok, claims} ->
          {:ok,
           %{
             uid: claims["sub"],
             email: claims["email"],
             # Apple doesn't provide a display name, use email
             display_name: claims["email"],
             avatar: nil
           }}

        error ->
          error
      end
    end
  end

  defp verify_token(:google, params) do
    id_token = params["id_token"]

    if is_nil(id_token) or id_token == "" do
      {:error, :missing_token}
    else
      case Flirtual.Google.verify_native_token(id_token) do
        {:ok, claims} -> {:ok, Flirtual.Google.profile(claims)}
        error -> error
      end
    end
  end

  defp verify_token(type, _params) do
    log(:warning, [:verify_token], "Native login not implemented for #{type}")
    {:error, :not_supported}
  end

  # Core grant logic - handles all connection scenarios
  defp handle_grant(conn, user, profile, type, options) do
    connection = Connection.get(uid: profile.uid, type: type)

    case {user, connection} do
      # Logged-in user, no existing connection -> link it
      {%User{} = user, nil} ->
        link_connection(conn, user, profile, type, options)

      # Logged-in user, connection already linked to them -> no-op
      {%User{id: user_id}, %Connection{user: %User{id: conn_user_id}}}
      when user_id == conn_user_id ->
        respond_success(conn, options, :already_linked)

      # Logged-in user, connection linked to different user -> transfer
      {%User{} = user, %Connection{user: %User{id: other_user_id}} = connection}
      when user.id != other_user_id ->
        transfer_connection(conn, user, connection, profile, type, options)

      # Not logged in, connection exists for active user -> log them in
      {nil, %Connection{user: %User{banned_at: nil} = login_user}} ->
        create_session(conn, login_user, type, options)

      # Not logged in, connection exists for banned user -> reject
      {nil, %Connection{user: %User{}} = connection} ->
        respond_error(conn, :account_banned, type, connection, options)

      # Not logged in, no connection -> register new user (if supported)
      {nil, nil} ->
        register_user(conn, profile, type, options)
    end
  end

  # Link a connection to an existing user
  defp link_connection(conn, user, profile, type, options) do
    %Connection{}
    |> Connection.changeset(profile)
    |> change(%{user_id: user.id, type: type})
    |> Repo.insert!()

    # Remove legacy Discord connection from profile
    if type == :discord do
      user.profile
      |> change(%{discord: nil})
      |> Repo.update()
    end

    run_connection_checks(user.id, profile, type)
    respond_success(conn, options, :linked, :created)
  end

  # Transfer a connection from one user to another. Refused for auth-only
  # (non-visible) connections; unusual to transfer these and more likely to
  # have recovery trouble.
  defp transfer_connection(conn, user, connection, profile, type, options) do
    if Connection.visible?(type) do
      Discord.deliver_webhook(:flagged_duplicate,
        user: user,
        duplicates: [User.url(connection.user) |> URI.to_string()],
        type: "#{Connection.provider_name!(type)} (connection updated)",
        text: "#{profile.display_name || profile.uid} (#{profile.uid})"
      )

      connection
      |> change(%{user_id: user.id})
      |> Repo.update!()

      respond_success(conn, options, :linked)
    else
      respond_error(conn, :connection_in_use, type, connection, options, options[:next])
    end
  end

  # Create a session for an existing user
  defp create_session(conn, user, type, options) do
    {session, conn} =
      SessionController.create(conn, user,
        method: type,
        device_id: options[:device_id]
      )

    case options[:response] do
      :redirect ->
        grant_next(conn, options[:redirect_type], options[:next])

      :json ->
        conn |> put_status(:ok) |> json(Flirtual.Policy.transform(conn, session))
    end
  end

  # Register a new user via connection
  defp register_user(conn, profile, type, options) do
    do_register_user(conn, profile, type, options)
  end

  defp do_register_user(conn, profile, type, options) do
    email = profile.email

    if is_nil(email) or email == "" do
      case options[:response] do
        :redirect -> grant_error(conn, options[:redirect_type], :email_required, type, nil)
        :json -> {:error, {:bad_request, :email_required}}
      end
    else
      case Users.create_from_connection(email, notifications: options[:notifications]) do
        {:ok, user} ->
          # Create the connection
          %Connection{}
          |> Connection.changeset(profile)
          |> change(%{user_id: user.id, type: type})
          |> Repo.insert!()

          run_connection_checks(user.id, profile, type)

          {session, conn} =
            SessionController.create(conn, user,
              method: type,
              device_id: options[:device_id]
            )

          case options[:response] do
            :redirect ->
              grant_next(conn, options[:redirect_type], options[:next])

            :json ->
              conn |> put_status(:created) |> json(Flirtual.Policy.transform(conn, session))
          end

        {:error, %Ecto.Changeset{} = changeset} ->
          case options[:response] do
            :redirect ->
              grant_error(conn, options[:redirect_type], :registration_failed, type, nil)

            :json ->
              {:error, changeset}
          end
      end
    end
  end

  # Run moderation checks on connection data
  defp run_connection_checks(user_id, profile, type) do
    if profile.display_name, do: Flag.check_flags(user_id, profile.display_name)
    if profile.email, do: Flag.check_email_flags(user_id, profile.email)
    if profile.email, do: Hash.check_hash(user_id, "email", profile.email)
    Hash.check_hash(user_id, "#{Connection.provider_name!(type)} ID", profile.uid)

    if profile.display_name do
      Hash.check_hash(
        user_id,
        "#{Connection.provider_name!(type)} username",
        profile.display_name
      )
    end
  end

  # Response helpers
  defp respond_success(conn, options, status, http_status \\ :ok) do
    case options[:response] do
      :redirect -> grant_next(conn, options[:redirect_type], options[:next])
      :json -> conn |> put_status(http_status) |> json(%{status: to_string(status)})
    end
  end

  defp respond_error(conn, message, type, connection, options, next \\ nil) do
    case options[:response] do
      :redirect ->
        grant_error(conn, options[:redirect_type], message, type, connection, next)

      :json ->
        if connection do
          Login.log_login_attempt(conn, connection.user.id, nil, method: type)
        end

        {:error, {:unauthorized, message}}
    end
  end
end
