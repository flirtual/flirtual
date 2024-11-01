defmodule Flirtual.User.Profile.Image do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.User.Profile.Image.Policy

  require Flirtual.Utilities
  import Flirtual.Utilities
  import Flirtual.Utilities.Changeset

  alias Flirtual.User.Profile.Image
  alias Flirtual.Repo
  alias Flirtual.User.Profile

  import Ecto.{Changeset, Query}

  schema "profile_images" do
    belongs_to(:profile, Profile, references: :user_id)

    field(:original_file, :string)
    field(:external_id, :string)
    field(:blur_id, :string)
    field(:scanned, :boolean, default: false)
    field(:failed, :boolean, default: false)
    field(:order, :integer)

    timestamps()
  end

  def changeset(image, attrs) do
    image
    |> cast(attrs, [
      :profile_id,
      :original_file,
      :external_id,
      :blur_id,
      :scanned,
      :failed,
      :order
    ])
    |> validate_required([:original_file])
    |> validate_uid(:profile_id)
    |> foreign_key_constraint(:profile_id)
    |> validate_uid(:external_id)
    |> validate_uid(:blur_id)
  end

  def not_found() do
    %Image{
      original_file: "e8212f93-af6f-4a2c-ac11-cb328bbc4aa4",
      external_id: "c40becbf-c934-433b-a680-2d475138b16e",
      blur_id: "3b872345-0743-4e1c-b4b6-3dfa4a757fc5"
    }
  end

  def url(_, variant \\ "full")

  def url(%Image{blur_id: blur_id}, "blur") when is_binary(blur_id) do
    URI.new!("https://pfp.flirtu.al/")
    |> URI.merge(blur_id <> "/blur")
    |> URI.to_string()
  end

  def url(%Image{external_id: external_id}, variant) when is_binary(external_id) do
    IO.inspect(external_id, label: "EXTERNAL ID")
    IO.inspect(variant, label: "VARIANT")

    URI.new!("https://pfp.flirtu.al/")
    |> URI.merge(external_id <> "/" <> variant)
    |> URI.to_string()
  end

  def url(%Image{original_file: original_file}, _) when is_binary(original_file) do
    URI.new!("https://pfpup.flirtu.al/")
    |> URI.merge(original_file |> URI.encode())
    |> URI.to_string()
  end

  def url(_, variant) do
    url(not_found(), variant)
  end

  def get(image_id) when is_uid(image_id) do
    Repo.get_by(Image, id: image_id)
  end

  def get(_), do: nil

  def delete(%Image{} = image) do
    Repo.delete(image)
  end

  def update_variants(original_file, external_id, blur_id) do
    Repo.transaction(fn ->
      now = DateTime.truncate(DateTime.utc_now(), :second)

      existing_image =
        Image
        |> where(original_file: ^original_file)
        |> order_by([image], desc: image.created_at)
        |> Repo.one()

      changeset =
        if existing_image do
          Image.changeset(existing_image, %{
            external_id: external_id,
            blur_id: blur_id,
            updated_at: now
          })
        else
          %Image{}
          |> Image.changeset(%{
            original_file: original_file,
            external_id: external_id,
            blur_id: blur_id,
            updated_at: now,
            created_at: now
          })
        end

      case Repo.insert_or_update(changeset) do
        {:ok, image} -> image
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end

  defimpl Jason.Encoder do
    use Flirtual.Encoder,
      only: [
        :id,
        :original_file,
        :external_id,
        :scanned,
        :updated_at,
        :created_at
      ]
  end
end
