defmodule Flirtual.Search.Document do
  # Intermediate representation of a user's profile for search;
  # `Search.to_row/1` maps it into the Manticore row.

  import Flirtual.Utilities

  alias Flirtual.Data.{Kink, Sexuality}
  alias Flirtual.Features
  alias Flirtual.Search.Tokens
  alias Flirtual.User
  alias Flirtual.User.Profile

  # Far-away sentinel so candidates without a value never receive closeness
  # boosts (a missing trait would otherwise score as a perfect match).
  @personality_missing 99

  def personality_missing, do: @personality_missing

  def encode(%User{} = user) do
    profile = user.profile
    nsfw = user.preferences.nsfw
    privacy = user.preferences.privacy

    profile_tags = Profile.tags(profile)

    tags =
      (profile_tags ++ Profile.normalize_aliases(profile_tags))
      |> Enum.uniq()
      |> then(&if(nsfw, do: &1, else: reject_kinks(&1)))

    tags_lf =
      Profile.Preferences.tags(profile.preferences)
      |> then(
        &if(nsfw,
          do: &1 ++ Profile.normalize_pairs(profile.kinks),
          else: reject_kinks(&1)
        )
      )

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
      tags: filterable_tag_ids(tags, privacy),
      tags_lf: tags_lf |> Enum.map(&Tokens.entry/1) |> Enum.uniq() |> Enum.sort(),
      country:
        if(private?(privacy, :country) or is_nil(profile.country),
          do: nil,
          else: profile.country.id
        ),
      languages: Enum.map(profile.languages, & &1.id),
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
      boosts: boosts(user, tags, Enum.uniq(tags_lf), privacy)
    }
  end

  defp reject_kinks(tags), do: Enum.reject(tags, &match?(%Kink{}, &1))

  # Whether a privacy-gated category is hidden from "everyone" (matches/me).
  defp private?(nil, _category), do: false
  defp private?(privacy, category), do: Map.get(privacy, category) != :everyone

  defp filterable_tag_ids(tags, privacy) do
    tags
    |> then(
      &if(private?(privacy, :sexuality),
        do: Enum.reject(&1, fn tag -> match?(%Sexuality{}, tag) end),
        else: &1
      )
    )
    |> then(&if(private?(privacy, :kinks), do: reject_kinks(&1), else: &1))
    |> Enum.map(&Tokens.entry/1)
    |> Enum.sort()
  end

  defp boosts(%User{} = user, tags, tags_lf, privacy) do
    profile = user.profile
    nsfw = user.preferences.nsfw

    [
      Enum.map(tags, &Tokens.tag/1),
      Enum.map(tags_lf, &Tokens.tag_lf/1),
      Enum.map(profile.custom_interests || [], &Tokens.custom_interest/1),
      Enum.map(profile.languages, &Tokens.language(&1.id)),
      Enum.map(profile.relationships, &Tokens.relationship(&1.id)),
      if(profile.monopoly, do: [Tokens.monopoly(profile.monopoly)], else: []),
      if(nsfw && profile.domsub, do: [Tokens.domsub(profile.domsub)], else: []),
      if(nsfw && profile.domsub && not private?(privacy, :kinks),
        do: [Tokens.public_domsub(profile.domsub)],
        else: []
      ),
      if(profile.country, do: [Tokens.country(profile.country.id)], else: []),
      # Personality poles are only filter tokens; hide them when private
      # (personality scoring factor reads the numeric traits, not these).
      personality_boosts(profile, privacy)
    ]
    |> List.flatten()
    |> Enum.uniq()
  end

  defp personality_boosts(profile, privacy) do
    if private?(privacy, :personality) or not Features.personality?(),
      do: [],
      else: personality_tokens(profile)
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
