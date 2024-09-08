defmodule FlirtualWeb.ErrorHelpers do
  import Phoenix.Controller
  import Plug.Conn

  alias Plug.Conn.Status

  defmodule Issue do
    @derive Jason.Encoder
    defstruct [:error, :details]

    def to_snake_case(value) when is_atom(value), do: to_snake_case(to_string(value))

    def to_snake_case(value) when is_binary(value) do
      value
      |> String.replace(~r/([A-Z])/, "_\\1")
      |> String.replace(~r/[\s-]+/, "_")
      |> String.trim("_")
      |> String.downcase()
    end

    def new(message) when is_binary(message) do
      new(%{error: message})
    end

    def new(attrs) when is_map(attrs) do
      %Issue{
        error: to_snake_case(attrs.error),
        details: attrs.details
      }
      |> IO.inspect()
    end
  end

  def put_error(%Plug.Conn{} = conn, status) do
    status_code = Status.code(status)
    message = status_code |> Status.reason_phrase()

    if status_code > 499, do: Sentry.capture_message(message)

    conn
    |> put_status(status_code)
    |> json(Issue.new(message))
  end

  def put_error(%Plug.Conn{} = conn, status, message \\ nil, details \\ %{}) do
    status_code = Status.code(status)
    message = message || status_code |> Status.reason_phrase()

    if status_code > 499, do: Sentry.capture_message(message)

    conn
    |> put_status(status_code)
    |> json(Issue.new(%{error: message, details: details}))
  end

  def transform_changeset_errors(%Ecto.Changeset{} = changeset) do
    changeset
    |> Ecto.Changeset.traverse_errors(fn {msg, opts} ->
      opts = Enum.into(opts, %{})

      Issue.new(%{
        error: msg |> String.replace(~r/%{(.+)}/, "{\\1}"),
        details:
          case opts do
            %{type: {:parameterized, Ecto.Enum, %{mappings: mappings}}} = opts ->
              opts
              |> Map.put(:type, :enum)
              |> Map.put(:values, Enum.into(mappings, [], fn {k, _} -> k end))

            opts ->
              opts
          end
      })
    end)
  end
end
