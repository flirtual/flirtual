defmodule FlirtualWeb.ErrorHelpers do
  import Phoenix.Controller
  import Plug.Conn

  def put_error(%Plug.Conn{} = conn, status) do
    conn
    |> put_status(status)
    |> json(new_error(Plug.Conn.Status.code(status) |> Plug.Conn.Status.reason_phrase()))
  end

  def put_error(%Plug.Conn{} = conn, status, message \\ nil, details \\ %{}) do
    message = message || Plug.Conn.Status.code(status) |> Plug.Conn.Status.reason_phrase()

    conn
    |> put_status(status)
    |> json(new_error(message, details))
  end

  def new_error(message, details \\ %{}) do
    %{ error: Map.merge(details, %{ message: message })}
  end

  def format_stack(stack) do
    Enum.map(stack, fn {module, function, arity, extra} ->
      String.replace(to_string(module), "Elixir.", "") <>
        "." <>
        to_string(function) <>
        if(is_list(arity),
          do: ("(" <> Enum.join(Enum.map(arity, &inspect(&1)), ", ") <> ")"),
          else: "/" <> to_string(arity)
        ) <>
        "\n  at " <>
        to_string(Keyword.get(extra, :file, "unknown")) <>
        ":" <> to_string(Keyword.get(extra, :line, "1"))
    end)
    |> Enum.join("\n")
  end

  def transform_changeset_errors(%Ecto.Changeset{} = changeset) do
    Ecto.Changeset.traverse_errors(changeset, &translate_error/1)
  end

  @doc """
  Translates an error message using gettext.
  """
  def translate_error({msg, opts}) do
    # When using gettext, we typically pass the strings we want
    # to translate as a static argument:
    #
    #     # Translate "is invalid" in the "errors" domain
    #     dgettext("errors", "is invalid")
    #
    #     # Translate the number of files with plural rules
    #     dngettext("errors", "1 file", "%{count} files", count)
    #
    # Because the error messages we show in our forms and APIs
    # are defined inside Ecto, we need to translate them dynamically.
    # This requires us to call the Gettext module passing our gettext
    # backend as first argument.
    #
    # Note we use the "errors" domain, which means translations
    # should be written to the errors.po file. The :count option is
    # set by Ecto and indicates we should also apply plural rules.
    if count = opts[:count] do
      Gettext.dngettext(FlirtualWeb.Gettext, "errors", msg, msg, count, opts)
    else
      Gettext.dgettext(FlirtualWeb.Gettext, "errors", msg, opts)
    end
  end
end
