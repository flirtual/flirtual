defmodule FlirtualWeb.SessionController do
  use FlirtualWeb, :controller
  require Logger

  import Plug.Conn
  import Phoenix.Controller
  import Ecto.Changeset
  import FlirtualWeb.Utilities
  import Flirtual.Utilities.Changeset

  alias Flirtual.{Policy, User, Users}
  alias Flirtual.User.{Login, Session, Verification}

  action_fallback(FlirtualWeb.FallbackController)

  def get(conn, _) do
    with :ok <- Policy.can(conn, :read, conn.assigns[:session]) do
      conn |> json_with_etag(Policy.transform(conn, conn.assigns[:session]))
    end
  end

  @fifteen_minutes 900_000

  def login(%Plug.Conn{} = conn, params) do
    ip = get_conn_ip(conn)

    case ExRated.check_rate("login:#{ip}", @fifteen_minutes, 5) do
      {:ok, _} ->
        with {:ok, attrs} <-
               cast_arbitrary(
                 %{
                   login: :string,
                   password: :string,
                   remember_me: :boolean,
                   device_id: :string
                 },
                 params
               )
               |> validate_required([:login, :password])
               |> apply_action(:update),
             %User{banned_at: nil} = user <-
               Users.get_by_login_and_password(
                 attrs[:login],
                 attrs[:password]
               ),
             false <- LeakedPasswords.leaked?(attrs[:password]) do
          if Login.suspicious?(user.id, conn) do
            with login_id when is_binary(login_id) <-
                   Verification.send_verification(conn, user, attrs[:device_id]) do
              conn
              |> put_status(:accepted)
              |> json(%{login_id: login_id, email: user.email})
            else
              {:error, :verification_rate_limit} ->
                {:error, {:unauthorized, :verification_rate_limit}}
            end
          else
            {session, conn} = create(conn, user, attrs[:remember_me], attrs[:device_id])

            conn
            |> put_status(:created)
            |> json(Policy.transform(conn, session))
          end
        else
          %User{banned_at: banned_at} = user when not is_nil(banned_at) ->
            Login.log_login_attempt(conn, user.id, nil, params["device_id"])
            {:error, {:unauthorized, :account_banned}}

          leak_count when is_integer(leak_count) ->
            user = Users.get_by_username(params["login"]) || Users.get_by_email(params["login"])
            Login.log_login_attempt(conn, user && user.id, nil, params["device_id"])
            {:error, {:unauthorized, :leaked_login_password}}

          _ ->
            user = Users.get_by_username(params["login"]) || Users.get_by_email(params["login"])
            Login.log_login_attempt(conn, user && user.id, nil, params["device_id"])
            {:error, {:unauthorized, :invalid_credentials}}
        end

      {:error, _} ->
        user = Users.get_by_email(params["login"]) || Users.get_by_username(params["login"])
        if user, do: Login.untrust(user.id)
        {:error, {:unauthorized, :login_rate_limit}}
    end
  end

  def resend_verification(conn, %{"login_id" => login_id}) do
    with {:ok, login_id} <- Verification.resend_verification(login_id) do
      conn
      |> put_status(:ok)
      |> json(%{login_id: login_id})
    else
      {:error, :verification_rate_limit} ->
        {:error, {:unauthorized, :verification_rate_limit}}

      {:error, _} ->
        {:error, {:unauthorized, :verification_invalid_code}}
    end
  end

  def verify(conn, %{"login_id" => login_id, "code" => code} = params) do
    with %Login{user_id: user_id, device_id: device_id} <- Login.get(login_id),
         %User{} = user <- Users.get(user_id),
         :ok <- Verification.verify(login_id, code) do
      {session, conn} = create(conn, user, params["remember_me"] || false, device_id)

      Login.verify(login_id, session.id)

      conn
      |> put_status(:created)
      |> json(Policy.transform(conn, session))
    else
      nil ->
        {:error, {:unauthorized, :verification_invalid_code}}

      {:error, :verification_rate_limit} ->
        with %Login{user_id: user_id} <- Login.get(login_id) do
          Login.untrust(user_id)
        end

        {:error, {:unauthorized, :verification_rate_limit}}

      {:error, _} ->
        {:error, {:unauthorized, :verification_invalid_code}}
    end
  end

  def sudo(conn, %{"user_id" => user_id}) do
    session = conn.assigns[:session]

    user =
      if(session.user.id === user_id,
        do: session.user,
        else: Users.get(user_id)
      )

    if is_nil(user) or Policy.cannot?(conn, :sudo, user) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
    else
      with {:ok, session} <-
             session |> Session.sudo(user) do
        conn
        |> json(Policy.transform(conn, session))
      end
    end
  end

  def revoke_sudo(conn, _) do
    session = conn.assigns[:session]

    if is_nil(session.sudoer_id) do
      {:error, {:bad_request, :missing_permission}}
    else
      with {:ok, session} <-
             session |> Session.sudo(nil) do
        conn
        |> assign(:session, session)
        |> json(Policy.transform(conn, session))
      end
    end
  end

  def create(%Plug.Conn{} = conn, %User{} = user, remember_me \\ false, device_id \\ nil) do
    session = Session.create(user)

    Login.log_login_attempt(conn, user.id, session.id, device_id)
    User.update_platforms(user)

    conn =
      conn
      |> fetch_session()
      |> renew_session()
      |> assign(:session, session)
      |> put_session(:token, session.token)
      |> maybe_write_remember_me_cookie(session.token, remember_me)

    {session, conn}
  end

  @remember_me_cookie "remember_me"
  @max_age 60 * 60 * 24 * 60

  defp maybe_write_remember_me_cookie(conn, token, true) do
    put_resp_cookie(conn, @remember_me_cookie, token,
      domain: Application.fetch_env!(:flirtual, :root_origin).host,
      sign: true,
      max_age: @max_age,
      same_site: "Lax"
    )
  end

  defp maybe_write_remember_me_cookie(conn, _token, _params) do
    conn
  end

  def delete(%Plug.Conn{} = conn, _params) do
    conn |> logout() |> resp(:no_content, "") |> halt()
  end

  def logout(conn) do
    token = get_session(conn, :token)
    token && Session.delete(token: token)

    conn
    |> clear_session()
    |> configure_session(drop: true)
    |> delete_resp_cookie("session")
    |> delete_resp_cookie(@remember_me_cookie)
  end

  defp renew_session(conn) do
    conn
    |> configure_session(renew: true)
    |> clear_session()
  end

  def fetch_current_session(conn, _) do
    with {token, conn} when not is_nil(token) <- ensure_session_token(conn),
         %Session{} = session <- Session.get(token: token),
         {:ok, session} <- Session.maybe_update_activity(session),
         %User{} = user <- session.user do
      Sentry.Context.set_user_context(%{
        id: user.id
      })

      conn
      |> assign(:session, session)
      |> assign(:user, user)
    else
      _ ->
        conn
        |> assign(:session, nil)
        |> assign(:user, nil)
    end
  end

  defp ensure_session_token(conn) do
    if token = get_session(conn, :token) do
      {token, conn}
    else
      conn = fetch_cookies(conn, signed: [@remember_me_cookie])

      if token = conn.cookies[@remember_me_cookie] do
        {token, put_session(conn, :token, token)}
      else
        {nil, conn}
      end
    end
  end
end
