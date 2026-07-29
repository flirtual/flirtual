defmodule Flirtual.Stats do
  @bucket "stats"

  # Allowed filename characters.
  @name_pattern ~r/^[a-z0-9_]+$/

  def index do
    with {:ok, body} <- get_object("index.json") do
      Jason.decode(body)
    end
  end

  def series(name) do
    with {:ok, body} <- csv(name) do
      {:ok, parse_csv(body)}
    end
  end

  def csv(name) do
    with :ok <- validate_name(name) do
      get_object(name <> ".csv")
    end
  end

  defp validate_name(name) when is_binary(name) do
    if Regex.match?(@name_pattern, name),
      do: :ok,
      else: {:error, {:bad_request, :invalid_stat_name}}
  end

  defp validate_name(_), do: {:error, {:bad_request, :invalid_stat_name}}

  defp get_object(key) do
    if Application.get_env(:flirtual, :local_uploads?) do
      {:error, {:service_unavailable, :stats_unavailable}}
    else
      case ExAws.S3.get_object(@bucket, key) |> ExAws.request() do
        {:ok, %{body: body}} -> {:ok, body}
        {:error, {:http_error, 404, _}} -> {:error, {:not_found, :stat_not_found}}
        {:error, _} -> {:error, {:internal_server_error, :stats_unavailable}}
      end
    end
  end

  # A stat's value columns are named by its header: a plain series carries one,
  # a funnel carries a column per step, a distribution carries a column per
  # quartile. `date` and `cohort_date` stay strings so the frontend can pick
  # which one to plot against.
  @date_columns ["date", "cohort_date"]

  # Rows are positional rather than keyed by column name: the api client
  # camel-cases every json key it receives, which would rename `cohort_date` out
  # of step with the column names index.json refers to.
  defp parse_csv(body) do
    case String.split(body, ["\r\n", "\n"], trim: true) do
      [] ->
        %{columns: [], rows: []}

      [header | rows] ->
        columns = String.split(header, ",")
        %{columns: columns, rows: Enum.map(rows, &parse_row(&1, columns))}
    end
  end

  defp parse_row(line, columns) do
    line
    |> String.split(",")
    |> then(&Enum.zip(columns, &1))
    |> Enum.map(fn
      {column, value} when column in @date_columns -> value
      {_, value} -> parse_value(value)
    end)
  end

  defp parse_value(value) do
    case Float.parse(value) do
      {number, _} -> number
      :error -> nil
    end
  end
end
