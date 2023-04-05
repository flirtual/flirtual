defmodule Flirtual.Users do
  import Ecto.Query
  import Ecto.Changeset
  import Flirtual.Utilities.Changeset

  import Flirtual.HCaptcha, only: [validate_captcha: 1]

  alias Flirtual.User.ChangeQueue
  alias Flirtual.Talkjs
  alias Flirtual.Jwt
  alias Flirtual.{Repo, User}
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

  def get_by_login_and_password(login, password)
      when is_binary(password) do
    user = get_by_username(login) || get_by_email(login)
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

  defmodule UpdatePassword do
    use Flirtual.EmbeddedSchema

    embedded_schema do
      field :password, :string
      field :password_confirmation, :string
      field :current_password, :string
    end

    def changeset(value, _, %{user: user}) do
      value
      |> User.validate_current_password(user)
      |> User.validate_password()
      |> User.validate_password_confirmation()
      |> validate_predicate(
        &(not User.valid_password?(&2, &1)),
        {:password, {:value, user.password_hash}},
        message: "New password cannot be the same as the old password"
      )
    end
  end

  def update_password(%User{} = user, attrs) do
    Repo.transaction(fn ->
      with {:ok, attrs} <- UpdatePassword.apply(attrs, context: %{user: user}),
           {:ok, user} <-
             user
             |> User.put_password(attrs.password)
             |> Repo.update(),
           {_, _} <- Session.delete(user_id: user.id) do
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
      field :email, :string
      field :password, :string
      field :password_confirmation, :string
      field :token, :string

      field :user, :map, virtual: true
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
           {:ok, user} <- update_password(attrs.user, attrs) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  defmodule UpdateEmail do
    use Flirtual.EmbeddedSchema

    alias Flirtual.Users

    embedded_schema do
      field :email, :string
      field :email_confirmation, :string
      field :current_password, :string
    end

    def changeset(value, _, %{user: user}) do
      value
      |> User.validate_current_password(user)
      |> User.validate_email()
      |> validate_confirmation(:email, message: "Email doesn't match")
      |> validate_predicate(:not_equal, {:email, {:value, user.email}},
        message: "New email cannot be the same as the old email"
      )
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
             |> User.update_email_changeset(attrs)
             |> Repo.update(),
           {:ok, _} <- ChangeQueue.add(user.id),
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
      field :token, :string
      field :user, :map, virtual: true
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
             |> Repo.update() do
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
    now = DateTime.utc_now() |> DateTime.truncate(:second)

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

  def create(attrs, options \\ []) do
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
             |> then(
               &if(Keyword.fetch!(options, :captcha) != false,
                 do: &1 |> validate_captcha(),
                 else: &1
               )
             )
             |> apply_action(:update),
           {:ok, user} <-
             %User{}
             |> cast(attrs, [:username, :email, :password])
             |> User.validate_unique_username()
             |> User.validate_unique_email()
             |> User.validate_password()
             |> User.put_password()
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
           {:ok, _} <- deliver_email_confirmation(user) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end
end
