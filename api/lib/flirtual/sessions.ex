defmodule Flirtual.Sessions do
  import Ecto.Query

  alias Flirtual.{Repo, User}
  alias Flirtual.User.{Session}

  def create(%User{} = user) do
    Session.create(user) |> Repo.insert!() |> Repo.preload(Session.default_assoc())
  end

  def delete(token) when is_binary(token) do
    Session |> query_by_token(token) |> Repo.delete_all()
  end

  def delete_all_by_user_id(user_id) when is_binary(user_id) do
    Session |> query_by_user_id(user_id) |> Repo.delete_all()
  end

  def get_by_token(token) do
    Session
    |> query_by_token(token)
    |> preload(^Session.default_assoc())
    |> Repo.one()
  end

  def query_by_user_id(query, user_id) do
    query
    |> where([session], session.user_id == ^user_id)
  end

  def query_by_token(query, token) do
    query
    |> where([session], session.hashed_token == ^Session.hash_token(Session.decode_token(token)))
  end
end
