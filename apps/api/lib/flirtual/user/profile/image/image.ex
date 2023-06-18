defmodule Flirtual.User.Profile.Image do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.User.Profile.Image.Policy

  require Flirtual.Utilities
  import Flirtual.Utilities

  alias Flirtual.User.Profile.Image
  alias Flirtual.Repo
  alias Flirtual.User.Profile

  schema "profile_images" do
    belongs_to(:profile, Profile, references: :user_id)

    field(:external_id, :string)
    field(:scanned, :boolean, default: false)
    field(:order, :integer)

    field(:url, :string, virtual: true)

    timestamps()
  end

  def not_found() do
    %Image{external_id: "e8212f93-af6f-4a2c-ac11-cb328bbc4aa4"}
  end

  def url(_, params \\ [])

  def url(%Image{external_id: external_id}, params) do
    URI.new!("https://media.flirtu.al/")
    |> URI.merge(
      external_id <>
        "/" <>
        (Keyword.to_list(params)
         |> then(
           &if(&1 == [],
             do: "",
             else: "-/" <> Enum.map_join(&1, "/-/", fn {k, v} -> "#{k}/#{case v do
                 v when is_list(v) -> Enum.join(v, "/")
                 v when is_binary(v) -> v
                 v when is_atom(v) -> Atom.to_string(v)
                 v when is_integer(v) -> Integer.to_string(v)
                 _ -> raise "Invalid value #{v} for key #{k}"
               end}" end) <> "/"
           )
         ))
    )
    |> URI.to_string()
  end

  def url(_, params) do
    url(not_found(), params)
  end

  def get(image_id) when is_uid(image_id) do
    Repo.get_by(Image, id: image_id)
  end

  def get(_), do: nil

  def delete(%Image{} = image) do
    Repo.delete(image)
  end

  defimpl Jason.Encoder do
    use Flirtual.Encoder,
      only: [
        :id,
        :url,
        :scanned,
        :updated_at,
        :created_at
      ]
  end
end
