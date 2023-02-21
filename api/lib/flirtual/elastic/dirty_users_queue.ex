defmodule Flirtual.Elastic.DirtyUsersQueue do
  use Flirtual.Schema

  alias Flirtual.User

  schema "dirty_users_queue" do
    belongs_to :user, User
    timestamps(inserted_at: :created_at)
  end
end
