# Fake accounts for translation screenshots (apps/frontend/i18n/scripts/screenshots.ts).
#
#   mix run --no-start priv/repo/screenshot_seeds.exs seed      reset and (re)create everything
#   mix run --no-start priv/repo/screenshot_seeds.exs cleanup   remove everything it created
#
# Only runs against the local dev database. Every account uses @screenshots.flirtual.test and
# logs in with the password below; ids are derived from fixed keys, so each run recreates the
# same accounts in the same state. Rows are written directly, so nothing reaches Oban, TalkJS,
# Listmonk, Discord or the search index.

defmodule Flirtual.ScreenshotSeeds do
  alias Flirtual.Matchmaking
  alias Flirtual.Repo
  alias Flirtual.User

  @domain "screenshots.flirtual.test"
  @password "screenshots-only-password"
  @local_hosts ["localhost", "127.0.0.1", "::1"]
  @image_directory "screenshot-seeds"
  @font "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

  @woman "tpkW7r8PZ2RUuYGUSYi82N"
  @man "rhw3rcbheU7vc9vcSy6W6V"
  @other_gender "jAL62ePbibxaG4FPu7S8LG"
  @games ["3nzcXDoMySRrPn6jHC8n3o", "JSyJfiSSzqm232nKidEDog", "MhWAgbFzmusLJyAdtSXfXV"]
  @platforms ["RNaigbGdB7H4ZMw5c8ysbi", "3Kagenz7boB64Ke6vEAKv6"]
  @sexualities ["a29qas632KmMpQ8T6arLxa", "NC5wiUcxGavten9E8gw64n"]
  @interests %{
    anime: "BTGLoHoCuPjvY2NrRKSWpb",
    art: "ZNXNaLMr85qQbKmX2TsrGQ",
    board_games: "ba58TDSPbjG9jtZixoneUn",
    cats: "m9K2k5wXQrVdehe3KN9ZaY",
    cooking: "9HPT7wgAd7HJajQkAXMbrQ",
    dogs: "xXDcmmB7yrZEMWi4ZLg6z3",
    gaming: "PAepdb7ewc4GVEnpWDCbcK",
    hiking: "Ka3JLErYVPJWHLLzQBT2WE",
    karaoke: "K9MHU3GP3kVfW8yck8ZPdg",
    movies: "Amq7oATgh6UcQx4SoeJdkD",
    music: "fEnnW4XeNnNbqReCryY58R",
    puzzles: "TuaoosdiDnHXC7FHVArkdW",
    reading: "XJUTFqrF2avzVtHMA7AGzk"
  }
  @promotional_plan "7bd2c5d3-d5e2-4188-af26-b26f64f9101f"

  # Personality answers: question0-2 openness, 3-5 conscientiousness, 6-8 agreeableness;
  # the third of each group counts against its trait.
  @open_reliable_friendly [true, true, false, true, true, false, true, true, false]
  @practical_reliable_straightforward [false, false, true, true, true, false, false, false, true]

  # Accounts that log in. `ip` is the last octet of a TEST-NET-1 address (192.0.2.0/24): capture
  # sends it as cf-connecting-ip, so every account gets its own login rate limit and IP hash, and
  # the trusted login seeded for it skips email verification.
  @viewers [
    %{
      key: "viewer",
      name: "Alice Samples",
      ip: 10,
      gender: @woman,
      timezone: "America/New_York",
      premium: true,
      nsfw: true,
      colors: {"#ffb36b", "#e9658b"}
    },
    %{
      key: "tour",
      name: "Carol Tourist",
      ip: 11,
      gender: @woman,
      timezone: "America/New_York",
      tour: true,
      colors: {"#a6e3a1", "#40a02b"}
    },
    %{
      key: "news",
      name: "Lorem Ipsum",
      ip: 12,
      gender: @woman,
      timezone: "America/New_York",
      news: ["2026_matchmaking", "2025_location"],
      colors: {"#89dceb", "#1e66f5"}
    },
    %{
      key: "limits",
      name: "Dave Limits",
      ip: 13,
      gender: @woman,
      timezone: "America/New_York",
      out_of_likes: true,
      colors: {"#f9e2af", "#df8e1d"}
    },
    %{
      key: "onboarding",
      name: "Demo Dumpling",
      ip: 15,
      gender: @woman,
      timezone: "America/New_York",
      status: "onboarded",
      biography: nil,
      images: 0,
      colors: {"#f5c2e7", "#ea76cb"}
    }
  ]

  @targets [
    %{
      key: "date_head",
      name: "Testy McTestface",
      gender: @man,
      timezone: "Europe/Berlin",
      colors: {"#fab387", "#fe640b"}
    },
    %{
      key: "homie_head",
      name: "Placeholder Bob",
      gender: @man,
      timezone: "Asia/Kolkata",
      colors: {"#94e2d5", "#179299"}
    },
    %{
      key: "matched",
      name: "Zark Muckerberg",
      gender: @man,
      timezone: "Asia/Kolkata",
      personality: @practical_reliable_straightforward,
      colors: {"#f38ba8", "#d20f39"}
    },
    %{
      key: "other_gender",
      name: "Flitty",
      gender: @other_gender,
      timezone: "Europe/Berlin",
      colors: {"#b4befe", "#7287fd"}
    },
    %{
      key: "picky",
      name: "Fixture Falafel",
      gender: @man,
      timezone: "Europe/Berlin",
      looking_for: [@man],
      colors: {"#eba0ac", "#e64553"}
    },
    %{
      key: "liker_love",
      name: "Example Eclair",
      gender: @man,
      timezone: "Europe/Berlin",
      colors: {"#f2cdcd", "#dd7878"}
    },
    %{
      key: "liker_homie",
      name: "Beta Bagel",
      gender: @woman,
      timezone: "Asia/Kolkata",
      colors: {"#a6e3a1", "#179299"}
    },
    %{key: "filler_1", name: "Erin Filler", gender: @woman, colors: {"#f5e0dc", "#dc8a78"}},
    %{key: "filler_2", name: "Frank Filler", gender: @man, colors: {"#74c7ec", "#209fb5"}},
    %{key: "filler_3", name: "Mockup Mochi", gender: @woman, colors: {"#f9e2af", "#fe640b"}},
    %{key: "filler_4", name: "Grace Filler", gender: @man, colors: {"#cdd6f4", "#7c7f93"}}
  ]

  # Over five uncompleted prospects per queue, so reading a queue never triggers a recompute that
  # would mix in other local profiles.
  @love_queue ~w(date_head other_gender filler_1 filler_2 filler_3 filler_4 homie_head)
  @friend_queue ~w(homie_head filler_1 filler_2 filler_3 filler_4 other_gender date_head)

  # {from, to, kind}: the viewer and Mock Muffin are matched; the others liked the viewer.
  @likes [
    {"viewer", "matched", "love"},
    {"matched", "viewer", "love"},
    {"other_gender", "viewer", "love"},
    {"liker_love", "viewer", "love"},
    {"liker_homie", "viewer", "friend"}
  ]

  def main(["seed"]) do
    start!()
    cleanup()
    seed()
    print_accounts()
  end

  def main(["cleanup"]) do
    start!()
    cleanup()
  end

  def main(_) do
    IO.puts(:stderr, "usage: mix run --no-start priv/repo/screenshot_seeds.exs seed|cleanup")
    System.halt(1)
  end

  defp refuse!(reason) do
    IO.puts(
      :stderr,
      "Refusing to run: #{reason}. This script only touches the local dev database."
    )

    System.halt(1)
  end

  defp guard! do
    if Mix.env() != :dev, do: refuse!("Mix.env() is #{inspect(Mix.env())}, not :dev")

    repo = Application.get_env(:flirtual, Repo, [])
    if repo[:url], do: refuse!("Flirtual.Repo is configured with a :url")

    if repo[:hostname] not in @local_hosts,
      do: refuse!("Flirtual.Repo hostname is #{inspect(repo[:hostname])}, not localhost")

    if repo[:database] != "flirtual_dev",
      do: refuse!("Flirtual.Repo database is #{inspect(repo[:database])}, not flirtual_dev")

    search = Application.get_env(:flirtual, Flirtual.Search.Repo, [])
    if search[:url], do: refuse!("Flirtual.Search.Repo is configured with a :url")

    if search[:hostname] not in @local_hosts,
      do: refuse!("Flirtual.Search.Repo hostname is #{inspect(search[:hostname])}, not localhost")
  end

  defp start! do
    guard!()
    {:ok, _} = Application.ensure_all_started([:postgrex, :myxql, :ecto_sql, :tz])
    {:ok, _} = Repo.start_link(pool_size: 2, log: false)
    {:ok, _} = Flirtual.Search.Repo.start_link(pool_size: 1, log: false)

    {:ok, %{rows: [[database]]}} = Repo.query("select current_database()")
    if database != "flirtual_dev", do: refuse!("connected to #{database}")
  end

  # Fixed keys map to the same UUIDs on every run.
  defp uuid(key) do
    <<a::48, _::4, b::12, _::2, c::62, _::binary>> =
      :crypto.hash(:sha256, "flirtual-screenshot-seeds:" <> key)

    <<a::48, 4::4, b::12, 2::2, c::62>>
  end

  defp short(binary), do: binary |> Ecto.UUID.load!() |> ShortUUID.encode!()
  defp attribute(short_id), do: short_id |> ShortUUID.decode!() |> Ecto.UUID.dump!()

  defp accounts, do: @viewers ++ @targets
  defp account_ids, do: Enum.map(accounts(), &uuid("user:" <> &1.key))
  defp id(key), do: uuid("user:" <> key)

  defp email(account),
    do: (account.name |> String.downcase() |> String.replace(" ", ".")) <> "@" <> @domain

  defp slug(account), do: account.name |> String.downcase() |> String.replace(" ", "_")

  defp uploads_directory do
    Path.join(Application.fetch_env!(:flirtual, :local_uploads_dir), @image_directory)
  end

  def cleanup do
    {:ok, %{rows: rows}} =
      Repo.query("select id from users where email like $1 or id = any($2)", [
        "%@" <> @domain,
        account_ids()
      ])

    ids = List.flatten(rows)
    short_ids = Enum.map(ids, &short/1)

    {:ok, _} =
      Repo.transaction(
        fn ->
          query!("delete from moderation_events where user_id = any($1)", [ids])
          query!("delete from reports where user_id = any($1) or target_id = any($1)", [ids])
          query!("delete from hashes where user_id = any($1)", [ids])

          query!(
            "delete from conversations where id in (select conversation_id from conversation_participants where user_id = any($1))",
            [ids]
          )

          query!(
            "delete from oban_jobs where state <> 'executing' and exists (select 1 from unnest($1::text[]) as id where oban_jobs.args::text like '%' || id || '%')",
            [short_ids]
          )

          query!("delete from users where id = any($1)", [ids])
        end,
        timeout: :infinity
      )

    if short_ids != [], do: Flirtual.Search.delete_users(short_ids)
    File.rm_rf!(uploads_directory())

    IO.puts("Removed #{length(ids)} screenshot accounts and everything referencing them.")
  end

  defp query!(sql, params), do: Repo.query!(sql, params)

  defp seed do
    for attribute <-
          [@woman, @man, @other_gender] ++
            @games ++ @platforms ++ @sexualities ++ Map.values(@interests) do
      %{rows: [[count]]} =
        query!("select count(*) from attributes where id = $1", [attribute(attribute)])

      if count != 1, do: raise("missing attribute #{attribute}; is the database seeded?")
    end

    File.mkdir_p!(uploads_directory())
    Enum.each(accounts(), &write_images/1)
    password_hash = Bcrypt.hash_pwd_salt(@password)

    {:ok, _} =
      Repo.transaction(
        fn ->
          accounts()
          |> Enum.with_index()
          |> Enum.each(fn {account, index} -> insert_account(account, index, password_hash) end)

          Enum.each(@viewers, &insert_queues/1)
          insert_likes()
        end,
        timeout: :infinity
      )

    for account <- accounts() do
      user = User.get(short(id(account.key)))

      expected = String.to_atom(status(account))
      actual = User.get_status(user)

      if actual != expected,
        do: raise("#{account.name} computes as #{actual}, expected #{expected}")
    end
  end

  defp now, do: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
  defp ago(days), do: NaiveDateTime.add(now(), -days * 86_400)

  defp status(account), do: account[:status] || "visible"

  defp insert_account(account, index, password_hash) do
    id = id(account.key)
    now = now()

    insert_user(account, id, index, password_hash)
    insert_preferences(account, id)
    insert_profile(account, id, index)
    insert_images(account, id, now)
    if account[:premium], do: insert_premium(account, id, now)
    if account[:ip], do: insert_login(account, id)
  end

  defp insert_user(account, id, index, password_hash) do
    now = now()

    Repo.insert_all("users", [
      %{
        id: id,
        email: email(account),
        slug: slug(account),
        password_hash: password_hash,
        born_at: Date.add(~D[1996-03-14], index * 211),
        email_confirmed_at: ago(30),
        active_at: now,
        status: status(account),
        news: account[:news] || [],
        unsubscribe_token: uuid("unsubscribe:" <> account.key),
        revenuecat_id: uuid("revenuecat:" <> account.key),
        created_at: ago(30),
        updated_at: now
      }
    ])
  end

  defp insert_preferences(account, id) do
    Repo.insert_all("preferences", [
      %{
        user_id: id,
        nsfw: account[:nsfw] || false,
        theme: "light",
        language: "en",
        dismissed: if(account[:tour], do: [], else: ["tour_browsing"])
      }
    ])

    for table <- ~w(preferences_email_notifications preferences_push_notifications),
        do: Repo.insert_all(table, [%{preferences_id: id}])

    Repo.insert_all("preferences_privacy", [%{preferences_id: id}])
  end

  defp insert_profile(account, id, index) do
    personality = account[:personality] || @open_reliable_friendly
    {openness, conscientiousness, agreeableness} = traits(personality)

    Repo.insert_all("profiles", [
      Map.merge(
        %{
          user_id: id,
          display_name: account.name,
          biography: Map.get(account, :biography, biography(account)),
          country: "us",
          languages: ["en"],
          relationships: ["serious", "friends"],
          custom_interests: ["Sample data"],
          timezone: account[:timezone],
          openness: openness,
          conscientiousness: conscientiousness,
          agreeableness: agreeableness,
          updated_at: now()
        },
        personality
        |> Enum.with_index()
        |> Map.new(fn {answer, question} -> {String.to_atom("question#{question}"), answer} end)
      )
    ])

    interests =
      @interests |> Map.values() |> Enum.sort() |> Enum.drop(rem(index, 5)) |> Enum.take(5)

    attributes =
      [account.gender | @games |> Enum.take(2)] ++ @platforms ++ @sexualities ++ interests

    Repo.insert_all(
      "profile_attributes",
      Enum.map(attributes, &%{profile_id: id, attribute_id: attribute(&1)})
    )

    Repo.insert_all("profile_preferences", [%{profile_id: id, agemin: 18, agemax: 60}])

    Repo.insert_all(
      "profile_preference_attributes",
      Enum.map(
        account[:looking_for] || [@woman, @man, @other_gender],
        &%{preferences_id: id, attribute_id: attribute(&1)}
      )
    )
  end

  defp insert_premium(account, id, now) do
    Repo.insert_all("profile_custom_weights", [
      %{profile_id: id, location: 1.5, games: 0.5, personality: 2.0}
    ])

    Repo.insert_all("entitlements", [
      %{
        id: uuid("entitlement:" <> account.key),
        user_id: id,
        plan_id: Ecto.UUID.dump!(@promotional_plan),
        kind: "one_time",
        store: "promotional",
        created_at: now,
        updated_at: now
      }
    ])
  end

  defp insert_login(account, id) do
    Repo.insert_all("logins", [
      %{
        id: uuid("login:" <> account.key),
        user_id: id,
        ip_address: %Postgrex.INET{address: {192, 0, 2, account.ip}, netmask: 32},
        status: "successful",
        method: "password",
        platform: "web",
        created_at: ago(7)
      }
    ])
  end

  defp traits(answers) do
    answers
    |> Enum.chunk_every(3)
    |> Enum.map(fn [a, b, c] -> score(a) + score(b) - score(c) end)
    |> List.to_tuple()
  end

  defp score(true), do: 1
  defp score(false), do: -1

  defp biography(account) do
    "<p>Hi! I'm #{account.name}, a sample profile made for Flirtual's translation screenshots.</p>"
  end

  defp image_count(account), do: Map.get(account, :images, 2)
  defp image_file(account, order), do: "#{@image_directory}/#{account.key}-#{order}.jpg"

  defp write_images(account) do
    {from, to} = account.colors

    initials =
      account.name |> String.split(" ") |> Enum.map_join(&String.first/1) |> String.upcase()

    for order <- 0..(image_count(account) - 1)//1 do
      path =
        Path.join(
          Application.fetch_env!(:flirtual, :local_uploads_dir),
          image_file(account, order)
        )

      gradient = if order == 0, do: "#{from}-#{to}", else: "#{to}-#{from}"

      {_, 0} =
        System.cmd("magick", [
          "-size",
          "800x1000",
          "gradient:" <> gradient,
          "-gravity",
          "center",
          "-font",
          @font,
          "-fill",
          "white",
          "-pointsize",
          "220",
          "-annotate",
          "+0-80",
          initials,
          "-pointsize",
          "54",
          "-annotate",
          "+0+120",
          "SAMPLE PHOTO",
          "-strip",
          "-quality",
          "85",
          path
        ])
    end
  end

  defp insert_images(account, id, now) do
    rows =
      for order <- 0..(image_count(account) - 1)//1 do
        %{
          id: uuid("image:#{account.key}:#{order}"),
          profile_id: id,
          original_file: image_file(account, order),
          order: order,
          created_at: now,
          updated_at: now
        }
      end

    Repo.insert_all("profile_images", rows)
  end

  defp insert_queues(viewer) do
    reset_at = Matchmaking.next_reset_at() |> DateTime.to_naive()
    computed_at = NaiveDateTime.utc_now()

    for {kind, keys} <- [{"love", @love_queue}, {"friend", @friend_queue}] do
      Repo.insert_all("queues", [
        %{
          profile_id: id(viewer.key),
          kind: kind,
          computed_at: computed_at,
          likes_count: if(viewer[:out_of_likes] && kind == "love", do: 15, else: 0),
          reset_at: reset_at
        }
      ])

      Repo.insert_all(
        "prospects",
        keys
        |> Enum.with_index()
        |> Enum.map(fn {key, position} ->
          %{
            id: uuid("prospect:#{viewer.key}:#{kind}:#{key}"),
            profile_id: id(viewer.key),
            target_id: id(key),
            kind: kind,
            position: position,
            score: 1.0 - position / 10,
            created_at: now()
          }
        end)
      )
    end
  end

  defp insert_likes do
    Repo.insert_all(
      "likes_and_passes",
      @likes
      |> Enum.with_index()
      |> Enum.map(fn {{from, to, kind}, index} ->
        %{
          profile_id: id(from),
          target_id: id(to),
          type: "like",
          kind: kind,
          source: kind,
          created_at: NaiveDateTime.add(ago(3), index * 3600)
        }
      end)
    )
  end

  defp print_accounts do
    IO.puts("\nPassword for every account: #{@password}\n")

    for account <- accounts() do
      ip = if account[:ip], do: "  cf-connecting-ip 192.0.2.#{account.ip}", else: ""

      IO.puts(
        "#{String.pad_trailing(account.key, 13)} #{String.pad_trailing(account.name, 20)} /#{slug(account)}  #{email(account)}#{ip}"
      )
    end
  end
end

Flirtual.ScreenshotSeeds.main(System.argv())
