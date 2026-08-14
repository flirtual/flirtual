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
        raw_body = if(is_nil(body), do: "", else: Jason.encode!(body))
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

        Req.request(
          method: method,
          url: url,
          body: raw_body,
          headers: [
            {"content-type", "application/json"}
          ],
          auth: {:basic, username <> ":" <> password},
          decode_body: false,
          retry: false,
          finch: Flirtual.Finch
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

  def get_subscriber_by_email(email) when is_binary(email) do
    case fetch(:get, "subscribers", nil,
           query: [query: "lower(subscribers.email) = lower('#{escape_sql_literal(email)}')"]
         ) do
      {:ok, %Req.Response{status: 200, body: body}} ->
        {:ok, Jason.decode!(body)["data"]["results"] |> List.first()}

      reason ->
        log(:error, [:get_subscriber_by_email], reason)
        :error
    end
  end

  defp escape_sql_literal(value), do: String.replace(value, "'", "''")

  def create_subscriber(%User{} = user) do
    body = %{
      "email" => user.email,
      "name" => user.profile[:display_name] || "_",
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
      {:ok, %Req.Response{status: 200, body: body}} ->
        data = Jason.decode!(body)["data"]

        with {:ok, _} <-
               change(user, %{listmonk_id: data["id"]})
               |> Repo.update() do
          {:ok, data}
        end

      {:ok, %Req.Response{status: 409, body: "{\"message\":\"E-mail already exists.\"}\n"}} ->
        case get_subscriber_by_email(user.email) do
          {:ok, %{"id" => listmonk_id} = subscriber} ->
            with {:ok, _} <-
                   change(user, %{listmonk_id: listmonk_id})
                   |> Repo.update() do
              {:ok, subscriber}
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
    case fetch(:get, "subscribers/#{listmonk_id}") do
      {:ok, %Req.Response{status: 200, body: body}} ->
        put_subscriber(user, listmonk_id, Jason.decode!(body)["data"])

      # Repair stale id: adopt the id the address resolves to, or create a new
      # subscriber if it doesn't resolve.
      reason ->
        log(:warning, [:update_subscriber, listmonk_id], reason)

        case get_subscriber_by_email(user.email) do
          {:ok, %{"id" => listmonk_id} = subscriber} ->
            with {:ok, user} <-
                   change(user, %{listmonk_id: listmonk_id})
                   |> Repo.update() do
              put_subscriber(user, listmonk_id, subscriber)
            end

          {:ok, nil} ->
            create_subscriber(user)

          :error ->
            :error
        end
    end
  end

  defp put_subscriber(%User{} = user, listmonk_id, subscriber) do
    status =
      cond do
        subscriber["status"] == "blocklisted" -> "blocklisted"
        is_nil(user.email_confirmed_at) -> "disabled"
        true -> "enabled"
      end

    body = %{
      "email" => user.email,
      "name" => user.profile[:display_name] || "_",
      "status" => status,
      "preconfirm_subscriptions" => true,
      "lists" => get_subscriber_lists(user)
    }

    case fetch(:put, "subscribers/#{listmonk_id}", body) do
      {:ok, %Req.Response{status: 200, body: body}} ->
        {:ok, Jason.decode!(body)["data"]}

      reason ->
        log(:error, [:update_subscriber, listmonk_id], reason)
        :error
    end
  end

  def delete_subscriber(%User{listmonk_id: nil}) do
    {:ok, nil}
  end

  def delete_subscriber(%User{listmonk_id: listmonk_id} = user) when is_integer(listmonk_id) do
    case delete_subscriber_by_id(listmonk_id) do
      {:ok, subscriber} ->
        {:ok, subscriber}

      # Listmonk returns 400 when a subscriber isn't found. If the id is stale,
      # the address may still resolve to a different one. Delete it if so,
      # otherwise the subscriber has already been deleted.
      :error ->
        case get_subscriber_by_email(user.email) do
          {:ok, nil} -> {:ok, nil}
          {:ok, %{"id" => listmonk_id}} -> delete_subscriber_by_id(listmonk_id)
          :error -> :error
        end
    end
  end

  defp delete_subscriber_by_id(listmonk_id) when is_integer(listmonk_id) do
    case fetch(:delete, "subscribers/#{listmonk_id}") do
      {:ok, %Req.Response{status: 200, body: body}} ->
        {:ok, Jason.decode!(body)["data"]}

      reason ->
        log(:warning, [:delete_subscriber, listmonk_id], reason)
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
      {:ok, %Req.Response{status: 200, body: body}} ->
        {:ok, Jason.decode!(body)["data"]}

      _ ->
        :error
    end
  end
end
