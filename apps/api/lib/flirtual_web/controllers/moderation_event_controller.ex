defmodule FlirtualWeb.ModerationEventController do
  use FlirtualWeb, :controller

  import FlirtualWeb.Utilities

  alias Flirtual.{ModerationEvent, Policy}

  action_fallback(FlirtualWeb.FallbackController)

  def list(conn, params) do
    user = conn.assigns[:session].user

    with :ok <- Policy.can(conn, :read_moderation_events, user),
         {:ok, events} <-
           params
           |> split_list_params(["types", "reason_ids", "excluded_duplicate_types"])
           |> ModerationEvent.search(ModerationEvent.visible_types(user)) do
      conn
      |> json_with_etag(events |> ModerationEvent.with_related() |> ModerationEvent.anonymize())
    end
  end

  def review(conn, %{"event_id" => event_id}) do
    user = conn.assigns[:session].user

    with :ok <- Policy.can(conn, :review_moderation_events, user),
         %ModerationEvent{} = event <- ModerationEvent.get(event_id),
         true <- event.type in ModerationEvent.visible_types(user),
         {:ok, event} <- ModerationEvent.review(event, user) do
      conn |> json(event |> List.wrap() |> ModerationEvent.with_related() |> hd())
    else
      value when value in [nil, false] ->
        {:error, {:not_found, :moderation_event_not_found}}

      value ->
        value
    end
  end
end
