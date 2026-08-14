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

  @upload_token_lifetime 3600
  @max_upload_size 64_000_000

  # The namespace the tus server routes writes into; see apps/tus-server.
  @upload_audience "attachments"

  def upload(conn, _params) do
    user_id = conn.assigns[:session].user_id
    bucket = "upload_image:#{user_id}"

    {_, remaining, _, _, _} = ExRated.inspect_bucket(bucket, @twelve_hours, 100)

    if remaining <= 0 do
      {:error, {:unauthorized, :upload_rate_limit}}
    else
      id = UUID.generate()
      ExRated.check_rate(bucket, @twelve_hours, 100)

      conn
      |> json(%{
        id: id,
        upload_url: upload_url(),
        upload_token: sign_upload_token(id)
      })
    end
  end

  defp local_uploads?, do: Application.get_env(:flirtual, :local_uploads?)

  defp upload_url do
    if local_uploads?(),
      do: "#{Application.fetch_env!(:flirtual, :origin)}/v1/images/uploads",
      else: "#{Application.fetch_env!(:flirtual, :upload_origin)}/upload/#{@upload_audience}"
  end

  defp upload_signer do
    Application.fetch_env!(:flirtual, :upload_secret)
    |> Base.decode64!()
    |> then(&Joken.Signer.create("HS256", &1))
  end

  # Short-lived token with the exact object key tus-server may write and how
  # large that write may be.
  defp sign_upload_token(id) do
    issued_at = System.os_time(:second)

    {:ok, token} =
      Joken.Signer.sign(
        %{
          "aud" => @upload_audience,
          "sub" => id,
          "scope" => "write",
          "maxLen" => @max_upload_size,
          "iat" => issued_at,
          "exp" => issued_at + @upload_token_lifetime
        },
        upload_signer()
      )

    token
  end

  defp authorized_upload_id(conn) do
    with ["Bearer " <> token] <- get_req_header(conn, "authorization"),
         {:ok, %{"sub" => id, "aud" => @upload_audience, "exp" => expires_at}} <-
           Joken.Signer.verify(token, upload_signer()),
         true <- expires_at > System.os_time(:second),
         {:ok, _} <- UUID.cast(id) do
      {:ok, id}
    else
      _ -> {:error, {:unauthorized, :invalid_upload_token}}
    end
  end

  # For local file uploads in dev, we stand in for the tus server. The offset is
  # however much of the partial file we've already written.
  @tus_version "1.0.0"

  def tus_options(conn, _params) do
    conn
    |> put_resp_header("tus-resumable", @tus_version)
    |> put_resp_header("tus-version", @tus_version)
    |> put_resp_header("tus-extension", "creation")
    |> put_resp_header("tus-max-size", to_string(@max_upload_size))
    |> send_resp(:no_content, "")
  end

  def tus_create(conn, _params) do
    with true <- local_uploads?(),
         {:ok, id} <- authorized_upload_id(conn),
         [raw_length] <- get_req_header(conn, "upload-length"),
         {upload_length, ""} <- Integer.parse(raw_length),
         true <- upload_length > 0 and upload_length <= @max_upload_size do
      File.mkdir_p!(local_uploads_dir())
      File.write!(tus_length_path(id), raw_length)
      File.write!(tus_partial_path(id), "")

      conn
      |> put_resp_header("tus-resumable", @tus_version)
      |> put_resp_header("location", "#{upload_url()}/#{id}")
      |> put_resp_header("upload-offset", "0")
      |> send_resp(:created, "")
    else
      false -> {:error, {:not_found}}
      {:error, error} -> {:error, error}
      _ -> {:error, {:bad_request, :invalid_upload_length}}
    end
  end

  def tus_head(conn, %{"image_id" => id}) do
    with true <- local_uploads?(),
         {:ok, ^id} <- authorized_upload_id(conn),
         {:ok, upload_length} <- tus_expected_length(id) do
      conn
      |> put_resp_header("tus-resumable", @tus_version)
      |> put_resp_header("cache-control", "no-store")
      |> put_resp_header("upload-offset", to_string(tus_offset(id)))
      |> put_resp_header("upload-length", to_string(upload_length))
      |> send_resp(:ok, "")
    else
      _ -> {:error, {:not_found, :upload_not_found}}
    end
  end

  def tus_patch(conn, %{"image_id" => id}) do
    with true <- local_uploads?(),
         {:ok, ^id} <- authorized_upload_id(conn),
         ["application/offset+octet-stream"] <- get_req_header(conn, "content-type"),
         {:ok, upload_length} <- tus_expected_length(id),
         offset = tus_offset(id),
         [^offset] <- conn |> get_req_header("upload-offset") |> Enum.map(&String.to_integer/1),
         {:ok, body, conn} <- read_body(conn, length: @max_upload_size) do
      File.write!(tus_partial_path(id), body, [:append])
      next = offset + byte_size(body)

      if next >= upload_length do
        File.rename!(tus_partial_path(id), Path.join(local_uploads_dir(), id))
        File.rm(tus_length_path(id))
      end

      conn
      |> put_resp_header("tus-resumable", @tus_version)
      |> put_resp_header("upload-offset", to_string(next))
      |> send_resp(:no_content, "")
    else
      _ -> {:error, {:conflict, :upload_offset_mismatch}}
    end
  end

  defp local_uploads_dir, do: Application.fetch_env!(:flirtual, :local_uploads_dir)

  defp tus_partial_path(id), do: Path.join(local_uploads_dir(), "#{id}.part")
  defp tus_length_path(id), do: Path.join(local_uploads_dir(), "#{id}.length")

  defp tus_offset(id) do
    case File.stat(tus_partial_path(id)) do
      {:ok, %File.Stat{size: size}} -> size
      _ -> 0
    end
  end

  defp tus_expected_length(id) do
    with {:ok, contents} <- File.read(tus_length_path(id)),
         {upload_length, ""} <- Integer.parse(contents) do
      {:ok, upload_length}
    else
      _ -> :error
    end
  end

  def local_file(conn, %{"path" => [_ | _] = path_parts}) do
    with true <- local_uploads?(),
         uploads_dir = local_uploads_dir(),
         {:ok, relative} <- Path.safe_relative(Path.join(path_parts), uploads_dir),
         file_path = Path.join(uploads_dir, relative),
         true <- File.exists?(file_path) do
      conn
      |> cache_control([:public, :immutable, {"max-age", [year: 1]}])
      |> send_file(200, file_path)
    else
      _ -> {:error, {:not_found, :file_not_found}}
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
         {:ok, _} <- ObanWorkers.update_user(image_owner.id, [:search_index, :talkjs]) do
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
         {:ok, _} <- ObanWorkers.update_user(image_owner.id, [:search_index, :talkjs]) do
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

  def update_variants(
        conn,
        %{
          "original_file" => original_file,
          "external_id" => external_id,
          "blur_id" => blur_id
        } = params
      ) do
    if authenticated?(conn) do
      blur_hash = Map.get(params, "blur_hash")

      with {:ok, image} <-
             Image.update_variants(original_file, external_id, blur_id, blur_hash) do
        conn |> json(image)
      end
    else
      {:error, {:unauthorized, :invalid_access_token}}
    end
  end
end
