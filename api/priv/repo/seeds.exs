# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#
# Inside the script, you can read and write to any of your
# repositories directly:
#
#     Flirtual.Repo.insert!(%Flirtual.SomeSchema{})
#
# We recommend using the bang functions (`insert!`, `update!`
# and so on) as they will fail if something goes wrong.

defmodule A do
  def normalize_attribute_name(name) do
    String.downcase(String.replace(name, "_", " "))
  end
end

defmodule Flirtual.Seed do
  alias Flirtual.Repo
  import Ecto.Changeset
  import Flirtual.Utilities
  alias Ecto.UUID
  alias Flirtual.Attribute
  alias Flirtual.User

  user_languages =
    File.read!("priv/repo/languages.json")
    |> Jason.decode!()

  db_genders = Attribute.list(type: "gender")

  lf_genders =
    File.read!("priv/repo/lfgenders.json")
    |> Jason.decode!()
    |> Enum.map(fn lf_gender ->
      Map.put(
        lf_gender,
        :attribute,
        Enum.find(
          db_genders,
          &(A.normalize_attribute_name(&1.name) ===
              A.normalize_attribute_name(lf_gender["name"]))
        )
      )
    end)

  genders =
    File.read!("priv/repo/genders.json")
    |> Jason.decode!()
    |> Enum.map(fn gender ->
      Map.put(
        gender,
        :attribute,
        Enum.find(
          db_genders,
          &(A.normalize_attribute_name(&1.name) ===
              A.normalize_attribute_name(gender["name"]))
        )
      )
    end)

  db_kinks = Attribute.list(type: "kink")

  lf_kinks =
    File.read!("priv/repo/lfkinks.json")
    |> Jason.decode!()
    |> Enum.map(fn lf_kink ->
      Map.put(
        lf_kink,
        :attribute,
        Enum.find(
          db_kinks,
          &(A.normalize_attribute_name(&1.name) ===
              A.normalize_attribute_name(lf_kink["name"]))
        )
      )
    end)

  kinks =
    File.read!("priv/repo/kinks.json")
    |> Jason.decode!()
    |> Enum.map(fn kink ->
      Map.put(
        kink,
        :attribute,
        Enum.find(
          db_kinks,
          &(A.normalize_attribute_name(&1.name) ===
              A.normalize_attribute_name(kink["name"]))
        )
      )
    end)

  db_games = Attribute.list(type: "game")

  games =
    File.read!("priv/repo/games.json")
    |> Jason.decode!()
    |> Enum.map(fn game ->
      Map.put(
        game,
        :attribute,
        Enum.find(
          db_games,
          &(A.normalize_attribute_name(&1.name) ===
              A.normalize_attribute_name(game["name"]))
        )
      )
    end)

  db_interests = Attribute.list(type: "interest")

  interests =
    File.read!("priv/repo/interests.json")
    |> Jason.decode!()
    |> Enum.map(fn interest ->
      Map.put(
        interest,
        :attribute,
        Enum.find(
          db_interests,
          &(A.normalize_attribute_name(&1.name) ===
              A.normalize_attribute_name(interest["name"]))
        )
      )
    end)

  db_platforms = Attribute.list(type: "platform")

  platforms =
    File.read!("priv/repo/platforms.json")
    |> Jason.decode!()
    |> Enum.map(fn platform ->
      Map.put(
        platform,
        :attribute,
        Enum.find(
          db_platforms,
          &(A.normalize_attribute_name(&1.name) ===
              A.normalize_attribute_name(platform["name"]))
        )
      )
    end)

  db_sexualities = Attribute.list(type: "sexuality")

  sexualities =
    File.read!("priv/repo/sexualities.json")
    |> Jason.decode!()
    |> Enum.map(fn sexuality ->
      Map.put(
        sexuality,
        :attribute,
        Enum.find(
          db_sexualities,
          &(A.normalize_attribute_name(&1.name) ===
              A.normalize_attribute_name(sexuality["name"]))
        )
      )
    end)

  images =
    File.read!("priv/repo/avatars.json")
    |> Jason.decode!()

  File.read!("priv/repo/users.json")
  |> Jason.decode!()
  |> Enum.map(fn source ->
    IO.inspect(source["id"])

    born_at =
      Date.new!(
        Integer.parse(String.slice(to_string(source["dob"]), 0..3)) |> elem(0),
        Integer.parse(String.slice(to_string(source["dob"]), 4..5)) |> elem(0),
        Integer.parse(String.slice(to_string(source["dob"]), 6..7)) |> elem(0)
      )

    db_user = Flirtual.Users.get(source["id"])

    user =
      (db_user ||
         %Flirtual.User{
           id: source["id"]
         })
      |> change(%{
        username: source["username"],
        password_hash: source["password"],
        email: source["email"],
        email_confirmed_at:
          if(source["confirmed"],
            do: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second),
            else: nil
          ),
        talkjs_signature: source["talkjs_signature"],
        born_at: born_at,
        created_at:
          source["registered_unix"]
          |> DateTime.from_unix!()
          |> DateTime.to_naive()
          |> NaiveDateTime.truncate(:second)
      })
      |> Repo.insert_or_update!()
      |> Repo.preload(User.default_assoc())

    preferences =
      (user.preferences || Ecto.build_assoc(user, :preferences))
      |> change(%{nsfw: source["nsfw"]})
      |> Repo.insert_or_update!()
      |> Repo.preload(User.Preferences.default_assoc())

    (preferences.email_notifications || Ecto.build_assoc(preferences, :email_notifications))
    |> change(%{
      matches: source["match_emails"],
      messages: source["message_emails"],
      likes: source["like_emails"],
      newsletter: if(is_nil(source["notifications"]), do: true, else: source["notifications"])
    })
    |> Repo.insert_or_update!()

    (preferences.privacy || Ecto.build_assoc(preferences, :privacy))
    |> change(%{
      analytics: !source["optout"],
      personality: to_atom(source["privacy_personality"] || "everyone"),
      connections: to_atom(source["privacy_socials"] || "everyone"),
      sexuality: to_atom(source["privacy_sexuality"] || "everyone"),
      country: to_atom(source["privacy_country"] || "everyone"),
      kinks: to_atom(source["privacy_kinks"] || "everyone")
    })
    |> Repo.insert_or_update!()

    profile =
      (user.profile || Ecto.build_assoc(user, :profile))
      |> change(%{
        display_name:
          if(source["displayname"] === source["username"], do: nil, else: source["displayname"]),
        biography: source["bio"],
        domsub:
          if(is_nil(source["domsub"]), do: nil, else: to_atom(String.downcase(source["domsub"]))),
        monopoly:
          if(is_nil(source["monopoly"]),
            do: nil,
            else: to_atom(String.downcase(source["monopoly"]))
          ),
        country: if(is_nil(source["country"]), do: nil, else: String.downcase(source["country"])),
        serious: source["serious"],
        new: source["new"],
        languages:
          Enum.filter(user_languages, &(&1["user_id"] === source["id"]))
          |> Enum.map(&if(String.starts_with?(&1["id"], "sgn"), do: "sgn", else: &1["id"])),
        custom_interests:
          interests
          |> Enum.filter(&(&1["user_id"] === source["id"] and &1["type"] === "custom"))
          |> Enum.map(& &1["name"])
      })
      |> User.Profile.update_personality_changeset(%{
        question0: source["survey_1"],
        question1: source["survey_2"],
        question2: source["survey_3"],
        question3: source["survey_4"],
        question4: source["survey_5"],
        question5: source["survey_6"],
        question6: source["survey_7"],
        question7: source["survey_8"],
        question8: source["survey_9"]
      })
      |> put_assoc(
        :gender,
        genders
        |> Enum.filter(&(&1["user_id"] === source["id"]))
        |> Enum.map(& &1.attribute)
      )
      |> put_assoc(
        :sexuality,
        sexualities
        |> Enum.filter(&(&1["user_id"] === source["id"]))
        |> Enum.map(& &1.attribute)
      )
      |> put_assoc(
        :kinks,
        kinks
        |> Enum.filter(&(&1["user_id"] === source["id"]))
        |> Enum.map(& &1.attribute)
      )
      |> put_assoc(
        :platforms,
        platforms
        |> Enum.filter(&(&1["user_id"] === source["id"]))
        |> Enum.map(& &1.attribute)
      )
      |> put_assoc(
        :interests,
        interests
        |> Enum.filter(&(&1["user_id"] === source["id"] and &1["type"] !== "custom"))
        |> Enum.map(& &1.attribute)
      )
      |> put_assoc(
        :games,
        games
        |> Enum.filter(&(&1["user_id"] === source["id"]))
        |> Enum.map(& &1.attribute)
      )
      |> Repo.insert_or_update!()
      |> Repo.preload(User.Profile.default_assoc())

    new_image_ids =
      Enum.filter(images, fn image ->
        image["user_id"] === source["id"] and
          not Enum.any?(profile.images, &(&1.external_id === image["url"]))
      end)
      |> Enum.map(& &1["url"])

    {_, images} =
      Repo.insert_all(
        Flirtual.User.Profile.Image,
        new_image_ids
        |> Enum.with_index()
        |> Enum.map(fn {file_id, file_idx} ->
          %{
            id: UUID.generate(),
            profile_id: {:placeholder, :profile_id},
            external_id: file_id,
            order: length(profile.images) + file_idx,
            updated_at: {:placeholder, :now},
            created_at: {:placeholder, :now}
          }
        end),
        placeholders: %{
          now: NaiveDateTime.truncate(NaiveDateTime.utc_now(), :second),
          profile_id: profile.id
        },
        returning: true
      )

    (profile.preferences || Ecto.build_assoc(profile, :preferences))
    |> change(%{
      agemin: source["agemin"],
      agemax: if(source["agemax"] === 125, do: nil, else: source["agemax"])
    })
    |> put_assoc(
      :gender,
      lf_genders
      |> Enum.filter(&(&1["user_id"] === source["id"]))
      |> Enum.map(& &1.attribute)
    )
    |> put_assoc(
      :kinks,
      lf_kinks
      |> Enum.filter(&(&1["user_id"] === source["id"]))
      |> Enum.map(& &1.attribute)
    )
    |> Repo.insert_or_update!()

    (profile.custom_weights || Ecto.build_assoc(profile, :custom_weights))
    |> change(%{
      country: (source["weight_country"] || 1) / 1,
      monopoly: (source["weight_monopoly"] || 1) / 1,
      games: (source["weight_games"] || 1) / 1,
      default_interests: (source["weight_custom_interests"] || 1) / 1,
      custom_interests: (source["weight_default_interests"] || 1) / 1,
      personality: (source["weight_personality"] || 1) / 1,
      serious: (source["weight_serious"] || 1) / 1,
      domsub: (source["weight_domsub"] || 1) / 1,
      kinks: (source["weight_kinks"] || 1) / 1,
      likes: (source["weight_likes"] || 1) / 1
    })
    |> Repo.insert_or_update!()

    Flirtual.Elastic.User.mark_dirty(user.id)
  end)
  |> IO.inspect()
end
