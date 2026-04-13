defmodule FlirtualWeb.RevenueCatController do
  use FlirtualWeb, :controller

  alias Flirtual.ObanWorkers.RevenueCatEvent
  alias Flirtual.RevenueCat

  def config(key) do
    Application.get_env(:flirtual, __MODULE__)[key]
  end

  def webhook(conn, params) do
    if authorized?(conn) do
      handle(conn, params, RevenueCat.handle_event(params))
    else
      conn
      |> put_status(:bad_request)
      |> json(%{success: false})
      |> halt()
    end
  end

  defp authorized?(conn) do
    String.match?(conn.assigns[:authorization_token_type] || "", ~r/bearer/i) and
      Plug.Crypto.secure_compare(
        conn.assigns[:authorization_token] || "",
        config(:signing_secret)
      )
  end

  defp handle(conn, _params, :ok) do
    conn
    |> put_status(:ok)
    |> json(%{success: true})
    |> halt()
  end

  defp handle(conn, _params, {:unhandled, reason}) do
    conn
    |> put_status(:accepted)
    |> json(%{success: true, message: reason})
    |> halt()
  end

  defp handle(conn, params, {:retry, reason}) do
    {:ok, _job} = params |> RevenueCatEvent.new() |> Oban.insert()

    conn
    |> put_status(:accepted)
    |> json(%{success: true, message: "queued: #{reason}"})
    |> halt()
  end

  defp handle(conn, _params, _) do
    conn
    |> put_status(:bad_request)
    |> json(%{success: false})
    |> halt()
  end
end
