defmodule Flirtual.User.Profile.Image.Moderation do
  use Flirtual.Logger, :image_moderation

  import Bitwise
  import Ecto.Query
  import Ecto.Changeset

  alias Flirtual.User
  alias Flirtual.Discord
  alias Flirtual.ObanWorkers.ImageClassify
  alias Flirtual.ObanWorkers.ImageSpatial
  alias Flirtual.Repo
  alias Flirtual.User.Profile.Image

  # These tags are not indicative of Flirtual's content policies, nor are they
  # an explicit list of forbidden content. They are simply used to classify
  # images for moderation purposes.

  # https://github.com/flirtual/deep-danbooru
  # https://danbooru.donmai.us/wiki_pages/tag_groups
  def classify_flag?(classifications) do
    case classifications do
      # Neutral usually applies for real-life images.
      %{"nsfwjs" => %{"neutral" => _}, "deepDanbooru" => %{"blood" => _}} -> :violence
      %{"nsfwjs" => %{"neutral" => _}, "deepDanbooru" => %{"drugs" => _}} -> :illegal
      %{"nsfwjs" => %{"neutral" => _}, "deepDanbooru" => %{"weapon" => _}} -> :violence
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

  # Queue classification once an image has variants and is attached to a
  # profile.
  def enqueue_scan(%Image{
        id: id,
        external_id: external_id,
        profile_id: profile_id
      })
      when is_binary(external_id) and not is_nil(profile_id) do
    if Application.get_env(:flirtual, :image_classification_origin) do
      %{"image_id" => id} |> ImageClassify.new() |> Oban.insert()
    else
      :ok
    end
  end

  def enqueue_scan(_), do: :ok

  # Send an image to the image classification service and return its
  # classifications + perceptual hashes.
  def classify_remote(%Image{id: id, external_id: external_id}) when is_binary(external_id) do
    with url when is_binary(url) <- Application.get_env(:flirtual, :image_classification_origin),
         token when is_binary(token) <- Application.get_env(:flirtual, :image_access_token) do
      case Req.request(
             method: :post,
             url: url <> "/classify",
             json: %{id: id, file: external_id},
             headers: [{"authorization", "Bearer " <> token}],
             receive_timeout: 60_000,
             retry: false,
             finch: Flirtual.FinchInternal
           ) do
        {:ok, %Req.Response{status: 200, body: %{"classifications" => classifications} = body}} ->
          {:ok, %{classifications: classifications, hashes: Map.take(body, ["hash", "flipped"])}}

        {:ok, %Req.Response{status: status}} ->
          {:error, {:classify_failed, status}}

        {:error, reason} ->
          {:error, reason}
      end
    else
      _ -> {:error, :not_configured}
    end
  end

  def classify_remote(_), do: {:error, :not_ready}

  # Queue spatial HEIC generation for an image.
  def enqueue_spatial(%Image{id: id, spatial_id: nil}) do
    %{"image_id" => id} |> ImageSpatial.new() |> Oban.insert()
  end

  def enqueue_spatial(_), do: :ok

  # Max Hamming distance (out of 64) for duplicate image flags and
  # image search.
  @duplicate_threshold 4
  @search_threshold 6

  def classify_image(%Image{} = image, classifications, hashes \\ nil) do
    type = classify_flag?(classifications)
    safe = type == :safe

    log(:debug, ["classify", image.id], %{
      classifications: classifications,
      type: type
    })

    if not safe do
      with %User{} = user <- User.get(image.profile_id) do
        Discord.deliver_webhook(:flagged_image,
          user: user,
          image: image,
          classifications: classifications,
          type: type
        )
      end
    end

    hashes = hashes || %{}
    hash = Image.hash_to_integer(hashes["hash"])
    flipped = Image.hash_to_integer(hashes["flipped"])

    attrs = if is_integer(hash), do: %{hash: hash}, else: %{}

    result =
      image
      |> change(attrs)
      |> Repo.update()

    with {:ok, %Image{} = updated} <- result do
      check_duplicate(updated, flipped)
    end

    result
  end

  def check_duplicate(%Image{hash: hash, profile_id: profile_id} = image, flipped)
      when is_integer(hash) and not is_nil(profile_id) do
    query_hashes = [hash, flipped] |> Enum.filter(&is_integer/1) |> Enum.uniq()

    matches =
      query_hashes
      |> find_similar_images(@duplicate_threshold)
      |> Enum.reject(&(&1.profile_id == profile_id))
      |> Enum.reject(&(is_nil(&1.profile_id) and variant_distance(query_hashes, &1) > 0))

    case matches do
      [] ->
        :ok

      matches ->
        closest = Enum.sort_by(matches, &variant_distance(query_hashes, &1))
        distance = variant_distance(query_hashes, List.first(closest))

        with %User{} = user <- User.get(profile_id) do
          Discord.deliver_webhook(:duplicate_image,
            user: user,
            image: image,
            matches: Enum.take(closest, 3),
            duplicates: duplicate_profiles(matches),
            distance: distance
          )
        end

        :ok
    end
  end

  def check_duplicate(_, _), do: :ok

  # Closest distance between image hash and any query hash.
  defp variant_distance(query_hashes, %Image{hash: hash}) do
    query_hashes |> Enum.map(&hamming_distance(&1, hash)) |> Enum.min()
  end

  # Hamming distance between two 64-bit perceptual hashes (as signed ints).
  defp hamming_distance(a, b) do
    bits = a |> bxor(b) |> band(0xFFFFFFFFFFFFFFFF)

    for <<(bit::1 <- <<bits::64>>)>>, reduce: 0 do
      acc -> acc + bit
    end
  end

  # Profiles with a matching image, grouped and ordered by closeness, excluding
  # the source image.
  def search_similar(query_hashes, exclude_id \\ nil) when is_list(query_hashes) do
    query_hashes
    |> find_similar_images(@search_threshold)
    |> Enum.reject(&(&1.id == exclude_id or is_nil(&1.profile_id)))
    |> Enum.group_by(& &1.profile_id)
    |> Enum.map(fn {profile_id, images} ->
      {profile_id, images, images |> Enum.map(&variant_distance(query_hashes, &1)) |> Enum.min()}
    end)
    |> Enum.sort_by(fn {_, _, distance} -> distance end)
    |> Enum.map(fn {profile_id, images, _} -> {profile_id, images} end)
  end

  # Images within `threshold` Hamming distance of any query hash.
  def find_similar_images(query_hashes, threshold) when is_list(query_hashes) do
    condition =
      Enum.reduce(query_hashes, dynamic(false), fn hash, acc ->
        dynamic(
          [image],
          ^acc or fragment("bit_count((? # ?)::bit(64)) <= ?", image.hash, ^hash, ^threshold)
        )
      end)

    Image
    |> where([image], not is_nil(image.hash))
    |> where(^condition)
    |> Repo.all()
  end

  # Render list of profiles with matched images.
  defp duplicate_profiles(matches) do
    {named, anonymous} =
      Enum.split_with(matches, fn
        %Image{profile_id: id} when not is_nil(id) -> true
        %Image{suspended_url: url} when not is_nil(url) -> true
        _ -> false
      end)

    named =
      named
      |> Enum.map(fn
        %Image{profile_id: id} when not is_nil(id) -> {:user, id}
        %Image{suspended_url: url} -> {:banned, url}
      end)
      |> Enum.uniq()
      |> Enum.map(fn
        {:user, id} ->
          case User.get(id) do
            %User{} = user ->
              Discord.md_display_name(user)

            _ ->
              url = Application.fetch_env!(:flirtual, :frontend_origin) |> URI.merge("/#{id}")
              "[#{id}](#{url})"
          end

        {:banned, url} ->
          "[Banned user](#{url})"
      end)

    anonymous =
      case length(anonymous) do
        0 -> []
        1 -> ["Banned user (not found)"]
        n -> ["#{n}x Banned user (not found)"]
      end

    named ++ anonymous
  end
end
