defmodule FlirtualWeb.ChargebeeController do
  use FlirtualWeb, :controller

  alias Flirtual.Chargebee

  def config(key) do
    Application.get_env(:flirtual, __MODULE__)[key]
  end

  def webhook(conn, params) do
    with true <-
           String.match?(conn.assigns[:authorization_token_type], ~r/basic/i) and
             conn.assigns[:authorization_token] == config(:signing_secret),
         :ok <- Chargebee.handle_event(params) do
      conn
      |> put_status(:ok)
      |> json(%{success: true})
      |> halt()
    else
      {:unhandled, reason} ->
        conn
        |> put_status(:accepted)
        |> json(%{
          success: true,
          message: reason
        })
        |> halt()

      _ ->
        conn
        |> put_status(:bad_request)
        |> json(%{success: false})
        |> halt()
    end
  end
end
