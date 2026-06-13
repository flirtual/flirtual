defmodule FlirtualWeb.OpenAIController do
  use FlirtualWeb, :controller

  alias Flirtual.OpenAI

  def translate(conn, %{"language" => language, "text" => text}) do
    user = conn.assigns[:session].user

    if :moderator not in user.tags do
      {:error, {:forbidden, :missing_permission}}
    else
      {:ok, text} = OpenAI.translate(language, text)

      conn
      |> put_status(:ok)
      |> json(%{text: text})
      |> halt()
    end
  end
end
