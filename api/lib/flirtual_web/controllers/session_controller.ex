defmodule FlirtualWeb.SessionController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller
  import Ecto.Changeset

  alias Flirtual.Users
  alias Flirtual.User

  action_fallback FlirtualWeb.FallbackController

  def get(conn, _params) do
    conn = conn |> fetch_session() |> fetch_current_user()
    conn |> put_status(:created) |> json(conn.assigns[:current_user])
  end

  def create(%Plug.Conn{} = conn, params) do
    changeset =
      cast(
        {%{},
         %{
           email: :string,
           password: :string,
           remember_me: :boolean
         }},
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
      if user = Users.get_by_email_and_password(
        get_field(changeset, :email),
        get_field(changeset, :password)
      ) do
        conn |> log_in_user(user, get_field(changeset, :remember_me))
      else
        {:error, "Invalid credentials"}
      end
    end
  end

  def delete(%Plug.Conn{} = conn, _params) do
    conn
  end

  @max_age 60 * 60 * 24 * 60
  @remember_me_cookie "remember_me"
  @remember_me_options [sign: true, max_age: @max_age, same_site: "Lax"]

  def log_in_user(%Plug.Conn{} = conn, %User{} = user, remember_me) do
    session = Users.create_session(user)
    IO.inspect(session.token)

    conn
    |> fetch_session()
    |> renew_session()
    |> put_session(:token, session.token)
    |> maybe_write_remember_me_cookie(session.token, remember_me)
    |> json(session)
    |> halt()
  end

  defp maybe_write_remember_me_cookie(conn, token, true) do
    put_resp_cookie(conn, @remember_me_cookie, token, @remember_me_options)
  end

  defp maybe_write_remember_me_cookie(conn, _token, _params) do
    conn
  end

  # This function renews the session ID and erases the whole
  # session to avoid fixation attacks. If there is any data
  # in the session you may want to preserve after log in/log out,
  # you must explicitly fetch the session data before clearing
  # and then immediately set it after clearing, for example:
  #
  #     defp renew_session(conn) do
  #       preferred_locale = get_session(conn, :preferred_locale)
  #
  #       conn
  #       |> configure_session(renew: true)
  #       |> clear_session()
  #       |> put_session(:preferred_locale, preferred_locale)
  #     end
  #
  defp renew_session(conn) do
    conn
    |> configure_session(renew: true)
    |> clear_session()
  end

  @doc """
  Logs the user out.

  It clears all session data for safety. See renew_session.
  """
  def log_out_user(conn) do
    user_token = get_session(conn, :user_token)
    user_token && Accounts.delete_session_token(user_token)

    if live_socket_id = get_session(conn, :live_socket_id) do
      FlirtualWeb.Endpoint.broadcast(live_socket_id, "disconnect", %{})
    end

    conn
    |> renew_session()
    |> delete_resp_cookie(@remember_me_cookie)
    |> redirect(to: "/")
  end

  @doc """
  Authenticates the user by looking into the session
  and remember me token.
  """
  def fetch_current_user(conn) do
    {token, conn} = ensure_session_token(conn)
    user = token && Users.get_by_session_token(token)
    assign(conn, :current_user, user)
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

  @doc """
  Used for routes that require the user to not be authenticated.
  """
  def redirect_if_user_is_authenticated(conn, _opts) do
    if conn.assigns[:current_user] do
      conn
      |> redirect(to: signed_in_path(conn))
      |> halt()
    else
      conn
    end
  end

  def require_authenticated_user(conn, _opts) do
    if conn.assigns[:current_user] do
      conn
    else
      conn
      |> resp(:unauthorized, "")
      |> halt()
    end
  end

  defp maybe_store_return_to(%{method: "GET"} = conn) do
    put_session(conn, :user_return_to, current_path(conn))
  end

  defp maybe_store_return_to(conn), do: conn

  defp signed_in_path(_conn), do: "/"
end
