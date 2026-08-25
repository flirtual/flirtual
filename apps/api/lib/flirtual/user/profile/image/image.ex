defmodule Flirtual.User.Profile.Image do
  use Flirtual.Schema
  use Flirtual.Logger, :image
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
    field(:blur_hash, :string)
    field(:hash, :integer)
    field(:order, :integer)
    field(:spatial_id, :string)
    field(:author_id, :string)
    field(:author_name, :string)
    field(:world_id, :string)
    field(:world_name, :string)
    field(:suspended_url, :string)

    timestamps()
  end

  def changeset(image, attrs) do
    image
    |> cast(attrs, [
      :profile_id,
      :original_file,
      :external_id,
      :blur_id,
      :blur_hash,
      :hash,
      :order,
      :spatial_id,
      :author_id,
      :author_name,
      :world_id,
      :world_name
    ])
    |> validate_required([:original_file])
    |> validate_uid(:profile_id)
    |> foreign_key_constraint(:profile_id)
    |> unique_constraint(:original_file)
    |> validate_uid(:external_id)
    |> validate_uid(:blur_id)
    |> validate_uid(:spatial_id)
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
    url(:content, blur_id <> "/blur")
  end

  def url(%Image{spatial_id: spatial_id}, "spatial") when is_binary(spatial_id) do
    url(:content, spatial_id <> "/spatial")
  end

  def url(%Image{external_id: external_id}, variant) when is_binary(external_id) do
    url(:content, external_id <> "/" <> variant)
  end

  def url(%Image{original_file: original_file}, _) when is_binary(original_file) do
    url(:uploads, original_file)
  end

  def url(:content, path) when is_binary(path) do
    case Application.get_env(:flirtual, :content_origin) do
      nil ->
        local_file_url(path)

      origin ->
        URI.new!(origin)
        |> URI.merge(path |> URI.encode())
        |> URI.to_string()
    end
  end

  def url(:uploads, path) when is_binary(path) do
    case Application.get_env(:flirtual, :uploads_origin) do
      nil ->
        local_file_url(path)

      origin ->
        URI.new!(origin)
        |> URI.merge(path |> URI.encode())
        |> URI.to_string()
    end
  end

  def url(:retained, path) when is_binary(path) do
    case Application.get_env(:flirtual, :retained_origin) do
      nil ->
        local_file_url(path)

      origin ->
        URI.new!(origin)
        |> URI.merge(path |> URI.encode())
        |> URI.to_string()
    end
  end

  defp local_file_url(path) do
    origin = Application.fetch_env!(:flirtual, :origin)
    "#{origin}/v1/images/files/#{path |> URI.encode()}"
  end

  def url(_, variant) do
    url(not_found(), variant)
  end

  def get(image_id) when is_uid(image_id) do
    Repo.get_by(Image, id: image_id)
  end

  def get(_), do: nil

  @uint64_max 0x1_0000_0000_0000_0000
  @int64_max 0x8000_0000_0000_0000

  # Convert 64-character perceptual hash binary string into a signed 64-bit
  # integer for storage, or nil if malformed.
  def hash_to_integer(hash) when is_binary(hash) do
    if hash =~ ~r/^[01]{64}$/ do
      case String.to_integer(hash, 2) do
        value when value >= @int64_max -> value - @uint64_max
        value -> value
      end
    end
  end

  def hash_to_integer(_), do: nil

  def delete(%Image{} = image) do
    delete_objects(image)
    Repo.delete(image)
  end

  # external_id variants
  # (blur uses blur_id)
  @content_variants ~w(full profile thumb icon)

  # sobelow_skip ["Traversal.FileModule"]
  def delete_objects(%Image{} = image) do
    uploads_keys = if is_binary(image.original_file), do: [image.original_file], else: []

    content_keys =
      if(is_binary(image.external_id),
        do: Enum.map(@content_variants, &"#{image.external_id}/#{&1}"),
        else: []
      ) ++
        if(is_binary(image.blur_id), do: ["#{image.blur_id}/blur"], else: []) ++
        if(is_binary(image.spatial_id), do: ["#{image.spatial_id}/spatial"], else: [])

    if Application.get_env(:flirtual, :local_uploads?) do
      dir = Application.fetch_env!(:flirtual, :local_uploads_dir)

      (uploads_keys ++ content_keys)
      |> Enum.map(&File.rm(Path.join(dir, &1)))
      |> first_error()
    else
      keys =
        Enum.map(uploads_keys, &{uploads_bucket(), &1}) ++
          Enum.map(content_keys, &{content_bucket(), &1})

      keys
      |> Enum.map(fn {bucket, key} ->
        ExAws.S3.delete_object(bucket, key) |> ExAws.request()
      end)
      |> first_error()
    end
  end

  defp first_error(results), do: Enum.find(results, :ok, &(not deleted?(&1)))

  defp deleted?(:ok), do: true
  defp deleted?({:ok, _}), do: true
  defp deleted?({:error, :enoent}), do: true
  defp deleted?(_), do: false

  defp uploads_bucket,
    do: if(Application.get_env(:flirtual, :canary?), do: "pfpup-canary", else: "pfpup")

  defp content_bucket,
    do: if(Application.get_env(:flirtual, :canary?), do: "pfp-canary", else: "pfp")

  defp retained_bucket,
    do:
      if(Application.get_env(:flirtual, :canary?), do: "pfpretained-canary", else: "pfpretained")

  def retain_object(%Image{} = image) do
    if Application.get_env(:flirtual, :local_uploads?) do
      nil
    else
      case copy_object(image, retained_bucket()) do
        {:ok, id} -> url(:retained, id)
        :error -> nil
      end
    end
  end

  def retain_illegal_object(%Image{} = image) do
    if Application.get_env(:flirtual, :local_uploads?),
      do: :skip,
      else: copy_object(image, "quarantine")
  end

  defp copy_object(%Image{} = image, bucket) do
    id = Ecto.UUID.generate()

    with {source_bucket, source_key} <- copy_source(image),
         {:ok, _} <-
           ExAws.S3.put_object_copy(bucket, id, source_bucket, source_key) |> ExAws.request() do
      {:ok, id}
    else
      _ -> :error
    end
  end

  defp copy_source(%Image{external_id: external_id}) when is_binary(external_id),
    do: {content_bucket(), external_id <> "/full"}

  defp copy_source(%Image{original_file: original_file}) when is_binary(original_file),
    do: {uploads_bucket(), original_file}

  defp copy_source(_), do: nil

  # sobelow_skip ["Traversal.FileModule"]
  def put_spatial(spatial_id, body)
      when is_binary(spatial_id) and is_binary(body) do
    key = "#{spatial_id}/spatial"

    if Application.get_env(:flirtual, :local_uploads?) do
      dir = Application.fetch_env!(:flirtual, :local_uploads_dir)
      path = Path.join(dir, key)

      with :ok <- File.mkdir_p(Path.dirname(path)),
           :ok <- File.write(path, body) do
        :ok
      else
        _ -> :error
      end
    else
      case ExAws.S3.put_object(content_bucket(), key, body,
             content_type: "image/heic",
             cache_control: "public, max-age=31536000, immutable"
           )
           |> ExAws.request() do
        {:ok, _} -> :ok
        _ -> :error
      end
    end
  end

  def put_spatial(_, _), do: :error

  def delete_user_objects(user_id) when is_binary(user_id) do
    images = Image |> where(profile_id: ^user_id) |> Repo.all()

    with {:error, reason} <- images |> Enum.map(&delete_objects/1) |> first_error() do
      log(:error, [:delete_user_objects, user_id], reason)
      {:error, reason}
    end
  end

  # Detach image from profile before pruning and reduce to hash for duplicate
  # flagging.
  def retain_user_hashes(user_id, suspended_url) when is_binary(user_id) do
    Image
    |> where([image], image.profile_id == ^user_id and not is_nil(image.hash))
    |> Repo.update_all(
      set: [
        profile_id: nil,
        order: nil,
        external_id: nil,
        blur_id: nil,
        author_id: nil,
        author_name: nil,
        world_id: nil,
        world_name: nil,
        suspended_url: suspended_url
      ]
    )

    :ok
  end

  def update_variants(original_file, external_id, blur_id, blur_hash) do
    Repo.transaction(fn ->
      now = DateTime.truncate(DateTime.utc_now(), :second)

      attrs = %{
        external_id: external_id,
        blur_id: blur_id,
        blur_hash: blur_hash,
        updated_at: now
      }

      original_file
      |> upsert_variant_rows(attrs, now)
      |> Enum.map(fn
        {:ok, image} ->
          Image.Moderation.enqueue_scan(image)
          image

        {:error, reason} ->
          Repo.rollback(reason)
      end)
      |> List.first()
    end)
  end

  # A key can match several rows: attached one(s), an in-flight row created
  # before the profile was saved, and retained hash rows, which must stay
  # frozen. Update every attached row, else the newest in-flight row, else
  # create one; when the insert loses the race against
  # Profiles.create_images, adopt the winner's row instead.
  defp upsert_variant_rows(original_file, attrs, now, retry? \\ true) do
    existing_images =
      Image
      |> where(original_file: ^original_file)
      |> where([image], is_nil(image.suspended_url))
      |> order_by([image], desc: image.created_at)
      |> Repo.all()

    case Enum.filter(existing_images, &(not is_nil(&1.profile_id))) do
      [] when existing_images == [] ->
        %Image{}
        |> Image.changeset(Map.merge(attrs, %{original_file: original_file, created_at: now}))
        |> Repo.insert(mode: :savepoint)
        |> case do
          {:error, changeset} = error ->
            if retry? and original_file_conflict?(changeset),
              do: upsert_variant_rows(original_file, attrs, now, false),
              else: [error]

          ok ->
            [ok]
        end

      [] ->
        [Repo.update(Image.changeset(List.first(existing_images), attrs))]

      attached ->
        Enum.map(attached, &Repo.update(Image.changeset(&1, attrs)))
    end
  end

  def original_file_conflict?(%Ecto.Changeset{errors: errors}) do
    Enum.any?(errors, fn
      {:original_file, {_, meta}} -> meta[:constraint] == :unique
      _ -> false
    end)
  end

  defimpl Jason.Encoder do
    use Flirtual.Encoder,
      only: [
        :id,
        :original_file,
        :external_id,
        :blur_hash,
        :spatial_id,
        :updated_at,
        :created_at,
        :author_id,
        :author_name,
        :world_id,
        :world_name
      ]
  end
end
