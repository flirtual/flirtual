defmodule Flirtual.User.Profile.Attributes do
  use Flirtual.Schema, primary_key: false

  import Ecto.Query
  import Ecto.Changeset

  alias Flirtual.Attribute
  alias Flirtual.Repo
  alias Flirtual.User.Profile
  alias Flirtual.User.Profile.Attributes

  schema "profile_attributes" do
    belongs_to(:profile, Profile, references: :user_id, primary_key: true)
    belongs_to(:attribute, Attribute, references: :id, primary_key: true)
  end

  def list(type, order_by: :popularity) when is_binary(type) do
    from(a in Attribute,
      where: a.type == ^type,
      join: b in Attributes,
      on: a.id == b.attribute_id,
      group_by: [a.id],
      order_by: [desc: count(b.attribute_id)]
    )
    |> Repo.all()
  end

  def update_order(type, order_by) do
    Repo.transaction(fn repo ->
      list(type, order_by: order_by)
      |> Enum.with_index()
      |> Enum.map(fn {attribute, order} ->
        with {:ok, attribute} <-
               change(attribute, %{order: order})
               |> repo.update() do
          attribute
        else
          {:error, reason} -> Repo.rollback(reason)
          reason -> Repo.rollback(reason)
        end
      end)
      |> length()
    end)
  end
end
