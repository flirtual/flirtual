defmodule Flirtual.User.Relationship do
  use Flirtual.Schema, primary_key: :id
  use Flirtual.Policy.Target, policy: __MODULE__.Policy

  alias Flirtual.Matchmaking
  alias Flirtual.Talkjs
  alias Flirtual.User.Profile.LikesAndPasses
  alias Flirtual.User.Relationship
  alias Flirtual.User

  embedded_schema do
    field(:user_id, :binary_id)

    field(:blocked, :boolean)
    field(:matched, :boolean)
    field(:conversation_id, :string)
    field(:type, :string)
    field(:kind, :string)
    field(:liked_me, :map)
    field(:time_diff, :integer)
  end

  defp liked_me(%LikesAndPasses{type: :like, kind: kind}), do: kind
  defp liked_me(_), do: nil

  def get(user_id, target_id) when is_binary(user_id) and is_binary(target_id) do
    lap = LikesAndPasses.get(user_id: user_id, target_id: target_id)
    opposite_lap = lap[:opposite] || LikesAndPasses.get(user_id: target_id, target_id: user_id)

    matched = LikesAndPasses.matched?(lap, opposite_lap)

    %__MODULE__{
      # user_id: user.id,
      blocked: User.blocked?(user_id, target_id),
      type: lap[:type],
      matched: matched,
      kind:
        if(matched,
          do: Matchmaking.reduce_kind(lap[:kind], opposite_lap[:kind]),
          else: lap[:kind]
        ),
      liked_me: liked_me(opposite_lap),
      conversation_id:
        if(matched,
          do: Talkjs.new_conversation_id(user_id, target_id),
          else: nil
        ),
      time_diff: User.time_diff(user_id, target_id)
    }
  end

  def get(%User{} = user, %User{} = target) do
    lap = LikesAndPasses.get(user: user, target: target)
    opposite_lap = lap[:opposite] || LikesAndPasses.get(user: target, target: user)

    matched = LikesAndPasses.matched?(lap, opposite_lap)

    %__MODULE__{
      user_id: user.id,
      blocked: User.blocked?(user, target),
      type: lap[:type],
      matched: matched,
      kind:
        if(matched,
          do: Matchmaking.reduce_kind(lap[:kind], opposite_lap[:kind]),
          else: lap[:kind]
        ),
      liked_me: liked_me(opposite_lap),
      conversation_id: if(matched, do: Talkjs.new_conversation_id(user, target), else: nil),
      time_diff: User.time_diff(user, target)
    }
  end

  defimpl Jason.Encoder do
    use Flirtual.Encoder,
      only: [
        :blocked,
        :matched,
        :type,
        :kind,
        :liked_me,
        :conversation_id,
        :time_diff
      ]
  end

  defmodule Policy do
    use Flirtual.Policy

    alias Flirtual.Subscription

    def authorize(_, _, _), do: false

    @liked_property_keys [:liked_me]

    def transform(
          :liked_me,
          _,
          %Relationship{
            liked_me: nil
          }
        ),
        do: nil

    def transform(
          key,
          %Plug.Conn{
            assigns: %{
              session: %{
                user: %User{
                  subscription: %Subscription{
                    cancelled_at: nil
                  }
                }
              }
            }
          },
          %Relationship{} = item
        )
        when key in @liked_property_keys,
        do: item[key]

    def transform(key, _, _) when key in @liked_property_keys, do: nil
  end
end
