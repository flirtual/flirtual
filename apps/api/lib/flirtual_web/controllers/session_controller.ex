defmodule FlirtualWeb.SessionController do
  use FlirtualWeb, :controller
  use Tracing
  require Logger

  import Plug.Conn
  import Phoenix.Controller
  import Ecto.Changeset
  import FlirtualWeb.Utilities
  import Flirtual.Utilities.Changeset

  alias Flirtual.User.Session
  alias Flirtual.Policy
  alias Flirtual.Users
  alias Flirtual.User

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
                   remember_me: :boolean
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
             false <- LeakedPasswords.leaked?(attrs[:password]),
             {session, conn} = create(conn, user, attrs[:remember_me]) do
          conn
          |> put_status(:created)
          |> json(Policy.transform(conn, session))
        else
          %User{} ->
            {:error, {:unauthorized, :account_banned}}

          leak_count when is_integer(leak_count) ->
            # deliver_leaked_password_alert(params["login"], get_conn_ip(conn))
            {:error, {:unauthorized, :leaked_login_password}}

          _ ->
            {:error, {:unauthorized, :invalid_credentials}}
        end

      {:error, _} ->
        {:error, {:unauthorized, :login_rate_limit}}
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

  def create(%Plug.Conn{} = conn, %User{} = user, remember_me \\ false) do
    user_agent = get_req_header(conn, "user-agent") |> List.first() |> String.downcase()

    platform =
      case String.split(user_agent) |> List.last() do
        "flirtual-native" ->
          if(String.contains?(user_agent, "android"), do: "android", else: "ios")

        "flirtual-vision" ->
          "vision"

        _ ->
          "web"
      end

    session = Session.create(user, platform)
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
    span do
      conn
      |> configure_session(renew: true)
      |> clear_session()
    end
  end

  def fetch_current_session(conn, _) do
    span do
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
  end

  defp ensure_session_token(conn) do
    span do
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
end
