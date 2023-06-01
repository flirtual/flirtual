defmodule Flirtual.Repo do
  use Ecto.Repo,
    otp_app: :flirtual,
    adapter: Ecto.Adapters.Postgres
end
