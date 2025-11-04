defmodule Flirtual.Users do
  import Ecto.Query
  import Ecto.Changeset
  import Flirtual.Utilities.Changeset

  import Flirtual.Turnstile, only: [validate_captcha: 1]

  alias Ecto.UUID

  alias Flirtual.{
    Chargebee,
    Discord,
    Elasticsearch,
    Flag,
    Hash,
    Jwt,
    # Languages,
    Listmonk,
    ObanWorkers,
    Repo,
    RevenueCat,
    Stripe,
    Talkjs,
    User
  }

  alias Flirtual.User.{Login, Preferences}

  def get(id)
      when is_binary(id) do
    User
    |> where([user], user.id == ^id)
    |> preload(^User.default_assoc())
    |> Repo.one()
  end

  def get_by_username(username)
      when is_binary(username) do
    User
    |> where([user], user.username == ^username)
    |> preload(^User.default_assoc())
    |> Repo.one()
  end

  def get_by_slug(slug)
      when is_binary(slug) do
    User
    |> where([user], user.slug == ^slug)
    |> preload(^User.default_assoc())
    |> Repo.one()
  end

  def by_ids(user_ids) do
    User
    |> where([user], user.id in ^user_ids)
    |> preload(^User.default_assoc())
    |> Repo.all()
  end

  def get_by_email(email)
      when is_binary(email) do
    User
    |> where([user], user.email == ^email)
    |> preload(^User.default_assoc())
    |> Repo.one()
  end

  def get_by_login_and_password(login, password)
      when is_binary(password) do
    user = get_by_username(login) || get_by_email(login)
    if User.valid_password?(user, password), do: user
  end

  def get_by_unsubscribe_token(token)
      when is_binary(token) do
    User
    |> where([user], user.unsubscribe_token == ^token)
    |> preload(^User.default_assoc())
    |> Repo.one()
  end

  def get_preferences_by_user_id(user_id)
      when is_binary(user_id) do
    Preferences
    |> where([preferences], preferences.user_id == ^user_id)
    |> preload(^Preferences.default_assoc())
    |> Repo.one()
  end

  def update(%User{} = user, attrs, options \\ []) do
    Repo.transaction(fn ->
      with :ok <- Flag.check_user_slug(user, attrs["slug"]),
           {:ok, user} <-
             user
             |> User.changeset(attrs, options)
             |> Repo.update(),
           {:ok, user} <- User.update_status(user),
           {:ok, _} <-
             ObanWorkers.update_user(user.id, [
               :elasticsearch,
               :listmonk,
               :refresh_prospects,
               :talkjs
             ]) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  defmodule UpdatePassword do
    use Flirtual.EmbeddedSchema

    embedded_schema do
      field(:password, :string, redact: true)
      field(:password_confirmation, :string, redact: true)
      field(:current_password, :string, redact: true)
    end

    def changeset(value, _, %{user: user}) do
      value
      |> User.validate_current_password(user)
      |> User.validate_password()
      |> User.validate_password_confirmation()
      |> validate_predicate(
        &(not User.valid_password?(&2, &1)),
        {:password, {:value, user.password_hash}},
        message: "password_must_be_different"
      )
    end
  end

  def update_password(%User{} = user, attrs) do
    Repo.transaction(fn ->
      with {:ok, attrs} <- UpdatePassword.apply(attrs, context: %{user: user}),
           {:ok, user} <-
             User.update_password(user, attrs.password),
           {:ok, _} <- User.Email.deliver(user, :password_changed) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def reset_password(%User{} = user) do
    with {:ok, token} <-
           Jwt.config("reset-password")
           |> Jwt.sign(%{"sub" => user.email}),
         {:ok, _} = User.Email.deliver(user, :reset_password, token) do
      {:ok, user}
    end
  end

  def reset_password(_) do
    {:ok, nil}
  end

  defmodule ConfirmResetPassword do
    use Flirtual.EmbeddedSchema

    import Flirtual.Jwt, only: [validate_jwt: 4]
    alias Flirtual.Users

    embedded_schema do
      field(:email, :string)
      field(:password, :string, redact: true)
      field(:password_confirmation, :string, redact: true)
      field(:token, :string, redact: true)

      field(:user, :map, virtual: true)
    end

    def changeset(value, _, _) do
      value
      |> validate_jwt(:token, Jwt.config("reset-password"), fn claims ->
        case Users.get_by_email(claims["sub"]) do
          nil -> {:error, nil}
          %User{} = user -> {:ok, {:user, user}}
        end
      end)
      |> User.validate_password()
      |> User.validate_password_confirmation()
    end
  end

  def confirm_reset_password(attrs) do
    Repo.transaction(fn ->
      with {:ok, attrs} <- ConfirmResetPassword.apply(attrs),
           {:ok, user} <- User.update_password(attrs.user, attrs.password),
           {:ok, _} <- User.Email.deliver(user, :password_changed) do
        Login.untrust(user.id)
        ExRated.delete_bucket("verify:#{user.id}")
        ExRated.delete_bucket("send_verification:#{user.id}")

        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  defmodule UpdateEmail do
    use Flirtual.EmbeddedSchema

    embedded_schema do
      field(:email, :string)
      field(:email_confirmation, :string)
      field(:current_password, :string, redact: true)
    end

    def changeset(value, _, %{user: user}) do
      value
      |> User.validate_current_password(user)
      |> User.validate_email()
      |> validate_confirmation(:email)
      |> validate_predicate(:not_equal, {:email, {:value, user.email}},
        message: "email_must_be_different"
      )
      |> Flag.validate_allowed_email(:email)
    end
  end

  def deliver_email_confirmation(user) do
    with {:ok, token} <-
           Jwt.sign(Jwt.config("confirm-email"), %{
             "sub" => user.id,
             "email" => user.email
           }),
         {:ok, _} = User.Email.deliver(user, :confirm_email, token) do
      {:ok, token}
    end
  end

  def update_email(%User{} = user, attrs) do
    Repo.transaction(fn ->
      with {:ok, attrs} <- UpdateEmail.apply(attrs, context: %{user: user}),
           {:ok, user} <-
             user
             |> User.update_email_changeset(attrs |> Map.from_struct())
             |> Repo.update(),
           :ok <- Hash.check_hash(user.id, "email", attrs[:email]),
           {:ok, user} <- User.update_status(user),
           {:ok, _} <- ObanWorkers.update_user(user.id, [:elasticsearch, :listmonk, :talkjs]),
           {:ok, _} <- deliver_email_confirmation(user) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  defmodule ConfirmUpdateEmail do
    use Flirtual.EmbeddedSchema

    import Flirtual.Jwt, only: [validate_jwt: 4]

    embedded_schema do
      field(:token, :string, redact: true)
      field(:user, :map, virtual: true)
    end

    def changeset(value, _, _) do
      value
      |> validate_jwt(:token, Jwt.config("confirm-email"), fn claims ->
        case User
             |> where(id: ^claims["sub"], email: ^claims["email"])
             |> Repo.one() do
          nil -> {:error, nil}
          user -> {:ok, {:user, user}}
        end
      end)
    end
  end

  def confirm_update_email(attrs) do
    Repo.transaction(fn ->
      with {:ok, attrs} <- ConfirmUpdateEmail.apply(attrs),
           {:ok, user} <-
             User.confirm_email_changeset(attrs.user)
             |> Repo.update(),
           {:ok, user} <- User.update_status(user),
           {:ok, _} <-
             ObanWorkers.update_user(user.id, [:chargebee, :elasticsearch, :listmonk, :talkjs]),
           {:ok, _} <- User.Email.deliver(user, :email_changed),
           :ok <- Flag.check_new_email_domain(user.id, user.email) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def update_preferences(%Preferences{} = preferences, attrs) do
    Repo.transaction(fn ->
      with {:ok, preferences} <-
             preferences
             |> Preferences.update_changeset(attrs)
             |> Repo.update(),
           {:ok, _} <- ObanWorkers.update_user(preferences.user_id) do
        preferences
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def update_privacy_preferences(%Preferences.Privacy{} = privacy_preferences, attrs) do
    privacy_preferences
    |> Preferences.Privacy.update_changeset(attrs)
    |> Repo.update()
  end

  def update_notification_preferences(
        %Preferences.EmailNotifications{} = notification_preferences,
        attrs
      ) do
    with {:ok, notification_preferences} <-
           notification_preferences
           |> Preferences.EmailNotifications.update_changeset(attrs)
           |> Repo.update(),
         {:ok, _} <-
           ObanWorkers.update_user(notification_preferences.preferences_id, [:listmonk, :talkjs]) do
      {:ok, notification_preferences}
    else
      {:error, reason} -> Repo.rollback(reason)
      reason -> Repo.rollback(reason)
    end
  end

  def update_notification_preferences(
        %Preferences.PushNotifications{} = notification_preferences,
        attrs
      ) do
    with {:ok, notification_preferences} <-
           notification_preferences
           |> Preferences.PushNotifications.update_changeset(attrs)
           |> Repo.update(),
         %User{} = user <- User.get(notification_preferences.preferences_id),
         if(notification_preferences.messages,
           do: Talkjs.update_push_tokens(user),
           else: Talkjs.remove_push_tokens(user)
         ) do
      {:ok, notification_preferences}
    else
      {:error, reason} -> Repo.rollback(reason)
      reason -> Repo.rollback(reason)
    end
  end

  def deactivate(%User{} = user) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    Repo.transaction(fn ->
      with {:ok, user} <-
             user
             |> change(%{deactivated_at: now})
             |> Repo.update(),
           {:ok, user} <- User.update_status(user),
           {:ok, _} <- ObanWorkers.update_user(user.id, [:elasticsearch, :listmonk, :talkjs]) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def reactivate(%User{} = user) do
    Repo.transaction(fn ->
      with {:ok, user} <-
             user
             |> change(%{deactivated_at: nil})
             |> Repo.update(),
           {:ok, user} <- User.update_status(user),
           {:ok, _} <-
             ObanWorkers.update_user(user.id, [
               :elasticsearch,
               :listmonk,
               :refresh_prospects,
               :talkjs
             ]) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  defmodule Delete do
    use Flirtual.EmbeddedSchema

    import Flirtual.Attribute, only: [validate_attribute: 3]
    import Flirtual.Turnstile, only: [validate_captcha: 1]
    import Flirtual.User, only: [validate_current_password: 2]

    @optional [:comment]

    embedded_schema do
      field(:reason_id, :string)
      field(:reason, :map, virtual: true)

      field(:comment, :string, default: "")

      field(:current_password, :string, redact: true)
      field(:captcha, :string, redact: true)
    end

    def changeset(value, _, %{user: user}) do
      value
      |> validate_captcha()
      |> validate_attribute(:reason_id, "delete-reason")
      |> validate_current_password(user)
      |> validate_length(:comment, max: 10_000)
    end
  end

  def delete(%User{} = user, attrs) do
    Repo.transaction(fn ->
      with {:ok, attrs} <- Delete.apply(attrs, context: %{user: user}),
           :ok <- Hash.delete(user.id),
           {:ok, user} <- Repo.delete(user),
           :ok <- Elasticsearch.delete(:users, user.id),
           {:ok, _} <- Talkjs.delete_user(user),
           {:ok, _} <- Listmonk.delete_subscriber(user),
           {:ok, _} <- Stripe.delete_customer(user),
           {:ok, _} <- Chargebee.delete_customer(user),
           :ok <- RevenueCat.delete_customer(user),
           :ok <-
             Discord.deliver_webhook(:exit_survey,
               user: user,
               reason: attrs.reason,
               comment: attrs.comment
             ) do
        {:ok, user}
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def admin_delete(%User{} = user) do
    Repo.transaction(fn ->
      with :ok <- if(is_nil(user.banned_at), do: Hash.delete(user.id), else: :ok),
           {:ok, user} <- Repo.delete(user),
           :ok <- Elasticsearch.delete(:users, user.id),
           {:ok, _} <- Talkjs.delete_user(user),
           {:ok, _} <- Listmonk.delete_subscriber(user),
           {:ok, _} <- Stripe.delete_customer(user),
           {:ok, _} <- Chargebee.delete_customer(user),
           :ok <- RevenueCat.delete_customer(user) do
        {:ok, user}
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def dev_delete(%User{} = user) do
    Repo.transaction(fn ->
      with :ok <- if(is_nil(user.banned_at), do: Hash.delete(user.id), else: :ok),
           {:ok, user} <- Repo.delete(user),
           :ok <- Elasticsearch.delete(:users, user.id) do
        {:ok, user}
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def create(attrs, options \\ []) do
    Repo.transaction(fn ->
      with {:ok, attrs} <-
             cast_arbitrary(
               %{
                 email: :string,
                 password: :string,
                 service_agreement: :boolean,
                 notifications: :boolean,
                 captcha: :string,
                 # language: :string,
                 url: :string
               },
               attrs
             )
             |> validate_required([
               :email,
               :password,
               :service_agreement,
               # :language,
               :notifications
             ])
             |> validate_acceptance(:service_agreement)
             # |> validate_inclusion(:language, Languages.list(:preference))
             |> then(
               &if(Keyword.get(options, :captcha, true),
                 do: &1 |> validate_captcha(),
                 else: &1
               )
             )
             |> apply_action(:update),
           {:ok, user} <-
             %User{}
             |> cast(attrs, [:email, :password])
             |> User.validate_unique_email()
             |> Flag.validate_allowed_email(:email)
             |> User.validate_password()
             |> User.put_password()
             |> Repo.insert(),
           {:ok, user} <-
             change(user, %{
               slug: String.downcase(user.id, :ascii) |> String.slice(0..19),
               talkjs_signature: Talkjs.new_user_signature(user.id),
               revenuecat_id: UUID.generate(),
               unsubscribe_token: UUID.generate()
             })
             |> Repo.update(),
           {:ok, preferences} <-
             Ecto.build_assoc(
               user,
               :preferences,
               %{
                 # language: attrs[:language]
               }
             )
             |> Repo.insert(),
           {:ok, _} <-
             Ecto.build_assoc(preferences, :email_notifications, %{
               newsletter: attrs[:notifications]
             })
             |> Repo.insert(),
           {:ok, _} <-
             Ecto.build_assoc(preferences, :push_notifications, %{
               newsletter: attrs[:notifications]
             })
             |> Repo.insert(),
           {:ok, _} <-
             Ecto.build_assoc(preferences, :privacy)
             |> Repo.insert(),
           {:ok, profile} <-
             Ecto.build_assoc(user, :profile)
             |> Repo.insert(),
           {:ok, _} <-
             Ecto.build_assoc(profile, :preferences)
             |> Repo.insert(),
           user <- Repo.preload(user, User.default_assoc()),
           :ok <- Flag.check_honeypot(user.id, attrs[:url]),
           :ok <- Flag.check_email_flags(user.id, attrs[:email]),
           :ok <-
             (case Application.get_env(:flirtual, :canary, false) do
                true -> :ok
                false -> Hash.check_hash(user.id, "email", attrs[:email])
              end),
           {:ok, _} <- Talkjs.update_user(user),
           {:ok, _} <-
             Listmonk.create_subscriber(user),
           {:ok, _} <- deliver_email_confirmation(user) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def count do
    Repo.aggregate(User, :count)
  end
end
