defmodule Flirtual.Appeal do
  import Ecto.Query

  alias Flirtual.{Attribute, Freshdesk, ModerationEvent, ObanWorkers, Repo, User}

  @profile_field :cf_flirtual_profile
  @date_field :cf_ban_date
  @moderator_field :cf_moderator
  @reason_field :cf_ban_reason
  @details_field :cf_ban_details

  def appealed?(user_id) when is_binary(user_id),
    do: appealed?(user_id, ModerationEvent.active(user_id, :banned))

  def appealed?(_), do: false

  def appealed?(user_id, %ModerationEvent{created_at: banned_at}) when is_binary(user_id) do
    ModerationEvent
    |> where([event], event.user_id == ^user_id and event.type == :appealed)
    |> where([event], event.created_at > ^banned_at)
    |> Repo.exists?()
  end

  def appealed?(_, _), do: false

  def create(%User{banned_at: nil}, _), do: {:error, :not_banned}

  def create(%User{} = user, message) when is_binary(message) do
    cond do
      String.length(String.trim(message)) < 16 -> {:error, :message_too_short}
      String.length(message) > 10_000 -> {:error, :message_too_long}
      appealed?(user.id) -> {:error, :already_appealed}
      true -> deliver(user, String.trim(message))
    end
  end

  def create(_, _), do: {:error, :message_required}

  defp deliver(%User{} = user, message) do
    ban = ModerationEvent.active(user.id, :banned)

    with {:ok, event} <-
           ModerationEvent.create(:appealed, %{
             user: user,
             message: message,
             details: %{ban_id: ban && ban.id}
           }),
         {:ok, _} <-
           %{"ticket" => ticket(user, ban, message)}
           |> ObanWorkers.Freshdesk.new()
           |> Oban.insert() do
      {:ok, event}
    end
  end

  defp ticket(%User{} = user, ban, message) do
    name = User.display_name(user)

    Freshdesk.ticket(%{
      subject: "Flirtual ban appeal - #{name}",
      body: message,
      name: name,
      email: user.email,
      group_id: Freshdesk.config(:moderation_group_id),
      custom_fields: %{
        @profile_field => User.url(user, :id) |> URI.to_string(),
        @date_field => ban && DateTime.to_date(ban.created_at) |> Date.to_iso8601(),
        @moderator_field => moderator_name(ban),
        @reason_field => ban && Map.get(Attribute.ban_reasons(), ban.reason_id),
        @details_field => ban && ban.message
      }
    })
  end

  defp moderator_name(%ModerationEvent{moderator_id: moderator_id})
       when is_binary(moderator_id) do
    case Repo.get(User, moderator_id) |> Repo.preload(:profile) do
      %User{} = moderator -> User.display_name(moderator)
      _ -> nil
    end
  end

  defp moderator_name(%ModerationEvent{automatic: true}), do: "Automatic"
  defp moderator_name(_), do: nil
end
