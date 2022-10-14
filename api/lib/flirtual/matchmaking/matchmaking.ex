defmodule Flirtual.Matchmaking do
  def get_user_interests_query(user) do
    List.flatten([
      # Which default-weighted interests do $a and $b have in common?
      Enum.map(
        user["default_interests"],
        &%{
          "term" => %{
            "default_interests" => %{
              "value" => &1,
              "boost" => 3 * user["weight_default_interests"]
            }
          }
        }
      ),
      # Which strong-weighted interests do $a and $b have in common?
      Enum.map(
        user["strong_interests"],
        &%{
          "term" => %{
            "strong_interests" => %{
              "value" => &1,
              "boost" => 5 * user["weight_default_interests"]
            }
          }
        }
      ),
      # Which stronger-weighted interests do $a and $b have in common?
      Enum.map(
        user["stronger_interests"],
        &%{
          "term" => %{
            "stronger_interests" => %{
              "value" => &1,
              "boost" => 15 * user["weight_default_interests"]
            }
          }
        }
      ),
      # Which custom-input interests do $a and $b have in common?
      Enum.map(
        user["custom_interests"],
        &%{
          "term" => %{
            "custom_interests" => %{
              "value" => &1,
              "boost" => 5 * user["weight_custom_interests"]
            }
          }
        }
      )
    ])
  end

  def get_user_personality_query(user) do
    List.flatten([
      %{
        "function_score" => %{
          "linear" => %{
            "openness" => %{
              "origin" => user["openness"],
              "scale" => 3
            }
          },
          "boost" => 1.5 * user["weight_personality"]
        }
      },
      %{
        "function_score" => %{
          "linear" => %{
            "conscientiousness" => %{
              "origin" => user["conscientiousness"],
              "scale" => 3
            }
          },
          "boost" => 1.5 * user["weight_personality"]
        }
      },
      %{
        "function_score" => %{
          "linear" => %{
            "agreeableness" => %{
              "origin" => user["agreeableness"],
              "scale" => 3
            }
          },
          "boost" => 1.5 * user["weight_personality"]
        }
      }
    ])
  end

  def compute_potential_matches(id) do
    user = Flirtual.Elasticsearch.get_user(id)

    {:ok, dob, 0} = DateTime.from_iso8601(user["dob"])
    user_age = Flirtual.Utilities.get_years_since(dob)

    query = %{
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
                    user["id"],
                    user["likes"],
                    user["passes"],
                    user["blocked"]
                  ])
              }
            }
          ],
          "filter" => [
            # $b must be looking for one or more of $a’s genders, and vice versa
            %{"terms" => %{"gender_lf" => user["gender"]}},
            %{"terms" => %{"gender" => user["gender_lf"]}},
            %{
              "range" => %{
                "dob" => %{
                  "lte" => "now-#{user["agemin"]}y",
                  "gte" => "now-#{user["agemax"]}y"
                }
              }
            },
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
          "should" =>
            List.flatten([
              %{
                "term" => %{
                  "likes" => %{
                    "value" => user["id"],
                    "boost" => 20 * user["weight_likes"]
                  }
                }
              },
              get_user_interests_query(user),
              # Which VR games do $a and $b both play?
              Enum.map(
                user["games"],
                &%{
                  "term" => %{
                    "games" => %{
                      "value" => &1,
                      "boost" => 3 * user["weight_games"]
                    }
                  }
                }
              ),
              # Are $a and $b from the same country?
              user["country"] &&
                %{
                  "term" => %{
                    "country" => %{
                      "value" => user["country"],
                      "boost" => 3 * user["weight_country"]
                    }
                  }
                },
              # Are $a and $b both monogamous, or both non-monogamous?
              user["monopoly"] &&
                %{
                  "term" => %{
                    "monopoly" => %{
                      "value" => user["monopoly"],
                      "boost" => 5 * user["weight_monopoly"]
                    }
                  }
                },
              # Are $a and $b both looking for a serious relationship?
              user["serious"] &&
                %{
                  "term" => %{
                    "serious" => %{
                      "value" => user["serious"],
                      "boost" => 5 * user["weight_serious"]
                    }
                  }
                },
              user["nsfw"] &&
                %{
                  "term" => %{
                    "nsfw" => %{
                      "value" => user["nsfw"],
                      "boost" => 5
                    }
                  }
                },
              %{
                "terms" => %{
                  "kinks_lf" => user["kinks"],
                  "boost" => 3 * user["weight_kinks"]
                }
              },
              %{
                "terms" => %{
                  "kinks" => user["kinks_lf"],
                  "boost" => 3 * user["weight_kinks"]
                }
              },
              get_user_personality_query(user)
            ])
            |> Enum.filter(&(!is_nil(&1) && !is_boolean(&1)))
        }
      }
    }

    IO.inspect(query)

    Elasticsearch.post!(Flirtual.Elasticsearch, "/users/_search", query)["hits"]["hits"]
    |> Enum.map(& &1["_id"])
  end

  def like_user(id, target_id) do
    update_user(
      id,
      %{
        "id" => id,
        "target_id" => target_id
      },
      """
        ctx._source.likes.add(params.target_id)
      """
    )
  end

  def pass_user(id, target_id) do
    update_user(
      id,
      %{
        "id" => id,
        "target_id" => target_id
      },
      """
        ctx._source.passes.add(params.target_id)
      """
    )
  end

  def block_user(id, target_id) do
    update_user(
      id,
      %{
        "id" => id,
        "target_id" => target_id
      },
      """
        ctx._source.blocked.add(params.target_id)
      """
    )
  end

  def patch_user(id, contents) do
    Elasticsearch.post!(Flirtual.Elasticsearch, "/users/_update/#{id}", %{
      "doc" => contents
    })
  end

  def update_user(id, params, source) do
    Elasticsearch.post!(Flirtual.Elasticsearch, "/users/_update/#{id}", %{
      "script" => %{
        "source" => source,
        "lang" => "painless",
        "params" => params
      }
    })
  end
end
