defmodule FlirtualWeb.ErrorHelpers do
  import Phoenix.Controller
  import Plug.Conn

  alias Plug.Conn.Status

  defmodule Issue do
    @derive Jason.Encoder
    defstruct [:error, :details]

    def normalize_error(value) when is_atom(value), do: normalize_error(to_string(value))

    def normalize_error(value) when is_binary(value) do
      value
      |> String.replace(~r/(?<=[a-z])([A-Z])/, "_\\1")
      |> String.replace(~r/[\s-]+/, "_")
      |> String.replace("'", "")
      |> String.replace("\"", "")
      |> String.trim("_")
      |> String.downcase()
    end

    def new(message) when is_binary(message) or is_atom(message) do
      new(%{error: message})
    end

    def new(attrs) do
      %Issue{
        error: normalize_error(attrs.error),
        details: attrs[:details]
      }
    end
  end

  def normalize_changeset_error(value) when is_atom(value) do
    value
  end

  def normalize_changeset_error(value) when is_binary(value) do
    String.replace(value, ~r/%{(.+)}/, "{\\1}")
  end

  def put_error(%Plug.Conn{} = conn, status) do
    status_code = Status.code(status)

    conn
    |> put_status(status_code)
    |> json(Issue.new(Status.reason_phrase(status_code)))
  end

  def put_error(%Plug.Conn{} = conn, status, message, details \\ %{}) do
    status_code = Status.code(status)
    message = message || status_code |> Status.reason_phrase()

    {conn, details} = maybe_put_headers(conn, details)

    conn
    |> put_status(status_code)
    |> json(Issue.new(%{error: message, details: details}))
  end

  defp maybe_put_headers(conn, %{headers: headers} = details) do
    {
      Enum.reduce(headers, conn, fn {key, value}, conn ->
        put_resp_header(conn, key, value |> to_string())
      end),
      Map.delete(details, :headers)
    }
  end

  defp maybe_put_headers(conn, details), do: {conn, details}

  def transform_changeset_errors(%Ecto.Changeset{} = changeset) do
    changeset
    |> Ecto.Changeset.traverse_errors(fn {msg, opts} ->
      Issue.new(%{
        error: normalize_changeset_error(msg),
        details: opts |> Enum.into(%{}) |> describe_type() |> encodable()
      })
    end)
  end

  defp describe_type(%{type: {:parameterized, {Ecto.Enum, %{mappings: mappings}}}} = opts) do
    opts
    |> Map.put(:type, :enum)
    |> Map.put(:values, Keyword.keys(mappings))
  end

  defp describe_type(
         %{type: {:array, {:parameterized, {Ecto.Enum, %{mappings: mappings}}}}} = opts
       ) do
    opts
    |> Map.put(:type, :array)
    |> Map.put(:array_type, :enum)
    |> Map.put(:values, Keyword.keys(mappings))
  end

  defp describe_type(%{type: {:array, array_type}} = opts) do
    opts
    |> Map.put(:type, :array)
    |> Map.put(:array_type, array_type)
  end

  defp describe_type(opts), do: opts

  # Error options carry arbitrary Ecto terms, and an unencodable one raises
  # mid-response, turning the validation error into a 500.
  defp encodable(value) when is_list(value), do: Enum.map(value, &encodable/1)

  defp encodable(value) when is_map(value) and not is_struct(value),
    do: Map.new(value, fn {key, value} -> {key, encodable(value)} end)

  defp encodable(value) do
    if Jason.Encoder.impl_for(value) in [nil, Jason.Encoder.Any],
      do: inspect(value),
      else: value
  end
end
