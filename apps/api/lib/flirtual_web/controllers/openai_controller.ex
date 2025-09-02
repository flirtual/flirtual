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
        {:error, reason} ->
          conn
          |> put_error(:internal_server_error, :openai_failed, %{original_reason: reason})
          |> halt()
      end
    end
  end
end
