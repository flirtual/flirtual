defmodule Flirtual.AgeVerification do
  use Flirtual.Schema
  use Flirtual.Logger, :age_verification

  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.{AgeVerification, Attribute, ModerationEvent, Repo, User, Users, Yoti}

  @threshold 18

  @electronic_id_sub_methods %{"SE" => "SWEDISH_BANK_ID", "FI" => "FTN", "DK" => "MIT_ID"}

  @providers [:yoti, :apple, :android]
  @statuses [
    :pending,
    :in_progress,
    :complete,
    :fail,
    :error,
    :cancelled,
    :expired,
    :unknown
  ]

  schema "age_verifications" do
    belongs_to(:user, User)

    field(:provider, Ecto.Enum, values: @providers)
    field(:status, Ecto.Enum, values: @statuses)

    field(:session_id, :string)
    field(:method, :string)
    field(:threshold, :integer)
    field(:age, :integer)
    field(:age_lower, :integer)
    field(:age_upper, :integer)
    field(:declaration, :string)
    field(:region, :string)
    field(:evidence_id, :string)
    field(:error_code, :string)

    field(:expires_at, :utc_datetime)
    field(:completed_at, :utc_datetime)

    timestamps()
  end

  def threshold, do: @threshold

  def get(id) when is_binary(id) do
    case Ecto.ShortUUID.cast(id) do
      {:ok, id} -> AgeVerification |> where(id: ^id) |> Repo.one()
      _ -> nil
    end
  end

  def get_by_session_id(session_id) when is_binary(session_id),
    do: AgeVerification |> where(session_id: ^session_id) |> Repo.one()

  def latest(%User{id: user_id}) do
    AgeVerification
    |> where(user_id: ^user_id, provider: :yoti)
    |> order_by([verification], desc: verification.created_at)
    |> limit(1)
    |> Repo.one()
  end

  def record_age_range(%User{} = user, attrs) do
    platform =
      case attrs[:platform] do
        "apple" -> :apple
        "android" -> :android
        _ -> nil
      end

    if is_nil(platform) do
      {:error, :unknown_platform}
    else
      %AgeVerification{}
      |> change(%{
        user_id: user.id,
        provider: platform,
        status: age_range_status(attrs[:age_lower], attrs[:age_upper]),
        threshold: @threshold,
        age_lower: attrs[:age_lower],
        age_upper: attrs[:age_upper],
        declaration: attrs[:declaration],
        region: attrs[:region],
        completed_at: now()
      })
      |> Repo.insert()
    end
  end

  defp age_range_status(age_lower, age_upper) do
    cond do
      is_integer(age_upper) and age_upper < @threshold -> :fail
      is_integer(age_lower) and age_lower >= @threshold -> :complete
      true -> :unknown
    end
  end

  def passed?(user_id) when is_binary(user_id) do
    AgeVerification
    |> where(user_id: ^user_id, provider: :yoti, status: :complete)
    |> Repo.exists?()
  end

  def required?(%User{} = user), do: User.banned_underage?(user) and not passed?(user.id)

  def required?(_), do: false

  def required?(%ModerationEvent{reason_id: reason_id}, user_id) when is_binary(user_id),
    do: reason_id === Attribute.underage_ban_reason_id() and not passed?(user_id)

  def required?(_, _), do: false

  def create_session(%User{} = user, options \\ []) do
    cond do
      not Yoti.configured?() -> {:error, :yoti_not_configured}
      not required?(user) -> {:error, :age_verification_not_required}
      true -> open_session(user, options)
    end
  end

  defp open_session(%User{} = user, options) do
    with {:ok, verification} <-
           %AgeVerification{}
           |> change(%{
             user_id: user.id,
             provider: :yoti,
             status: :pending,
             threshold: @threshold
           })
           |> Repo.insert() do
      body =
        session_body(
          verification,
          options[:region],
          options[:methods] || :recommended
        )

      case Yoti.create_session(body) do
        {:ok, %{id: session_id, expires_at: expires_at}} ->
          with {:ok, verification} <-
                 verification
                 |> change(%{
                   session_id: session_id,
                   expires_at: parse_datetime(expires_at)
                 })
                 |> Repo.update() do
            {:ok, verification, Yoti.user_view_url(session_id, options[:locale])}
          end

        {:error, reason} ->
          verification |> change(%{status: :error}) |> Repo.update()
          {:error, reason}
      end
    end
  end

  defp session_body(%AgeVerification{} = verification, region, :recommended) do
    verification
    |> base_body()
    |> Map.put(:doc_scan, %{
      allowed: true,
      threshold: @threshold,
      authenticity: "AUTO",
      level: "ACTIVE",
      retry_limit: 3
    })
    |> put_electronic_id(@electronic_id_sub_methods |> Map.get(country(region)) |> List.wrap())
    |> put_la_wallet(region)
  end

  defp session_body(%AgeVerification{} = verification, _, :alternative) do
    verification
    |> base_body()
    |> Map.merge(%{
      digital_id: %{
        allowed: true,
        threshold: @threshold,
        age_estimation_allowed: false,
        retry_limit: 3
      },
      double_blind: true,
      la_wallet: %{
        allowed: true,
        threshold: @threshold
      },
      yoti_key: %{
        allowed: true,
        authentication: true
      }
    })
    |> put_electronic_id(Map.values(@electronic_id_sub_methods))
  end

  defp base_body(%AgeVerification{} = verification) do
    %{
      type: "OVER",
      ttl: 900,
      reference_id: verification.id,
      callback: %{
        auto: false,
        url: frontend_url("/verify-age")
      },
      cancel_url: frontend_url("/verify-age"),
      notification_url: notification_url(),
      retry_enabled: true,
      resume_enabled: true,
      synchronous_checks: true
    }
  end

  defp put_electronic_id(body, []), do: body

  defp put_electronic_id(body, sub_methods),
    do:
      Map.put(body, :electronic_id, %{
        allowed: true,
        threshold: @threshold,
        sub_methods: sub_methods
      })

  defp put_la_wallet(body, "Louisiana, US"),
    do: Map.put(body, :la_wallet, %{allowed: true, threshold: @threshold})

  defp put_la_wallet(body, _), do: body

  defp country(region) when is_binary(region),
    do: region |> String.split(", ") |> List.last()

  defp country(_), do: nil

  defp frontend_url(pathname),
    do:
      Application.fetch_env!(:flirtual, :frontend_origin)
      |> URI.merge(pathname)
      |> URI.to_string()

  defp notification_url,
    do:
      Application.fetch_env!(:flirtual, :origin)
      |> URI.merge("/v1/age-verification/notification")
      |> URI.to_string()

  def refresh(%AgeVerification{provider: :yoti, session_id: session_id} = verification)
      when is_binary(session_id) do
    with {:ok, result} <- Yoti.get_session_result(session_id) do
      apply_result(verification, result)
    end
  end

  def refresh(%AgeVerification{} = verification), do: {:ok, verification}

  defp apply_result(%AgeVerification{} = verification, result) do
    status = normalize_status(result["status"])

    attrs =
      %{
        status: status,
        method: result["method"],
        age_lower: if(status === :complete, do: result["age"]),
        evidence_id: result["evidence_id"],
        expires_at: parse_datetime(result["expires_at"]),
        completed_at: if(status in [:complete, :fail], do: now(), else: nil)
      }
      |> put_error_code(verification, status)

    with {:ok, verification} <-
           verification
           |> change(attrs)
           |> Repo.update() do
      if status === :complete and threshold_met?(result) do
        case Users.unban_age_verified(verification.user_id, verification) do
          {:ok, _} -> :ok
          reason -> log(:error, ["unban", verification.id], reason)
        end
      end

      {:ok, verification}
    end
  end

  defp threshold_met?(%{"type" => "OVER"} = result) do
    case result["age"] do
      threshold when is_integer(threshold) -> threshold >= @threshold
      _ -> true
    end
  end

  defp threshold_met?(_), do: false

  defp put_error_code(attrs, %AgeVerification{session_id: session_id}, status)
       when status in [:error, :fail] and is_binary(session_id) do
    case Yoti.get_session_report(session_id) do
      {:ok, %{"error_code" => error_code}} when is_binary(error_code) and error_code !== "" ->
        Map.put(attrs, :error_code, error_code)

      _ ->
        attrs
    end
  end

  defp put_error_code(attrs, _, _), do: attrs

  @yoti_statuses %{
    "pending" => :pending,
    "in_progress" => :in_progress,
    "complete" => :complete,
    "fail" => :fail,
    "error" => :error,
    "cancelled" => :cancelled,
    "canceled" => :cancelled,
    "expired" => :expired
  }

  defp normalize_status(status) when is_binary(status),
    do: Map.get(@yoti_statuses, String.downcase(status), :unknown)

  defp normalize_status(_), do: :unknown

  defp parse_datetime(value) when is_binary(value) do
    case DateTime.from_iso8601(value) do
      {:ok, value, _} -> DateTime.truncate(value, :second)
      _ -> nil
    end
  end

  defp parse_datetime(_), do: nil

  defp now, do: DateTime.utc_now() |> DateTime.truncate(:second)
end

defimpl Jason.Encoder, for: Flirtual.AgeVerification do
  use Flirtual.Encoder,
    only: [
      :id,
      :provider,
      :status,
      :method,
      :threshold,
      :expires_at,
      :completed_at,
      :created_at
    ]
end
