defmodule FlirtualWeb.ImageController do
  alias Flirtual.Policy
  alias Flirtual.User.Profile.Image
  use FlirtualWeb, :controller

  action_fallback FlirtualWeb.FallbackController

  def get(conn, %{"image_id" => image_id}) do
    with %Image{} = image <- Image.get(image_id),
         :ok <- Policy.can(conn, :read, image) do
      conn |> json(Policy.transform(conn, image))
    else
      nil -> {:error, {:not_found, "Image not found", %{image_id: image_id}}}
      value -> value
    end
  end

  @year_in_seconds 31_536_000

  def view(conn, %{"image_id" => image_id}) do
    with %Image{} = image <- Image.get(image_id),
         :ok <- Policy.can(conn, :view, image) do
      conn
      |> put_resp_header("cache-control", "public, max-age=#{@year_in_seconds}, immutable")
      |> put_resp_header("etag", image.external_id)
      |> put_status(:permanent_redirect)
      |> redirect(external: Image.url(image))
    else
      nil -> conn |> redirect(external: Image.url(nil))
      value -> value
    end
  end

  def delete(conn, %{"image_id" => image_id}) do
    with %Image{} = image <- Image.get(image_id),
         :ok <- Policy.can(conn, :delete, image),
         {:ok, _} <- Image.delete(image) do
      conn |> json(%{deleted: true})
    else
      nil -> {:error, {:not_found, "Image not found", %{image_id: image_id}}}
      value -> value
    end
  end
end
