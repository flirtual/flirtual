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
end
