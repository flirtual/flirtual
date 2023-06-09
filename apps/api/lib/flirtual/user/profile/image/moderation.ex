defmodule Flirtual.User.Profile.Image.Moderation do
  use Flirtual.Logger, :image_moderation

  import Ecto.Query

  alias Flirtual.User
  alias Flirtual.Discord
  alias Flirtual.Repo
  alias Flirtual.User.Profile.Image

  def classify_flag?(%{"nsfwjs" => %{"porn" => v}}) when v > 0.5, do: true
  def classify_flag?(%{"nsfwjs" => %{"hentai" => v}}) when v > 0.5, do: true
  def classify_flag?(%{"nsfwjs" => %{"sexy" => v}}) when v > 0.7, do: true

  def classify_flag?(%{"deepDanbooru" => %{"rating:explicit" => v}}) when v > 0.5, do: true
  def classify_flag?(%{"deepDanbooru" => %{"rating:questionable" => v}}) when v > 0.7, do: true

  def classify_flag?(%{"deepDanbooru" => %{"pasties" => v}}) when v > 0.5, do: true

  def classify_flag?(_), do: false

  def list_scan_queue() do
    Image
    |> where(scanned: false)
    |> order_by(asc: :created_at)
    |> limit(100)
    |> select([image], image.id)
    |> Repo.all()
  end

  def classify_image(%Image{} = image, classifications) do
    flagged = classify_flag?(classifications)

    log(:info, ["classify", image.id], %{
      classifications: classifications,
      flagged: flagged
    })

    if flagged do
      with %User{} = user <- User.get(image.profile_id) do
        Discord.deliver_webhook(:flagged_image, user: user, image: image)
      end
    end

    # image
    # |> change(%{scanned: true})
    # |> Repo.update()
  end

  def update_scan_queue(data) do
    Repo.transaction(fn ->
      data
      |> Map.to_list()
      |> Enum.each(fn {id, classifications} ->
        Image.get(id)
        |> case do
          %Image{} = image ->
            classify_image(image, classifications)

          _ ->
            nil
        end
      end)
    end)
  end
end
