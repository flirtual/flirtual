defmodule Flirtual.User.Session do
  use Flirtual.Schema

  alias Flirtual.User

  @derive {Jason.Encoder,
           only: [
             :user_id,
             :updated_at,
             :created_at
           ]}

  schema "sessions" do
    belongs_to :user, User

    field :token, :string, virtual: true, redact: true
    field :hashed_token, :string, redact: true

    timestamps(inserted_at: :created_at)
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
