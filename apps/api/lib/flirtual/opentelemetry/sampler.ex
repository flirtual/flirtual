defmodule Flirtual.OpenTelemetry.Sampler do
  @moduledoc """
  OpenTelemetry sampler that drops client spans targeting Sentry's own ingest
  endpoint, then delegates every other decision to `Sentry.OpenTelemetry.Sampler`.
  """

  @behaviour :otel_sampler

  alias Sentry.OpenTelemetry.Sampler, as: SentrySampler

  @impl true
  def setup(config), do: {ingest_host(), SentrySampler.setup(config)}

  @impl true
  def description({_, config}), do: SentrySampler.description(config)

  # opentelemetry_finch puts the destination host in `net.peer.name`; repeating
  # `ingest_host` across the attributes and the setup tuple makes this an equality match.
  @impl true
  def should_sample(_, _, _, _, _, %{"net.peer.name": ingest_host}, {ingest_host, _})
      when is_binary(ingest_host),
      do: {:drop, [], []}

  def should_sample(ctx, trace_id, links, span_name, span_kind, attributes, {_, config}) do
    SentrySampler.should_sample(ctx, trace_id, links, span_name, span_kind, attributes, config)
  end

  defp ingest_host do
    case Application.get_env(:sentry, :dsn) do
      dsn when is_binary(dsn) -> URI.parse(dsn).host
      _ -> nil
    end
  end
end
