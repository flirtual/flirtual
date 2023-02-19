defmodule Flirtual.Elasticsearch.User do
  alias Flirtual.User

  def enqueue_update(user_id) do
    :queue.
  end

  def update(%User{} = user) do
    Elasticsearch.put_document(Flirtual.Elasticsearch, user, "users")
  end
end

defimpl Elasticsearch.Document, for: Flirtual.User do
  alias Flirtual.User
  alias Flirtual.User.Profile
  alias Flirtual.Repo

  def id(%User{} = user), do: user.id
  def routing(_), do: false

  def encode(%User{} = user) do
    user = user |> Repo.preload(User.default_assoc())

    document = %{
      id: user.id,
      dob: user.born_at,
      agemin: user.profile.preferences.agemin,
      agemax: user.profile.preferences.agemax,
      openness: user.profile.openness,
      conscientiousness: user.profile.conscientiousness,
      agreeableness: user.profile.agreeableness,
      gender: user.profile.gender |> Enum.map(& &1.id),
      gender_lf: user.profile.preferences.gender |> Enum.map(& &1.id),
      custom_interests: [],
      stronger_interests: [],
      strong_interests: [],
      default_interests: user.profile.interests |> Enum.map(& &1.id),
      games: user.profile.games |> Enum.map(& &1.id),
      country: user.profile.country,
      monopoly: user.profile.monopoly,
      serious: user.profile.serious,
      nsfw: user.preferences.nsfw,
      domsub: user.profile.domsub,
      domsub_lf: Profile.get_domsub_opposite(user.profile.domsub),
      kinks: user.profile.kinks |> Enum.map(& &1.id),
      kinks_lf: user.profile.preferences.kinks |> Enum.map(& &1.id),
      liked: [],
      passed: [],
      blocked: [],
      weight_country: user.profile.custom_weights.country,
      weight_default_interests: user.profile.custom_weights.default_interests,
      weight_custom_interests: user.profile.custom_weights.custom_interests,
      weight_domsub: user.profile.custom_weights.domsub,
      weight_games: user.profile.custom_weights.games,
      weight_kinks: user.profile.custom_weights.kinks,
      weight_likes: user.profile.custom_weights.likes,
      weight_monopoly: user.profile.custom_weights.monopoly,
      weight_personality: user.profile.custom_weights.personality,
      weight_serious: user.profile.custom_weights.serious
    }

    document
  end
end
