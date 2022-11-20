defmodule Flirtual.Profiles do
  import Ecto.Query
  import Ecto.Changeset

  alias Flirtual.{Repo, User, Sessions}
  alias Flirtual.User.{Profile}

  def get(id) when is_binary(id) do
    Profile
    |> query_by_id(id)
    |> preload(^Profile.default_assoc())
    |> Repo.one()
  end

  def get_by_user_id(user_id) when is_binary(user_id) do
    Profile
    |> query_by_user_id(user_id)
    |> preload(^Profile.default_assoc())
    |> Repo.one()
  end

  def update(%Profile{} = profile, attrs) do
    profile
    |> Profile.update_changeset(attrs)
    |> Repo.update()
  end

  def update_preferences(%Profile.Preferences{} = preferences, attrs) do
    preferences
    |> Profile.Preferences.update_changeset(attrs)
    |> Repo.update()
  end

  def query_by_id(query, id) do
    query |> where([profile], profile.id == ^id)
  end

  def query_by_user_id(query, user_id) do
    query |> where([profile], profile.user_id == ^user_id)
  end
end
