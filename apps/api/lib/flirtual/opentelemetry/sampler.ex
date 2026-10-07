defmodule Flirtual.OpenTelemetry.Sampler do
  @moduledoc """
  OpenTelemetry sampler that drops client spans targeting Sentry's own ingest
  endpoint, inherits an incoming trace's sampling decision, then delegates every other
  decision to `Sentry.OpenTelemetry.Sampler`.
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

  # Sentry's propagator continues an incoming trace without its sampling decision, so
  # `SentrySampler` re-rolls every request. Inherit the caller's decision from baggage,
  # which only carries `sentry-sampled` once the caller has decided.
  def should_sample(ctx, trace_id, links, span_name, span_kind, attributes, {_, config}) do
    case incoming_sampled(ctx) do
      nil ->
        SentrySampler.should_sample(
          ctx,
          trace_id,
          links,
          span_name,
          span_kind,
          attributes,
          config
        )

      sampled ->
        decision = if sampled, do: :record_and_sample, else: :drop
        {decision, [], [{"sentry-sampled", to_string(sampled)}]}
    end
  end

  defp incoming_sampled(ctx) do
    with baggage when is_binary(baggage) <- :otel_ctx.get_value(ctx, :"sentry-baggage", nil),
         [_, sampled] <- Regex.run(~r/(?:^|,)\s*sentry-sampled=(true|false)\b/, baggage) do
      sampled == "true"
    else
      _ -> nil
    end
  end

  defp ingest_host do
    case Application.get_env(:sentry, :dsn) do
      dsn when is_binary(dsn) -> URI.parse(dsn).host
      _ -> nil
    end
  end
end
