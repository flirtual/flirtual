defmodule FlirtualWeb.ConnectionController do
  use FlirtualWeb, :controller
  use Flirtual.Logger, :connection

  import Plug.Conn
  import Phoenix.Controller
  import Ecto.Changeset
  import Flirtual.Utilities

  alias Flirtual.{Connection, Discord, Flag, Hash, Repo, User}
  alias FlirtualWeb.SessionController

  action_fallback(FlirtualWeb.FallbackController)

  def list_available(conn, _) do
    conn
    |> json(Connection.list_available(conn.assigns[:session].user))
  end

  def authorize(conn, %{"type" => type, "prompt" => prompt, "next" => next, "json" => json})
      when not is_nil(json) do
    type = to_atom(type)

    with {:ok, provider} <- Connection.provider(type),
         {:ok, authorize_url} <-
           provider.authorize_url(conn, %{prompt: prompt, redirect: false}) do
      conn
      |> put_session(:next, next)
      |> json(%{
        authorize_url: authorize_url |> URI.to_string()
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

  def authorize(conn, %{"type" => type, "prompt" => prompt, "next" => next}) do
    type = to_atom(type)

    with {:ok, provider} <- Connection.provider(type),
         {:ok, authorize_url} <- provider.authorize_url(conn, %{prompt: prompt}) do
      conn
      |> put_session(:next, next)
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
    |> resp(if(redirect_type == "manual", do: 200, else: 307), "")
    |> halt()
  end

  defp grant_error(conn, redirect_type, message) do
    conn
    |> delete_session(:next)
    |> put_resp_header("access-control-expose-headers", "location")
    |> put_resp_header(
      "location",
      Application.fetch_env!(:flirtual, :frontend_origin)
      |> URI.merge((get_session(conn, :next) || "/login") <> "?error=" <> Atom.to_string(message))
      |> URI.to_string()
    )
    |> resp(if(redirect_type == "manual", do: 200, else: 307), "")
    |> halt()
  end

  def grant(conn, params = %{"redirect" => "off"}) do
    conn |> resp(200, "") |> halt()
  end

  def grant(conn, %{"error" => error}) do
    grant_error(conn, "auto", error)
  end

  def grant(conn, params = %{"type" => type, "code" => code}) do
    type = to_atom(type)

    redirect_type = params["redirect"] || "auto"

    with {:ok, provider} <- Connection.provider(type),
         {:ok, authorization} <-
           provider.exchange_code(code, redirect: redirect_type !== "manual"),
         {:ok, profile} <- provider.get_profile(authorization),
         connection <- Connection.get(uid: profile.uid, type: type) do
      user = conn.assigns[:session] && conn.assigns[:session].user

      case {user, connection} do
        {%User{} = user, nil} ->
          %Connection{}
          |> Connection.changeset(profile)
          |> change(%{user_id: user.id, type: type})
          |> Repo.insert!()

          # remove legacy connections
          if type == :discord do
            user.profile
            |> change(%{
              discord: nil
            })
            |> Repo.update()
          end

          Flag.check_flags(user.id, profile.display_name)
          Flag.check_email_flags(user.id, profile.email)

          Hash.check_hash(user.id, "email", profile.email)
          Hash.check_hash(user.id, "#{Connection.provider_name!(type)} ID", profile.uid)

          Hash.check_hash(
            user.id,
            "#{Connection.provider_name!(type)} username",
            profile.display_name
          )

          grant_next(conn, redirect_type)

        {%User{} = user, %Connection{user: %User{id: user_id}}} when user_id == user.id ->
          grant_next(conn, redirect_type)

        {%User{} = user, %Connection{user: %User{id: user_id}}} when user_id != user.id ->
          Discord.deliver_webhook(:flagged_duplicate,
            user: user,
            duplicates: "https://flirtu.al/#{user_id}",
            type: "#{Connection.provider_name!(type)} (connection updated)",
            text: "#{profile.display_name} (#{profile.uid})"
          )

          connection
          |> change(%{user_id: user.id})
          |> Repo.update!()

          grant_next(conn, redirect_type)

        {nil, %Connection{user: %User{banned_at: nil} = login_user}} ->
          next = get_session(conn, :next)
          {_, conn} = SessionController.create(conn, login_user)
          grant_next(conn, redirect_type, next)

        {nil, %Connection{user: %User{}}} ->
          grant_error(
            conn,
            redirect_type,
            :account_banned
          )

        {nil, nil} ->
          grant_error(
            conn,
            redirect_type,
            :connection_account_not_found
          )
      end
    else
      {:error, :unverified_email} ->
        grant_error(
          conn,
          redirect_type,
          :connection_verify_email
        )

      {:error, :provider_not_found} ->
        grant_error(conn, redirect_type, :provider_not_found)

      {:error, :not_supported} ->
        grant_error(conn, redirect_type, :authorize_not_supported)

      {:error, :invalid_grant} ->
        grant_error(conn, redirect_type, :invalid_grant)

      {:error, :upstream} ->
        grant_error(conn, redirect_type, :upstream_error)

      {:error, {status, message}} when is_atom(status) and is_binary(message) ->
        grant_error(conn, redirect_type, message)

      reason ->
        log(:error, [:grant], reason: reason)
        grant_error(conn, redirect_type, :internal_server_error)
    end
  end
end
