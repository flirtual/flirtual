defmodule FlirtualWeb.AgeVerificationController do
  use FlirtualWeb, :controller
  use Flirtual.Logger, :age_verification

  import Plug.Conn
  import Phoenix.Controller
  import FlirtualWeb.Utilities

  alias Flirtual.{AgeVerification, Repo, User, Yoti}
  alias FlirtualWeb.CacheBodyReader

  action_fallback(FlirtualWeb.FallbackController)

  @fifteen_minutes 900_000

  def get(%{assigns: %{session: %{user: %User{} = user}}} = conn, _) do
    {user, verification} =
      case AgeVerification.latest(user) do
        %AgeVerification{status: status} = verification when status in [:pending, :in_progress] ->
          case AgeVerification.refresh(verification) do
            {:ok, verification} -> {Repo.get(User, user.id) || user, verification}
            _ -> {user, verification}
          end

        verification ->
          {user, verification}
      end

    conn
    |> json(%{
      required: AgeVerification.required?(user),
      threshold: AgeVerification.threshold(),
      verification: verification
    })
  end

  def create(%{assigns: %{session: %{user: %User{} = user}}} = conn, params) do
    with {:ok, _} <-
           ExRated.check_rate("age_verification:#{user.id}", @fifteen_minutes, 5),
         {:ok, verification, url} <-
           AgeVerification.create_session(user,
             locale: params["locale"],
             region: get_conn_region(conn),
             methods: methods(params["methods"])
           ) do
      conn
      |> put_status(:created)
      |> json(%{
        url: url,
        verification: verification
      })
    else
      {:error, count} when is_integer(count) ->
        {:error, {:too_many_requests, :age_verification_rate_limit}}

      {:error, :yoti_not_configured} ->
        {:error, {:service_unavailable, :yoti_not_configured}}

      {:error, :age_verification_not_required} ->
        {:error, {:forbidden, :missing_permission}}

      {:error, reason} when is_atom(reason) ->
        {:error, {:bad_gateway, reason}}

      reason ->
        reason
    end
  end

  defp methods("alternative"), do: :alternative
  defp methods(_), do: :recommended

  def notification(conn, params) do
    with true <- verified_notification?(conn, params),
         %AgeVerification{} = verification <- find_verification(params),
         {:ok, _} <- AgeVerification.refresh(verification) do
      conn |> send_resp(:no_content, "")
    else
      false ->
        {:error, {:unauthorized, :invalid_signature}}

      nil ->
        conn |> send_resp(:no_content, "")

      reason ->
        log(:error, ["notification"], reason)
        {:error, {:bad_gateway, :yoti_unavailable}}
    end
  end

  defp find_verification(params) do
    with nil <- params["session_key"] && AgeVerification.get_by_session_id(params["session_key"]) do
      params["reference_id"] && AgeVerification.get(params["reference_id"])
    end
  end

  defp verified_notification?(conn, params) do
    with signature when is_binary(signature) <- params["signature"],
         body when is_binary(body) <- CacheBodyReader.raw_body(conn),
         {:ok, payload} <- signed_payload(body) do
      Yoti.verify_notification(payload, signature)
    else
      _ -> false
    end
  end

  defp signed_payload(body) do
    with {:ok, %Jason.OrderedObject{values: values}} <-
           Jason.decode(body, objects: :ordered_objects),
         {:ok, payload} <-
           values
           |> Enum.reject(fn {key, _} -> key in ["sequence_number", "signature"] end)
           |> Jason.OrderedObject.new()
           |> Jason.encode() do
      {:ok, String.replace(payload, ~r/\s/, "")}
    end
  end
end
