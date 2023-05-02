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

defmodule Flirtual.Seeds do
  alias Flirtual.{Repo, User, Stripe}
  import Ecto.Changeset
  import Flirtual.Utilities

  {:ok, conn} =
    Redix.start_link(
      "***REMOVED***"
    )

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
    "exists(u.lifetime_premium)"
    # "u.agemin", # 18 -> 125
    # "u.agemax", # 18 -> 125
    # "u.serious", # boolean, open to serious dating
    # "u.monopoly", # "Monogamous" or "Non-monogamous"
    # "u.weight_likes", # 0 -> 2.004
    # "u.weight_default_interests", # 0 -> 2.004
    # "u.weight_custom_interests", # 0 -> 2.004
    # "u.weight_personality", # 0 -> 2.004
    # "u.weight_games", # 0 -> 2.004
    # "u.weight_country", # 0 -> 2.004
    # "u.weight_serious", # 0 -> 2.004
    # "u.weight_monopoly", # 0 -> 2.004
    # "u.weight_nsfw", # 0 -> 2.004
    # "u.weight_domsub", # 0 -> 2.004
    # "u.weight_kinks", # 0 -> 2.004
    # "u.new", # boolean, new to VR
    # "u.bio", # html string
    # "u.vrchat", # https://vrchat.com/home/search/username
    # "u.discord", # user#1234
    # "u.survey_1", # boolean, personality answer
    # "u.survey_2", # boolean, personality answer
    # "u.survey_3", # boolean, personality answer
    # "u.survey_4", # boolean, personality answer
    # "u.survey_5", # boolean, personality answer
    # "u.survey_6", # boolean, personality answer
    # "u.survey_7", # boolean, personality answer
    # "u.survey_8", # boolean, personality answer
    # "u.survey_9", # boolean, personality answer
    # "u.openness", # -3 -> 3
    # "u.conscientiousness", # -3 -> 3
    # "u.agreeableness", # -3 -> 3
    # "u.domsub" # "Dominant" or "Submissive" or "Switch
  ]

  {:ok, %{result_set: result_set}} =
    RedisGraph.query(
      conn,
      "vrlfp",
      "MATCH (u:user {username: 'Buramie'}) RETURN #{keys |> Enum.join(", ")}"
    )

  IO.inspect(result_set)

  result_set
  |> Enum.map(fn [
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
                   lifetime_premium
                 ] ->
    Repo.transaction(fn ->
      with created_at =
             if(is_nil(registered_unix),
               do: nil,
               else: DateTime.from_unix!(registered_unix, :second)
             ),
           email_confirmed_at = is_confirmed === "true" && created_at,
           deactivated_at =
             if(is_nil(deactivated), do: nil, else: DateTime.from_unix!(deactivated, :second)),
           banned_at = if(is_nil(banned), do: nil, else: DateTime.from_unix!(banned, :second)),
           shadowbanned_at =
             if(is_nil(shadowbanned), do: nil, else: DateTime.from_unix!(shadowbanned, :second)),
           active_at =
             if(is_nil(lastlogin), do: nil, else: DateTime.from_unix!(lastlogin, :second)),
           {:ok, user} <-
             %User{
               id: id,
               username: username,
               email: email,
               password_hash: password,
               talkjs_signature: talkjs_signature,
               stripe_id: stripe_id,
               tags:
                 [
                   is_admin === "true" && :admin,
                   is_mod === "true" && :moderator,
                   is_beta === "true" && :beta_tester,
                   is_debugger === "true" && :debugger,
                   is_vrlfp === "true" && :legacy_vrlfp
                 ]
                 |> Enum.filter(&(!!&1)),
               born_at:
                 DateTime.new!(
                   Date.new!(
                     Integer.parse(String.slice(to_string(dob), 0..3)) |> elem(0),
                     Integer.parse(String.slice(to_string(dob), 4..5)) |> elem(0),
                     Integer.parse(String.slice(to_string(dob), 6..7)) |> elem(0)
                   ),
                   Time.new!(0, 0, 0)
                 ),
               email_confirmed_at: email_confirmed_at,
               deactivated_at: deactivated_at,
               banned_at: banned_at,
               shadowbanned_at: shadowbanned_at,
               active_at: active_at,
               created_at: created_at
             }
             |> Repo.insert(),
           {:ok, preferences} <-
             Ecto.build_assoc(user, :preferences, %{
               theme: to_atom(theme) || :light,
               nsfw: nsfw === "true"
             })
             |> Repo.insert(),
           {:ok, _} <-
             Ecto.build_assoc(preferences, :email_notifications, %{
               matches: match_emails === "true",
               messages: message_emails === "true",
               likes: like_emails === "true",
               newsletter: newsletter === "true"
             })
             |> Repo.insert(),
           {:ok, _} <-
             Ecto.build_assoc(preferences, :privacy, %{
               analytics: optout !== "true",
               personality: to_atom(privacy_personality),
               connections: :matches,
               sexuality: to_atom(privacy_sexuality),
               country: to_atom(privacy_country),
               kinks: to_atom(privacy_kinks)
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
           IO.inspect(stripe_subscription)

      {:ok, _} <-
        if(premium === "true" or supposrter === "true" or lifetime_premium === "true",
          do:
            Ecto.build_assoc(user, :subscription, %{
              plan_id:
                if(lifetime_premium === "true",
                  do: "ccd77191-c9aa-4b01-859d-e6475a87e82e",
                  else:
                    if(supporter === "true",
                      do: "b8bbbad1-103e-40dd-80e6-99f0d81e9fe7",
                      else: ""
                    )
                ),
              stripe_id: "",
              cancelled_at: nil
            })
            |> Repo.insert(),
          else: {:ok, _}
        ) do
          IO.inspect(user)
        else
          reason ->
            IO.inspect(reason)
            Repo.rollback(reason)
        end
    end)
  end)

  Redix.stop(conn)
end
