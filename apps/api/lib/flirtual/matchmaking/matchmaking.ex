defmodule Flirtual.Matchmaking do
  use Flirtual.Logger, :matchmaking

  import Flirtual.Utilities
  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.User.Profile.Block
  alias Flirtual.Subscription
  alias Flirtual.Talkjs
  alias Flirtual.Conversation
  alias Flirtual.Elasticsearch
  alias Flirtual.User.Profile.Prospect
  alias Flirtual.User.Profile.LikesAndPasses
  alias Flirtual.User.Profile
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

  def should_compute_prospects?(user, kind) do
    reset_fields = get_reset_fields(kind)

    reset_at = user.profile[reset_fields.at]
    reset_count = user.profile[reset_fields.count]

    reset_at === nil or
      (Subscription.active?(user.subscription) and reset_count >= 15) or
      DateTime.compare(reset_at, DateTime.utc_now()) == :lt
  end

  def list_prospects(%User{} = user, kind) do
    if(should_compute_prospects?(user, kind)) do
      log(:info, ["compute", kind], user.id)
      compute_prospects(user, kind)
    else
      log(:info, ["skip-compute", kind], user.id)
      list_existing_prospects(user, kind)
    end
  end

  defp list_existing_prospects(user, kind) do
    {:ok,
     Prospect.list(profile_id: user.id, kind: kind)
     |> Enum.map(& &1.target_id)}
  end

  defp compute_prospects(user, kind) do
    reset_fields = get_reset_fields(kind)
    query = generate_query(user, kind)

    Repo.transaction(fn ->
      with {:ok, resp} <- Elasticsearch.search(:users, query),
           prospects = Enum.map(resp["hits"]["hits"], &{&1["_id"], &1["_score"]}),
           prospects =
             User
             |> where([user], user.id in ^Enum.map(prospects, &elem(&1, 0)))
             |> select([user], user.id)
             |> Repo.all()
             |> Enum.map(fn user_id ->
               {user_id, prospects |> Enum.find(&(elem(&1, 0) == user_id)) |> elem(1)}
             end),
           {:ok, _} <- Prospect.delete_all(profile_id: user.id, kind: kind),
           {:ok, _} <-
             Prospect.insert_all(
               prospects
               |> Enum.map(fn {prospect_id, score} ->
                 %{
                   profile_id: user.id,
                   target_id: prospect_id,
                   kind: kind,
                   score: score
                 }
               end)
             ),
           {:ok, _} <-
             change(
               user.profile,
               Map.put(%{}, reset_fields.at, next_reset_at())
               |> Map.put(reset_fields.count, 0)
             )
             |> Repo.update() do
        prospects |> Enum.map(&elem(&1, 0))
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def reset_prospects(%User{} = user) do
    with {:ok, count} <- LikesAndPasses.delete_all(profile_id: user.id),
         {:ok, _} <- compute_prospects(user, :love),
         {:ok, _} <- compute_prospects(user, :friend) do
      {:ok, count}
    end
  end

  def deliver_match_email(user, target_user) do
    action_url = User.url(target_user)

    Mailer.send(
      user,
      subject: "It's a match!",
      action_url: action_url,
      body_text: """
      #{User.display_name(target_user)} liked you back—they want to meet you too!

      Check out their profile:
      #{action_url}
      """,
      body_html: """
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
      """
    )
  end

  def create_match_conversation(user_a, user_b, kind) do
    conversation_id = Talkjs.new_conversation_id(user_a, user_b)

    with {:ok, conversation} <-
           Talkjs.update_conversation(
             conversation_id,
             %{
               participants: [ShortUUID.decode!(user_a.id), ShortUUID.decode!(user_b.id)],
               subject: Conversation.encode(:kind, kind)
             }
           ),
         {:ok, _} <-
           Talkjs.create_messages(conversation_id, [
             %{
               text: "It's a match!",
               type: "SystemMessage"
             }
           ]) do
      {:ok, conversation}
    else
      _ -> {:error, nil}
    end
  end

  def reduce_kind(a, b) when a === :friend or b === :friend, do: :friend
  def reduce_kind(_, _), do: :love

  def respond_profile(opts \\ []) do
    user = Keyword.fetch!(opts, :user)
    target = Keyword.fetch!(opts, :target)

    type = Keyword.fetch!(opts, :type)
    kind = Keyword.get(opts, :kind, :love)
    mode = Keyword.get(opts, :mode, :love)

    reset_count_field = get_reset_fields(mode).count
    reset_count = user.profile[reset_count_field]

    Repo.transaction(fn repo ->
      with {_, _} <-
             Prospect
             |> where(profile_id: ^user.id, target_id: ^target.id)
             |> Repo.update_all(set: [completed: true]),
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
                 add_error(&1, :user_id, "Cannot respond to yourself")
               else
                 &1
               end
             )
             |> unsafe_validate_unique([:profile_id, :target_id, :kind], repo,
               error_key: :user_id,
               message: "Profile already responded"
             )
             |> Repo.insert(),
           {:ok, _} <-
             user.profile
             |> change(Map.put(%{}, reset_count_field, reset_count + 1))
             |> Repo.update(),
           opposite_item <-
             LikesAndPasses.get(user_id: item.target_id, target_id: item.profile_id, type: type),
           match_kind = reduce_kind(item.kind, opposite_item[:kind]),
           {:ok, opposite_item} <-
             if(is_nil(opposite_item),
               do: {:ok, nil},
               else:
                 with true <- item.type === :like and opposite_item.type === :like,
                      {:ok, _} <- create_match_conversation(user, target, match_kind),
                      {:ok, _} <- deliver_match_email(target, user) do
                   {:ok, opposite_item}
                 else
                   false -> {:ok, opposite_item}
                   value -> value
                 end
             ) do
        %{
          matched:
            if not is_nil(opposite_item) do
              item.type === :like and opposite_item.type === :like
            else
              false
            end
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

    %{
      "explain" => false,
      "_source" => false,
      "size" => 30,
      "query" => %{
        "function_score" => %{
          "query" => %{
            "bool" => %{
              "must_not" => [
                %{
                  "ids" => %{
                    "values" =>
                      [
                        # Exclude yourself.
                        user.id,
                        # Exclude users you've already liked or passed.
                        LikesAndPasses
                        |> where(profile_id: ^profile.user_id, type: :like)
                        |> or_where(profile_id: ^profile.user_id, type: :pass, kind: :love)
                        |> or_where(profile_id: ^profile.user_id, type: :pass, kind: ^kind)
                        |> distinct(true)
                        |> select([item], item.target_id)
                        |> Repo.all(),
                        # Exclude blocked users.
                        Block
                        |> where(profile_id: ^profile.user_id)
                        |> distinct(true)
                        |> select([item], item.target_id)
                        |> Repo.all(),
                        # Exclude users who blocked you.
                        Block
                        |> where(target_id: ^profile.user_id)
                        |> distinct(true)
                        |> select([item], item.target_id)
                        |> Repo.all()
                      ]
                      |> List.flatten()
                      |> Enum.uniq()
                  }
                }
              ],
              "filter" => filters(user, kind),
              "should" => queries(user, kind),
              "minimum_should_match" => 0
            }
          },
          functions: [
            %{
              random_score: %{},
              weight: case kind do
                :love -> 1
                :friend -> 30
              end
            }
          ],
          boost_mode: "sum"
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

    dob_gte =
      if preferences.agemax, do: Date.add(get_years_ago(preferences.agemax + 1), 1), else: nil

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
            |> Attribute.normalize_aliases()
            |> Enum.map(& &1.id)
        }
      },
      # $a must be looking for one or more of $b’s genders.
      %{
        "terms" => %{
          "attributes" =>
            preferences.attributes
            |> filter_by(:type, "gender")
            |> Attribute.normalize_aliases()
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
        :personality,
        :active_at
      ],
      &query(&1, user)
    )
    |> List.flatten()
  end

  def queries(%User{} = user, :friend) do
    Enum.map(
      [
        :active_at
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
          "boost" => 19 * (Map.get(custom_weights, :likes) || 1)
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
              "boost" => 20 * (Map.get(custom_weights, :default_interests) || 1)
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
              "boost" => 25 * (Map.get(custom_weights, :custom_interests) || 1)
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
            "boost" => 1 * (Map.get(custom_weights, :games) || 1)
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
            "boost" => 15 * (Map.get(custom_weights, :country) || 1)
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
            "boost" => 3 * (Map.get(custom_weights, :serious) || 1)
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
          "boost" => 3 * (Map.get(custom_weights, :domsub) || 1)
        }
      },
      else: []
    )
  end

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
                  "boost" => 2 * (Map.get(custom_weights, :kinks) || 1)
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
                  "boost" => 2 * (Map.get(custom_weights, :kinks) || 1)
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
      if profile.openness do
        %{
          "function_score" => %{
            "linear" => %{
              "openness" => %{
                "origin" => profile.openness,
                "scale" => 3
              }
            },
            "boost" => 4.5 * (Map.get(custom_weights, :personality) || 1)
          }
        }
      else
        []
      end,
      if profile.conscientiousness do
        %{
          "function_score" => %{
            "linear" => %{
              "conscientiousness" => %{
                "origin" => profile.conscientiousness,
                "scale" => 3
              }
            },
            "boost" => 4.5 * (Map.get(custom_weights, :personality) || 1)
          }
        }
      else
        []
      end,
      if profile.agreeableness do
        %{
          "function_score" => %{
            "linear" => %{
              "agreeableness" => %{
                "origin" => profile.agreeableness,
                "scale" => 3
              }
            },
            "boost" => 4.5 * (Map.get(custom_weights, :personality) || 1)
          }
        }
      else
        []
      end
    ]
  end

  def query(:active_at, %User{} = user) do
    %{
      "function_score" => %{
        "exp" => %{
          "active_at" => %{
            "scale" => "7d",
            "offset" => "1d",
            "decay" => 0.5
          }
        },
        "boost" => 30
      }
    }
  end
end
