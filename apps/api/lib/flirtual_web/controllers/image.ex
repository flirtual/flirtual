defmodule FlirtualWeb.ImageController do
  use FlirtualWeb, :controller

  import FlirtualWeb.Utilities

  alias Flirtual.{Discord, ImageClassification, ObanWorkers, Policy, User}
  alias Flirtual.User.Profile.Image
  alias Flirtual.User.Profile.Image.Moderation
  alias Ecto.UUID

  action_fallback(FlirtualWeb.FallbackController)

  @ten_megabytes 10_000_000

  # Profiles with an image matching the uploaded image.
  def search(conn, _params) do
    if Policy.cannot?(conn, :search, conn.assigns[:session].user) do
      {:error, {:forbidden, :missing_permission}}
    else
      with {:ok, body, conn} <- read_body(conn, length: @ten_megabytes),
           true <- byte_size(body) > 0,
           {:ok, {hash, flipped}} <- ImageClassification.hash(body) do
        hashes =
          [hash, flipped] |> Enum.map(&Image.hash_to_integer/1) |> Enum.filter(&is_integer/1)

        conn |> json(render_matches(hashes))
      else
        false -> {:error, {:bad_request, :empty_body}}
        {:more, _, _conn} -> {:error, {:bad_request, :image_too_large}}
        {:error, _} -> {:error, {:unprocessable_entity, :hash_failed}}
      end
    end
  end

  # Profiles with an image matching an existing image's hash.
  def similar(conn, %{"image_id" => image_id}) do
    if Policy.cannot?(conn, :search, conn.assigns[:session].user) do
      {:error, {:forbidden, :missing_permission}}
    else
      with %Image{hash: hash} = image when is_integer(hash) <- Image.get(image_id) do
        conn |> json(render_matches([hash], image.id))
      else
        %Image{} -> conn |> json([])
        nil -> {:error, {:not_found, :image_not_found, %{image_id: image_id}}}
      end
    end
  end

  defp render_matches(hashes, exclude_id \\ nil) do
    hashes
    |> Moderation.search_similar(exclude_id)
    |> Enum.map(fn {user_id, images} -> %{user_id: user_id, images: images} end)
  end

  def get(conn, %{"image_id" => image_id}) do
    with %Image{} = image <- Image.get(image_id),
         :ok <- Policy.can(conn, :read, image) do
      conn |> json_with_etag(Policy.transform(conn, image))
    else
      nil -> {:error, {:not_found, :image_not_found, %{image_id: image_id}}}
      value -> value
    end
  end

  @twelve_hours 43_200_000

  def upload(conn, _) do
    user_id = conn.assigns[:session].user_id
    bucket = "upload_image:#{user_id}"

    {_, remaining, _, _, _} = ExRated.inspect_bucket(bucket, @twelve_hours, 100)

    if remaining <= 0 do
      {:error, {:unauthorized, :upload_rate_limit}}
    else
      id = UUID.generate()

      with {:ok, signed_url} <- presigned_upload_url(id) do
        ExRated.check_rate(bucket, @twelve_hours, 100)

        conn |> json(%{id: id, signed_url: signed_url})
      end
    end
  end

  defp presigned_upload_url(id) do
    if Application.get_env(:flirtual, :local_uploads?) do
      origin = Application.fetch_env!(:flirtual, :origin)
      {:ok, "#{origin}/v1/images/#{id}/file"}
    else
      bucket =
        case Application.get_env(:flirtual, :canary?) do
          true -> "pfpup-canary"
          _ -> "pfpup"
        end

      ExAws.Config.new(:s3, []) |> ExAws.S3.presigned_url(:put, bucket, id, [])
    end
  end

  def local_upload(conn, %{"image_id" => id}) do
    with {:ok, _} <- UUID.cast(id) do
      uploads_dir = Application.fetch_env!(:flirtual, :local_uploads_dir)
      File.mkdir_p!(uploads_dir)

      file_path = Path.join(uploads_dir, id)

      {:ok, body, conn} = Plug.Conn.read_body(conn, length: 64_000_000)
      File.write!(file_path, body)

      conn
      |> put_resp_header("etag", "\"#{id}\"")
      |> send_resp(:ok, "")
    else
      :error -> {:error, {:bad_request, :invalid_id}}
    end
  end

  def local_file(conn, %{"path" => path_parts}) do
    uploads_dir = Application.fetch_env!(:flirtual, :local_uploads_dir)
    file_path = Path.join([uploads_dir | path_parts])

    # Prevent directory traversal
    if String.starts_with?(Path.expand(file_path), Path.expand(uploads_dir)) and
         File.exists?(file_path) do
      conn
      |> cache_control([:public, :immutable, {"max-age", [year: 1]}])
      |> send_file(200, file_path)
    else
      {:error, {:not_found, :file_not_found}}
    end
  end

  def view(conn, %{"image_id" => image_id, "type" => variant}) do
    with %Image{} = image <- Image.get(image_id),
         :ok <- Policy.can(conn, :view, image) do
      conn =
        conn
        |> cache_control([:public, :immutable, {"max-age", [year: 1]}])

      conn =
        if image.external_id,
          do: put_resp_header(conn, "etag", image.external_id),
          else: conn

      conn
      |> put_status(:permanent_redirect)
      |> redirect(external: Image.url(image, variant))
    else
      nil -> conn |> redirect(external: Image.url(nil))
      value -> value
    end
  end

  def view(conn, %{"image_id" => image_id}),
    do: view(conn, %{"image_id" => image_id, "type" => "full"})

  def delete(conn, %{"image_id" => image_id}) do
    user = conn.assigns[:session].user

    with %Image{} = image <- Image.get(image_id),
         %User{} = image_owner <- User.get(image.profile_id),
         :ok <- Policy.can(conn, :delete, image),
         :ok <-
           if(:moderator in user.tags and user.id != image_owner.id,
             do:
               Discord.deliver_webhook(:removed_image,
                 user: image_owner,
                 moderator: user,
                 image_url: Image.retain_object(image)
               ),
             else: :ok
           ),
         {:ok, _} <- Image.delete(image),
         image_owner = User.get(image_owner.id),
         {:ok, _} <- User.update_status(image_owner),
         {:ok, _} <- ObanWorkers.update_user(image_owner.id, [:elasticsearch, :talkjs]) do
      conn |> json(%{deleted: true})
    else
      nil -> {:error, {:not_found, :image_not_found, %{image_id: image_id}}}
      value -> value
    end
  end

  def delete_illegal(conn, %{"image_id" => image_id}) do
    user = conn.assigns[:session].user

    with %Image{} = image <- Image.get(image_id),
         %User{} = image_owner <- User.get(image.profile_id),
         :ok <- Policy.can(conn, :delete_illegal, image),
         retention when retention != :error <- Image.retain_illegal_object(image),
         key = if(match?({:ok, _}, retention), do: elem(retention, 1)),
         :ok <-
           Discord.deliver_webhook(:illegal_image,
             user: image_owner,
             moderator: user,
             key: key
           ),
         {:ok, _} <- Image.delete(image),
         image_owner = User.get(image_owner.id),
         {:ok, _} <- User.update_status(image_owner),
         {:ok, _} <- ObanWorkers.update_user(image_owner.id, [:elasticsearch, :talkjs]) do
      conn |> json(%{deleted: true})
    else
      nil -> {:error, {:not_found, :image_not_found, %{image_id: image_id}}}
      :error -> {:error, {:internal_server_error, :image_retention_failed}}
      value -> value
    end
  end

  def authenticated?(conn) do
    String.match?(conn.assigns[:authorization_token_type], ~r/bearer/i) and
      Plug.Crypto.secure_compare(
        conn.assigns[:authorization_token],
        Application.fetch_env!(:flirtual, :image_access_token)
      )
  end

  def update_variants(conn, %{
        "original_file" => original_file,
        "external_id" => external_id,
        "blur_id" => blur_id
      }) do
    if authenticated?(conn) do
      with {:ok, image} <- Image.update_variants(original_file, external_id, blur_id) do
        conn |> json(image)
      end
    else
      {:error, {:unauthorized, :invalid_access_token}}
    end
  end

  def scan_queue(conn, %{"size" => size}) do
    {size, _} = Integer.parse(size)

    if authenticated?(conn) do
      images = Moderation.list_scan_queue(size)

      conn
      |> json(images)
    else
      {:error, {:unauthorized, :invalid_access_token}}
    end
  end

  def resolve_scan_queue(conn, %{"success" => _, "failed" => _} = data) do
    if authenticated?(conn) do
      case Moderation.update_scan_queue(data) do
        {:ok, _} -> conn |> json(%{updated: true})
        _ -> {:error, {:unprocessable_entity, :update_failed}}
      end
    else
      {:error, {:unauthorized, :invalid_access_token}}
    end
  end
end
