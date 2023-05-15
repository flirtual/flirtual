defmodule Flirtual.User.Relationship do
  use Flirtual.Schema, primary_key: :id
  use Flirtual.Policy.Target, policy: __MODULE__.Policy

  alias Flirtual.Talkjs
  alias Flirtual.User.Profile.LikesAndPasses
  alias Flirtual.User.Relationship
  alias Flirtual.User

  embedded_schema do
    field :user_id, :binary_id

    field :blocked, :boolean
    field :matched, :boolean
    field :conversation_id, :string
    field :type, :string
    field :kind, :string
    field :liked_me, :map
  end

  defp liked_me(%LikesAndPasses{type: :like, kind: kind}), do: kind
  defp liked_me(_), do: nil

  defp maybe_reduce_kind(a, _, false), do: a
  defp maybe_reduce_kind(a, b, true) when a === :friend or b === :friend, do: :friend
  defp maybe_reduce_kind(a, _, true), do: a

  def get(%User{} = user, %User{} = target) do
    lap = LikesAndPasses.get(user: user, target: target)
    opposite_lap = lap[:opposite] || LikesAndPasses.get(user: target, target: user)

    matched = LikesAndPasses.matched?(lap, opposite_lap)

    %__MODULE__{
      user_id: user.id,
      blocked: User.blocked?(user, target),
      type: lap[:type],
      matched: matched,
      kind: maybe_reduce_kind(lap[:kind], opposite_lap[:kind], matched),
      liked_me: liked_me(opposite_lap),
      conversation_id: if(matched, do: Talkjs.new_conversation_id(user, target), else: nil)
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
        :conversation_id
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
