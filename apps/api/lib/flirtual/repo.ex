defmodule Flirtual.Repo do
  use Ecto.Repo,
    otp_app: :flirtual,
    adapter: Ecto.Adapters.Postgres

  @doc """
  Name of the dedicated pool Oban uses for queries outside a transaction, so its
  volume doesn't contend with the pool serving web requests. Started in prod
  only; Oban keeps using the default pool inside app transactions.
  """
  def oban_repo, do: __MODULE__.Oban

  # use Paginator, include_total_count: true
end

# defimpl Jason.Encoder, for: Paginator.Page do
#   def encode(value, opts) do
#     value
#     |> Map.take([:entries, :metadata])
#     |> Jason.Encode.map(opts)
#   end
# end

# defimpl Jason.Encoder, for: Paginator.Page.Metadata do
#   def encode(value, opts) do
#     value
#     |> Map.take([
#       :after,
#       :before,
#       :limit,
#       :total_count,
#       :total_count_cap_exceeded
#     ])
#     |> Jason.Encode.map(opts)
#   end
# end
