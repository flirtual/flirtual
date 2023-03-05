defmodule FlirtualWeb.SessionController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller
  import Ecto.Changeset
  import Flirtual.Utilities.Changeset

  alias Flirtual.{Repo, Policy}
  alias Flirtual.Sessions
  alias Flirtual.Users
  alias Flirtual.User

  action_fallback FlirtualWeb.FallbackController

  def get(conn, _) do
    conn |> then(&json(&1, Policy.transform(&1, &1.assigns[:session])))
  end

  def create(%Plug.Conn{} = conn, params) do
    changeset =
      {%{},
       %{
         email: :string,
         password: :string,
         remember_me: :boolean
       }}
      |> cast(
        params,
        [
          :email,
          :password,
          :remember_me
        ]
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
        {session, conn} = log_in_user(conn, user, get_field(changeset, :remember_me))
        conn |> put_status(:created) |> json(session)
      else
        {:error, {:unauthorized, "Invalid credentials"}}
      end
    end
  end

  def sudo(conn, %{"user_id" => user_id}) do
    user =
      if(conn.assigns[:session].user.id === user_id,
        do: conn.assigns[:session].user,
        else: Users.get(user_id)
      )

    if is_nil(user) or Policy.cannot?(conn, :sudo, user) do
      {:error, {:forbidden, "Missing permissions", %{user_id: user_id}}}
    else
      with {:ok, session} <-
             conn.assigns[:session]
             |> then(
               &cast(
                 &1,
                 %{
                   sudoer_id: &1.sudoer_id || &1.user_id,
                   user_id: user_id
                 },
                 [:sudoer_id, :user_id]
               )
             )
             |> validate_uuid(:sudoer_id)
             |> validate_uuid(:user_id)
             |> then(
               &if(get_field(&1, :user_id) === get_field(&1, :sudoer_id)) do
                 add_error(&1, :user_id, "cannot sudo yourself")
               else
                 &1
               end
             )
             |> Repo.update() do
        conn
        |> assign(:session, session)
        |> json(Policy.transform(conn, session))
      end
    end
  end

  def revoke_sudo(conn, _) do
    if is_nil(conn.assigns[:session].sudoer_id) do
      {:error, {:bad_request, "Bad request"}}
    else
      with {:ok, session} <-
             conn.assigns[:session]
             |> then(
               &change(
                 &1,
                 %{
                   sudoer_id: nil,
                   user_id: &1.sudoer_id
                 }
               )
             )
             |> Repo.update() do
        conn
        |> assign(:session, session)
        |> json(Policy.transform(conn, session))
      end
    end
  end

  def log_in_user(%Plug.Conn{} = conn, %User{} = user, remember_me \\ false) do
    session = Sessions.create(user)

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
      domain: "localhost",
      sign: true,
      max_age: @max_age,
      same_site: "Lax"
    )
  end

  defp maybe_write_remember_me_cookie(conn, _token, _params) do
    conn
  end

  def delete(%Plug.Conn{} = conn, _params) do
    conn |> log_out_user() |> resp(:no_content, "") |> halt()
  end

  def log_out_user(conn) do
    token = get_session(conn, :token)
    token && Sessions.delete(token)

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
    {token, conn} = ensure_session_token(conn)

    session =
      token &&
        Sessions.get_by_token(token)
        |> Repo.preload(user: User.default_assoc())

    conn
    |> assign(:session, session)
    |> assign(:user, if(session !== nil, do: session.user, else: nil))
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
