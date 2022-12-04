defmodule Flirtual.Users do
  import Ecto.Query
  import Ecto.Changeset

  alias Flirtual.{Repo, User, Sessions}
  alias Flirtual.User.{Session, Preferences, Connection}

  def get(id)
      when is_binary(id) do
    User |> where([user], user.id == ^id) |> preload(^User.default_assoc()) |> Repo.one()
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

  def get_by_session_token(token)
      when is_binary(token) do
    (Session
     |> Sessions.query_by_token(token)
     |> preload(user: ^User.default_assoc())
     |> Repo.one()).user
  end

  def get_preferences_by_user_id(user_id)
      when is_binary(user_id) do
    Preferences
    |> where([preferences], preferences.user_id == ^user_id)
    |> preload(^Preferences.default_assoc())
    |> Repo.one()
  end

  def update(%User{} = user, attrs) do
    user
    |> User.update_changeset(attrs)
    |> Repo.update()
  end

  def update_email(%User{} = user, attrs) do
    user
    |> User.update_email_changeset(attrs)
    |> change(email_confirmed_at: nil)
    |> Repo.update()
  end

  def confirm_email(%User{} = user, attrs) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    user
    |> cast(attrs, [:token])
    |> change(email_confirmed_at: now)
    |> Repo.update()
  end

  def update_privacy_preferences(%Preferences.Privacy{} = preferences, attrs) do
    preferences
    |> Preferences.Privacy.update_changeset(attrs)
    |> Repo.update()
  end

  def create_connection(user_id, :discord = connection_type, %{"code" => code}) do
    body =
      URI.encode_query(%{
        client_id: Application.fetch_env!(:flirtual, :discord_client_id),
        client_secret: Application.fetch_env!(:flirtual, :discord_client_secret),
        grant_type: "authorization_code",
        code: code,
        redirect_uri: "http://localhost:4000/v1/auth/connect/discord"
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
            %{"id" => external_id} = Poison.decode!(body)

            %Connection{user_id: user_id, external_id: external_id, type: connection_type}
            |> cast(%{}, [])
            |> Repo.insert_or_update()
          {_, _} ->
            {:error, {:bad_request, "Couldn't get user information"}}
        end

        {:ok, Poison.decode!(body)}

      {_, _} ->
        {:error, {:bad_request, "Connection failed"}}
    end
  end

  def create_connection(_, _, _) do
    {:error, {:not_found, "Unknown connection type"}}
  end


  def list_connections_by_user_id(user_id) do
    Connection
    |> where(user_id: ^user_id)
    |> Repo.all()
    |> Enum.map(&Connection.get_profile(&1))
  end

  def register_user(attrs) do
    changeset =
      {%{},
       %{
         username: :string,
         email: :string,
         password: :string,
         service_agreement: :boolean,
         notifications: :boolean
       }}
      |> cast(attrs, [:username, :email, :password, :service_agreement, :notifications])
      |> validate_required([:username, :email, :password, :service_agreement, :notifications])
      |> validate_acceptance(:service_agreement)

    case changeset.valid? do
      false ->
        {:error, changeset}

      true ->
        source = changeset.changes

        changeset =
          %User{}
          |> cast(changeset.changes, [:username, :email, :password])
          |> User.validate_unique_username()
          |> User.validate_unique_email()
          |> User.validate_password()

        with {:ok, user} <- Repo.insert(changeset) do
          {:ok, preferences} = Ecto.build_assoc(user, :preferences) |> Repo.insert()

          {:ok, _} =
            Ecto.build_assoc(preferences, :email_notifications, %{
              newsletter: source[:notifications]
            })
            |> Repo.insert()

          {:ok, _} = Ecto.build_assoc(preferences, :privacy) |> Repo.insert()

          {:ok, profile} = Ecto.build_assoc(user, :profile) |> Repo.insert()
          {:ok, _} = Ecto.build_assoc(profile, :preferences) |> Repo.insert()

          {:ok,
           user
           |> Repo.preload([
             :connections,
             :subscription,
             preferences: [:email_notifications, :privacy],
             profile: [:preferences, :custom_weights, :images]
           ])}
        end
    end
  end
end
