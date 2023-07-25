defmodule Flirtual.Listmonk do
  use Flirtual.Logger, :listmonk

  alias Flirtual.Repo
  alias Flirtual.User

  import Ecto.Changeset

  defp config(key) do
    Application.get_env(:flirtual, Flirtual.Listmonk)[key]
  end

  def new_url(pathname, query) do
    URI.parse(config(:url) <> "/api/" <> pathname)
    |> then(&if(is_nil(query), do: &1, else: Map.put(&1, :query, URI.encode_query(query))))
    |> URI.to_string()
  end

  def fetch(method, pathname, body \\ nil, options \\ []) do
    raw_body = if(is_nil(body), do: "", else: Poison.encode!(body))
    url = new_url(pathname, Keyword.get(options, :query))

    log(:info, [method, url], body)

    HTTPoison.request(
      method,
      url,
      raw_body,
      [
        {"content-type", "application/json"}
      ],
      hackney: [basic_auth: {config(:username), config(:password)}]
    )
  end

  def create_subscriber(%User{} = user) do
    body = %{
      "email" => user.email,
      "name" => User.display_name(user),
      "status" => "disabled",
      "preconfirm_subscriptions" => true
    }

    case fetch(:post, "subscribers", body) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        data = Poison.decode!(body)["data"]

        with {:ok, _} <-
               change(user, %{listmonk_id: data["id"]})
               |> Repo.update() do
          {:ok, data}
        end

      _ ->
        :error
    end
  end

  def update_subscriber(%User{} = user) do
    case fetch(:get, "subscribers/#{user.listmonk_id}") do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        subscriber = Poison.decode!(body)["data"]

        status =
          cond do
            subscriber["status"] == "blocklisted" -> "blocklisted"
            is_nil(user.email_confirmed_at) -> "disabled"
            true -> "enabled"
          end

        body = %{
          "email" => user.email,
          "name" => User.display_name(user),
          "status" => status,
          "preconfirm_subscriptions" => true
        }

        case fetch(:put, "subscribers/#{user.listmonk_id}", body) do
          {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
            {:ok, Poison.decode!(body)["data"]}

          _ ->
            :error
        end

      {:error, _} ->
        :error
    end
  end

  def update_subscription(%User{} = user, action, list_id) do
    body = %{
      "ids" => [user.listmonk_id],
      "action" => action,
      "target_list_ids" => [list_id],
      "status" => "confirmed"
    }

    case fetch(:put, "subscribers/lists", body) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        {:ok, Poison.decode!(body)["data"]}

      _ ->
        :error
    end
  end
end
