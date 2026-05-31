defmodule Flirtual.Users do
  require Flirtual.Utilities
  import Flirtual.Utilities

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
    changeset = User.changeset(user, attrs, options)

    with :ok <- Flag.check_user_slug(user, attrs["slug"]),
         %Ecto.Changeset{valid?: true} <- changeset do
      born_at = Ecto.Changeset.get_change(changeset, :born_at)

      if not is_nil(born_at) and User.underage?(born_at) === true do
        case Flirtual.Attribute.get("muXMqNjneKnwqxT8nqcy4d", "ban-reason") do
          %Flirtual.Attribute{} = reason ->
            Repo.update(changeset)

            User.suspend(
              user,
              reason,
              "Underaged. You must be at least 18 years of age to use Flirtual. If you believe you have been banned in error, you can reply to this email to appeal and we'll send you a secure link to verify your I.D. in order to unban your account.",
              user
            )

            {:error, {:forbidden, :banned_underage}}

          _ ->
            {:error, {:internal_error, :attribute_not_found}}
        end
      else
        previous_born_at = user.born_at

        Repo.transaction(fn ->
          with {:ok, user} <- Repo.update(changeset),
               {:ok, user} <- User.update_status(user),
               {:ok, _} <-
                 ObanWorkers.update_user(user.id, [
                   :elasticsearch,
                   :listmonk,
                   :refresh_prospects,
                   :talkjs
                 ]) do
            if not is_nil(born_at) do
              turns_18_utc =
                skip_invalid_leap_day(born_at.year + 18, born_at.month, born_at.day)
                |> DateTime.new!(~T[00:00:00], "Etc/UTC")

              if DateTime.after?(turns_18_utc, user.created_at) do
                Discord.deliver_webhook(:flagged_registered_underage,
                  user: user,
                  previous_born_at: previous_born_at,
                  born_at: born_at,
                  created_at: user.created_at
                )
              end
            end

            user
          else
            {:error, reason} -> Repo.rollback(reason)
            reason -> Repo.rollback(reason)
          end
        end)
      end
    else
      %Ecto.Changeset{} = changeset -> {:error, changeset}
      {:error, reason} -> {:error, reason}
    end
  end

  defmodule UpdatePassword do
    use Flirtual.EmbeddedSchema

    @optional [:current_password]

    embedded_schema do
      field(:password, :string, redact: true)
      field(:password_confirmation, :string, redact: true)
      field(:current_password, :string, redact: true)
    end

    def changeset(value, _, %{user: user}) do
      value
      |> User.validate_current_password_if_set(user)
      |> User.validate_password()
      |> User.validate_password_confirmation()
      |> then(fn changeset ->
        if User.has_password?(user) do
          validate_predicate(
            changeset,
            &(not User.valid_password?(&2, &1)),
            {:password, {:value, user.password_hash}},
            message: "password_must_be_different"
          )
        else
          changeset
        end
      end)
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

    @optional [:current_password]

    embedded_schema do
      field(:email, :string)
      field(:email_confirmation, :string)
      field(:current_password, :string, redact: true)
    end

    def changeset(value, _, %{user: user}) do
      value
      |> User.validate_current_password_if_set(user)
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

  def add_news(user_ids, news) when is_list(user_ids) and is_binary(news) do
    {count, _} =
      User
      |> where([u], u.id in ^user_ids)
      |> where([u], ^news not in u.news)
      |> Repo.update_all(push: [news: news])

    {:ok, count}
  end

  def remove_news(%User{} = user, news) when is_list(news) do
    user
    |> change(%{news: Enum.reject(user.news, &(&1 in news))})
    |> Repo.update()
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
    import Flirtual.User, only: [validate_current_password_if_set: 2]

    @optional [:comment, :current_password]

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
      |> validate_current_password_if_set(user)
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

  @doc """
  Creates a new user with password (standard registration flow).
  """
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
           {:ok, user} <- setup_new_user(user, attrs),
           :ok <- Flag.check_honeypot(user.id, attrs[:url]) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  @doc """
  Creates a new user without password (social login flow).
  Email is pre-verified since it comes from a trusted provider.
  """
  def create_from_connection(email, options \\ []) do
    notifications = Keyword.get(options, :notifications, false)

    Repo.transaction(fn ->
      with {:ok, user} <-
             %User{}
             |> cast(%{email: email}, [:email])
             |> User.validate_unique_email()
             |> Flag.validate_allowed_email(:email)
             |> Repo.insert(),
           {:ok, user} <-
             setup_new_user(user, %{notifications: notifications}, email_confirmed: true) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  # Shared user setup: generates identifiers, creates preferences/profile, runs checks
  defp setup_new_user(user, attrs, options \\ []) do
    email_confirmed = Keyword.get(options, :email_confirmed, false)
    notifications = Map.get(attrs, :notifications, false)

    with {:ok, user} <-
           change(user, %{
             slug: String.downcase(user.id, :ascii) |> String.slice(0..19),
             talkjs_signature: Talkjs.new_user_signature(user.id),
             revenuecat_id: UUID.generate(),
             unsubscribe_token: UUID.generate(),
             email_confirmed_at:
               if(email_confirmed,
                 do: DateTime.utc_now() |> DateTime.truncate(:second),
                 else: nil
               )
           })
           |> Repo.update(),
         {:ok, preferences} <-
           Ecto.build_assoc(user, :preferences, %{})
           |> Repo.insert(),
         {:ok, _} <-
           Ecto.build_assoc(preferences, :email_notifications, %{newsletter: notifications})
           |> Repo.insert(),
         {:ok, _} <-
           Ecto.build_assoc(preferences, :push_notifications, %{newsletter: notifications})
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
         :ok <- Flag.check_email_flags(user.id, user.email),
         :ok <- check_email_hash(user),
         {:ok, _} <- Talkjs.update_user(user),
         {:ok, _} <- Listmonk.create_subscriber(user),
         {:ok, _} <- if(email_confirmed, do: {:ok, nil}, else: deliver_email_confirmation(user)) do
      {:ok, user}
    end
  end

  defp check_email_hash(user) do
    case Application.get_env(:flirtual, :canary, false) do
      true -> :ok
      false -> Hash.check_hash(user.id, "email", user.email)
    end
  end

  def count do
    Repo.aggregate(User, :count)
  end
end
