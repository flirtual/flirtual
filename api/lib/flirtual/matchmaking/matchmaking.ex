defmodule Flirtual.Matchmaking do

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

  def compute_potential_matches(id) do
    user = get_user(id)
    IO.inspect(user)

    query = %{
      "query" => %{
        "bool" => %{
          "must_not" => [
            # $a and $b must not be the same user
            %{"term" => %{id: user["id"]}}
          ],
          "filter" => [
            # $a and $b must both have completed onboarding OR be an old VRLFP user[1],
            # $a and $b must both have either uploaded an avatar[2] OR filled out a bio[3],
            # $a and $b must both not be banned from Flirtual
            %{"term" => %{"visible" => true}},
            # $b must be looking for one or more of $a’s genders, and vice versa
            %{"terms" => %{"gender_lf" => user["gender"]}},
            %{"terms" => %{"gender" => user["gender_lf"]}}
          ],
          "should" =>
            List.flatten([
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
              %{
                "term" => %{
                  "country" => %{
                    "value" => user["country"],
                    "boost" => 3
                  }
                }
              },
              # Are $a and $b both monogamous, or both non-monogamous?
              %{
                "term" => %{
                  "monopoly" => %{
                    "value" => user["monopoly"],
                    "boost" => 5
                  }
                }
              },
              # Are $a and $b both looking for a serious relationship?
              %{
                "term" => %{
                  "serious" => %{
                    "value" => user["serious"],
                    "boost" => 5
                  }
                }
              },
            ])
        }
      }
    }

    IO.inspect(query)

    matches = Elasticsearch.post!(Flirtual.Elasticsearch, "/users/_search", query)["hits"]["hits"]
    Enum.map(matches, &(%{
      "id" => &1["_id"],
      "score" => &1["_score"],
    }))
  end
end
