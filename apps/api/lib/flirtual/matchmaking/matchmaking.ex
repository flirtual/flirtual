defmodule Flirtual.Matchmaking do
  use Flirtual.Logger, :matchmaking

  import Flirtual.Utilities
  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.Conversation
  alias Flirtual.Elasticsearch
  alias Flirtual.Subscription
  alias Flirtual.Talkjs
  alias Flirtual.User.Profile
  alias Flirtual.User.Profile.Block
  alias Flirtual.User.Profile.LikesAndPasses
  alias Flirtual.User.Profile.Prospect
  alias Flirtual.{Attribute, Repo, User}

  @simple_genders ["jAL62ePbibxaG4FPu7S8LG", "rhw3rcbheU7vc9vcSy6W6V", "tpkW7r8PZ2RUuYGUSYi82N"]

  def next_reset_at() do
    now = DateTime.utc_now()
    today_9am = DateTime.new!(Date.utc_today(), Time.new!(9, 0, 0, 0))

    case DateTime.compare(now, today_9am) do
      :lt -> today_9am
      _ -> DateTime.add(today_9am, 24 * 60 * 60)
    end
    |> DateTime.truncate(:second)
  end

  @queue_limit 15

  def get_queue_fields(profile, kind) do
    %{reset_at: reset_at, likes: likes, passes: passes} =
      case kind do
        :love ->
          %{
            reset_at: profile.queue_love_reset_at,
            likes: profile.queue_love_likes,
            passes: profile.queue_love_passes
          }

        :friend ->
          %{
            reset_at: profile.queue_friend_reset_at,
            likes: profile.queue_friend_likes,
            passes: profile.queue_friend_passes
          }
      end

    likes_limit = @queue_limit
    passes_limit = @queue_limit * 2 - likes

    %{
      reset_at: reset_at,
      likes: likes,
      likes_left: likes_limit - likes,
      likes_limit: likes_limit,
      passes: passes,
      passes_left: passes_limit - passes,
      passes_limit: passes_limit
    }
  end

  def queue_fields(kind) do
    case kind do
      :love ->
        %{
          reset_at: :queue_love_reset_at,
          likes: :queue_love_likes,
          passes: :queue_love_passes
        }

      :friend ->
        %{
          reset_at: :queue_friend_reset_at,
          likes: :queue_friend_likes,
          passes: :queue_friend_passes
        }
    end
  end

  def reset_queue_fields(kind) do
    %{}
    |> Map.put(queue_fields(kind)[:reset_at], next_reset_at())
    |> Map.put(queue_fields(kind)[:likes], 0)
    |> Map.put(queue_fields(kind)[:passes], 0)
  end

  def should_reset?(reset_at) do
    reset_at === nil or
      DateTime.compare(reset_at, DateTime.utc_now()) == :lt
  end

  def queue_information(%User{} = user, mode) do
    {:ok, existing_next_prospects} = next_prospects(user, mode)

    if(
      (user.likes_count + user.passes_count >= 15 || user.likes_count >= 7) &&
        (user.status in [:registered, :onboarded] ||
           (user.status == :finished_profile && is_nil(user.email_confirmed_at)))
    ) do
      {:error,
       {:forbidden,
        case user.status do
          :finished_profile -> :confirm_email
          _ -> :finish_profile
        end}}
    else
      {:ok, prospects} =
        if(existing_next_prospects == [],
          do: compute_next_prospects(user, mode),
          else: {:ok, existing_next_prospects}
        )

      # {:ok, previous} = previous_prospect(user, mode)

      grouped_prospects = Enum.group_by(prospects, & &1.completed)

      {:ok,
       %{
         previous:
           (grouped_prospects[true] || [])
           |> Enum.at(0)
           |> Map.get(:id),
         next:
           (grouped_prospects[false] || [])
           |> Enum.take(2)
           |> Enum.map(& &1.id)
       }}
    end
  end

  defp previous_prospect(user, kind) do
    prospect =
      Prospect
      |> where(profile_id: ^user.id, kind: ^kind, completed: true)
      |> order_by(asc: :score)
      |> limit(1)
      |> Repo.one()

    {:ok, prospect}
  end

  defp next_prospects(user, kind) do
    prospects =
      Prospect
      # |> where(profile_id: ^user.id, kind: ^kind, completed: false)
      |> where(profile_id: ^user.id, kind: ^kind)
      |> order_by(desc: :completed, desc: :score, desc: :target_id)
      |> select([prospect], %{
        id: prospect.target_id,
        score: prospect.score,
        completed: prospect.completed
      })
      # |> select([prospect], prospect.target_id)
      # |> limit(2)
      |> Repo.all()

    {:ok, prospects}
  end

  defp compute_next_prospects(user, kind) do
    query = generate_query(user, kind)

    Repo.transaction(fn ->
      with {:ok, resp} <- Elasticsearch.search(:users, query),
           prospects = Enum.map(resp["hits"]["hits"], &{&1["_id"], &1["_score"]}),
           prospects =
             User
             |> where(
               [user],
               user.id in ^Enum.map(prospects, &elem(&1, 0)) and user.status == :visible
             )
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
             ) do
        value =
          prospects
          |> Enum.sort(&(elem(&1, 1) > elem(&2, 1)))
          |> Enum.map(&elem(&1, 0))

        log(:debug, ["computing", user.id, kind], value)
        value
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def reset_prospects(%User{} = user) do
    with {:ok, _} <- compute_next_prospects(user, :love),
         {:ok, _} <- compute_next_prospects(user, :friend) do
      :ok
    end
  end

  def schedule_reset_notification(user, reset_at) do
    if user.preferences.push_notifications.reminders and
         (user.apns_tokens != [] or user.fcm_tokens != []) do
      User.Push.deliver(user, :daily_profiles_ready, reset_at)
    else
      {:ok, :disabled}
    end
  end

  def deliver_match_notification(user, target_user, match_kind) do
    conversation_id = Talkjs.new_conversation_id(user, target_user)

    send_email =
      user.preferences.email_notifications.matches and is_nil(user.banned_at) and
        is_nil(user.deactivated_at)

    send_push =
      user.preferences.push_notifications.matches and
        (user.apns_tokens != [] or user.fcm_tokens != [])

    if target_user.status == :visible and (send_email or send_push) do
      email_result =
        if send_email do
          User.Email.deliver(user, :new_match,
            conversation_id: conversation_id,
            match_kind: match_kind,
            target_user: target_user
          )
        else
          {:ok, :disabled}
        end

      push_result =
        if send_push do
          User.Push.deliver(user, :new_match,
            conversation_id: conversation_id,
            match_kind: match_kind,
            target_user: target_user
          )
        else
          {:ok, :disabled}
        end

      case {email_result, push_result} do
        {{:ok, :disabled}, {:ok, :disabled}} -> {:ok, :disabled}
        {{:ok, _}, {:ok, :disabled}} -> {:ok, :email}
        {{:ok, :disabled}, {:ok, _}} -> {:ok, :push}
        {{:ok, _}, {:ok, _}} -> {:ok, :both}
        {{:error, reason}, _} -> {:error, reason}
        {_, {:error, reason}} -> {:error, reason}
      end
    else
      {:ok, :disabled}
    end
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

  def respond(opts \\ []) do
    user = Keyword.fetch!(opts, :user)

    type = Keyword.fetch!(opts, :type)
    types = if type == :like, do: :likes, else: :passes

    kind = Keyword.get(opts, :kind, :love)
    mode = Keyword.get(opts, :mode, kind)

    {:ok, next} = next_prospects(user, mode)
    target_id = Keyword.get(opts, :target_id) || Enum.at(next, 0)
    target = Keyword.get(opts, :target) || User.get(target_id)

    queue_keys = queue_fields(mode)
    existing_fields = get_queue_fields(user.profile, mode)

    profile =
      if should_reset?(existing_fields.reset_at) do
        fields = reset_queue_fields(mode)

        {:ok, profile} =
          user.profile
          |> change(fields)
          |> Repo.update()

        log(:info, ["reset", user.id, mode], fields)
        profile
      else
        user.profile
      end

    fields = get_queue_fields(profile, mode)

    if type == :like and fields.likes >= fields.likes_limit and
         not Subscription.active?(user.subscription) do
      schedule_reset_notification(user, fields.reset_at)
      {:error, :out_of_likes, fields.reset_at}
    else
      if fields.passes >= fields.passes_limit and not Subscription.active?(user.subscription) do
        schedule_reset_notification(user, fields.reset_at)
        {:error, :out_of_passes, fields.reset_at}
      else
        Repo.transaction(fn repo ->
          with %User{} <- target,
               {_, _} <-
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
                     add_error(&1, :user_id, "cannot_like_self")
                   else
                     &1
                   end
                 )
                 |> unsafe_validate_unique([:profile_id, :target_id, :kind], repo,
                   error_key: :user_id,
                   message: "already_responded"
                 )
                 |> Repo.insert(),
               {1, nil} <-
                 Profile
                 |> where(user_id: ^user.id)
                 |> Repo.update_all(inc: Keyword.put([], queue_keys[types], 1)),
               {1, nil} <-
                 User
                 |> where(id: ^user.id)
                 |> Repo.update_all(
                   inc:
                     Keyword.put(
                       [],
                       case type do
                         :like -> :likes_count
                         :pass -> :passes_count
                       end,
                       1
                     )
                 ),
               opposite_item <-
                 LikesAndPasses.get(
                   user_id: item.target_id,
                   target_id: item.profile_id,
                   type: type
                 ),
               match_kind = reduce_kind(item.kind, opposite_item[:kind]),
               {:ok, opposite_item} <-
                 if(is_nil(opposite_item),
                   do: {:ok, nil},
                   else:
                     with true <- item.type === :like and opposite_item.type === :like,
                          {:ok, _} <-
                            create_match_conversation(user, target, match_kind),
                          {:ok, _} <-
                            deliver_match_notification(target, user, match_kind) do
                       {:ok, opposite_item}
                     else
                       false -> {:ok, opposite_item}
                       value -> value
                     end
                 ) do
            %{
              match:
                if not is_nil(opposite_item) do
                  item.type === :like and opposite_item.type === :like
                else
                  false
                end,
              match_kind: match_kind,
              user_id: target.id
            }
          else
            {:error, reason} -> Repo.rollback(reason)
            reason -> Repo.rollback(reason)
          end
        end)
      end
    end
  end

  def undo(user, kind) do
    Repo.transaction(fn ->
      with {:ok, prospect} <- previous_prospect(user, kind),
           {:ok, _} <- Prospect.reverse(prospect) do
        prospect
      end
    end)
  end

  def generate_query(%User{} = user, kind, opts \\ []) do
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
      "explain" => Keyword.get(opts, :explain, false),
      "_source" => false,
      "size" => 31,
      "query" => %{
        "function_score" => %{
          "query" => %{
            "bool" => %{
              "must_not" =>
                [
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
                ]
                |> Enum.reject(&is_nil/1),
              "filter" => filters(user, kind),
              "should" => queries(user, kind),
              "minimum_should_match" => 0
            }
          },
          functions: [
            %{
              random_score: %{},
              weight:
                case kind do
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
    Enum.map([:age, :gender, :hidden], &filter(&1, user)) |> List.flatten()
  end

  def filters(%User{} = user, :friend) do
    filter(:hidden, user)
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

    genders =
      attributes
      |> filter_by(:type, "gender")
      |> Attribute.normalize_aliases()
      |> Enum.map(& &1.id)
      |> Enum.sort()

    preferences_genders =
      preferences.attributes
      |> filter_by(:type, "gender")
      |> Attribute.normalize_aliases()
      |> Enum.map(& &1.id)
      |> Enum.sort()

    # $b must be looking for one or more of $a’s genders.
    filter =
      if genders != @simple_genders do
        [
          %{
            "terms" => %{
              "attributes_lf" => genders
            }
          }
        ]
      else
        []
      end

    # $a must be looking for one or more of $b’s genders.
    if preferences_genders != @simple_genders do
      [
        %{
          "terms" => %{
            "attributes" => preferences_genders
          }
        }
        | filter
      ]
    else
      filter
    end
  end

  def filter(:hidden, %User{status: :visible}) do
    []
  end

  def filter(:hidden, _) do
    %{
      "term" => %{
        "hidden_from_nonvisible" => %{
          "value" => false
        }
      }
    }
  end

  def queries(%User{} = user, :love) do
    Enum.map(
      [
        :likes,
        :interests,
        :custom_interests,
        :games,
        :country,
        :monopoly,
        :relationships,
        :domsub,
        :languages,
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
      "constant_score" => %{
        "filter" => %{
          "term" => %{
            "liked" => %{
              "value" => user.id
            }
          }
        },
        "boost" => 15 * (Map.get(custom_weights, :likes) || 1)
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
          "constant_score" => %{
            "filter" => %{
              "term" => %{
                "attributes" => %{
                  "value" => &1.id
                }
              }
            },
            "boost" => 3 * (Map.get(custom_weights, :default_interests) || 1)
          }
        }
      ),
      # Which strong-weighted interests do $a and $b have in common?
      Enum.map(
        grouped_interests[1] || [],
        &%{
          "constant_score" => %{
            "filter" => %{
              "term" => %{
                "attributes" => %{
                  "value" => &1.id
                }
              }
            },
            "boost" => 5 * (Map.get(custom_weights, :default_interests) || 1)
          }
        }
      ),
      # Which stronger-weighted interests do $a and $b have in common?
      Enum.map(
        grouped_interests[2] || [],
        &%{
          "constant_score" => %{
            "filter" => %{
              "term" => %{
                "attributes" => %{
                  "value" => &1.id
                }
              }
            },
            "boost" => 20 * (Map.get(custom_weights, :default_interests) || 1)
          }
        }
      )
    ])
  end

  def query(:custom_interests, %User{} = user) do
    %{profile: %{custom_interests: custom_interests, custom_weights: custom_weights}} = user

    # Which custom interests do $a and $b have in common?
    Enum.map(
      custom_interests,
      &%{
        "constant_score" => %{
          "filter" => %{
            "term" => %{
              "custom_interests" => %{
                "value" =>
                  &1
                  |> String.downcase()
                  |> String.replace(~r/[^[:alnum:]]/u, "")
              }
            }
          },
          "boost" => 25 * (Map.get(custom_weights, :custom_interests) || 1)
        }
      }
    )
  end

  def query(:games, %User{} = user) do
    %{profile: %{attributes: attributes, custom_weights: custom_weights}} = user
    games = attributes |> filter_by(:type, "game")

    # Which VR games do $a and $b both play?
    Enum.map(
      games,
      &%{
        "constant_score" => %{
          "filter" => %{
            "term" => %{
              "attributes" => %{
                "value" => &1.id
              }
            }
          },
          "boost" => 1 * (Map.get(custom_weights, :games) || 1)
        }
      }
    )
  end

  def query(:country, %User{} = user) do
    %{profile: %{country: country, custom_weights: custom_weights}} = user

    # Are $a and $b from the same country?
    if(country,
      do: %{
        "constant_score" => %{
          "filter" => %{
            "term" => %{
              "country" => %{
                "value" => country
              }
            }
          },
          "boost" => 20 * (Map.get(custom_weights, :country) || 1)
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
        "constant_score" => %{
          "filter" => %{
            "term" => %{
              "monopoly" => %{
                "value" => monopoly
              }
            }
          },
          "boost" => 5 * (Map.get(custom_weights, :monopoly) || 1)
        }
      },
      else: []
    )
  end

  def query(:relationships, %User{} = user) do
    %{profile: %{relationships: relationships, custom_weights: custom_weights}} = user

    # Are $a and $b both looking for the same types of relationships?
    Enum.map(
      relationships,
      &%{
        "constant_score" => %{
          "filter" => %{
            "term" => %{
              "relationships" => %{
                "value" => &1
              }
            }
          },
          "boost" => 2 * (Map.get(custom_weights, :relationships) || 1)
        }
      }
    )
  end

  def query(:domsub, %User{} = user) do
    %{profile: %{domsub: domsub, custom_weights: custom_weights}} = user

    if(user.preferences.nsfw && domsub,
      do: %{
        "constant_score" => %{
          "filter" => %{
            "terms" => %{
              "domsub" => User.Profile.get_domsub_match(domsub)
            }
          },
          "boost" => 3 * (Map.get(custom_weights, :domsub) || 1)
        }
      },
      else: []
    )
  end

  def query(:languages, %User{} = user) do
    %{profile: %{languages: languages, custom_weights: custom_weights}} = user

    Enum.map(
      languages,
      &%{
        "constant_score" => %{
          "filter" => %{
            "term" => %{
              "languages" => %{
                "value" => &1
              }
            }
          },
          "boost" => 1 * (Map.get(custom_weights, :languages) || 1)
        }
      }
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
              "constant_score" => %{
                "filter" => %{
                  "term" => %{
                    "attributes" => %{
                      "value" => &1.id
                    }
                  }
                },
                "boost" => 2 * (Map.get(custom_weights, :kinks) || 1)
              }
            }
          ),
          Enum.map(
            filter_by(profile.attributes, :type, "kink"),
            &%{
              "constant_score" => %{
                "filter" => %{
                  "term" => %{
                    "attributes_lf" => %{
                      "value" => &1.id
                    }
                  }
                },
                "boost" => 2 * (Map.get(custom_weights, :kinks) || 1)
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

  def query(:active_at, _) do
    %{
      "function_score" => %{
        "exp" => %{
          "active_at" => %{
            "scale" => "7d",
            "offset" => "1d",
            "decay" => 0.5
          }
        },
        "boost" => 12
      }
    }
  end
end
