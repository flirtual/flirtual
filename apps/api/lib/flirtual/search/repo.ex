defmodule Flirtual.Search.Repo do
  # Manticore uses the MySQL wire protocol but not full MySQL SQL. The Ecto repo
  # is used for a pooled connection but we run raw SphinxQL with `query_type: :text`.
  use Ecto.Repo,
    otp_app: :flirtual,
    adapter: Ecto.Adapters.MyXQL
end
