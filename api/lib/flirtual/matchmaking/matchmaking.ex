defmodule Flirtual.Matchmaking do
  import Flirtual.Utilities
  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.Talkjs
  alias Flirtual.Elasticsearch
  alias Flirtual.User.Profile.LikesAndPasses
  alias Flirtual.User.Profile
  alias Flirtual.{Repo, User, Attribute, Mailer}

  def compute_prospects(%User{} = user) do
    query = generate_query(user)

    with {:ok, resp} <- Elasticsearch.search("users", query) do
      resp["hits"]["hits"] |> Enum.map(& &1["_id"])
    end
  end

  def reset_prospects(%User{} = user) do
    LikesAndPasses.delete_all(profile_id: user.id)
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

  def respond_profile(%User{} = source_user, %User{} = target_user, type) do
    Repo.transaction(fn repo ->
      with {:ok, item} <-
             %Profile.LikesAndPasses{}
             |> cast(
               %{
                 profile_id: source_user.id,
                 target_id: target_user.id,
                 type: type,
                 kind: :love
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
           opposite_item <-
             from(Profile.LikesAndPasses,
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
                 with {:ok, _} <- create_match_conversation(source_user, target_user),
                      {:ok, _} <- deliver_match_email(target_user, source_user) do
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

  def generate_query(%User{} = user) do
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
        where: [profile_id: ^profile.user_id],
        select: a.target_id
      )
      |> Repo.all()

    %{
      # "explain" => true,
      "size" => 15,
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
          "filter" => filters([:age, :gender], user),
          "should" =>
            queries(
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
              user
            )
        }
      }
    }
  end

  def queries(names, %User{} = user) do
    names |> Enum.map(&query(&1, user)) |> List.flatten()
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

  def filters(names, %User{} = user) do
    names |> Enum.map(&filter(&1, user)) |> List.flatten()
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
end
