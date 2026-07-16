defmodule Flirtual.Matchmaking.Query do
  import Ecto.Query
  import Flirtual.Utilities

  alias Flirtual.Attribute
  alias Flirtual.Matchmaking.Query
  alias Flirtual.Repo
  alias Flirtual.Search
  alias Flirtual.User
  alias Flirtual.User.Profile
  alias Flirtual.User.Profile.AdvancedFilter
  alias Flirtual.User.Profile.Block
  alias Flirtual.User.Profile.LikesAndPasses
  alias Flirtual.User.Profile.Preferences

  @simple_genders ["jAL62ePbibxaG4FPu7S8LG", "rhw3rcbheU7vc9vcSy6W6V", "tpkW7r8PZ2RUuYGUSYi82N"]

  @default_size 31

  defstruct user_id: nil,
            kind: :love,
            fallback: false,
            size: @default_size,
            exclude_ids: [],
            liked_me_ids: [],
            filters: [],
            factors: []

  def default_size, do: @default_size

  # With fallback: true (Date Mode only), the age and advanced filters are
  # relaxed into weighted factors. opts[:exclude_ids] carries extras on top of
  # the user's own exclusions (retained prospects, fallback's primary results).
  def build(%User{} = user, kind, opts \\ []) do
    fallback = Keyword.get(opts, :fallback, false)
    advanced_filters = AdvancedFilter.list(profile_id: user.id)

    %Query{
      user_id: user.id,
      kind: kind,
      fallback: fallback,
      size: Keyword.get(opts, :size, @default_size),
      exclude_ids:
        [user.id | excluded_ids(user) ++ Keyword.get(opts, :exclude_ids, [])] |> Enum.uniq(),
      liked_me_ids: liked_me_ids(user),
      filters: filters(user, kind, fallback, advanced_filters),
      factors: factors(user, kind, fallback, advanced_filters)
    }
  end

  defp excluded_ids(%User{} = user) do
    own_actions =
      LikesAndPasses
      |> where(profile_id: ^user.id)
      |> select([lp], lp.target_id)

    own_blocks =
      Block
      |> where(profile_id: ^user.id)
      |> select([block], block.target_id)

    blocked_by =
      Block
      |> where(target_id: ^user.id)
      |> select([block], block.profile_id)

    own_actions
    |> union(^own_blocks)
    |> union(^blocked_by)
    |> Repo.all()
  end

  defp liked_me_ids(%User{} = user) do
    LikesAndPasses
    |> where(target_id: ^user.id, type: :like)
    |> select([lp], lp.profile_id)
    |> Repo.all()
  end

  # No filters in Homie Mode.
  defp filters(user, :friend, _fallback, _advanced_filters) do
    filter_hidden(user)
  end

  defp filters(user, :love, false = _fallback, advanced_filters) do
    [
      filter_hidden(user),
      filter_gender(user),
      filter_age(user),
      filter_advanced(advanced_filters)
    ]
    |> List.flatten()
  end

  defp filters(user, :love, true = _fallback, _advanced_filters) do
    [
      filter_hidden(user),
      filter_gender(user)
    ]
    |> List.flatten()
  end

  defp filter_hidden(%User{status: :visible}), do: []

  defp filter_hidden(_user) do
    [{:term, "hidden_from_nonvisible", false}]
  end

  defp my_genders(%User{profile: profile}) do
    profile.attributes
    |> filter_by(:type, "gender")
    |> Attribute.normalize_aliases()
    |> Enum.map(& &1.id)
    |> Enum.sort()
  end

  defp my_preferred_genders(%User{profile: profile}) do
    profile.preferences.attributes
    |> filter_by(:type, "gender")
    |> Attribute.normalize_aliases()
    |> Enum.map(& &1.id)
    |> Enum.sort()
  end

  # I must be looking for one or more of the candidate's genders.
  defp filter_gender_one_way(user) do
    preferred = my_preferred_genders(user)

    if preferred == @simple_genders or preferred == [] do
      []
    else
      [{:terms, "attributes", preferred}]
    end
  end

  # ... and the candidate must be looking for one or more of mine.
  defp filter_gender(user) do
    genders = my_genders(user)

    reverse =
      if genders == @simple_genders or genders == [] do
        []
      else
        [{:terms, "attributes_lf", genders}]
      end

    filter_gender_one_way(user) ++ reverse
  end

  # Whether the target's gender preferences include one of the user's genders.
  def prefers_my_gender?(user_id, target_id) do
    my_genders =
      Attribute
      |> join(:inner, [attribute], profile_attribute in Profile.Attributes,
        on: profile_attribute.attribute_id == attribute.id
      )
      |> where(
        [attribute, profile_attribute],
        profile_attribute.profile_id == ^user_id and attribute.type == "gender"
      )
      |> Repo.all()
      |> Attribute.normalize_aliases()
      |> Enum.map(& &1.id)
      |> Enum.uniq()
      |> Enum.sort()

    if my_genders == @simple_genders or my_genders == [] do
      true
    else
      Attribute
      |> join(:inner, [attribute], preference in Preferences.Attributes,
        on: preference.attribute_id == attribute.id
      )
      |> where([attribute, preference], preference.preferences_id == ^target_id)
      |> where([attribute], attribute.type == "gender" and attribute.id in ^my_genders)
      |> Repo.exists?()
    end
  end

  # Candidates must be within my age range; whether I'm within theirs is a
  # scoring factor (see reverse_age/1), not a filter.
  defp filter_age(%User{profile: %{preferences: preferences}}) do
    dob_lte = if preferences.agemin, do: get_years_ago(preferences.agemin), else: nil

    dob_gte =
      if preferences.agemax, do: Date.add(get_years_ago(preferences.agemax + 1), 1), else: nil

    if dob_lte || dob_gte do
      [
        {:range, "dob",
         %{}
         |> then(&if(dob_lte, do: Map.put(&1, :lte, dob_lte), else: &1))
         |> then(&if(dob_gte, do: Map.put(&1, :gte, dob_gte), else: &1))}
      ]
    else
      []
    end
  end

  # My advanced filters, applied to candidates.
  defp filter_advanced(advanced_filters) do
    %{include: includes, exclude: excludes} =
      Map.merge(%{include: [], exclude: []}, Enum.group_by(advanced_filters, & &1.kind))

    include_filters =
      includes
      |> Enum.group_by(&include_group/1)
      |> Enum.map(fn {_group, [%AdvancedFilter{category: category} | _] = entries} ->
        {:terms, category_field(category), Enum.map(entries, &entry_value/1)}
      end)

    exclude_filters =
      excludes
      |> Enum.group_by(&category_field(&1.category))
      |> Enum.map(fn {field, entries} ->
        {:none_of, field, Enum.map(entries, &entry_value/1)}
      end)

    include_filters ++ exclude_filters
  end

  # VR platforms and accessories are one attribute category but two UI groups;
  # splitting includes by kind ANDs them, so headset + accessory requires both.
  defp include_group(%AdvancedFilter{
         category: :platform,
         attribute: %{metadata: %{"kind" => kind}}
       }),
       do: {:platform, kind}

  defp include_group(%AdvancedFilter{category: category}), do: category

  # Categories whose tags aren't attributes or dedicated document fields, but
  # namespaced tokens matched against the candidate's `boosts` field.
  @boost_categories [:relationships, :monopoly, :domsub, :personality]

  defp category_field(:country), do: "country"
  defp category_field(:language), do: "languages"
  defp category_field(category) when category in @boost_categories, do: "boosts"
  defp category_field(_), do: "attributes"

  defp entry_value(%AdvancedFilter{category: category} = entry)
       when category in @boost_categories,
       do: boost_token(entry)

  defp entry_value(%AdvancedFilter{attribute_id: attribute_id}) when not is_nil(attribute_id),
    do: attribute_id

  defp entry_value(%AdvancedFilter{value: value}), do: to_string(value)

  defp boost_token(%AdvancedFilter{category: :relationships, value: value}),
    do: Search.Tokens.relationship(value)

  defp boost_token(%AdvancedFilter{category: :monopoly, value: value}),
    do: Search.Tokens.monopoly(value)

  defp boost_token(%AdvancedFilter{category: :domsub, value: value}),
    do: Search.Tokens.domsub(value)

  defp boost_token(%AdvancedFilter{category: :personality, value: value}),
    do: Search.Tokens.personality(value)

  @age_closeness_weight 15
  @reverse_age_weight 10
  @fallback_advanced_weight 10

  defp factors(user, kind, fallback, advanced_filters) do
    cw = custom_weights(user)

    base =
      case kind do
        :love ->
          [
            liked_me(user, cw),
            interests(user, cw),
            custom_interests(user, cw),
            games(user, cw),
            location(user, cw),
            monopoly(user, cw),
            relationships(user, cw),
            domsub(user, cw),
            languages(user, cw),
            kinks(user, cw),
            personality(user, cw),
            reverse_age(user),
            active(),
            {:random, 1}
          ]

        :friend ->
          [
            liked_me(user, cw),
            interests(user, cw),
            custom_interests(user, cw),
            games(user, cw),
            languages(user, cw),
            personality(user, cw),
            age_closeness(user),
            reverse_age(user),
            active(),
            {:random, 15}
          ]
      end

    extras = if fallback, do: fallback_factors(user, kind, advanced_filters), else: []

    (base ++ extras)
    |> List.flatten()
    |> Enum.reject(&is_nil/1)
  end

  defp custom_weights(%User{profile: profile}) do
    profile.custom_weights || %Profile.CustomWeights{}
  end

  defp weight(cw, key), do: Map.get(cw, key) || 1

  defp liked_me(_user, cw), do: {:liked_me, 20 * weight(cw, :likes)}

  defp interests(%User{profile: profile}, cw) do
    strength_boosts = %{0 => 3, 1 => 5, 2 => 20}

    profile.attributes
    |> filter_by(:type, "interest")
    |> Profile.group_interests_by_strength()
    |> Enum.flat_map(fn {strength, interests} ->
      boost = Map.get(strength_boosts, strength, 3)

      Enum.map(
        interests,
        &{:token, Search.Tokens.attribute(&1.id), boost * weight(cw, :default_interests)}
      )
    end)
  end

  defp custom_interests(%User{profile: profile}, cw) do
    Enum.map(
      profile.custom_interests || [],
      &{:token, Search.Tokens.custom_interest(&1), 25 * weight(cw, :custom_interests)}
    )
  end

  defp games(%User{profile: profile}, cw) do
    profile.attributes
    |> filter_by(:type, "game")
    |> Enum.map(&{:token, Search.Tokens.attribute(&1.id), 1 * weight(cw, :games)})
  end

  # Scale base location-related weights so they add up to 40 even if you don't
  # have all 3 location fields on your profile.
  @location_base %{country: 12, geolocation: 21, timezone: 7}
  @location_target 40

  defp location_scale(%{country: country, latitude: lat, longitude: lon, timezone: timezone}) do
    present =
      if(country, do: @location_base.country, else: 0) +
        if(lat && lon, do: @location_base.geolocation, else: 0) +
        if(timezone, do: @location_base.timezone, else: 0)

    if present > 0, do: @location_target / present, else: 1.0
  end

  defp location(%User{profile: profile}, cw) do
    scale = location_scale(profile)
    w = weight(cw, :location)
    country_token = profile.country && Search.Tokens.country(profile.country)

    [
      if(country_token,
        do: {:token, country_token, @location_base.country * scale * w},
        else: nil
      ),
      if(profile.latitude && profile.longitude,
        do: {:geo, {profile.latitude, profile.longitude}, @location_base.geolocation * scale * w},
        else: nil
      ),
      if(profile.timezone,
        do: {:tz, timezone_normalized(profile.timezone), @location_base.timezone * scale * w},
        else: nil
      ),
      # Compensate same-country candidates for the proximity boosts they can't
      # earn without a geolocation or timezone of their own.
      if(country_token && profile.latitude && profile.longitude,
        do: {:token_missing, country_token, :geolocation, 12 * scale * w},
        else: nil
      ),
      if(country_token && profile.timezone,
        do: {:token_missing, country_token, :tz_norm, 3.3 * scale * w},
        else: nil
      )
    ]
  end

  defp monopoly(%User{profile: %{monopoly: nil}}, _cw), do: nil

  defp monopoly(%User{profile: %{monopoly: monopoly}}, cw),
    do: {:token, Search.Tokens.monopoly(monopoly), 5 * weight(cw, :monopoly)}

  defp relationships(%User{profile: profile}, cw) do
    Enum.map(
      profile.relationships || [],
      &{:token, Search.Tokens.relationship(&1), 2 * weight(cw, :relationships)}
    )
  end

  defp domsub(%User{preferences: %{nsfw: true}, profile: %{domsub: domsub}}, cw)
       when not is_nil(domsub) do
    domsub
    |> Profile.get_domsub_match()
    |> Enum.map(&{:token, Search.Tokens.domsub(&1), 3 * weight(cw, :domsub)})
  end

  defp domsub(_user, _cw), do: nil

  defp languages(%User{profile: profile}, cw) do
    Enum.map(
      profile.languages || [],
      &{:token, Search.Tokens.language(&1), 1 * weight(cw, :languages)}
    )
  end

  defp kinks(%User{preferences: %{nsfw: true}, profile: profile}, cw) do
    w = 2 * weight(cw, :kinks)

    forward =
      profile.preferences.attributes
      |> filter_by(:type, "kink")
      |> Enum.map(&{:token, Search.Tokens.attribute(&1.id), w})

    reverse =
      profile.attributes
      |> filter_by(:type, "kink")
      |> Enum.map(&{:token, Search.Tokens.attribute_lf(&1.id), w})

    forward ++ reverse
  end

  defp kinks(_user, _cw), do: nil

  defp personality(%User{profile: profile}, cw) do
    origins =
      %{
        openness: profile.openness,
        conscientiousness: profile.conscientiousness,
        agreeableness: profile.agreeableness
      }
      |> Map.filter(fn {_, value} -> not is_nil(value) end)

    if origins == %{},
      do: nil,
      else: {:personality, origins, 4.5 * weight(cw, :personality)}
  end

  # Candidates within my preferred age range score fully; close misses still
  # earn partial points, decaying with distance outside the range.
  defp age_closeness(%User{profile: %{preferences: preferences}}) do
    if preferences.agemin || preferences.agemax do
      agemin = preferences.agemin || 18
      agemax = preferences.agemax || 80
      origin = get_years_ago(round((agemin + agemax) / 2))
      offset_days = round((agemax - agemin) / 2 * 365)

      {:age_closeness, origin, offset_days, @age_closeness_weight}
    else
      nil
    end
  end

  # ... and candidates whose own age range includes me score fully, with
  # partial points when I'm just outside it.
  defp reverse_age(%User{born_at: nil}), do: nil

  defp reverse_age(%User{born_at: born_at}),
    do: {:reverse_age, get_years_since(born_at), @reverse_age_weight}

  defp active, do: {:active, 12}

  defp fallback_factors(user, :love, advanced_filters) do
    [
      age_closeness(user),
      fallback_advanced(advanced_filters)
    ]
  end

  defp fallback_factors(_user, _kind, _advanced_filters), do: []

  defp fallback_advanced(advanced_filters) do
    %{include: includes, exclude: excludes} =
      Map.merge(%{include: [], exclude: []}, Enum.group_by(advanced_filters, & &1.kind))

    include_factors =
      Enum.map(includes, &{:token, entry_token(&1), @fallback_advanced_weight})

    exclude_factors =
      case excludes do
        [] -> []
        _ -> [{:none_of_boost, Enum.map(excludes, &entry_token/1), @fallback_advanced_weight}]
      end

    include_factors ++ exclude_factors
  end

  defp entry_token(%AdvancedFilter{category: :country, value: value}),
    do: Search.Tokens.country(value)

  defp entry_token(%AdvancedFilter{category: :language, value: value}),
    do: Search.Tokens.language(value)

  defp entry_token(%AdvancedFilter{category: category} = entry)
       when category in @boost_categories,
       do: boost_token(entry)

  defp entry_token(%AdvancedFilter{attribute_id: attribute_id}),
    do: Search.Tokens.attribute(attribute_id)
end
