defmodule FlirtualWeb.UsersController do
  use FlirtualWeb, :controller

  require Logger

  import Plug.Conn
  import Phoenix.Controller
  import Ecto.Changeset
  import Ecto.Query

  import FlirtualWeb.Utilities
  import Flirtual.Utilities
  import Flirtual.Attribute, only: [validate_attribute: 3]

  alias Flirtual.{ObanWorkers, Policy, Repo, User, Users}
  alias Flirtual.User.Session
  alias Flirtual.User.Profile.Block
  alias FlirtualWeb.SessionController

  @one_hour 3_600_000

  action_fallback(FlirtualWeb.FallbackController)

  def create(conn, params) do
    with {:ok, user} <- Users.create(params),
         {_, conn} = SessionController.create(conn, user, method: :password) do
      conn
      |> put_status(:created)
      |> json(Policy.transform(conn, user))
    end
  end

  def get(conn, %{"user_id" => user_id}) do
    user =
      if(conn.assigns[:session].user.id === user_id,
        do: conn.assigns[:session].user,
        else: Users.get(user_id)
      )

    if is_nil(user) or Policy.cannot?(conn, :read, user) do
      {:error, {:not_found, :user_not_found, %{user_id: user_id}}}
    else
      conn
      # |> cache_control([:public, {"max-age", [minute: 5]}])
      |> json_with_etag(Policy.transform(conn, user))
    end
  end

  def get_relationship(conn, %{"user_id" => user_id}) do
    conn |> json_with_etag(User.Relationship.get(conn.assigns[:session].user[:id], user_id))
  end

  def get(conn, %{"slug" => slug}) do
    user_id =
      if(conn.assigns[:session].user.slug === slug,
        do: conn.assigns[:session].user.id,
        else:
          User
          |> where([u], u.slug == ^slug)
          |> select([u], u.id)
          |> Repo.one()
      )

    if is_nil(user_id) do
      {:error, {:not_found, :user_not_found, %{name: slug}}}
    else
      conn
      |> redirect(to: "/v1/users/#{user_id}")
    end
  end

  def preview(conn, %{"user_id" => user_id}) do
    user = Users.get(user_id)

    if is_nil(user) do
      {:error, {:not_found, :user_not_found, %{user_id: user_id}}}
    else
      conn |> json_with_etag(User.preview(user))
    end
  end

  def search(conn, params) do
    if Policy.cannot?(conn, :search, conn.assigns[:session].user) do
      {:error, {:forbidden, :missing_permission}}
    else
      with {:ok, page} <- User.search(params) do
        # page = %{page | entries: Policy.transform(conn, page.entries)}
        conn |> json(page)
      end
    end
  end

  # def bulk(conn, %{"_json" => user_ids}) do
  #   conn
  #   |> json_with_etag(
  #     Users.by_ids(user_ids)
  #     |> Enum.map(
  #       &if(not is_nil(&1) and Policy.can?(conn, :read, &1),
  #         do: Policy.transform(conn, &1),
  #         else: nil
  #       )
  #     )
  #     |> Enum.reject(&is_nil/1)
  #   )
  # end

  def inspect(conn, %{"user_id" => user_id, "type" => "elasticsearch"}) do
    user =
      if(conn.assigns[:session].user.id === user_id,
        do: conn.assigns[:session].user,
        else: Users.get(user_id)
      )

    if is_nil(user) or Policy.cannot?(conn, :inspect, user) do
      {:error, {:not_found, :user_not_found, %{user_id: user_id}}}
    else
      conn |> json_with_etag(Elasticsearch.Document.encode(user))
    end
  end

  def inspect(_, _) do
    {:error, {:bad_request, :unknown_inspect_type}}
  end

  def update(conn, %{"user_id" => user_id} = params) do
    user =
      if(conn.assigns[:session].user.id === user_id,
        do: conn.assigns[:session].user,
        else: Users.get(user_id)
      )

    if is_nil(user) or Policy.cannot?(conn, :update, user) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
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
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
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
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
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
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
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

    token = get_session(conn, :token)

    if is_nil(user) or Policy.cannot?(conn, :update, user) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
    else
      with {:ok, user} <- Users.update_password(user, params),
           {_, _} <- Session.delete_others(user_id: user.id, token: token) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def reset_password(conn, %{"email" => email}) do
    ip = get_conn_ip(conn)
    user = Users.get_by_email(email)

    with {:ok, _} <- ExRated.check_rate("reset_password:#{ip}", @one_hour, 10),
         {:ok, _} <- Users.reset_password(user) do
      conn |> json(%{success: true})
    else
      {:error, _} -> {:error, {:unauthorized, :reset_password_rate_limit}}
    end
  end

  def confirm_reset_password(conn, params) do
    with {:ok, user} <- Users.confirm_reset_password(params),
         {_, _} <- Session.delete(user_id: user.id) do
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
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
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
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
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
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
    else
      with {:ok, user} <- Users.reactivate(user) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def block(%{assigns: %{session: %{user_id: user_id}}}, %{"user_id" => user_id}),
    do: {:error, {:bad_request, :missing_permission, %{user_id: user_id}}}

  def block(conn, %{"user_id" => user_id}) do
    target = Users.get(user_id)

    if is_nil(target) or Policy.cannot?(conn, :read, target) do
      {:error, {:forbidden, :cannot_block_user, %{user_id: user_id}}}
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
      {:error, {:forbidden, :cannot_unblock_user, %{user_id: user_id}}}
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
          nil -> {:error, {:bad_request, :profile_not_blocked, %{user_id: user_id}}}
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
    do: {:error, {:bad_request, :missing_permission, %{user_id: user_id}}}

  def suspend(conn, %{"user_id" => user_id} = attrs) do
    user = Users.get(user_id)

    if is_nil(user) or Policy.cannot?(conn, :suspend, user) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
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

    if is_nil(user) or Policy.cannot?(conn, :unsuspend, user) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
    else
      with {:ok, user} <- User.unsuspend(user, conn.assigns[:session].user) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def indef_shadowban(conn, %{"user_id" => user_id}) do
    user = Users.get(user_id)

    if is_nil(user) or Policy.cannot?(conn, :indef_shadowban, user) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
    else
      with {:ok, user} <- User.indef_shadowban(user, conn.assigns[:session].user) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def unindef_shadowban(conn, %{"user_id" => user_id}) do
    user = Users.get(user_id)

    if is_nil(user) or Policy.cannot?(conn, :unindef_shadowban, user) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
    else
      with {:ok, user} <- User.unindef_shadowban(user, conn.assigns[:session].user) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def payments_ban(conn, %{"user_id" => user_id}) do
    user = Users.get(user_id)

    if is_nil(user) or Policy.cannot?(conn, :payments_ban, user) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
    else
      with {:ok, user} <- User.payments_ban(user) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def payments_unban(conn, %{"user_id" => user_id}) do
    user = Users.get(user_id)

    if is_nil(user) or Policy.cannot?(conn, :payments_unban, user) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
    else
      with {:ok, user} <- User.payments_unban(user) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  defmodule Warn do
    use Flirtual.EmbeddedSchema

    embedded_schema do
      field(:message, :string)
      field(:shadowban, :boolean)

      field(:reason_id, :string)
      field(:reason, :map, virtual: true)
    end

    def changeset(value, _, _) do
      value
      |> validate_attribute(:reason_id, "warn-reason")
      |> validate_length(:message, min: 8, max: 10_000)
    end
  end

  def warn(%{assigns: %{session: %{user_id: user_id}}}, %{"user_id" => user_id}),
    do: {:error, {:bad_request, :missing_permission, %{user_id: user_id}}}

  def warn(conn, %{"user_id" => user_id} = attrs) do
    user = Users.get(user_id)

    if is_nil(user) or Policy.cannot?(conn, :warn, user) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
    else
      with {:ok, attrs} <- Warn.apply(attrs),
           {:ok, user} <-
             User.warn(
               user,
               attrs.reason,
               attrs.message,
               attrs.shadowban,
               conn.assigns[:session].user
             ) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def revoke_warn(conn, %{"user_id" => user_id}) do
    user = Users.get(user_id)

    if is_nil(user) or Policy.cannot?(conn, :warn, user) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
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
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
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
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
    else
      with {:ok, user} <-
             User.remove_note(user) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def add_push_token(conn, %{"user_id" => user_id, "type" => type, "token" => token}) do
    type = to_atom(type)

    user =
      if(conn.assigns[:session].user.id === user_id,
        do: conn.assigns[:session].user,
        else: Users.get(user_id)
      )

    if is_nil(user) or Policy.cannot?(conn, :update, user) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
    else
      with {:ok, user} <- User.add_push_token(user, type, token) do
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
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
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
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
    else
      with {:ok, user} <- User.update_rating_prompts(user, params) do
        conn |> json(Policy.transform(conn, user))
      end
    end
  end

  def admin_delete(conn, %{"user_id" => user_id}) do
    user = Users.get(user_id)

    if is_nil(user) or Policy.cannot?(conn, :delete, user) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
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
