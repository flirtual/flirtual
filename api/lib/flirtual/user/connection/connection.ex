defmodule Flirtual.User.Connection do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.User.Connection.Policy

  import Ecto.Changeset

  alias Flirtual.User
  alias User.Connection

  @derive {Jason.Encoder,
           only: [
             :type,
             :external_id,
             :name,
             :avatar_url,
             :url,
             :updated_at,
             :created_at
           ]}

  schema "user_connections" do
    belongs_to :user, User

    field :type, Ecto.Enum, values: [:discord, :vrchat]
    field :external_id, :string

    field :name, :string, virtual: true
    field :avatar_url, :string, virtual: true
    field :url, :string, virtual: true

    timestamps(inserted_at: :created_at)
  end

  def update_changeset(connection) do
    connection
    |> cast(%{}, [])
    |> unsafe_validate_unique([:user_id, :type], Flirtual.Repo)
    |> unique_constraint([:user_id, :type])
  end

  def get_authorize_url(:discord) do
    "https://discord.com/api/oauth2/authorize?" <>
      URI.encode_query(%{
        client_id: Application.fetch_env!(:flirtual, :discord_client_id),
        redirect_uri: "http://localhost:4000/v1/auth/connect/discord",
        response_type: "code",
        scope: "identify"
      })
  end

  def get_authorize_url(_), do: nil

  def assign_connection(
        %Connection{external_id: external_id, type: :discord} = connection,
        external_profile
      ) do
    %{
      "username" => username,
      "discriminator" => discriminator,
      "avatar" => avatar_id
    } = external_profile

    %Connection{
      connection
      | name: username <> "#" <> discriminator,
        avatar_url:
          "https://cdn.discordapp.com/avatars/" <> external_id <> "/" <> avatar_id <> ".png",
        url: "https://discordapp.com/users/" <> external_id <> "/"
    }
  end

  def get_profile(%Connection{type: :discord, external_id: external_id} = connection) do
    case HTTPoison.get("https://discord.com/api/users/" <> external_id, %{
           authorization: "Bot " <> Application.fetch_env!(:flirtual, :discord_token)
         }) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        assign_connection(connection, Poison.decode!(body))

      {_, _} ->
        connection
    end
  end

  def get_profile(connection), do: connection
end
