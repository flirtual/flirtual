defmodule FlirtualWeb.UsersController do
  use FlirtualWeb, :controller

  require Logger

  import Plug.Conn
  import Phoenix.Controller
  import Ecto.Changeset

  import FlirtualWeb.Utilities
  import Flirtual.Attribute, only: [validate_attribute: 3]

  alias Flirtual.{ObanWorkers, Policy, Repo, User, Users}
  alias Flirtual.User.Profile.Block
  alias FlirtualWeb.SessionController

  action_fallback(FlirtualWeb.FallbackController)

  def create(conn, params) do
    with {:ok, user} <- Users.create(params),
         {_, conn} = SessionController.create(conn, user) do
      conn |> put_status(:created) |> json(Policy.transform(conn, user))
    end
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
      conn |> json_with_etag(Policy.transform(conn, user))
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
      conn |> json_with_etag(Policy.transform(conn, user))
    end
  end

  def preview(conn, %{"user_id" => user_id}) do
    user = Users.get(user_id)

    if is_nil(user) do
      {:error, {:not_found, "User not found", %{user_id: user_id}}}
    else
      conn |> json_with_etag(User.preview(user))
    end
  end

  def search(conn, params) do
    if Policy.cannot?(conn, :search, conn.assigns[:session].user) do
      {:error, {:forbidden, "Forbidden"}}
    else
      with {:ok, page} <- User.search(params) do
        page = %{page | entries: Policy.transform(conn, page.entries)}
        conn |> json(page)
      end
    end
  end

  def bulk(conn, %{"_json" => user_ids}) do
    conn
    |> json_with_etag(
      Users.by_ids(user_ids)
      |> Enum.map(
        &if(not is_nil(&1) and Policy.can?(conn, :read, &1),
          do: Policy.transform(conn, &1),
          else: nil
        )
      )
      |> Enum.reject(&is_nil/1)
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
      |> json_with_etag(
        case User.visible(user) do
          {:error, errors} ->
            %{visible: Enum.empty?(errors), reasons: errors |> Enum.filter(&(!&1[:silent]))}

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

    if is_nil(user) or Policy.cannot?(conn, :inspect, user) do
      {:error, {:not_found, "User not found", %{user_id: user_id}}}
    else
      conn |> json_with_etag(Elasticsearch.Document.encode(user))
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

  def update_notifications_preferences(
        conn,
        %{"user_id" => user_id, "email" => email_preferences, "push" => push_preferences}
      ) do
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
             Users.update_notification_preferences(
               preferences.email_notifications,
               email_preferences
             ),
           {:ok, push_notifications} <-
             Users.update_notification_preferences(
               preferences.push_notifications,
               push_preferences
             ) do
        conn |> json(%{"email" => email_notifications, "push" => push_notifications})
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
         {:ok, _} <- ObanWorkers.update_user(user.id, [:elasticsearch, :listmonk, :talkjs]) do
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

  defmodule Suspend do
    use Flirtual.EmbeddedSchema

    embedded_schema do
      field(:message, :string)

      field(:reason_id, :string)
      field(:reason, :map, virtual: true)
    end

    def changeset(value, _, _) do
      value
      |> validate_attribute(:reason_id, "ban-reason")
      |> validate_length(:message, min: 8)
    end
  end

  def suspend(%{assigns: %{session: %{user_id: user_id}}}, %{"user_id" => user_id}),
    do: {:error, {:bad_request, "Cannot suspend yourself", %{user_id: user_id}}}

  def suspend(conn, %{"user_id" => user_id} = attrs) do
    user = Users.get(user_id)

    if is_nil(user) or Policy.cannot?(conn, :suspend, user) do
      {:error, {:forbidden, "Cannot suspend this user", %{user_id: user_id}}}
    else
      with {:ok, attrs} <- Suspend.apply(attrs),
           {:ok, user} <-
             User.suspend(user, attrs.reason, attrs.message, conn.assigns[:session].user) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def unsuspend(conn, %{"user_id" => user_id}) do
    user = Users.get(user_id)

    if is_nil(user) or Policy.cannot?(conn, :suspend, user) do
      {:error, {:forbidden, "Cannot unsuspend this user", %{user_id: user_id}}}
    else
      with {:ok, user} <- User.unsuspend(user, conn.assigns[:session].user) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def indef_shadowban(conn, %{"user_id" => user_id}) do
    user = Users.get(user_id)

    if is_nil(user) or Policy.cannot?(conn, :indef_shadowban, user) do
      {:error, {:forbidden, "Cannot indefinitely shadowban this user", %{user_id: user_id}}}
    else
      with {:ok, user} <- User.indef_shadowban(user, conn.assigns[:session].user) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def unindef_shadowban(conn, %{"user_id" => user_id}) do
    user = Users.get(user_id)

    if is_nil(user) or Policy.cannot?(conn, :unindef_shadowban, user) do
      {:error, {:forbidden, "Cannot unshadowban this user", %{user_id: user_id}}}
    else
      with {:ok, user} <- User.unindef_shadowban(user, conn.assigns[:session].user) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  defmodule Warn do
    use Flirtual.EmbeddedSchema

    embedded_schema do
      field(:message, :string)
      field(:shadowban, :boolean)
    end

    def changeset(value, _, _) do
      value
      |> validate_length(:message, min: 8, max: 10_000)
    end
  end

  def warn(%{assigns: %{session: %{user_id: user_id}}}, %{"user_id" => user_id}),
    do: {:error, {:bad_request, "Cannot warn yourself", %{user_id: user_id}}}

  def warn(conn, %{"user_id" => user_id} = attrs) do
    user = Users.get(user_id)

    if is_nil(user) or Policy.cannot?(conn, :warn, user) do
      {:error, {:forbidden, "Cannot warn this user", %{user_id: user_id}}}
    else
      with {:ok, attrs} <- Warn.apply(attrs),
           {:ok, user} <-
             User.warn(user, attrs.message, attrs.shadowban, conn.assigns[:session].user) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def revoke_warn(conn, %{"user_id" => user_id}) do
    user = Users.get(user_id)

    if is_nil(user) or Policy.cannot?(conn, :warn, user) do
      {:error, {:forbidden, "Cannot revoke warning for this user", %{user_id: user_id}}}
    else
      with {:ok, user} <-
             User.revoke_warn(user, conn.assigns[:session].user) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def acknowledge_warn(
        %{assigns: %{session: %{user_id: user_id}}} = conn,
        %{"user_id" => user_id}
      ) do
    with {:ok, user} <-
           User.acknowledge_warn(conn.assigns[:session].user) do
      conn |> json(Policy.transform(conn, user))
    end
  end

  def delete(conn, attrs) do
    user = conn.assigns[:session].user

    with {:ok, _} <- Users.delete(user, attrs) do
      conn |> json(%{deleted: true})
    end
  end

  defmodule Note do
    use Flirtual.EmbeddedSchema

    embedded_schema do
      field(:message, :string)
    end

    def changeset(value, _, _) do
      value
      |> validate_length(:message, min: 0, max: 10_000)
    end
  end

  def add_note(conn, %{"user_id" => user_id} = attrs) do
    user = Users.get(user_id)

    if is_nil(user) or Policy.cannot?(conn, :note, user) do
      {:error, {:forbidden, "Cannot note this user", %{user_id: user_id}}}
    else
      with {:ok, attrs} <- Note.apply(attrs),
           {:ok, user} <-
             User.add_note(user, attrs.message) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def remove_note(conn, %{"user_id" => user_id}) do
    user = Users.get(user_id)

    if is_nil(user) or Policy.cannot?(conn, :note, user) do
      {:error, {:forbidden, "Cannot remove note for this user", %{user_id: user_id}}}
    else
      with {:ok, user} <-
             User.remove_note(user) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def update_push_tokens(conn, %{"user_id" => user_id} = params) do
    user =
      if(conn.assigns[:session].user.id === user_id,
        do: conn.assigns[:session].user,
        else: Users.get(user_id)
      )

    if is_nil(user) or Policy.cannot?(conn, :update, user) do
      {:error, {:forbidden, "Cannot update this user's push tokens", %{user_id: user_id}}}
    else
      with {:ok, user} <- User.update_push_tokens(user, params) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def reset_push_count(conn, %{"user_id" => user_id}) do
    user =
      if(conn.assigns[:session].user.id === user_id,
        do: conn.assigns[:session].user,
        else: Users.get(user_id)
      )

    if is_nil(user) or Policy.cannot?(conn, :update, user) do
      {:error, {:forbidden, "Cannot reset this user's push count", %{user_id: user_id}}}
    else
      with {:ok, user} <- User.reset_push_count(user) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def update_rating_prompts(conn, %{"user_id" => user_id} = params) do
    user =
      if(conn.assigns[:session].user.id === user_id,
        do: conn.assigns[:session].user,
        else: Users.get(user_id)
      )

    if is_nil(user) or Policy.cannot?(conn, :update, user) do
      {:error, {:forbidden, "Cannot update this user's rating status", %{user_id: user_id}}}
    else
      with {:ok, user} <- User.update_rating_prompts(user, params) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def admin_delete(conn, %{"user_id" => user_id}) do
    user = Users.get(user_id)

    if is_nil(user) or Policy.cannot?(conn, :delete, user) do
      {:error, {:forbidden, "Cannot delete this user", %{user_id: user_id}}}
    else
      with {:ok, _} <-
             Users.admin_delete(user) do
        conn |> json(%{deleted: true})
      end
    end
  end

  def get_current_user(conn, _) do
    conn |> json_with_etag(Policy.transform(conn, conn.assigns[:session].user))
  end

  def count(conn, _) do
    conn |> json(%{count: Users.count()})
  end
end
