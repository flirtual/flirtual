defmodule FlirtualWeb.UsersController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller
  import Ecto.Query
  import Ecto.Changeset

  import FlirtualWeb.Utilities
  import Flirtual.Utilities

  alias Flirtual.Repo
  alias FlirtualWeb.SessionController
  alias Flirtual.{User, Users, Policy, Jwt}
  alias User.Connection

  action_fallback FlirtualWeb.FallbackController

  def create(conn, params) do
    with {:ok, user} <- Users.create(params) do
      {_, conn} = conn |> SessionController.log_in_user(user)
      conn |> put_status(:created) |> json(Policy.transform(conn, user))
    end
  end

  def start_connection(conn, %{"connection_type" => connection_type}) do
    connection_type = to_atom(connection_type)

    url = User.Connection.get_authorize_url(connection_type)
    conn |> redirect(external: url)
  end

  def create_connection(conn, %{"connection_type" => connection_type} = params) do
    user = conn.assigns[:session].user
    connection_type = to_atom(connection_type)

    if is_nil(user) or Policy.cannot?(conn, :update, user) do
      {:error,
       {:forbidden, "Cannot update this user's connections",
        %{
          user_id: user.id,
          connection_type: connection_type
        }}}
    else
      with {:ok, connection} <- Users.assign_connection(user.id, connection_type, params) do
        conn |> json(connection)
      end
    end
  end

  def list_connections(conn, %{"user_id" => user_id}) do
    user =
      if(conn.assigns[:session].user.id === user_id,
        do: conn.assigns[:session].user,
        else: Users.get(user_id)
      )

    connections =
      Users.list_connections_by_user_id(user_id)
      |> Enum.map(&%Connection{&1 | user: user})
      |> Enum.filter(&Policy.can?(conn, :read, &1))

    conn |> json(connections)
  end

  def get(conn, %{"user_id" => user_id}) do
    user =
      if(conn.assigns[:session].user.id === user_id,
        do: conn.assigns[:session].user,
        else: Users.get(user_id)
      )

    if is_nil(user) or Policy.cannot?(conn, :read, user) do
      {:error, {:not_found, "User not found", %{user_id: user_id}}}
    else
      conn |> json(Policy.transform(conn, user))
    end
  end

  def get(conn, %{"username" => username}) do
    user =
      if(conn.assigns[:session].user.username === username,
        do: conn.assigns[:session].user,
        else: Users.get_by_username(username)
      )

    if is_nil(user) or Policy.cannot?(conn, :read, user) do
      {:error, {:not_found, "User not found", %{username: username}}}
    else
      conn |> json(Policy.transform(conn, user))
    end
  end

  def bulk(conn, %{"_json" => user_ids}) do
    conn
    |> json(
      Users.by_ids(user_ids)
      |> Enum.map(
        &if(not is_nil(&1) and Policy.can?(conn, :read, &1),
          do: Policy.transform(conn, &1),
          else: nil
        )
      )
    )
  end

  def visible(conn, %{"user_id" => user_id}) do
    user =
      if(conn.assigns[:session].user.id === user_id,
        do: conn.assigns[:session].user,
        else: Users.get(user_id)
      )

    if is_nil(user) or Policy.cannot?(conn, :read, user) do
      {:error, {:not_found, "User not found", %{user_id: user_id}}}
    else
      conn
      |> json(
        case User.visible(user) do
          {:error, errors} ->
            %{visible: length(errors) === 0, reasons: errors |> Enum.filter(&(!&1[:silent]))}

          {:ok, _} ->
            %{visible: true, reasons: []}
        end
      )
    end
  end

  def inspect(conn, %{"user_id" => user_id, "type" => "elasticsearch"}) do
    user =
      if(conn.assigns[:session].user.id === user_id,
        do: conn.assigns[:session].user,
        else: Users.get(user_id)
      )

      if is_nil(user) or Policy.cannot?(conn, :read, user) do
        {:error, {:not_found, "User not found", %{user_id: user_id}}}
      else
        conn |> json(Elasticsearch.Document.encode(user))
      end
  end

  def inspect(conn, _) do
    {:error, {:bad_request, "Unknown inspect type"}}
  end

  def update(conn, %{"user_id" => user_id} = params) do
    user =
      if(conn.assigns[:session].user.id === user_id,
        do: conn.assigns[:session].user,
        else: Users.get(user_id)
      )

    if is_nil(user) or Policy.cannot?(conn, :update, user) do
      {:error, {:forbidden, "Cannot update this user", %{user_id: user_id}}}
    else
      with {:ok, user} <-
             Users.update(user, params, required: split_to_atom_list(params["required"])) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def update_privacy_preferences(conn, %{"user_id" => user_id} = params) do
    user =
      if(conn.assigns[:session].user.id === user_id,
        do: conn.assigns[:session].user,
        else: Users.get(user_id)
      )

    preferences = %User.Preferences{user.preferences | user: user}

    if is_nil(user) or Policy.cannot?(conn, :update, user.profile) do
      {:error, {:forbidden, "Cannot update this user's preferences", %{user_id: user_id}}}
    else
      with {:ok, privacy} <- Users.update_privacy_preferences(preferences.privacy, params) do
        conn |> json(privacy)
      end
    end
  end

  def update_preferences(conn, %{"user_id" => user_id} = params) do
    user =
      if(conn.assigns[:session].user.id === user_id,
        do: conn.assigns[:session].user,
        else: Users.get(user_id)
      )

    preferences = %User.Preferences{user.preferences | user: user}

    if is_nil(user) or Policy.cannot?(conn, :update, user.profile) do
      {:error, {:forbidden, "Cannot update this user's preferences", %{user_id: user_id}}}
    else
      with {:ok, privacy} <- Users.update_preferences(preferences, params) do
        conn |> json(privacy)
      end
    end
  end

  def update_notifications_preferences(conn, %{"user_id" => user_id} = params) do
    user =
      if(conn.assigns[:session].user.id === user_id,
        do: conn.assigns[:session].user,
        else: Users.get(user_id)
      )

    preferences = %User.Preferences{user.preferences | user: user}

    if is_nil(user) or Policy.cannot?(conn, :update, user.profile) do
      {:error, {:forbidden, "Cannot update this user's notifications", %{user_id: user_id}}}
    else
      with {:ok, email_notifications} <-
             Users.update_notification_preferences(preferences.email_notifications, params) do
        conn |> json(email_notifications)
      end
    end
  end

  def update_password(conn, %{"user_id" => user_id} = params) do
    user =
      if(conn.assigns[:session].user.id === user_id,
        do: conn.assigns[:session].user,
        else: Users.get(user_id)
      )

    if is_nil(user) or Policy.cannot?(conn, :update, user) do
      {:error, {:forbidden, "Cannot update this user's password", %{user_id: user_id}}}
    else
      with {:ok, user} <- Users.update_password(user, params) do
        conn |> SessionController.log_out_user() |> json(Policy.transform(conn, user))
      end
    end
  end

  def update_email(conn, %{"user_id" => user_id} = params) do
    user =
      if(conn.assigns[:session].user.id === user_id,
        do: conn.assigns[:session].user,
        else: Users.get(user_id)
      )

    if is_nil(user) or Policy.cannot?(conn, :update, user) do
      {:error, {:forbidden, "Cannot update this user's email address", %{user_id: user_id}}}
    else
      with {:ok, user} <- Users.update_email(user, params) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def confirm_email(conn, params) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    case Jwt.validate_email_confirmation(params["token"]) do
      {:error, _} ->
        {:error, {:bad_request, "Invalid confirmation token"}}

      {:ok, claims} ->
        case User |> where(id: ^claims["sub"], email: ^claims["email"]) |> Repo.one() do
          nil ->
            {:error, {:bad_request, "Stale confirmation token"}}

          user ->
            with {:ok, _} <-
                   user
                   |> change(email_confirmed_at: now)
                   |> Repo.update() do
              conn |> json(%{})
            end
        end
    end
  end

  def resend_confirm_email(conn, _) do
    with {:ok, _} <- Users.send_email_confirmation(conn.assigns[:session].user) do
      conn |> put_status(:accepted) |> json(%{})
    end
  end

  def deactivate(conn, %{"user_id" => user_id}) do
    user =
      if(conn.assigns[:session].user.id === user_id,
        do: conn.assigns[:session].user,
        else: Users.get(user_id)
      )

    if is_nil(user) or Policy.cannot?(conn, :update, user) do
      {:error, {:forbidden, "Cannot deactivate this user", %{user_id: user_id}}}
    else
      with {:ok, user} <- Users.deactivate(user) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def reactivate(conn, %{"user_id" => user_id}) do
    user =
      if(conn.assigns[:session].user.id === user_id,
        do: conn.assigns[:session].user,
        else: Users.get(user_id)
      )

    if is_nil(user) or Policy.cannot?(conn, :update, user) do
      {:error, {:forbidden, "Cannot reactivate this user", %{user_id: user_id}}}
    else
      with {:ok, user} <- Users.reactivate(user) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def get_current_user(conn, _) do
    conn |> json(Policy.transform(conn, conn.assigns[:session].user))
  end
end
