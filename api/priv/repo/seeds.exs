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

defmodule A do
  alias Flirtual.{Repo, User, Users, Stripe, Plan, Attribute}

  def query(query) do
    with {:ok, conn} <-
           Redix.start_link(
             "***REMOVED***"
           ),
         {:ok, %{result_set: result_set}} <- RedisGraph.query(conn, "vrlfp", query),
         :ok <- Redix.stop(conn) do
      {:ok, result_set}
    end
  end

  def create([
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
      with created_at =
             if(is_nil(registered_unix),
               do: nil,
               else: DateTime.from_unix!(registered_unix, :second)
             ),
           email_confirmed_at = (is_confirmed === "true" && created_at) || nil,
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
               theme: if(is_nil(theme), do: :light, else: String.to_atom(theme)),
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
             if(premium === "true" or supporter === "true" or lifetime_premium === "true",
               do:
                 Ecto.build_assoc(user, :subscription, %{
                   plan_id:
                     if(lifetime_premium === "true",
                       do: "ccd77191-c9aa-4b01-859d-e6475a87e82e",
                       else:
                         if(supporter === "true",
                           do: "b8bbbad1-103e-40dd-80e6-99f0d81e9fe7",
                           else:
                             (Plan.get(
                                product_id: stripe_subscription.plan.product,
                                price_id: stripe_subscription.plan.id
                              ) || raise("User missing subscription"))[:id]
                         )
                     ),
                   stripe_id: stripe_subscription[:id],
                   cancelled_at: nil
                 })
                 |> Repo.insert(),
               else: {:ok, nil}
             ),
           {:ok, [[country]]} <-
             query(
               "MATCH (u:user {id: '#{user.id}'})-[:COUNTRY]->(c:country) RETURN toLower(c.id)"
             ),
           {:ok, languages} <-
             query(
               "MATCH (u:user {id: '#{user.id}'})-[:KNOWS]->(l:language) RETURN toLower(l.id)"
             ),
           languages =
             languages
             |> List.flatten()
             |> Enum.map(fn lang ->
               case lang do
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

                 lang
                 when lang === "sgn-be-fr" or lang === "sgn-be-nl" or lang === "sgn-ch-de" or
                        lang === "sgn-co" or lang === "sgn-dk" or lang === "sgn-gr" or
                        lang === "sgn-ie" or lang === "sgn-it" or lang === "sgn-ni" or
                        lang === "sgn-no" or lang === "sgn-se" or lang === "sgn-za" ->
                   nil

                 lang ->
                   String.to_atom(lang)
               end
             end)
             |> Enum.filter(&(!is_nil(&1))),
           {:ok, custom_interests} <-
             query(
               "MATCH (u:user {id: '#{user.id}'})-[:TAGGED]->(i:interest {type: 'custom'}) RETURN i.name"
             ),
           custom_interests = custom_interests |> List.flatten(),
           {:ok, genders} <-
             query("MATCH (u:user {id: '#{user.id}'})-[:GENDER]->(g:gender) RETURN g.name"),
           {:ok, sexualities} <-
             query("MATCH (u:user {id: '#{user.id}'})-[:SEXUALITY]->(s:sexuality) RETURN s.name"),
           {:ok, games} <-
             query("MATCH (u:user {id: '#{user.id}'})-[:PLAYS]->(g:game) RETURN g.name"),
           {:ok, kinks} <-
             query("MATCH (u:user {id: '#{user.id}'})-[:KINK]->(k:kink) RETURN k.name"),
           {:ok, platforms} <-
             query("MATCH (u:user {id: '#{user.id}'})-[:USES]->(p:platform) RETURN p.name"),
           {:ok, interests} <-
             query(
               "MATCH (u:user {id: '#{user.id}'})-[:TAGGED]->(i:interest) WHERE i.type <> 'custom' RETURN i.name"
             ),
           all_genders = Attribute.list(type: "gender"),
           genders =
             genders
             |> List.flatten()
             |> Enum.map(fn gender ->
               all_genders |> Enum.find(&(&1.name === A.map_attribute_name(gender)))
             end),
           all_sexuality = Attribute.list(type: "sexuality"),
           sexualities =
             sexualities
             |> List.flatten()
             |> Enum.map(fn sexuality ->
               all_sexuality |> Enum.find(&(&1.name === A.map_attribute_name(sexuality)))
             end),
           all_games = Attribute.list(type: "game"),
           games =
             games
             |> List.flatten()
             |> Enum.map(fn game ->
               all_games |> Enum.find(&(&1.name === A.map_attribute_name(game)))
             end),
           all_kinks = Attribute.list(type: "kink"),
           kinks =
             kinks
             |> List.flatten()
             |> Enum.map(fn kink ->
               all_kinks |> Enum.find(&(&1.name === A.map_attribute_name(kink)))
             end),
           all_platforms = Attribute.list(type: "platform"),
           platforms =
             platforms
             |> List.flatten()
             |> Enum.map(fn platform ->
               all_platforms |> Enum.find(&(&1.name === A.map_attribute_name(platform)))
             end),
           all_interests = Attribute.list(type: "interest"),
           interests =
             interests
             |> List.flatten()
             |> Enum.map(fn interest ->
               all_interests |> Enum.find(&(&1.name === A.map_attribute_name(interest)))
             end),
           attributes =
             [genders, sexualities, games, kinks, platforms, interests]
             |> List.flatten()
             |> IO.inspect(),
           {:ok, profile} <-
             Ecto.build_assoc(user, :profile, %{
               display_name: displayname,
               biography: bio,
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
               country: if(is_nil(country), do: nil, else: String.to_atom(country)),
               openness: openness,
               conscientiousness: conscientiousness,
               agreeableness: agreeableness,
               question0: survey_1 === "true",
               question1: survey_2 === "true",
               question2: survey_3 === "true",
               question3: survey_4 === "true",
               question4: survey_5 === "true",
               question5: survey_6 === "true",
               question6: survey_7 === "true",
               question7: survey_8 === "true",
               question8: survey_9 === "true",
               serious: serious === "true",
               new: new === true,
               languages: languages,
               custom_interests: custom_interests,
               vrchat:
                 if(is_nil(vrchat),
                   do: nil,
                   else: vrchat |> String.replace("https://vrchat.com/home/search/", "")
                 ),
               discord: discord,
               attributes: attributes
             })
             |> Repo.insert(),
           {:ok, _} <-
             Ecto.build_assoc(profile, :preferences, %{
               agemin: agemin,
               agemax: agemax
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
        Users.get(user.id)
        |> IO.inspect()
      else
        reason ->
          IO.inspect(reason)
          Repo.rollback(reason)
      end
    end)
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

  def map_attribute_name(value) do
    value |> String.replace("_", " ")
  end
end

defmodule Flirtual.Seeds do
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

  {:ok, result_set} =
    A.query("MATCH (u:user {username: 'kfarwell'}) RETURN #{keys |> Enum.join(", ")}")

  IO.inspect(result_set)

  result_set
  |> Enum.map(&A.create(&1))
end
