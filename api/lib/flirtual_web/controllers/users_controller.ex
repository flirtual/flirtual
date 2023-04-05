defmodule FlirtualWeb.UsersController do
  use FlirtualWeb, :controller
  require Logger

  import Plug.Conn
  import Phoenix.Controller
  import Ecto.Changeset

  import FlirtualWeb.Utilities
  import Flirtual.Utilities.Changeset
  import Flirtual.Utilities
  import Flirtual.Attribute, only: [validate_attribute: 3]
  import Flirtual.HCaptcha, only: [validate_captcha: 1]
  import Flirtual.User, only: [validate_current_password: 2]

  alias Flirtual.User.Profile.Block
  alias Flirtual.Attribute
  alias Flirtual.User.ChangeQueue
  alias Flirtual.Repo
  alias FlirtualWeb.SessionController
  alias Flirtual.{User, Users, Policy}
  alias User.Connection

  action_fallback FlirtualWeb.FallbackController

  def create(conn, params) do
    with {:ok, user} <- Users.create(params),
         {_, conn} = SessionController.create(conn, user) do
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

  def inspect(_, _) do
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
        conn |> SessionController.logout() |> json(Policy.transform(conn, user))
      end
    end
  end

  def reset_password(conn, %{"email" => email}) do
    user = Users.get_by_email(email)

    with {:ok, _} <- Users.reset_password(user) do
      conn |> json(%{success: true})
    end
  end

  def confirm_reset_password(conn, params) do
    with {:ok, _} <- Users.confirm_reset_password(params) do
      conn |> json(%{success: true})
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
    with {:ok, user} <- Users.confirm_update_email(params),
         {:ok, _} <- ChangeQueue.add(user.id) do
      conn
      |> json(%{
        user_id: user.id,
        email: user.email
      })
    end
  end

  def resend_confirm_email(conn, _) do
    with {:ok, _} <- Users.deliver_email_confirmation(conn.assigns[:session].user) do
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

  def block(%{assigns: %{session: %{user_id: user_id}}}, %{"user_id" => user_id}),
    do: {:error, {:bad_request, "Cannot block yourself", %{user_id: user_id}}}

  def block(conn, %{"user_id" => user_id}) do
    target = Users.get(user_id)

    if is_nil(target) or Policy.cannot?(conn, :read, target) do
      {:error, {:forbidden, "Cannot block this user", %{user_id: user_id}}}
    else
      Repo.transaction(fn ->
        options = [user: conn.assigns[:session].user, target: target]

        with nil <- Block.get(options),
             {:ok, item} <- Block.create(options) do
          conn |> json(item)
        else
          %Block{} ->
            Repo.rollback({:bad_request, "Profile already blocked", %{user_id: user_id}})

          {:error, reason} ->
            Repo.rollback(reason)

          reason ->
            Repo.rollback(reason)
        end
      end)
    end
  end

  def unblock(conn, %{"user_id" => user_id}) do
    target = Users.get(user_id)

    if is_nil(target) or Policy.cannot?(conn, :read, target) do
      {:error, {:forbidden, "Cannot unblock this user", %{user_id: user_id}}}
    else
      Repo.transaction(fn ->
        with %Block{} = item <-
               Block.get(
                 user: conn.assigns[:session].user,
                 target: target
               ),
             {:ok, item} <- Block.delete(item) do
          conn |> json(item)
        else
          nil -> {:error, {:bad_request, "Profile not blocked", %{user_id: user_id}}}
          {:error, reason} -> Repo.rollback(reason)
          reason -> Repo.rollback(reason)
        end
      end)
    end
  end

  def suspend(%{assigns: %{session: %{user_id: user_id}}}, %{"user_id" => user_id}),
    do: {:error, {:bad_request, "Cannot suspend yourself", %{user_id: user_id}}}

  def suspend(conn, %{"user_id" => user_id} = params) do
    user = Users.get(user_id)

    if is_nil(user) or Policy.cannot?(conn, :suspend, user) do
      {:error, {:forbidden, "Cannot suspend this user", %{user_id: user_id}}}
    else
      with {:ok, attrs} <-
             cast_arbitrary(
               %{
                 message: :string,
                 reason_id: :string
               },
               params
             )
             |> validate_required([:message, :reason_id])
             |> validate_attribute(:reason_id, "ban-reason")
             |> apply_action(:update),
           reason <- Attribute.by_id_explicit(attrs.reason_id, "ban-reason"),
           {:ok, user} <- User.suspend(user, reason, attrs.message, conn.assigns[:session].user) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def unsuspend(conn, %{"user_id" => user_id}) do
    user = Users.get(user_id)

    if is_nil(user) or Policy.cannot?(conn, :suspend, user) do
      {:error, {:forbidden, "Cannot unsuspend this user", %{user_id: user_id}}}
    else
      with {:ok, user} <- User.unsuspend(user) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def delete(conn, params) do
    user = conn.assigns[:session].user

    with {:ok, params} <-
           cast_arbitrary(
             %{
               reason_id: :string,
               comment: :string,
               current_password: :string,
               captcha: :string
             },
             params
           )
           |> validate_required([:reason_id, :current_password])
           |> validate_attribute(:reason_id, "delete-reason")
           |> validate_length(:comment, max: 2048)
           |> validate_captcha()
           |> validate_current_password(user)
           |> apply_action(:read),
         {:ok, _} <- Users.delete(user) do
      Logger.warn(
        "Account deleted: #{user.id} for #{params.reason_id}" <>
          if(params[:comment], do: " with the comment\n#{params[:comment]}", else: "")
      )

      conn |> resp(:no_content, "") |> halt()
    end
  end

  def get_current_user(conn, _) do
    conn |> json(Policy.transform(conn, conn.assigns[:session].user))
  end
end
