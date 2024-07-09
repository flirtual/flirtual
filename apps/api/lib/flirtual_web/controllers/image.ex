defmodule FlirtualWeb.ImageController do
  use FlirtualWeb, :controller

  import FlirtualWeb.Utilities

  alias Flirtual.{Discord, ObanWorkers, Policy, User}
  alias Flirtual.User.Profile.Image
  alias Flirtual.User.Profile.Image.Moderation

  action_fallback(FlirtualWeb.FallbackController)

  def get(conn, %{"image_id" => image_id}) do
    with %Image{} = image <- Image.get(image_id),
         :ok <- Policy.can(conn, :read, image) do
      conn |> json_with_etag(Policy.transform(conn, image))
    else
      nil -> {:error, {:not_found, "Image not found", %{image_id: image_id}}}
      value -> value
    end
  end

  @year_in_seconds 31_536_000

  def view(conn, %{"image_id" => image_id} = params) do
    with %Image{} = image <- Image.get(image_id),
         :ok <- Policy.can(conn, :view, image) do
      conn
      |> put_resp_header("cache-control", "public, max-age=#{@year_in_seconds}, immutable")
      |> put_resp_header("etag", image.external_id)
      |> put_status(:permanent_redirect)
      |> redirect(
        external:
          image
          |> Image.url(
            params
            |> Map.delete("image_id")
          )
      )
    else
      nil -> conn |> redirect(external: Image.url(nil))
      value -> value
    end
  end

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
                 image: image
               ),
             else: :ok
           ),
         {:ok, _} <- Image.delete(image),
         {:ok, _} <- ObanWorkers.update_user(image.profile_id, [:elasticsearch, :talkjs]) do
      conn |> json(%{deleted: true})
    else
      nil -> {:error, {:not_found, "Image not found", %{image_id: image_id}}}
      value -> value
    end
  end

  def authenticated?(conn) do
    String.match?(conn.assigns[:authorization_token_type], ~r/bearer/i) and
      conn.assigns[:authorization_token] ==
        Application.fetch_env!(:flirtual, :image_access_token)
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
      {:error, {:unauthorized, "Invalid access token"}}
    end
  end

  def scan_queue(conn, %{"size" => size}) do
    {size, _} = Integer.parse(size)

    if authenticated?(conn) do
      images = Moderation.list_scan_queue(size)

      conn
      |> json(images)
    else
      {:error, {:unauthorized, "Invalid access token"}}
    end
  end

  def resolve_scan_queue(conn, %{"success" => _, "failed" => _} = data) do
    if authenticated?(conn) do
      case Moderation.update_scan_queue(data) do
        {:ok, _} -> conn |> json(%{updated: true})
        _ -> {:error, {:unprocessable_entity, "Unable to update scan queue"}}
      end
    else
      {:error, {:unauthorized, "Invalid access token"}}
    end
  end
end
