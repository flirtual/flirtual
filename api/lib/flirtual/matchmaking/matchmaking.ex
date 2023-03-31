defmodule Flirtual.Matchmaking do
  import Flirtual.Utilities
  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.Subscription
  alias Flirtual.Talkjs
  alias Flirtual.Elasticsearch
  alias Flirtual.User.Profile.Prospect
  alias Flirtual.User.Profile.LikesAndPasses
  alias Flirtual.User.Profile
  Flirtual.Utilities.Changeset
  alias Flirtual.{Repo, User, Attribute, Mailer}

  def get_reset_fields(kind) do
    case kind do
      :love -> %{at: :reset_love_at, count: :reset_love_count}
      :friend -> %{at: :reset_friend_at, count: :reset_friend_count}
    end
  end

  def next_reset_at() do
    now = DateTime.utc_now()
    today_9am = DateTime.new!(Date.utc_today(), Time.new!(9, 0, 0, 0))

    case DateTime.compare(now, today_9am) do
      :lt -> today_9am
      _ -> DateTime.add(today_9am, 24 * 60 * 60)
    end
    |> DateTime.truncate(:second)
  end

  def next_reset_changeset(%User{} = user, kind) do
  end

  def compute_prospects(%User{} = user, kind, opts \\ []) do
    profile = user.profile

    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    reset_fields = get_reset_fields(kind)

    reset_at = user.profile[reset_fields.at]
    reset_count = user.profile[reset_fields.count]

    Repo.transaction(fn ->
      prospect_ids =
        from(
          a in Prospect,
          where: [profile_id: ^profile.user_id, kind: ^kind],
          select: a.target_id
        )
        |> Repo.all()

      query = generate_query(user, kind)

      if Keyword.get(opts, :force, false) or reset_at === nil or
           Subscription.active?(user.subscription) or
           NaiveDateTime.compare(DateTime.to_naive(reset_at), now) == :lt do
        with {:ok, resp} <- Elasticsearch.search("users", query),
             user_ids = Enum.map(resp["hits"]["hits"], & &1["_id"]),
             {:ok, _} <- Prospect.delete_all(profile_id: profile.user_id, kind: kind),
             {:ok, _} <-
               Prospect.insert_all(
                 user_ids
                 |> Enum.map(
                   &%{
                     profile_id: profile.user_id,
                     target_id: &1,
                     kind: kind
                   }
                 )
               ),
             {:ok, _} <-
               change(
                 user.profile,
                 Map.put(%{}, reset_fields.at, next_reset_at())
                 |> Map.put(reset_fields.count, 0)
               )
               |> Repo.update() do
          user_ids
        else
          {:error, reason} -> Repo.rollback(reason)
          reason -> Repo.rollback(reason)
        end
      else
        if reset_count >= 15 do
          []
        else
          prospect_ids
        end
      end
    end)
  end

  def reset_prospects(%User{} = user) do
    with {:ok, count} <- LikesAndPasses.delete_all(profile_id: user.id),
         {:ok, _} <- compute_prospects(user, :love, force: true),
         {:ok, _} <- compute_prospects(user, :friend, force: true) do
      {:ok, count}
    end
  end

  def deliver_match_email(user, target_user) do
    action_url = User.url(target_user)

    Mailer.send(
      user,
      "It's a match!",
      """
      #{User.display_name(target_user)} liked you back—they want to meet you too!

      Check out their profile:
      #{action_url}
      """,
      """
      <p>#{User.display_name(target_user)} liked you back&mdash;they want to meet you too!</p>

      <p><a href="#{action_url}" class="btn">Check out their profile</a></p>

      <script type="application/ld+json">
      {
        "@context": "http://schema.org",
        "@type": "EmailMessage",
        "description": "Check out their profile",
        "potentialAction": {
          "@type": "ViewAction",
          "url": "#{action_url}",
          "name": "Profile"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Flirtual",
          "url": "https://flirtu.al/"
        }
      }
      </script>
      """,
      action_url
    )
  end

  def create_match_conversation(user_a, user_b) do
    conversation_id = Talkjs.new_conversation_id(user_a, user_b)

    with {:ok, conversation} <-
           Talkjs.update_conversation(
             conversation_id,
             %{
               participants: [user_a.id, user_b.id],
               subject: "❤️"
             }
           ),
         {:ok, _} <-
           Talkjs.create_messages(conversation_id, [
             %{
               text: "It's a match",
               type: "SystemMessage"
             }
           ]) do
      {:ok, conversation}
    else
      _ -> {:error, nil}
    end
  end

  def respond_profile(opts \\ []) do
    user = Keyword.fetch!(opts, :user)
    target = Keyword.fetch!(opts, :target)

    type = Keyword.fetch!(opts, :type)
    kind = Keyword.get(opts, :kind, :love)
    mode = Keyword.get(opts, :mode, :love)

    reset_count_field = get_reset_fields(mode).count
    reset_count = user.profile[reset_count_field]

    Repo.transaction(fn repo ->
      with {:ok, _} <-
             Prospect.delete(profile_id: user.id, target_id: target.id),
           {:ok, item} <-
             %LikesAndPasses{}
             |> cast(
               %{
                 profile_id: user.id,
                 target_id: target.id,
                 type: type,
                 kind: kind
               },
               [:profile_id, :target_id, :type, :kind]
             )
             |> then(
               &if(get_field(&1, :profile_id) === get_field(&1, :target_id)) do
                 add_error(&1, :user_id, "cannot respond to yourself")
               else
                 &1
               end
             )
             |> unsafe_validate_unique([:profile_id, :target_id, :kind], repo,
               error_key: :user_id,
               message: "profile already responded"
             )
             |> Repo.insert(),
           {:ok, _} <-
             user.profile
             |> change(Map.put(%{}, reset_count_field, reset_count + 1))
             |> Repo.update(),
           opposite_item <-
             from(LikesAndPasses,
               where: [
                 profile_id: ^item.target_id,
                 target_id: ^item.profile_id
               ]
             )
             |> Repo.one(),
           {:ok, _} <-
             if(is_nil(opposite_item),
               do: {:ok, nil},
               else:
                 with {:ok, _} <- create_match_conversation(user, target),
                      {:ok, _} <- deliver_match_email(target, user) do
                   {:ok, nil}
                 end
             ) do
        %{
          match: not is_nil(opposite_item)
        }
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def generate_query(%User{} = user, kind) do
    user =
      user
      |> then(
        &Map.put(
          &1,
          :profile,
          &1.profile
          |> Repo.preload([attributes: from(Attribute)], force: true)
          |> Map.put(:custom_weights, &1.profile.custom_weights || %{})
        )
      )

    profile = user.profile

    likes_and_passes =
      from(
        a in LikesAndPasses,
        where: [profile_id: ^profile.user_id, type: :like],
        or_where: [profile_id: ^profile.user_id, type: :pass, kind: :love],
        or_where: [profile_id: ^profile.user_id, type: :pass, kind: ^kind],
        distinct: :target_id,
        select: a.target_id
      )
      |> Repo.all()

    %{
      # "explain" => true,
      "size" => 30,
      "query" => %{
        "bool" => %{
          "must_not" => [
            # $a and $b must not be the same user and must not be an already liked user.
            %{
              "ids" => %{
                "values" =>
                  List.flatten([
                    user.id,
                    likes_and_passes,
                    []
                  ])
              }
            }
          ],
          "filter" => filters(user, kind),
          "should" => queries(user, kind)
        }
      }
    }
  end

  def filters(%User{} = user, :love) do
    Enum.map([:age, :gender], &filter(&1, user)) |> List.flatten()
  end

  def filters(_, :friend) do
    []
  end

  def filter(:age, %User{} = user) do
    %{profile: %{preferences: preferences}} = user
    user_age = if user.born_at, do: get_years_since(user.born_at), else: nil

    dob_lte = if preferences.agemin, do: get_years_ago(preferences.agemin), else: nil
    dob_gte = if preferences.agemax, do: get_years_ago(preferences.agemax), else: nil

    [
      if(!!dob_lte or !!dob_gte,
        do: %{
          "range" => %{
            "dob" =>
              Map.merge(
                if(dob_lte, do: %{"lte" => dob_lte}, else: %{}),
                if(dob_gte, do: %{"gte" => dob_gte}, else: %{})
              )
          }
        },
        else: []
      ),
      if(user_age,
        do: [
          %{
            "range" => %{
              "agemin" => %{
                "lte" => user_age
              }
            }
          },
          %{
            "range" => %{
              "agemax" => %{
                "gte" => user_age
              }
            }
          }
        ],
        else: []
      )
    ]
  end

  def filter(:gender, %User{} = user) do
    %{profile: %{attributes: attributes, preferences: preferences}} = user

    [
      # $b must be looking for one or more of $a’s genders.
      %{
        "terms" => %{
          "attributes_lf" =>
            attributes
            |> filter_by(:type, "gender")
            |> Enum.filter(& &1.metadata["simple"])
            |> Enum.map(& &1.id)
        }
      },
      # $a must be looking for one or more of $b’s genders.
      %{
        "terms" => %{
          "attributes" =>
            preferences.attributes
            |> filter_by(:type, "gender")
            |> Enum.map(& &1.id)
        }
      }
    ]
  end

  def queries(%User{} = user, :love) do
    Enum.map(
      [
        :likes,
        :interests,
        :games,
        :country,
        :monopoly,
        :serious,
        :domsub,
        :kinks,
        :personality
      ],
      &query(&1, user)
    )
    |> List.flatten()
  end

  def queries(%User{} = user, :friend) do
    Enum.map(
      [
        :likes,
        :interests,
        :games,
        :country,
        :personality
      ],
      &query(&1, user)
    )
    |> List.flatten()
  end

  def query(:likes, %User{} = user) do
    %{profile: %{custom_weights: custom_weights}} = user

    %{
      "term" => %{
        "liked" => %{
          "value" => user.id,
          "boost" => 20 * (Map.get(custom_weights, :likes) || 1)
        }
      }
    }
  end

  def query(:interests, %User{} = user) do
    %{profile: %{attributes: attributes, custom_weights: custom_weights}} = user

    grouped_interests =
      attributes
      |> filter_by(:type, "interest")
      |> Profile.group_interests_by_strength()

    List.flatten([
      # Which default-weighted interests do $a and $b have in common?
      Enum.map(
        grouped_interests[0] || [],
        &%{
          "term" => %{
            "attributes" => %{
              "value" => &1.id,
              "boost" => 3 * (Map.get(custom_weights, :default_interests) || 1)
            }
          }
        }
      ),
      # Which strong-weighted interests do $a and $b have in common?
      Enum.map(
        grouped_interests[1] || [],
        &%{
          "term" => %{
            "attributes" => %{
              "value" => &1.id,
              "boost" => 5 * (Map.get(custom_weights, :default_interests) || 1)
            }
          }
        }
      ),
      # Which stronger-weighted interests do $a and $b have in common?
      Enum.map(
        grouped_interests[2] || [],
        &%{
          "term" => %{
            "attributes" => %{
              "value" => &1.id,
              "boost" => 15 * (Map.get(custom_weights, :default_interests) || 1)
            }
          }
        }
      ),
      # Which custom-input interests do $a and $b have in common?
      Enum.map(
        [],
        &%{
          "term" => %{
            "attributes" => %{
              "value" => &1.id,
              "boost" => 5 * (Map.get(custom_weights, :custom_interests) || 1)
            }
          }
        }
      )
    ])
  end

  def query(:games, %User{} = user) do
    %{profile: %{attributes: attributes, custom_weights: custom_weights}} = user
    games = attributes |> filter_by(:type, "game")

    # Which VR games do $a and $b both play?
    Enum.map(
      games,
      &%{
        "term" => %{
          "attributes" => %{
            "value" => &1.id,
            "boost" => 3 * (Map.get(custom_weights, :games) || 1)
          }
        }
      }
    )
  end

  def query(:country, %User{} = user) do
    %{profile: %{country: country, custom_weights: custom_weights}} = user

    # Are $a and $b from the same country?
    if(country,
      do: %{
        "term" => %{
          "country" => %{
            "value" => country,
            "boost" => 3 * (Map.get(custom_weights, :country) || 1)
          }
        }
      },
      else: []
    )
  end

  def query(:monopoly, %User{} = user) do
    %{profile: %{monopoly: monopoly, custom_weights: custom_weights}} = user

    # Are $a and $b both monogamous, or both non-monogamous?
    if(monopoly,
      do: %{
        "term" => %{
          "monopoly" => %{
            "value" => monopoly,
            "boost" => 5 * (Map.get(custom_weights, :monopoly) || 1)
          }
        }
      },
      else: []
    )
  end

  def query(:serious, %User{} = user) do
    %{profile: %{serious: serious, custom_weights: custom_weights}} = user

    # Are $a and $b both looking for a serious relationship?
    if(serious,
      do: %{
        "term" => %{
          "serious" => %{
            "value" => serious,
            "boost" => 5 * (Map.get(custom_weights, :serious) || 1)
          }
        }
      },
      else: []
    )
  end

  def query(:domsub, %User{} = user) do
    %{profile: %{domsub: domsub, custom_weights: custom_weights}} = user

    if(user.preferences.nsfw && domsub,
      do: %{
        "terms" => %{
          "domsub" => User.Profile.get_domsub_match(domsub),
          "boost" => 5 * (Map.get(custom_weights, :domsub) || 1)
        }
      },
      else: []
    )
  end

  # todo: check this later, pretty sure it's wrong.
  def query(:kinks, %User{} = user) do
    %{profile: %{preferences: preferences, custom_weights: custom_weights} = profile} = user

    if(user.preferences.nsfw,
      do:
        List.flatten([
          Enum.map(
            filter_by(preferences.attributes, :type, "kink"),
            &%{
              "term" => %{
                "attributes" => %{
                  "value" => &1.id,
                  "boost" => 3 * (Map.get(custom_weights, :kinks) || 1)
                }
              }
            }
          ),
          Enum.map(
            filter_by(profile.attributes, :type, "kink"),
            &%{
              "term" => %{
                "attributes_lf" => %{
                  "value" => &1.id,
                  "boost" => 3 * (Map.get(custom_weights, :kinks) || 1)
                }
              }
            }
          )
        ]),
      else: []
    )
  end

  def query(:personality, %User{} = user) do
    %{profile: %{custom_weights: custom_weights} = profile} = user

    [
      %{
        "function_score" => %{
          "linear" => %{
            "openness" => %{
              "origin" => profile.openness,
              "scale" => 3
            }
          },
          "boost" => 1.5 * (Map.get(custom_weights, :personality) || 1)
        }
      },
      %{
        "function_score" => %{
          "linear" => %{
            "conscientiousness" => %{
              "origin" => profile.conscientiousness,
              "scale" => 3
            }
          },
          "boost" => 1.5 * (Map.get(custom_weights, :personality) || 1)
        }
      },
      %{
        "function_score" => %{
          "linear" => %{
            "agreeableness" => %{
              "origin" => profile.agreeableness,
              "scale" => 3
            }
          },
          "boost" => 1.5 * (Map.get(custom_weights, :personality) || 1)
        }
      }
    ]
  end
end
