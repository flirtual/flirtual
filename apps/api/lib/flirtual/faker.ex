defmodule Flirtual.Faker do
  use Flirtual.Logger, :faker

  alias Flirtual.User.Profile.Image
  alias Flirtual.User.Profile.LikesAndPasses
  alias Flirtual.User.Profile.Prospect
  alias Flirtual.User
  alias Flirtual.Attribute
  alias Flirtual.Countries
  alias Flirtual.Languages
  alias Flirtual.Matchmaking
  alias Flirtual.Profiles
  alias Flirtual.Users
  alias Flirtual.Repo

  import Ecto.Changeset
  import Ecto.Query
  import Flirtual.Utilities

  @custom_interests [
    "Aquascaping",
    "Archery",
    "Astrophotography",
    "Axe Throwing",
    "Beatboxing",
    "Beekeeping",
    "Blacksmithing",
    "Bonsai",
    "Bookbinding",
    "Calligraphy",
    "Carnivorous Plants",
    "Conlangs",
    "Contact Juggling",
    "Esperanto",
    "Falconry",
    "Fermentation",
    "Fire Dancing",
    "Foraging",
    "Fossil Hunting",
    "Geocaching",
    "Glassblowing",
    "Ham Radio",
    "Homebrewing",
    "Letterpress",
    "Lockpicking",
    "Magnet Fishing",
    "Marquetry",
    "Metal Detecting",
    "Morse Code",
    "Mycology",
    "Neon Bending",
    "Origami",
    "Overtone Singing",
    "Parkour",
    "Planespotting",
    "Poi Spinning",
    "Rockhounding",
    "Shortwave",
    "Slacklining",
    "Speedcubing",
    "Storm Chasing",
    "Sword Fighting",
    "Terrariums",
    "Throat Singing",
    "Trainspotting",
    "Urban Exploration",
    "Whittling"
  ]

  @image_endpoints [
    "https://nekos.life/api/v2/img/goose",
    "https://nekos.life/api/v2/img/lizard",
    "https://nekos.life/api/v2/img/meow",
    "https://nekos.life/api/v2/img/neko"
  ]

  def create_user(options \\ []) do
    file_ids = Keyword.get(options, :file_ids)
    existing_images = Keyword.get(options, :existing_images)

    {image_source, images_to_use} =
      cond do
        existing_images && length(existing_images) > 0 ->
          image_count = Enum.random(1..min(8, length(existing_images)))
          {:copy, Enum.take_random(existing_images, image_count)}

        file_ids && length(file_ids) > 0 ->
          image_count = Enum.random(1..min(8, length(file_ids)))
          {:new, Enum.take_random(file_ids, image_count)}

        true ->
          {:new, get_random_images(Enum.random(1..3))}
      end

    now =
      DateTime.utc_now()
      |> DateTime.truncate(:second)

    born_at = Faker.Date.between(get_years_ago(18), Date.from_iso8601!("1980-01-01"))

    slug = Faker.Internet.user_name() |> Recase.to_snake() |> String.slice(0..19)
    email = (slug |> Recase.to_dot()) <> "@example.com"
    display_name = slug |> Recase.to_title() |> String.split(" ") |> List.first()

    genders = Attribute.list(type: "gender")
    simple_genders = genders |> Enum.filter(&(&1.metadata["simple"] === true))
    sexualities = Attribute.list(type: "sexuality")
    kinks = Attribute.list(type: "kink")
    games = Attribute.list(type: "game")
    platforms = Attribute.list(type: "platform")
    interests = Attribute.list(type: "interest")

    Repo.transaction(fn ->
      with {:ok, user} <-
             Users.create(
               %{
                 email: email,
                 password: "password",
                 service_agreement: true,
                 notifications: Enum.random([true, false])
               },
               captcha: false
             ),
           {:ok, user} <-
             change(user, %{
               slug: slug,
               born_at: born_at,
               email_confirmed_at: now,
               active_at: now
             })
             |> Repo.update(),
           {:ok, preferences} <-
             Users.update_preferences(user.preferences, %{
               nsfw: Enum.random([true, false]),
               theme: Ecto.Enum.values(Flirtual.User.Preferences, :theme) |> Enum.random()
             }),
           {:ok, _} <-
             if(Enum.random(1..4) === 1,
               do:
                 Users.update_privacy_preferences(
                   preferences.privacy,
                   %{
                     personality: Enum.random(User.Preferences.Privacy.get_possible_values()),
                     connections: Enum.random(User.Preferences.Privacy.get_possible_values()),
                     sexuality: Enum.random(User.Preferences.Privacy.get_possible_values()),
                     country: Enum.random(User.Preferences.Privacy.get_possible_values()),
                     kinks: Enum.random(User.Preferences.Privacy.get_possible_values()),
                     analytics: Enum.random([true, false])
                   }
                 ),
               else: {:ok, preferences.privacy}
             ),
           {:ok, _} <-
             Users.update_notification_preferences(
               preferences.email_notifications,
               [:matches, :messages, :likes, :reminders, :newsletter]
               |> Enum.map(&{&1, Enum.random([true, false])})
               |> Map.new()
             ),
           {:ok, _} <-
             Users.update_notification_preferences(
               preferences.push_notifications,
               [:matches, :messages, :likes, :reminders, :newsletter]
               |> Enum.map(&{&1, Enum.random([true, false])})
               |> Map.new()
             ),
           {:ok, profile} <-
             Profiles.update(user.profile, %{
               display_name: display_name,
               biography: generate_biography(display_name),
               relationships: random_n_of(0..4, ["serious", "vr", "hookups", "friends"]),
               new: Enum.random([true, false, nil]),
               country:
                 if(Enum.random(1..10) === 1,
                   do: nil,
                   else:
                     if(Enum.random(1..2) === 1,
                       do: :us,
                       else: Enum.random(Countries.list(:iso_3166_1))
                     )
                 ),
               domsub: Enum.random([nil | Ecto.Enum.values(Flirtual.User.Profile, :domsub)]),
               monopoly: Enum.random([nil | Ecto.Enum.values(Flirtual.User.Profile, :monopoly)]),
               languages:
                 if(Enum.random(1..5) === 1,
                   do: random_n_of(1..3, Languages.list(:bcp_47)),
                   else: [:en | random_n_of(0..2, Languages.list(:bcp_47) -- [:en])]
                 ),
               custom_interests: random_n_of(0..3, @custom_interests),
               gender_id:
                 case Enum.random(1..4) do
                   1 ->
                     ["rhw3rcbheU7vc9vcSy6W6V"]

                   2 ->
                     ["tpkW7r8PZ2RUuYGUSYi82N"]

                   3 ->
                     random_n_of(1..4, genders |> Enum.map(& &1.id))

                   4 ->
                     [
                       Enum.random(["rhw3rcbheU7vc9vcSy6W6V", "tpkW7r8PZ2RUuYGUSYi82N"])
                       | random_n_of(
                           1..3,
                           genders
                           |> Enum.reject(
                             &(&1.id in ["rhw3rcbheU7vc9vcSy6W6V", "tpkW7r8PZ2RUuYGUSYi82N"])
                           )
                           |> Enum.map(& &1.id)
                         )
                     ]
                 end,
               sexuality_id: random_n_of(0..3, sexualities |> Enum.map(& &1.id)),
               kink_id: random_n_of(0..8, kinks |> Enum.map(& &1.id)),
               game_id: random_n_of(1..5, games |> Enum.map(& &1.id)),
               platform_id:
                 if(Enum.random(1..2) === 1,
                   do: [
                     "RNaigbGdB7H4ZMw5c8ysbi" | random_n_of(0..7, platforms |> Enum.map(& &1.id))
                   ],
                   else: random_n_of(1..8, platforms |> Enum.map(& &1.id))
                 ),
               interest_id: random_n_of(2..7, interests |> Enum.map(& &1.id))
             }),
           {:ok, profile} <-
             if(Enum.random(1..5) === 1,
               do: {:ok, profile},
               else:
                 Profiles.update_personality(profile, %{
                   question0: Enum.random([true, false, nil]),
                   question1: Enum.random([true, false, nil]),
                   question2: Enum.random([true, false, nil]),
                   question3: Enum.random([true, false, nil]),
                   question4: Enum.random([true, false, nil]),
                   question5: Enum.random([true, false, nil]),
                   question6: Enum.random([true, false, nil]),
                   question7: Enum.random([true, false, nil]),
                   question8: Enum.random([true, false, nil])
                 })
             ),
           agemin <-
             if(Enum.random(1..2) == 1,
               do: 18 + Enum.min([Enum.random(0..30), Enum.random(0..30)]),
               else: nil
             ),
           agemax <-
             if(agemin && Enum.random(1..2) == 1,
               do: max(99 - Enum.min([Enum.random(0..30), Enum.random(0..30)]), agemin + 1),
               else: nil
             ),
           {:ok, _} <-
             Profiles.update_preferences(profile.preferences, %{
               agemin: agemin,
               agemax: agemax,
               attributes: random_n_of(1..3, simple_genders |> Enum.map(& &1.id))
             }),
           {:ok, _} <-
             create_profile_images(profile, image_source, images_to_use, now),
           user <- User.get(user.id),
           {:ok, user} <- User.update_status(user) do
        log(:info, ["create-user"], user.id)
        user
      else
        {:error, reason} ->
          log(:error, ["create-user"], inspect(reason))
          Repo.rollback(reason)

        reason ->
          log(:error, ["create-user"], inspect(reason))
          Repo.rollback(reason)
      end
    end)
  end

  def create_users(n, opts \\ []) do
    reuse_images = Keyword.get(opts, :reuse_images, false)

    existing_images =
      if reuse_images do
        Image
        |> Repo.all()
        |> Enum.shuffle()
        |> Enum.map(
          &%{
            original_file: &1.original_file,
            external_id: &1.external_id,
            blur_id: &1.blur_id
          }
        )
      else
        nil
      end

    file_ids =
      if reuse_images do
        nil
      else
        total_images = max(n * 3, 10)
        get_random_images(total_images)
      end

    Enum.map(1..n, fn _ ->
      create_user(
        file_ids: file_ids,
        existing_images: existing_images
      )
    end)
  end

  def async_create_users(n, process_count \\ 3) do
    per_process = div(n, process_count)
    remainder = rem(n, process_count)

    Enum.map(0..(process_count - 1), fn i ->
      count = if i < remainder, do: per_process + 1, else: per_process

      spawn(fn ->
        create_users(count, reuse_images: true)
      end)
    end)
  end

  defp random_n_of(range, list) do
    Enum.shuffle(list) |> Enum.take(Enum.random(range))
  end

  defp create_profile_images(profile, :new, file_ids, _now) do
    Profiles.create_images(profile, file_ids |> Enum.map(&%{"id" => &1}))
  end

  defp create_profile_images(profile, :copy, existing_images, now) do
    images =
      existing_images
      |> Enum.with_index()
      |> Enum.map(fn {img, idx} ->
        %{
          id: Ecto.ShortUUID.generate(),
          profile_id: profile.user_id,
          original_file: img.original_file,
          external_id: img.external_id,
          blur_id: img.blur_id,
          scanned: true,
          order: idx,
          created_at: now,
          updated_at: now
        }
      end)

    {count, _} = Repo.insert_all(Image, images)
    {:ok, count}
  end

  defp generate_biography(display_name) do
    base_bio =
      "<p>Hey, I'm #{display_name} from #{Faker.Pokemon.location()}! " <>
        "I'm a #{Faker.Person.title()} at #{Faker.Company.name()} and " <>
        "my favorite Pokemon is #{Faker.Pokemon.name()}.</p>" <>
        "<p><br /></p>" <>
        "<p>#{Faker.Lorem.Shakespeare.romeo_and_juliet()} " <>
        "#{Faker.Lorem.Shakespeare.hamlet()} " <>
        "#{Faker.StarWars.quote()}</p>"

    if Enum.random(1..4) == 1 do
      base_bio <> "<p><br /></p><p>#{Faker.String.naughty()}</p>"
    else
      base_bio
    end
  end

  defp get_random_images(count \\ 3) do
    1..count
    |> Enum.map(fn _ ->
      case upload_image_to_r2() do
        {:ok, id} -> id
        _ -> nil
      end
    end)
    |> Enum.filter(&(&1 != nil))
  end

  defp get_random_image do
    api_url = Enum.random(@image_endpoints)

    with {:ok, %HTTPoison.Response{status_code: 200, body: body}} <- HTTPoison.get(api_url),
         {:ok, %{"url" => image_url}} <- Jason.decode(body),
         {:ok, %HTTPoison.Response{status_code: 200, body: image_data}} <-
           HTTPoison.get(image_url) do
      {:ok, image_data}
    else
      {:ok, %HTTPoison.Response{status_code: status}} ->
        log(:error, ["get-random-image"], "Failed with status #{status}")
        {:error, :fetch_failed}

      {:error, reason} ->
        log(:error, ["get-random-image"], inspect(reason))
        {:error, reason}
    end
  end

  defp upload_image_to_r2 do
    with {:ok, image_data} <- get_random_image() do
      id = Ecto.UUID.generate()

      bucket =
        case Application.get_env(:flirtual, :canary) do
          true -> "pfpup-canary"
          _ -> "pfpup"
        end

      case ExAws.S3.put_object(bucket, id, image_data, content_type: "image/jpeg")
           |> ExAws.request() do
        {:ok, _} ->
          {:ok, id}

        {:error, reason} ->
          log(:error, ["upload-image"], inspect(reason))
          {:error, reason}
      end
    end
  end

  def create_likes_passes(options) do
    profile_id = Keyword.get(options, :profile_id)
    target_id = Keyword.get(options, :target_id)
    count = Keyword.get(options, :count)
    action_type = Keyword.get(options, :type)

    if is_nil(profile_id) == is_nil(target_id) do
      raise ArgumentError, "Must provide exactly one of :profile_id or :target_id"
    end

    existing_subquery =
      if target_id do
        LikesAndPasses
        |> where([lp], lp.target_id == ^target_id)
        |> select([lp], lp.profile_id)
      else
        LikesAndPasses
        |> where([lp], lp.profile_id == ^profile_id)
        |> select([lp], lp.target_id)
      end

    query =
      User
      |> where([u], not is_nil(u.email_confirmed_at))
      |> where([u], like(u.email, "%@example.com"))
      |> where([u], u.id not in subquery(existing_subquery))
      |> order_by(fragment("RANDOM()"))
      |> select([u], u.id)

    query = if count, do: limit(query, ^count), else: query

    fake_profiles = Repo.all(query)

    now = DateTime.utc_now() |> DateTime.truncate(:second)

    entries =
      Enum.map(fake_profiles, fn fake_id ->
        {type, kind} = resolve_like_pass_type(action_type)

        if profile_id do
          %{
            profile_id: profile_id,
            target_id: fake_id,
            type: type,
            kind: kind,
            created_at: now
          }
        else
          %{
            profile_id: fake_id,
            target_id: target_id,
            type: type,
            kind: kind,
            created_at: now
          }
        end
      end)

    {inserted, _} = Repo.insert_all(LikesAndPasses, entries, on_conflict: :nothing)

    Enum.each(entries, fn entry ->
      Prospect
      |> where(profile_id: ^entry.profile_id, target_id: ^entry.target_id)
      |> Repo.update_all(set: [completed: true])
    end)

    matches =
      entries
      |> Enum.filter(&(&1.type == :like))
      |> Enum.map(fn entry ->
        opposite =
          LikesAndPasses
          |> where(
            profile_id: ^entry.target_id,
            target_id: ^entry.profile_id,
            type: :like
          )
          |> limit(1)
          |> Repo.one()

        if opposite do
          user_a = User.get(entry.profile_id)
          user_b = User.get(entry.target_id)
          match_kind = Matchmaking.reduce_kind(entry.kind, opposite.kind)

          case Matchmaking.create_match_conversation(user_a, user_b, match_kind) do
            {:ok, _} -> 1
            _ -> 0
          end
        else
          0
        end
      end)
      |> Enum.sum()

    log(:info, ["create-likes-passes"], "Created #{inserted} likes/passes, #{matches} matches")
    %{inserted: inserted, matches: matches}
  end

  defp resolve_like_pass_type(nil),
    do: resolve_like_pass_type(Enum.random([:love, :friend, :pass]))

  defp resolve_like_pass_type(:love), do: {:like, :love}
  defp resolve_like_pass_type(:friend), do: {:like, :friend}
  defp resolve_like_pass_type(:pass), do: {:pass, :love}
end
