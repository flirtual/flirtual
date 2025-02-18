defmodule FlirtualWeb.OpenAIController do
  use FlirtualWeb, :controller

  alias Flirtual.OpenAI

  def translate(conn, %{"language" => language, "text" => text}) do
    user = conn.assigns[:session].user

    if :moderator not in user.tags do
      {:error, {:forbidden, :missing_permission}}
    else
      with {:ok, text} <- OpenAI.translate(language, text) do
        conn
        |> put_status(:ok)
        |> json(%{text: text})
        |> halt()
      else
        _ -> conn
          |> put_status(:bad_request)
          |> json(%{error: :bad_request})
          |> halt()
      end
    end
  end
end
