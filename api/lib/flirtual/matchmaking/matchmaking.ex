defmodule Flirtual.Matchmaking do

  @year_in_milliseconds 3.154e+10

  def get_age_in_years(dob) do
    floor(DateTime.diff(DateTime.utc_now(), dob, :millisecond) / @year_in_milliseconds)
  end

  def get_user(id) do
    Elasticsearch.get!(Flirtual.Elasticsearch, "/users/_doc/#{id}")["_source"]
  end

  def get_user_interests_query(user) do
    List.flatten([
      # Which default-weighted interests do $a and $b have in common?
      Enum.map(
        user["default_interests"],
        &%{
          "term" => %{
            "default_interests" => %{
              "value" => &1,
              "boost" => 3
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
              "boost" => 5
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
              "boost" => 15
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
              # TODO: Custom interest weights?
              "boost" => 5
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
              "scale" => 3,
            }
          },
          "boost" => 1.5
        }
      },
      %{
        "function_score" => %{
          "linear" => %{
            "conscientiousness" => %{
              "origin" => user["conscientiousness"],
              "scale" => 3,
            }
          },
          "boost" => 1.5
        }
      },
      %{
        "function_score" => %{
          "linear" => %{
            "agreeableness" => %{
              "origin" => user["agreeableness"],
              "scale" => 3,
            }
          },
          "boost" => 1.5
        }
      }
    ])
  end

  def compute_potential_matches(id) do
    user = get_user(id)

    {:ok, dob, 0} = DateTime.from_iso8601(user["dob"])
    user_age = get_age_in_years(dob)

    query = %{
      "query" => %{
        "bool" => %{
          "must_not" => [
            # $a and $b must not be the same user and must not be an already liked user.
            %{
              "ids" => %{
                "values" => [user["id"] | user["likes"]]
              }
            }
          ],
          "filter" => [
            # $a and $b must both have completed onboarding OR be an old VRLFP user[1],
            # $a and $b must both have either uploaded an avatar[2] OR filled out a bio[3],
            # $a and $b must both not be banned from Flirtual
            %{"term" => %{"visible" => true}},
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
                    "boost" => 20
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
                      "boost" => 3
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
                      "boost" => 3
                    }
                  }
                },
              # Are $a and $b both monogamous, or both non-monogamous?
              user["monopoly"] &&
                %{
                  "term" => %{
                    "monopoly" => %{
                      "value" => user["monopoly"],
                      "boost" => 5
                    }
                  }
                },
              # Are $a and $b both looking for a serious relationship?
              user["serious"] &&
                %{
                  "term" => %{
                    "serious" => %{
                      "value" => user["serious"],
                      "boost" => 5
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
                  "boost" => 3
                }
              },
              %{
                "terms" => %{
                  "kinks" => user["kinks_lf"],
                  "boost" => 3
                }
              },
              get_user_personality_query(user)
            ])
            |> Enum.filter(&(!is_nil(&1) && !is_boolean(&1)))
        }
      }
    }

    IO.inspect(query)

    matches = Elasticsearch.post!(Flirtual.Elasticsearch, "/users/_search", query)["hits"]["hits"]
    Enum.map(matches, & &1["_id"])
  end

  def patch_user(id, contents) do
    Elasticsearch.post!(Flirtual.Elasticsearch, "/users/_update/#{id}", %{
      "doc" => contents
    })
  end

  def update_user(id, source, params \\ %{}) do
    Elasticsearch.post!(Flirtual.Elasticsearch, "/users/_update/#{id}", %{
      "script" => %{
        "source" => source,
        "lang" => "painless",
        "params" => params
      }
    })
  end
end
