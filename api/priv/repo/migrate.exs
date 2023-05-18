# Script for populating the database. You can run it as:
#
#     mix run priv/repo/migrate.exs
#
# Inside the script, you can read and write to any of your
# repositories directly:
#
#     Flirtual.Repo.insert!(%Flirtual.SomeSchema{})
#
# We recommend using the bang functions (`insert!`, `update!`
# and so on) as they will fail if something goes wrong.

# profile pics: MATCH (u:user)-[:AVATAR]->(a:avatar) RETURN a.url, a.order, a.scanned
# url = UUID, possibly with uploadcare transforms
# order = 0 -> 14
# scanned = boolean

# likes: MATCH (a:user)-[l:LIKED]->(b:user) RETURN l.type, l.date
# type = "like" or "homie"
# date = unix

# passes: MATCH (a:user)-[p:PASSED]->(b:user) RETURN p.date
# date = unix

# homie mode passes: MATCH (a:user)-[p:HPASSED]->(b:user) RETURN p.date
# date = unix

# blocks: MATCH (a:user)-[:BLOCKED]->(b:user)

# reports: MATCH (a:user)-[r:REPORTED]->(b:user) RETURN r.reviewed, r.reason, r.details, r.date
# reviewed = boolean
# reason = "Advertising", "Harassment", "Hateful content", "Illegal content", "Impersonating me or someone else", "Missing", "Nude or NSFW pictures", "Other", "Scam, malware, or harmful links", "Self-harm content", "Spam or troll account", "Underage user", "Violent or disturbing content"
# details = string
# date = unix

# genders: MATCH (u:user)-[:GENDER]->(g:gender) RETURN g.name
# name = "She/Her", "He/Him", "They/Them", "Woman", "Man", "Agender", "Androgynous", "Bigender", "Cis_Woman", "Cis_Man", "Genderfluid", "Genderqueer", "Gender_Nonconforming", "Hijra", "Intersex", "Non-binary", "Pangender", "Transgender", "Transsexual", "Trans_Woman", "Trans_Man", "Transfeminine", "Transmasculine", "Two_Spirit", "Other"

# gender preference: MATCH (u:user)-[:LF]->(g:gender) RETURN g.name
# name = "She/Her", "He/Him", "They/Them", "Woman", "Man", "Agender", "Androgynous", "Bigender", "Cis_Woman", "Cis_Man", "Genderfluid", "Genderqueer", "Gender_Nonconforming", "Hijra", "Intersex", "Non-binary", "Pangender", "Transgender", "Transsexual", "Trans_Woman", "Trans_Man", "Transfeminine", "Transmasculine", "Two_Spirit", "Other"

# sexuality: MATCH (u:user)-[:SEXUALITY]->(s:sexuality) RETURN s.name
# name = "Straight", "Lesbian", "Gay", "Bisexual", "Pansexual", "Asexual", "Demisexual", "Heteroflexible", "Homoflexible", "Queer", "Questioning", "Experimenting_in_VR"

# country: MATCH (u:user)-[:COUNTRY]->(c:country) RETURN c.id
# id = 3166-1 alpha-2

# games: MATCH (u:user)-[:PLAYS]->(g:game) RETURN g.name
# name = string

# kinks: MATCH (u:user)-[:KINK]->(k:kink) RETURN k.name
# name = "Brat_tamer", "Brat", "Owner", "Pet", "Daddy/Mommy", "Boy/Girl", "Master/Mistress", "Slave", "Rigger", "Rope_bunny", "Sadist", "Masochist", "Exhibitionist", "Voyeur", "Hunter", "Prey", "Degrader", "Degradee", "Ageplayer", "Experimentalist"

# languages: MATCH (u:user)-[:LANGUAGE]->(l:language) RETURN l.id
# id = 639-1 or sgn-... for sign languages

# platforms: MATCH (u:user)-[:USES]->(p:platform) RETURN p.name
# name = "Meta_Quest", "Oculus_Link", "Oculus_Rift", "SteamVR", "Windows_Mixed_Reality", "Pico", "PlayStation_VR", "Mobile_VR", "Other_VR", "Desktop", "Full-body_tracking", "Haptic_suit", "Eye/facial_tracking", "Locomotion_treadmill"

# default interests: MATCH (u:user)-[:TAGGED]->(i:interest) WHERE i.type <> 'custom' RETURN i.name
# name = string

# custom interests: MATCH (u:user)-[:TAGGED]->(i:interest {type: 'custom'}) RETURN i.name
# name = string

defmodule A do
  import Ecto.Query

  alias Flirtual.Report
  alias Flirtual.User.Profile.Block
  alias Flirtual.User.Profile.LikesAndPasses
  alias Ecto.UUID
  alias Flirtual.{Repo, User, Stripe, Plan, Attribute}
  alias Flirtual.User.Profile.Image

  @all_genders Attribute.list(type: "gender")
  @all_sexuality Attribute.list(type: "sexuality")
  @all_games Attribute.list(type: "game")
  @all_kinks Attribute.list(type: "kink")
  @all_platforms Attribute.list(type: "platform")
  @all_interests Attribute.list(type: "interest")

  def query(conn, query) do
    with {:ok, %{result_set: result_set}} <- RedisGraph.query(conn, "vrlfp", query) do
      {:ok, result_set}
    end
  end

  def create_user(conn, [
        id,
        username,
        email,
        password,
        talkjs_signature,
        stripe_id,
        is_admin,
        is_mod,
        is_beta,
        is_debugger,
        is_vrlfp,
        dob,
        is_confirmed,
        deactivated,
        banned,
        shadowbanned,
        lastlogin,
        registered_unix,
        nsfw,
        theme,
        privacy_personality,
        privacy_sexuality,
        privacy_country,
        privacy_kinks,
        newsletter,
        match_emails,
        message_emails,
        like_emails,
        optout,
        premium,
        supporter,
        lifetime_premium,
        agemin,
        agemax,
        serious,
        monopoly,
        weight_likes,
        weight_default_interests,
        weight_custom_interests,
        weight_personality,
        weight_games,
        weight_country,
        weight_serious,
        weight_monopoly,
        weight_domsub,
        weight_kinks,
        new,
        displayname,
        bio,
        vrchat,
        discord,
        survey_1,
        survey_2,
        survey_3,
        survey_4,
        survey_5,
        survey_6,
        survey_7,
        survey_8,
        survey_9,
        openness,
        conscientiousness,
        agreeableness,
        domsub
      ]) do
    Repo.transaction(fn ->
      with user <- User.get(id),
           {:ok, _} <-
             if(is_nil(user),
               do: {:ok, nil},
               else: Repo.delete(user)
             ),
           {:ok, created_at} <-
             if(is_nil(registered_unix),
               do: {:ok, nil},
               else: DateTime.from_unix(registered_unix, :second)
             ),
           born_at =
             if(is_nil(dob),
               do: nil,
               else:
                 case Date.new(
                        Integer.parse(String.slice(to_string(dob), 0..3)) |> elem(0),
                        Integer.parse(String.slice(to_string(dob), 4..5)) |> elem(0),
                        Integer.parse(String.slice(to_string(dob), 6..7)) |> elem(0)
                      ) do
                   {:ok, date} -> date

                   {:error, :invalid_date} ->
                     nil
                 end
             ),
           {:ok, user} <-
             %User{
               id: ShortUUID.encode!(id),
               username: username,
               email: email,
               password_hash: password,
               talkjs_signature: talkjs_signature,
               stripe_id: stripe_id,
               tags:
                 [
                   to_boolean(is_admin) && :admin,
                   to_boolean(is_mod) && :moderator,
                   to_boolean(is_beta) && :beta_tester,
                   to_boolean(is_debugger) && :debugger,
                   to_boolean(is_vrlfp) && :legacy_vrlfp
                 ]
                 |> Enum.filter(&(!!&1)),
               born_at: born_at,
               email_confirmed_at: (to_boolean(is_confirmed) && created_at) || nil,
               deactivated_at:
                 if(is_nil(deactivated), do: nil, else: DateTime.from_unix!(deactivated, :second)),
               banned_at: if(is_nil(banned), do: nil, else: DateTime.from_unix!(banned, :second)),
               shadowbanned_at:
                 if(is_nil(shadowbanned),
                   do: nil,
                   else: created_at
                 ),
               active_at:
                 if(is_nil(lastlogin), do: nil, else: DateTime.from_unix!(lastlogin, :second)),
               created_at: created_at
             }
             |> Repo.insert(),
           {:ok, preferences} <-
             Ecto.build_assoc(user, :preferences, %{
               theme: if(is_nil(theme), do: :light, else: String.to_atom(theme)),
               nsfw: to_boolean(nsfw)
             })
             |> Repo.insert(),
           {:ok, _} <-
             Ecto.build_assoc(preferences, :email_notifications, %{
               matches: to_boolean(match_emails),
               messages: to_boolean(message_emails),
               likes: to_boolean(like_emails),
               newsletter: to_boolean(newsletter)
             })
             |> Repo.insert(),
           {:ok, _} <-
             Ecto.build_assoc(preferences, :privacy, %{
               analytics: not to_boolean(optout),
               personality: String.to_atom(privacy_personality),
               connections: :matches,
               sexuality: String.to_atom(privacy_sexuality),
               country: String.to_atom(privacy_country),
               kinks: String.to_atom(privacy_kinks)
             })
             |> Repo.insert(),
           {:ok, stripe_customer} <- Stripe.get_customer(stripe_id),
           stripe_subscription =
             if(is_nil(stripe_customer),
               do: nil,
               else:
                 stripe_customer.subscriptions.data
                 |> Enum.find(&(&1.status === "active"))
             ),
           {:ok, _} <-
             if(to_boolean(premium) or to_boolean(supporter) or to_boolean(lifetime_premium),
               do:
                 Ecto.build_assoc(user, :subscription, %{
                   plan_id:
                     if(to_boolean(lifetime_premium),
                       do: "CJv2NQ7AiEimvDoZJ3uQTe",
                       else:
                         if(to_boolean(supporter),
                           do: "43V699voRpLqskJEM42Vsa",
                           else:
                             if(is_nil(stripe_subscription),
                               do: "rFxKcnAZGQtwckWUQbrG9J",
                               else:
                                 Plan.get(
                                   product_id: stripe_subscription.plan.product,
                                   price_id: stripe_subscription.plan.id
                                 )[:id]
                             )
                         )
                     ),
                   stripe_id:
                     if(is_nil(stripe_subscription), do: nil, else: stripe_subscription.id),
                   cancelled_at: nil
                 })
                 |> Repo.insert(),
               else: {:ok, nil}
             ),
           {:ok, country} <-
             query(
               conn,
               "MATCH (u:user {id: '#{user.id}'})-[:COUNTRY]->(c:country) RETURN toLower(c.id)"
             ),
           country =
             country
             |> List.flatten()
             |> List.first(),
           {:ok, languages} <-
             query(
               conn,
               "MATCH (u:user {id: '#{user.id}'})-[:KNOWS]->(l:language) RETURN toLower(l.id)"
             ),
           {:ok, custom_interests} <-
             query(
               conn,
               "MATCH (u:user {id: '#{user.id}'})-[:TAGGED]->(i:interest {type: 'custom'}) RETURN i.name"
             ),
           {:ok, genders} <-
             query(conn, "MATCH (u:user {id: '#{user.id}'})-[:GENDER]->(g:gender) RETURN g.name"),
           {:ok, sexualities} <-
             query(
               conn,
               "MATCH (u:user {id: '#{user.id}'})-[:SEXUALITY]->(s:sexuality) RETURN s.name"
             ),
           {:ok, games} <-
             query(conn, "MATCH (u:user {id: '#{user.id}'})-[:PLAYS]->(g:game) RETURN g.name"),
           {:ok, kinks} <-
             query(conn, "MATCH (u:user {id: '#{user.id}'})-[:KINK]->(k:kink) RETURN k.name"),
           {:ok, platforms} <-
             query(conn, "MATCH (u:user {id: '#{user.id}'})-[:USES]->(p:platform) RETURN p.name"),
           {:ok, interests} <-
             query(
               conn,
               "MATCH (u:user {id: '#{user.id}'})-[:TAGGED]->(i:interest) WHERE i.type <> 'custom' RETURN i.name"
             ),
           {:ok, profile} <-
             Ecto.build_assoc(user, :profile, %{
               display_name: displayname,
               biography: if(is_nil(bio), do: nil, else: bio |> strip_redis()),
               domsub:
                 case domsub do
                   "Dominant" -> :dominant
                   "Submissive" -> :submissive
                   "Switch" -> :switch
                   _ -> nil
                 end,
               monopoly:
                 case monopoly do
                   "Monogamous" -> :monogamous
                   "Non-monogamous" -> :nonmonogamous
                   _ -> nil
                 end,
               country:
                 if(is_nil(country),
                   do: nil,
                   else: String.to_atom(country)
                 ),
               openness: openness,
               conscientiousness: conscientiousness,
               agreeableness:
                 case agreeableness do
                   "0.5" -> 1
                   value -> value
                 end,
               question0: to_boolean(survey_1),
               question1: to_boolean(survey_2),
               question2: to_boolean(survey_3),
               question3: to_boolean(survey_4),
               question4: to_boolean(survey_5),
               question5: to_boolean(survey_6),
               question6: to_boolean(survey_7),
               question7: to_boolean(survey_8),
               question8: to_boolean(survey_9),
               serious: to_boolean(serious),
               new: if(is_nil(new), do: nil, else: to_boolean(new)),
               languages:
                 languages
                 |> List.flatten()
                 |> Enum.map(&map_language(&1))
                 |> Enum.filter(&(!is_nil(&1))),
               custom_interests:
                 custom_interests
                 |> List.flatten()
                 |> Enum.map(&(strip_redis(&1) |> String.trim())),
               vrchat:
                 if(is_nil(vrchat),
                   do: nil,
                   else: vrchat |> String.replace("https://vrchat.com/home/search/", "")
                 ),
               discord: discord,
               attributes:
                 [
                   genders
                   |> List.flatten()
                   |> map_attributes(@all_genders),
                   sexualities
                   |> List.flatten()
                   |> map_attributes(@all_sexuality),
                   games
                   |> List.flatten()
                   |> map_attributes(@all_games),
                   kinks
                   |> List.flatten()
                   |> map_attributes(@all_kinks),
                   platforms
                   |> List.flatten()
                   |> map_attributes(@all_platforms),
                   interests
                   |> List.flatten()
                   |> map_attributes(@all_interests)
                 ]
                 |> List.flatten()
             })
             |> Repo.insert(),
           {:ok, images} <-
             query(
               conn,
               "MATCH (u:user {id: '#{user.id}'})-[:AVATAR]->(a:avatar) WITH DISTINCT a.url AS url, a.order AS order, a.scanned AS scanned ORDER BY a.order RETURN url, order, scanned"
             ),
           {_, nil} <-
             Repo.insert_all(
               Image,
               images
               |> Enum.sort(fn [_, order1, _], [_, order2, _] -> order1 < order2 end)
               |> Enum.filter(fn [file_id, _, _] ->
                 file_id !== "e8212f93-af6f-4a2c-ac11-cb328bbc4aa4"
               end)
               |> Enum.slice(0..15)
               |> Enum.with_index()
               |> Enum.map(fn {[file_id, _, scanned], file_index} ->
                 %{
                   id: Ecto.ShortUUID.generate(),
                   profile_id: {:placeholder, :profile_id},
                   external_id: file_id,
                   order: file_index,
                   scanned: if(is_nil(scanned), do: false, else: to_boolean(scanned)),
                   updated_at: {:placeholder, :ts},
                   created_at: {:placeholder, :ts}
                 }
               end),
               placeholders: %{
                 ts: created_at,
                 profile_id: profile.user_id
               }
             ),
           {:ok, gender_preferences} <-
             query(conn, "MATCH (u:user {id: '#{user.id}'})-[:LF]->(g:mgender) RETURN g.name"),
           {:ok, _} <-
             Ecto.build_assoc(profile, :preferences, %{
               agemin: agemin,
               agemax: if(agemax > 99, do: nil, else: agemax),
               attributes:
                 gender_preferences
                 |> List.flatten()
                 |> map_attributes(@all_genders)
             })
             |> Repo.insert(),
           {:ok, _} <-
             Ecto.build_assoc(profile, :custom_weights, %{
               country: weight_country |> A.map_custom_weight(),
               monopoly: weight_monopoly |> A.map_custom_weight(),
               games: weight_games |> A.map_custom_weight(),
               default_interests: weight_default_interests |> A.map_custom_weight(),
               custom_interests: weight_custom_interests |> A.map_custom_weight(),
               personality: weight_personality |> A.map_custom_weight(),
               serious: weight_serious |> A.map_custom_weight(),
               domsub: weight_domsub |> A.map_custom_weight(),
               kinks: weight_kinks |> A.map_custom_weight(),
               likes: weight_likes |> A.map_custom_weight()
             })
             |> Repo.insert() do
        nil
      else
        reason ->
          IO.inspect([id, reason])
          Repo.rollback(reason)
      end
    end)
  end

  @relation_chunk_size 50

  def create_user_relations(conn, user_id) do
    {:ok, likes} =
      query(
        conn,
        "MATCH (a:user {id: '#{user_id}'})-[l:LIKED]->(b:user) RETURN l.type, l.date, b.id"
      )

    likes
    |> Enum.uniq_by(fn [type, _, target_id] -> [map_like_type(type), target_id] end)
    |> Enum.map(fn [type, created_at, target_id] ->
      %{
        type: {:placeholder, :type},
        kind: map_like_type(type),
        profile_id: {:placeholder, :profile_id},
        target_id: target_id,
        created_at: DateTime.from_unix!(created_at, :second)
      }
    end)
    |> Enum.chunk_every(@relation_chunk_size)
    |> Enum.map(fn chunk ->
      {_, nil} =
        Repo.insert_all(
          LikesAndPasses,
          chunk,
          placeholders: %{
            profile_id: user_id,
            type: :like
          },
          on_conflict: :replace_all,
          conflict_target: [:profile_id, :target_id, :kind]
        )
    end)

    {:ok, passes} =
      query(
        conn,
        "MATCH (a:user {id: '#{user_id}'})-[p:PASSED]->(b:user) RETURN p.date, b.id"
      )

    passes
    |> Enum.uniq_by(fn [_, target_id] -> target_id end)
    |> Enum.map(fn [created_at, target_id] ->
      %{
        type: {:placeholder, :type},
        kind: {:placeholder, :kind},
        profile_id: {:placeholder, :profile_id},
        target_id: target_id,
        created_at: DateTime.from_unix!(created_at, :second)
      }
    end)
    |> Enum.chunk_every(@relation_chunk_size)
    |> Enum.map(fn chunk ->
      {_, nil} =
        Repo.insert_all(
          LikesAndPasses,
          chunk,
          placeholders: %{
            profile_id: user_id,
            kind: :love,
            type: :pass
          },
          on_conflict: :replace_all,
          conflict_target: [:profile_id, :target_id, :kind]
        )
    end)

    {:ok, friend_passes} =
      query(
        conn,
        "MATCH (a:user {id: '#{user_id}'})-[p:HPASSED]->(b:user) RETURN p.date, b.id"
      )

    friend_passes
    |> Enum.uniq_by(fn [_, target_id] -> target_id end)
    |> Enum.map(fn [created_at, target_id] ->
      %{
        type: {:placeholder, :type},
        kind: {:placeholder, :kind},
        profile_id: {:placeholder, :profile_id},
        target_id: target_id,
        created_at: DateTime.from_unix!(created_at, :second)
      }
    end)
    |> Enum.chunk_every(@relation_chunk_size)
    |> Enum.map(fn chunk ->
      {_, nil} =
        Repo.insert_all(
          LikesAndPasses,
          chunk,
          placeholders: %{
            profile_id: user_id,
            kind: :friend,
            type: :pass
          },
          on_conflict: :replace_all,
          conflict_target: [:profile_id, :target_id, :kind]
        )
    end)

    {:ok, blocks} =
      query(
        conn,
        "MATCH (a:user {id: '#{user_id}'})-[:BLOCKED]->(b:user) RETURN b.id"
      )

    {_, nil} =
      Repo.insert_all(
        Block,
        blocks
        |> Enum.uniq_by(fn [target_id] -> target_id end)
        |> Enum.map(fn [target_id] ->
          %{
            id: Ecto.ShortUUID.generate(),
            profile_id: {:placeholder, :profile_id},
            target_id: target_id,
            created_at: {:placeholder, :created_at}
          }
        end),
        placeholders: %{
          profile_id: user_id,
          created_at: DateTime.utc_now() |> DateTime.truncate(:second)
        },
        on_conflict: :replace_all,
        conflict_target: [:profile_id, :target_id]
      )

    {:ok, reports} =
      query(
        conn,
        "MATCH (a:user {id: '#{user_id}'})-[r:REPORTED]->(b:user) RETURN r.reviewed, r.reason, r.details, r.date, b.id"
      )

    Report
    |> where(user_id: ^user_id)
    |> Repo.all()
    |> Enum.map(&Repo.delete(&1))

    {_, nil} =
      Repo.insert_all(
        Report,
        reports
        |> Enum.uniq_by(fn [_, _, _, _, target_id] -> target_id end)
        |> Enum.map(fn [reviewed, reason, details, date, target_id] ->
          %{
            id: Ecto.ShortUUID.generate(),
            user_id: {:placeholder, :user_id},
            target_id: target_id,
            reason_id: map_report_reason(reason),
            message:
              case details do
                details when details === "None" or details === "Missing" -> ""
                details -> details
              end,
            reviewed_at: (to_boolean(reviewed) && DateTime.from_unix!(date, :second)) || nil,
            updated_at: DateTime.from_unix!(date, :second),
            created_at: DateTime.from_unix!(date, :second)
          }
        end),
        placeholders: %{
          user_id: user_id
        }
      )

    {:ok, nil}
  end

  def map_like_type(value) do
    case value do
      value when value === "like" or value === "date" or value === "hookup" -> :love
      "homie" -> :friend
    end
  end

  def to_boolean(value) do
    case value do
      "true" -> true
      "false" -> false
      true -> true
      false -> false
      nil -> nil
    end
  end

  def map_report_reason(value) do
    case value do
      "Advertising" ->
        "L6FRU2xjUiZwHUbegAcWTa"

      "Harassment" ->
        "AFe9ijRg9MYGubm2Efi4Ki"

      "Hateful content" ->
        "wFkctcaaf5B4Ef5i3ggY3G"

      "Illegal content" ->
        "BtJvp62cJ5vm6CeuCPTP5H"

      "Impersonating me or someone else" ->
        "Ec5fqqgVo5X3s4QCeFUJ6D"

      "Nude or NSFW pictures" ->
        "ymWd4JdTqpnBLmGSLmJRvY"

      "Scam, malware, or harmful links" ->
        "MyexHAyY8gzQjBQ6agCSx3"

      "Self-harm content" ->
        "vTzgZw4Eexx7fehzCM9PQY"

      "Spam or troll account" ->
        "Ur6iAuTDCktZe3zZQGqtZ2"

      "Underage user" ->
        "zu6HcxQxmJDDq4rmvJazkf"

      "Violent or disturbing content" ->
        "Wf4t9FT7Lmvnn73KqpZGPG"

      value when value === "Other" or value === "Missing" ->
        "9iwmQ8huhkngyY9BgLDE9W"

      _ ->
        "9iwmQ8huhkngyY9BgLDE9W"
    end
  end

  def map_custom_weight(value) do
    value = to_string(value) |> Float.parse() |> elem(0)

    case value do
      0.0 -> 0.0
      0.334 -> 0.25
      0.668 -> 0.75
      1.0 -> 1.0
      1.002 -> 1.0
      1.336 -> 1.25
      1.67 -> 1.75
      2.004 -> 2.0
    end
  end

  def map_language(value) do
    case value do
      "sgn-br" ->
        :bzs

      "sgn-de" ->
        :gsg

      "sgn-es" ->
        :ssp

      "sgn-fr" ->
        :fsl

      "sgn-gb" ->
        :bfi

      "sgn-jp" ->
        :jsl

      "sgn-mx" ->
        :mfs

      "sgn-nl" ->
        :dse

      "sgn-pt" ->
        :psr

      "sgn-us" ->
        :ase

      value
      when value === "sgn-be-fr" or value === "sgn-be-nl" or value === "sgn-ch-de" or
             value === "sgn-co" or value === "sgn-dk" or value === "sgn-gr" or
             value === "sgn-ie" or value === "sgn-it" or value === "sgn-ni" or
             value === "sgn-no" or value === "sgn-se" or value === "sgn-za" ->
        nil

      value ->
        String.to_atom(value)
    end
  end

  def map_attributes(value, list) do
    value
    |> Enum.map(fn name ->
      list |> Enum.find(&(normalize_attribute_name(&1.name) === normalize_attribute_name(name))) ||
        raise "Unknown attribute: #{name}"
    end)
    |> MapSet.new()
    |> MapSet.to_list()
  end

  def normalize_attribute_name(name) do
    case name do
      "Transsexual" -> "transgender"
      name -> String.downcase(String.replace(name, "_", " "))
    end
  end

  def strip_redis(value) do
    value =
      value
      |> String.replace(~r/\\\"/, "\"")
      |> String.replace(~r/\\'/, "'")
      |> String.replace(~r//, "'")

    value
    |> String.codepoints()
    |> Enum.filter(&String.valid?(&1))
    |> List.to_string()
  end
end

defmodule Flirtual.Migrate do
  alias Flirtual.User.ChangeQueue

  keys = [
    "u.id",
    "u.username",
    "u.email",
    "u.password",
    "u.talkjs_signature",
    "u.customer",
    "exists(u.admin)",
    "exists(u.mod)",
    "exists(u.beta)",
    "exists(u.debugger)",
    "exists(u.vrlfp)",
    "u.dob",
    "exists(u.confirmed)",
    "u.deactivated",
    "u.banned",
    "u.shadowbanned",
    "u.lastlogin",
    "u.registered_unix",
    "u.nsfw",
    "u.theme",
    "u.privacy_personality",
    "u.privacy_sexuality",
    "u.privacy_country",
    "u.privacy_kinks",
    "u.newsletter",
    "u.match_emails",
    "u.message_emails",
    "u.like_emails",
    "u.optout",
    "exists(u.premium)",
    "exists(u.supporter)",
    "exists(u.lifetime_premium)",
    # 18 -> 125
    "u.agemin",
    # 18 -> 125
    "u.agemax",
    # boolean, open to serious dating
    "u.serious",
    # "Monogamous" or "Non-monogamous"
    "u.monopoly",
    # 0 -> 2.004
    "u.weight_likes",
    # 0 -> 2.004
    "u.weight_default_interests",
    # 0 -> 2.004
    "u.weight_custom_interests",
    # 0 -> 2.004
    "u.weight_personality",
    # 0 -> 2.004
    "u.weight_games",
    # 0 -> 2.004
    "u.weight_country",
    # 0 -> 2.004
    "u.weight_serious",
    # 0 -> 2.004
    "u.weight_monopoly",
    # 0 -> 2.004
    "u.weight_domsub",
    # 0 -> 2.004
    "u.weight_kinks",
    # boolean, new to VR
    "u.new",
    # html string
    "u.displayname",
    # string
    "u.bio",
    # https://vrchat.com/home/search/username
    "u.vrchat",
    # user#1234
    "u.discord",
    # boolean, personality answer
    "u.survey_1",
    # boolean, personality answer
    "u.survey_2",
    # boolean, personality answer
    "u.survey_3",
    # boolean, personality answer
    "u.survey_4",
    # boolean, personality answer
    "u.survey_5",
    # boolean, personality answer
    "u.survey_6",
    # boolean, personality answer
    "u.survey_7",
    # boolean, personality answer
    "u.survey_8",
    # boolean, personality answer
    "u.survey_9",
    # -3 -> 3
    "u.openness",
    # -3 -> 3
    "u.conscientiousness",
    # -3 -> 3
    "u.agreeableness",
    # "Dominant" or "Submissive" or "Switch"
    "u.domsub"
  ]

  {:ok, conn} = Redix.start_link("redis://localhost:6379")

  @create_users false
  @create_relations true

  @skip 0
  @limit 60000
  @chunk_size 100

  {:ok, users} =
    A.query(
      conn,
      "MATCH (u:user) RETURN u.id ORDER BY u.id SKIP #{@skip} LIMIT #{@limit}"
    )

  if @create_users do
    users
    |> Enum.with_index()
    |> Enum.chunk_every(@chunk_size)
    |> Enum.with_index()
    |> Enum.map(fn {chunk, chunk_idx} ->
      Task.async(fn ->
        chunk
        |> Enum.map(fn {[id], idx} ->
          idx = idx + @skip

          try do
            {:ok, [user]} =
              A.query(conn, "MATCH (u:user {id: '#{id}'}) RETURN #{keys |> Enum.join(", ")}")

            # IO.inspect(user)

            {:ok, _} = A.create_user(conn, user)

            IO.puts("CREATE\t##{idx}\t#{id}")
          rescue
            exception ->
              IO.puts("CREATE\tFAIL\tCHUNK\t#{chunk_idx}\t#{id}")
              reraise(exception, __STACKTRACE__)
          end
        end)
      end)
    end)
    |> Task.await_many(:infinity)

    IO.puts("SUCCESS\tCREATE\t#{users |> Enum.count()}")
  else
    IO.puts("SKIP\tCREATE\t#{users |> Enum.count()}")
  end

  if @create_relations do
    users
    |> Enum.with_index()
    |> Enum.chunk_every(@chunk_size)
    |> Enum.with_index()
    |> Enum.map(fn {chunk, chunk_idx} ->
      Task.async(fn ->
        chunk
        |> Enum.map(fn {[id], idx} ->
          idx = idx + @skip

          try do
            {:ok, _} = A.create_user_relations(conn, id)
            IO.puts("RELATE\tSUCCESS\t#{id}")

            id
          rescue
            exception ->
              IO.puts("RELATE\tFAIL\tCHUNK\t#{chunk_idx}\t#{id}")
              reraise(exception, __STACKTRACE__)
          end
        end)
        |> ChangeQueue.add()

        IO.puts("RELATE\tSUCCESS\tCHUNK\t#{chunk_idx}")
      end)
    end)
    |> Task.await_many(:infinity)

    IO.puts("RELATE\tSUCCESS\t#{users |> Enum.count()}")
  else
    IO.puts("RELATE\tSKIP\t#{users |> Enum.count()}")
  end
end
