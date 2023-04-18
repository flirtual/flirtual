defmodule FlirtualWeb.DebugController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller
  alias Flirtual.Crypto
  alias Flirtual.Policy
  import Ecto.Changeset
  import Flirtual.Utilities.Changeset

  action_fallback FlirtualWeb.FallbackController

  def input_changeset(conn, attrs) do
    changeset =
      cast_arbitrary(
        %{
          input: :string,
          output: :string,
          limit: :integer
        },
        attrs
      )

    try do
      input = Code.format_string!(get_change(changeset, :input) || "") |> to_string()

      limit =
        if(get_change(changeset, :limit) >= 100,
          do: :infinity,
          else: get_change(changeset, :limit)
        )

      output =
        Code.eval_string(input, binding(), file: "eval")
        |> elem(0)
        |> inspect(
          pretty: true,
          limit: limit,
          printable_limit: limit,
          syntax_colors: [
            string: :light_green,
            number: :light_yellow,
            boolean: :light_magenta,
            atom: :cyan,
            nil: :light_red
          ]
        )

      change(changeset, %{
        input: input,
        output: output,
        limit: limit
      })
    rescue
      error -> add_error(changeset, :input, error |> Exception.message() |> String.slice(0..128))
    end
  end

  def evaluate(conn, attrs) do
    with :ok <- Policy.can(conn, :arbitrary_code_execution, conn.assigns[:session].user),
         {:ok, attrs} <- input_changeset(conn, attrs) |> apply_action(:execute) do
      conn |> json(attrs)
    end
  end

  def error(conn, %{"cipher" => cipher}) do
    with :ok <- Policy.can(conn, :read_error_cipher, conn.assigns[:session].user),
         {:ok, reason} <- Crypto.decrypt(:error, cipher) do
      conn |> json(reason |> Map.from_struct())
    else
      {:error, :invalid} -> {:error, {400, "Unknown cipher"}}
      reason -> reason
    end
  end
end
