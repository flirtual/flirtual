defmodule Flirtual.Sessions do
  import Ecto.Query

  alias Flirtual.{Repo, User}
  alias Flirtual.User.{Session}

  def create(%User{} = user) do
    Session.create(user) |> Repo.insert!()
  end

  def delete(token) when is_binary(token) do
    Session |> query_by_token(token) |> Repo.delete_all()
  end

  def get_by_token (token) do
    Session
    |> query_by_token(token)
    |> Repo.one!()
  end

  def query_by_token(query, token) do
    query
    |> where([session], session.hashed_token == ^Session.hash_token(Session.decode_token(token)))
  end
end
