defmodule FlirtualWeb.ErrorView do
  use FlirtualWeb, :controller
  require Logger

  alias Plug.Conn
  alias FlirtualWeb.ErrorHelpers.Issue

  def render(_, %{status: 404}) do
    Issue.new(Conn.Status.reason_phrase(404))
  end

  def render(_, %{status: 400}) do
    Issue.new(Conn.Status.reason_phrase(400))
  end

  def render(_, %{reason: reason, status: status} = assigns) do
    message =
      Conn.Status.code(status)
      |> Conn.Status.reason_phrase()

    Issue.new(%{error: message, details: debug_details(reason, assigns)})
  end

  def render(_, %{status: status}) do
    message =
      Conn.Status.code(status)
      |> Conn.Status.reason_phrase()

    Issue.new(message)
  end

  defp debug_details(reason, assigns) do
    if Application.get_env(:flirtual, :expose_error_details?, false) do
      %{
        kind: assigns[:kind],
        exception: exception_name(reason),
        message: describe_reason(reason),
        stacktrace: format_stacktrace(assigns[:stack])
      }
    end
  end

  defp exception_name(%struct{}), do: inspect(struct)
  defp exception_name(_), do: nil

  defp describe_reason(reason) when is_exception(reason), do: Exception.message(reason)
  defp describe_reason(reason), do: inspect(reason)

  defp format_stacktrace(stack) when is_list(stack) do
    stack
    |> Exception.format_stacktrace()
    |> String.split("\n", trim: true)
  end

  defp format_stacktrace(_), do: nil
end
