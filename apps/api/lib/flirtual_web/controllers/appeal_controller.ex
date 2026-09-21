defmodule FlirtualWeb.AppealController do
  use FlirtualWeb, :controller

  import Plug.Conn

  alias Flirtual.{Appeal, User}

  action_fallback(FlirtualWeb.FallbackController)

  @day 86_400_000

  def create(%{assigns: %{session: %{user: %User{} = user}}} = conn, params) do
    with {:ok, _} <- ExRated.check_rate("appeal:#{user.id}", @day, 5),
         {:ok, _} <- Appeal.create(user, params["message"]) do
      conn |> send_resp(:no_content, "")
    else
      {:error, count} when is_integer(count) ->
        {:error, {:too_many_requests, :appeal_rate_limit}}

      {:error, :not_banned} ->
        {:error, {:forbidden, :missing_permission}}

      {:error, reason} when is_atom(reason) ->
        {:error, {:bad_request, reason}}

      reason ->
        reason
    end
  end
end
