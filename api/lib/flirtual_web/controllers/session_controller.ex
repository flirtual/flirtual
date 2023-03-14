defmodule FlirtualWeb.SessionController do
  use FlirtualWeb, :controller
  require Logger

  import Plug.Conn
  import Phoenix.Controller
  import Ecto.Changeset
  import Flirtual.Utilities.Changeset

  alias Flirtual.User.Session
  alias Flirtual.Policy
  alias Flirtual.Users
  alias Flirtual.User

  action_fallback FlirtualWeb.FallbackController

  def get(conn, _) do
    Logger.debug(%{session: conn.assigns[:session]})
    Logger.debug(%{user: conn.assigns[:session].user})

    conn |> then(&json(&1, Policy.transform(&1, &1.assigns[:session])))
  end

  def login(%Plug.Conn{} = conn, params) do
    changeset =
      cast_arbitrary(
        %{
          email: :string,
          password: :string,
          remember_me: :boolean
        },
        params
      )
      |> validate_required([:email, :password])

    if not changeset.valid? do
      {:error, changeset}
    else
      if user =
           Users.get_by_email_and_password(
             get_field(changeset, :email),
             get_field(changeset, :password)
           ) do
        {session, conn} = create(conn, user, get_field(changeset, :remember_me))
        conn |> put_status(:created) |> json(session)
      else
        {:error, {:unauthorized, "Invalid credentials"}}
      end
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
      {:error, {:forbidden, "Missing permissions", %{user_id: user_id}}}
    else
      with {:ok, session} <-
             session |> Session.sudo(user) do
        conn
        |> assign(:session, session)
        |> json(Policy.transform(conn, session))
      end
    end
  end

  def revoke_sudo(conn, _) do
    session = conn.assigns[:session]

    if is_nil(session.sudoer_id) do
      {:error, {:bad_request, "Bad request"}}
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
    session = Session.create(user)

    conn =
      conn
      |> fetch_session()
      |> renew_session()
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
    |> renew_session()
    |> delete_resp_cookie(@remember_me_cookie)
  end

  defp renew_session(conn) do
    conn
    |> configure_session(renew: true)
    |> clear_session()
  end

  def fetch_current_session(conn, _) do
    with {token, conn} <- ensure_session_token(conn),
         false <- is_nil(token),
         session <-
           Session.get(token: token)
           |> Session.maybe_update_active_at(),
         false <- is_nil(session) do
      conn
      |> assign(:session, session)
      |> assign(:user, session.user)
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
