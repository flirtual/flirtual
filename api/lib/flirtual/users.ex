defmodule Flirtual.Users do
  import Ecto.Query
  import Ecto

  alias Flirtual.{Repo, User}
  alias Flirtual.User.{Session}

  def get_by_email(email)
      when is_binary(email) do
    Repo.get_by(User, email: email)
  end

  def get_by_email_and_password(email, password)
      when is_binary(password) do
    user = get_by_email(email)
    if User.valid_password?(user, password), do: user
  end

  def get_by_session_token(token)
      when is_binary(token) do
    (Session
     |> where([session], session.hashed_token == ^Session.hash_token(Session.decode_token(token)))
     |> preload(user: ^User.default_assoc())
     |> Repo.one!()).user

    # Repo.one(
    #   from(
    #     session in from(Session,
    #       where: [hashed_token: ^Session.hash_token(Session.decode_token(token))]
    #     ),
    #     join: user in assoc(session, :user),
    #     select: user,
    #     preload: []
    #   )
    # )
  end

  def create_session(%User{} = user) do
    Session.create(user) |> Repo.insert!()
  end

  def register_user(attrs) do
    changeset = %User{} |> User.registration_changeset(attrs)

    with {:ok, user} <- Repo.insert(changeset) do
      {:ok, preferences} = Ecto.build_assoc(user, :preferences) |> Repo.insert()
      {:ok, _} = Ecto.build_assoc(preferences, :email_notifications) |> Repo.insert()
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
