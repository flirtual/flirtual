defmodule Flirtual.DatabaseSeeder do
  @moduledoc """
  Seeds the database,
  """

  alias Ecto.Adapters.SQL

  def seed_all() do
    seed_by_file!(:attributes)
  end

  defp query_all!(queries) when is_list(queries) do
    Enum.map(queries, fn query -> SQL.query!(Flirtual.Repo, query) end)
  end

  defp seed_by_value!(value) do
    value
    |> String.split(";\n")
    |> query_all!()
  end

  def seed_by_file!(name) when is_atom(name) do
    File.read!("./priv/repo/exports/#{name}.sql")
    |> seed_by_value!()
  end
end

Flirtual.DatabaseSeeder.seed_all()
