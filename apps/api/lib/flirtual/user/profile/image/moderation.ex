defmodule Flirtual.User.Profile.Image.Moderation do
  use Flirtual.Logger, :image_moderation

  import Ecto.Query
  import Ecto.Changeset

  alias Flirtual.User
  alias Flirtual.Discord
  alias Flirtual.Repo
  alias Flirtual.User.Profile.Image

  # https://github.com/flirtual/deep-danbooru
  # https://danbooru.donmai.us/wiki_pages/tag_groups
  def classify_flag?(classifications) do
    case classifications do
      # Neutral usually applies for real-life images.
      %{"nsfwjs" => %{"neutral" => _}, "deepDanbooru" => %{"blood" => _}} -> :illegal
      %{"nsfwjs" => %{"neutral" => _}, "deepDanbooru" => %{"drugs" => _}} -> :illegal
      %{"nsfwjs" => %{"neutral" => _}, "deepDanbooru" => %{"weapon" => _}} -> :illegal
      # Specific or niche classifications.
      %{"deepDanbooru" => %{"ahegao" => _}} -> :nsfw
      %{"deepDanbooru" => %{"ass_focus" => _}} -> :nsfw
      %{"deepDanbooru" => %{"baby" => _}} -> :underage
      %{"deepDanbooru" => %{"bdsm" => _}} -> :nsfw
      %{"deepDanbooru" => %{"bondage" => _}} -> :nsfw
      %{"deepDanbooru" => %{"breast_focus" => _}} -> :nsfw
      %{"deepDanbooru" => %{"breast_tattoo" => _}} -> :nsfw
      %{"deepDanbooru" => %{"cameltoe" => _}} -> :nsfw
      %{"deepDanbooru" => %{"chat_log" => _}} -> :spam
      %{"deepDanbooru" => %{"child" => _}} -> :underage
      %{"deepDanbooru" => %{"comic" => _}} -> :spam
      %{"deepDanbooru" => %{"cum" => _}} -> :nsfw
      %{"deepDanbooru" => %{"diaper" => _}} -> :underage
      %{"deepDanbooru" => %{"fellatio_gesture" => _}} -> :nsfw
      %{"deepDanbooru" => %{"foot_focus" => _}} -> :nsfw
      %{"deepDanbooru" => %{"groping" => _}} -> :nsfw
      %{"deepDanbooru" => %{"guro" => _}} -> :violence
      %{"deepDanbooru" => %{"implied_fellatio" => _}} -> :nsfw
      %{"deepDanbooru" => %{"implied_fingering" => _}} -> :nsfw
      %{"deepDanbooru" => %{"implied_masturbation" => _}} -> :nsfw
      %{"deepDanbooru" => %{"implied_sex" => _}} -> :nsfw
      %{"deepDanbooru" => %{"licking_foot" => _}} -> :nsfw
      %{"deepDanbooru" => %{"lingerie" => _}} -> :nsfw
      %{"deepDanbooru" => %{"meme" => _}} -> :spam
      %{"deepDanbooru" => %{"nude" => _}} -> :nsfw
      %{"deepDanbooru" => %{"oral_invitation" => _}} -> :nsfw
      %{"deepDanbooru" => %{"pasties" => _}} -> :nsfw
      %{"deepDanbooru" => %{"peeing" => _}} -> :nsfw
      %{"deepDanbooru" => %{"penetration_gesture" => _}} -> :nsfw
      %{"deepDanbooru" => %{"phone_screen" => _}} -> :spam
      %{"deepDanbooru" => %{"presenting" => _}} -> :nsfw
      %{"deepDanbooru" => %{"pubic_tattoo" => _}} -> :nsfw
      %{"deepDanbooru" => %{"severed_head" => _}} -> :violence
      %{"deepDanbooru" => %{"severed_limb" => _}} -> :violence
      %{"deepDanbooru" => %{"sex_toy" => _}} -> :nsfw
      %{"deepDanbooru" => %{"sexually_suggestive" => _}} -> :nsfw
      %{"deepDanbooru" => %{"stab" => _}} -> :violence
      %{"deepDanbooru" => %{"straddling" => _}} -> :nsfw
      %{"deepDanbooru" => %{"swastika" => _}} -> :hate
      %{"deepDanbooru" => %{"teenage" => _}} -> :underage
      %{"deepDanbooru" => %{"text-only_page" => _}} -> :spam
      %{"deepDanbooru" => %{"text_focus" => _}} -> :spam
      %{"deepDanbooru" => %{"top-down_bottom-up" => _}} -> :nsfw
      %{"deepDanbooru" => %{"underwear" => _}} -> :nsfw
      %{"deepDanbooru" => %{"vore" => _}} -> :nsfw
      %{"deepDanbooru" => %{"wall_of_text" => _}} -> :spam
      %{"deepDanbooru" => %{"watermark" => _}} -> :spam
      # Generalistic ratings.
      %{"nsfwjs" => %{"porn" => _}} -> :nsfw
      %{"nsfwjs" => %{"hentai" => _}} -> :nsfw
      %{"nsfwjs" => %{"sexy" => v}} when v > 0.8 -> :nsfw
      %{"deepDanbooru" => %{"rating:explicit" => _}} -> :nsfw
      %{"deepDanbooru" => %{"rating:questionable" => v}} when v > 0.8 -> :nsfw
      _ -> :safe
    end
  end

  def list_scan_queue(size) do
    Image
    |> where(scanned: false)
    |> order_by(asc: :created_at)
    |> limit(^size)
    |> select([image], image.id)
    |> Repo.all()
  end

  def classify_image(%Image{} = image, classifications) do
    flag = classify_flag?(classifications)
    safe = flag == :safe

    log(:info, ["classify", image.id], %{
      classifications: classifications,
      flagged: not safe
    })

    if not safe do
      with %User{} = user <- User.get(image.profile_id) do
        Discord.deliver_webhook(:flagged_image,
          user: user,
          image: image,
          classifications: classifications,
          flag: flag
        )
      end
    end

    image
    |> change(%{scanned: true})
    |> Repo.update()
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
