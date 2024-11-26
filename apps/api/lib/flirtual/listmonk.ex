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
    case {config(:url), config(:username), config(:password)} do
      {basename, username, password}
      when basename in [nil, ""] or username in [nil, ""] or password in [nil, ""] ->
        log(
          :warning,
          [method, pathname],
          "Requested dropped because Listmonk was not properly configured. If this is unintentional, ensure the following environment variables are set: LISTMONK_URL, LISTMONK_USERNAME and LISTMONK_PASSWORD."
        )

        {:error, :not_configured}

      {basename, username, password} ->
        raw_body = if(is_nil(body), do: "", else: Poison.encode!(body))
        query = Keyword.get(options, :query)

        url =
          URI.parse(basename <> "/api/" <> pathname)
          |> then(
            &if(is_nil(query),
              do: &1,
              else: Map.put(&1, :query, URI.encode_query(query))
            )
          )
          |> URI.to_string()

        log(:debug, [method, url], body)

        HTTPoison.request(
          method,
          url,
          raw_body,
          [
            {"content-type", "application/json"}
          ],
          hackney: [basic_auth: {username, password}]
        )
    end
  end

  def get_subscriber_lists(%User{} = user) do
    if user.preferences.email_notifications.newsletter and is_nil(user.banned_at) and
         is_nil(user.deactivated_at) do
      [1, 3]
    else
      [3]
    end
  end

  def create_subscriber(%User{} = user) do
    body = %{
      "email" => user.email,
      "name" => User.display_name(user),
      "status" =>
        if is_nil(user.email_confirmed_at) do
          "disabled"
        else
          "enabled"
        end,
      "preconfirm_subscriptions" => true,
      "lists" => get_subscriber_lists(user)
    }

    case fetch(:post, "subscribers", body) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        data = Poison.decode!(body)["data"]

        with {:ok, _} <-
               change(user, %{listmonk_id: data["id"]})
               |> Repo.update() do
          {:ok, data}
        end

      {:ok,
       %HTTPoison.Response{status_code: 409, body: "{\"message\":\"E-mail already exists.\"}\n"}} ->
        case fetch(:get, "subscribers", nil,
               query: [query: "lower(subscribers.email) = lower('#{user.email}')"]
             ) do
          {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
            data = Poison.decode!(body)["data"]

            with {:ok, _} <-
                   change(user, %{listmonk_id: hd(data["results"])["id"]})
                   |> Repo.update() do
              {:ok, hd(data["results"])}
            end

          _ ->
            :error
        end

      {:error, :not_configured} ->
        {:ok, nil}

      reason ->
        log(:error, [reason], body)
        {:error, :unknown}
    end
  end

  # User isn't an existing Listmonk subscriber, create one.
  def update_subscriber(%User{listmonk_id: nil} = user) do
    create_subscriber(user)
  end

  # User is an existing Listmonk subscriber, update their details.
  def update_subscriber(%User{listmonk_id: listmonk_id} = user) when is_integer(listmonk_id) do
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
          "preconfirm_subscriptions" => true,
          "lists" => get_subscriber_lists(user)
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

  def delete_subscriber(%User{listmonk_id: nil}) do
    {:ok, nil}
  end

  def delete_subscriber(%User{listmonk_id: listmonk_id} = user) when is_integer(listmonk_id) do
    case fetch(:delete, "subscribers/#{user.listmonk_id}") do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        {:ok, Poison.decode!(body)["data"]}

      _ ->
        :error
    end
  end

  def update_subscription(nil, _, _) do
    {:ok, nil}
  end

  def update_subscription(listmonk_id, action, list_id) when is_integer(listmonk_id) do
    body = %{
      "ids" => [listmonk_id],
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
