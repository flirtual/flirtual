defmodule Flirtual.Repo.Local do
  use Ecto.Repo,
    otp_app: :flirtual,
    adapter: Ecto.Adapters.Postgres

  # use Paginator, include_total_count: true

  @env Mix.env()

  def init(_type, config) do
    Fly.Postgres.config_repo_url(config, @env)
  end
end

defmodule Flirtual.Repo do
  use Fly.Repo, local_repo: Flirtual.Repo.Local
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
