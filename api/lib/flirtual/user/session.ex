defmodule Flirtual.User.Session do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.User.Session.Policy

  alias Flirtual.User

  schema "sessions" do
    belongs_to :user, User
    belongs_to :sudoer, User

    field :token, :string, virtual: true, redact: true
    field :hashed_token, :string, redact: true

    timestamps(inserted_at: :created_at)
  end

  def default_assoc do
    [
      user: User.default_assoc()
    ]
  end

  @hash_algorithm :sha256
  @rand_size 32

  def create(%User{} = user) do
    token = generate_token()

    Ecto.build_assoc(user, :sessions, %{
      hashed_token: hash_token(token),
      token: encode_token(token)
    })
  end

  def generate_token() do
    :crypto.strong_rand_bytes(@rand_size)
  end

  def encode_token(token) do
    Base.url_encode64(token, padding: false)
  end

  def decode_token(token) do
    Base.url_decode64!(token, padding: false)
  end

  def hash_token(token) do
    :crypto.hash(@hash_algorithm, token)
  end

  def compare_token(token, hashed_token) do
    hash_token(decode_token(token)) === hashed_token
  end
end

defmodule Flirtual.User.Session.Policy do
  use Flirtual.Policy

  alias Flirtual.User.Session

  def authorize(
        :read,
        %Plug.Conn{
          assigns: %{
            session: %Session{
              id: id
            }
          }
        },
        %Session{
          id: id
        }
      ) do
    true
  end

  def authorize(_, _, _), do: false
end

defimpl Jason.Encoder, for: Flirtual.User.Session do
  def encode(value, opts) do
    Jason.Encode.map(
      Map.take(value, [
        :user,
        :sudoer_id,
        :updated_at,
        :created_at
      ])
      |> Map.filter(fn {_, value} -> value !== nil end),
      opts
    )
  end
end

defimpl Inspect, for: Flirtual.User.Session do
  import Inspect.Algebra

  def inspect(conn, opts) do
    document = Map.take(conn, [:id, :user, :sudoer_id]) |> Map.to_list()
    concat(["#Session<", to_doc(document, opts), ">"])
  end
end
