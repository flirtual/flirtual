defmodule Flirtual.Users do
  import Ecto.Query
  import Ecto.Changeset

  alias Flirtual.{Repo, User, Sessions}
  alias Flirtual.User.{Session}

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

  def update(%User{} = user, attrs) do
    user
    |> User.update_changeset(attrs)
    |> Repo.update()
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
