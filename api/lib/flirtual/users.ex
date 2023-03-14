defmodule Flirtual.Users do
  import Ecto.Query
  import Ecto.Changeset
  import Flirtual.Utilities.Changeset

  import Flirtual.HCaptcha, only: [validate_captcha: 1]

  alias Flirtual.User.ChangeQueue
  alias Flirtual.Talkjs
  alias Flirtual.Jwt
  alias Flirtual.{Repo, Mailer, User}
  alias Flirtual.User.{Session, Preferences, Connection}

  def get(id)
      when is_binary(id) do
    User |> where([user], user.id == ^id) |> preload(^User.default_assoc()) |> Repo.one()
  end

  def get_by_username(username)
      when is_binary(username) do
    User
    |> where([user], user.username == ^username)
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
    User |> where([user], user.email == ^email) |> preload(^User.default_assoc()) |> Repo.one()
  end

  def get_by_email_and_password(email, password)
      when is_binary(password) do
    user = get_by_email(email)
    if User.valid_password?(user, password), do: user
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
      with {:ok, user} <-
             user
             |> User.changeset(attrs, options)
             |> Repo.update(),
           {:ok, _} <- ChangeQueue.add(user.id) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def update_password(%User{} = user, attrs) do
    Repo.transaction(fn ->
      with {:ok, user} <-
             user
             |> User.update_password_changeset(attrs)
             |> Repo.update() do
        {_, _} = Session.delete(user_id: user.id)
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def send_email_confirmation(user) do
    {:ok, token, _} = Jwt.sign_email_confirmation(user)
    {:ok, _} = deliver_email_confirmation_instructions(user, token)
    {:ok, token}
  end

  def update_email(%User{} = user, attrs) do
    Repo.transaction(fn ->
      with {:ok, user} <-
             user
             |> User.update_email_changeset(attrs)
             |> change(email_confirmed_at: nil)
             |> Repo.update(),
           {:ok, _} <- ChangeQueue.add(user.id),
           {:ok, _} <- send_email_confirmation(user) do
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
           {:ok, _} <- ChangeQueue.add(preferences.user_id) do
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
    notification_preferences
    |> Preferences.EmailNotifications.update_changeset(attrs)
    |> Repo.update()
  end

  def deactivate(%User{} = user) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    Repo.transaction(fn ->
      with {:ok, user} <-
             user
             |> change(%{deactivated_at: now})
             |> Repo.update(),
           {:ok, _} <- ChangeQueue.add(user.id) do
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
           {:ok, _} <- ChangeQueue.add(user.id) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def delete(%User{} = user) do
    user |> Repo.delete()
  end

  def assign_connection(user_id, :discord = connection_type, %{"code" => code}) do
    connection = get_connection(user_id, connection_type)

    body =
      URI.encode_query(%{
        client_id: Application.fetch_env!(:flirtual, :discord_client_id),
        client_secret: Application.fetch_env!(:flirtual, :discord_client_secret),
        grant_type: "authorization_code",
        code: code,
        redirect_uri: "http://127.0.0.1:4000/v1/auth/connect/discord"
      })

    headers = %{"content-type" => "application/x-www-form-urlencoded"}

    case HTTPoison.post("https://discord.com/api/oauth2/token", body, headers) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        %{
          "access_token" => access_token,
          "token_type" => token_type
        } = Poison.decode!(body)

        case HTTPoison.get("https://discord.com/api/users/@me", %{
               authorization: token_type <> " " <> access_token
             }) do
          {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
            external_profile = Poison.decode!(body)

            {:ok, connection} =
              %Connection{
                (connection || %Connection{user_id: user_id})
                | external_id: external_profile["id"],
                  type: connection_type
              }
              |> Connection.update_changeset()
              |> Repo.insert_or_update()

            {:ok, Connection.assign_connection(connection, external_profile)}

          {_, _} ->
            {:error, {:bad_request, "Couldn't get user information"}}
        end

      {_, _} ->
        {:error, {:bad_request, "Connection failed"}}
    end
  end

  def assign_connection(_, _, _) do
    {:error, {:not_found, "Unknown connection type"}}
  end

  def list_connections_by_user_id(user_id) do
    Connection
    |> where(user_id: ^user_id)
    |> Repo.all()
    |> Enum.map(&Connection.get_profile(&1))
  end

  def get_connection(user_id, type) do
    Connection
    |> where(user_id: ^user_id, type: ^type)
    |> Repo.one()
  end

  def create(attrs) do
    Repo.transaction(fn ->
      with {:ok, attrs} <-
             cast_arbitrary(
               %{
                 username: :string,
                 email: :string,
                 password: :string,
                 service_agreement: :boolean,
                 notifications: :boolean,
                 captcha: :string
               },
               attrs
             )
             |> validate_required([
               :username,
               :email,
               :password,
               :service_agreement,
               :notifications
             ])
             |> validate_acceptance(:service_agreement)
             |> validate_captcha()
             |> apply_action(:update),
           {:ok, user} <-
             %User{}
             |> cast(attrs, [:username, :email, :password])
             |> User.validate_unique_username()
             |> User.validate_unique_email()
             |> User.validate_password()
             |> Repo.insert(),
           {:ok, user} <-
             change(user, %{talkjs_signature: Talkjs.new_user_signature(user.id)})
             |> Repo.update(),
           {:ok, preferences} <-
             Ecto.build_assoc(user, :preferences)
             |> Repo.insert(),
           {:ok, _} <-
             Ecto.build_assoc(preferences, :email_notifications, %{
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
           {:ok, _} <- Talkjs.update_user(user),
           {:ok, _} <- send_email_confirmation(user) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  defp deliver_email_confirmation_instructions(user, token) do
    action_url =
      URI.to_string(Application.fetch_env!(:flirtual, :frontend_origin)) <>
        "/confirm-email?token=" <> token

    Mailer.send(
      user,
      "Confirm your email address",
      """
      Please confirm your email address:
      #{action_url}
      """,
      """
      <p>Please click here to confirm your email:</p>

      <p><a href="#{action_url}" class="btn">Confirm</a></p>

      <script type="application/ld+json">
      {
        "@context": "http://schema.org",
        "@type": "EmailMessage",
        "description": "Confirm your email",
        "potentialAction": {
          "@type": "ViewAction",
          "url": "$confirm",
          "name": "Confirm"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Flirtual",
          "url": "https://flirtu.al/"
        }
      }
      </script>
      """,
      action_url
    )
  end
end
