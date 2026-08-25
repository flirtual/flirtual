defmodule Flirtual.Search.Document do
  # Intermediate representation of a user's profile for search;
  # `Search.to_row/1` maps it into the Manticore row.

  import Flirtual.Utilities

  alias Flirtual.Attribute
  alias Flirtual.Search.Tokens
  alias Flirtual.User

  # Far-away sentinel so candidates without a value never receive closeness
  # boosts (a missing trait would otherwise score as a perfect match).
  @personality_missing 99

  def personality_missing, do: @personality_missing

  def encode(%User{} = user) do
    profile = user.profile
    nsfw = user.preferences.nsfw
    privacy = user.preferences.privacy

    attributes =
      profile.attributes
      |> Attribute.normalize_aliases()
      |> then(&if(nsfw, do: &1, else: exclude_by(&1, :type, "kink")))

    attributes_lf =
      profile.preferences.attributes
      |> then(
        &if(nsfw,
          do:
            &1 ++
              (profile.attributes
               |> filter_by(:type, "kink")
               |> Attribute.normalize_pairs()),
          else: exclude_by(&1, :type, "kink")
        )
      )

    attribute_ids = attributes |> Enum.map(& &1.id) |> Enum.sort()
    attribute_lf_ids = attributes_lf |> Enum.map(& &1.id) |> Enum.uniq() |> Enum.sort()

    %{
      id: user.id,
      dob: user.born_at,
      active_at: user.active_at,
      agemin: profile.preferences.agemin || 18,
      agemax: profile.preferences.agemax || 128,
      openness: profile.openness || @personality_missing,
      conscientiousness: profile.conscientiousness || @personality_missing,
      agreeableness: profile.agreeableness || @personality_missing,
      # Tags whose privacy isn't "everyone" are dropped from the filterable
      # fields, so advanced filters can't include or exclude by them. They stay
      # in `boosts` for scoring.
      attributes: filterable_attribute_ids(attributes, privacy),
      attributes_lf: attribute_lf_ids,
      country: if(private?(privacy, :country), do: nil, else: profile.country),
      languages: Enum.map(profile.languages || [], &to_string/1),
      nsfw: nsfw,
      hidden_from_nonvisible:
        user.tns_discord_in_biography !== nil and :moderator not in user.tags and
          :admin not in user.tags,
      tz_norm: if(profile.timezone, do: timezone_normalized(profile.timezone), else: nil),
      geolocation:
        if(profile.latitude && profile.longitude,
          do: {profile.latitude, profile.longitude},
          else: nil
        ),
      boosts: boosts(user, attribute_ids, attribute_lf_ids, privacy)
    }
  end

  # Whether a privacy-gated category is hidden from "everyone" (matches/me).
  defp private?(nil, _category), do: false
  defp private?(privacy, category), do: Map.get(privacy, category) != :everyone

  defp filterable_attribute_ids(attributes, privacy) do
    attributes
    |> then(&if(private?(privacy, :sexuality), do: exclude_by(&1, :type, "sexuality"), else: &1))
    |> then(&if(private?(privacy, :kinks), do: exclude_by(&1, :type, "kink"), else: &1))
    |> Enum.map(& &1.id)
    |> Enum.sort()
  end

  defp boosts(%User{} = user, attribute_ids, attribute_lf_ids, privacy) do
    profile = user.profile
    nsfw = user.preferences.nsfw

    [
      Enum.map(attribute_ids, &Tokens.attribute/1),
      Enum.map(attribute_lf_ids, &Tokens.attribute_lf/1),
      Enum.map(profile.custom_interests || [], &Tokens.custom_interest/1),
      Enum.map(profile.languages || [], &Tokens.language/1),
      Enum.map(profile.relationships || [], &Tokens.relationship/1),
      if(profile.monopoly, do: [Tokens.monopoly(profile.monopoly)], else: []),
      if(nsfw && profile.domsub, do: [Tokens.domsub(profile.domsub)], else: []),
      if(profile.country, do: [Tokens.country(profile.country)], else: []),
      # Personality poles are only filter tokens; hide them when private
      # (personality scoring factor reads the numeric traits, not these).
      if(private?(privacy, :personality), do: [], else: personality_tokens(profile))
    ]
    |> List.flatten()
    |> Enum.uniq()
  end

  # Big Five poles, so profiles can be filtered by personality trait.
  @personality_poles %{
    openness: {"openminded", "practical"},
    conscientiousness: {"reliable", "freespirited"},
    agreeableness: {"friendly", "straightforward"}
  }

  def personality_poles, do: @personality_poles

  defp personality_tokens(profile) do
    Enum.flat_map(@personality_poles, fn {trait, {positive, negative}} ->
      case Map.get(profile, trait) do
        value when is_integer(value) and value > 0 -> [Tokens.personality(positive)]
        value when is_integer(value) and value < 0 -> [Tokens.personality(negative)]
        _ -> []
      end
    end)
  end
end
