defmodule FlirtualWeb.ErrorHelpers do
  import Phoenix.Controller
  import Plug.Conn

  alias Plug.Conn.Status

  def put_error(%Plug.Conn{} = conn, status) do
    status_code = Status.code(status)
    message = status_code |> Status.reason_phrase()

    if status_code > 499, do: Sentry.capture_message(message)

    conn
    |> put_status(status_code)
    |> json(new_error(message))
  end

  def put_error(%Plug.Conn{} = conn, status, message \\ nil, details \\ %{}) do
    status_code = Status.code(status)
    message = message || status_code |> Status.reason_phrase()

    if status_code > 499, do: Sentry.capture_message(message)

    conn
    |> put_status(status)
    |> json(new_error(message, details))
  end

  def new_error(message, details \\ %{}) do
    %{error: Map.merge(details, %{message: message})}
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
