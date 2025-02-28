defmodule Flirtual.OpenAI do
  def translate(language, text) do
    case OpenAI.chat_completion(
           model: "gpt-4o",
           messages: [
             %{
               role: "developer",
               content:
                 "Translate the following text to #{language}. Respond only with the translation verbatim."
             },
             %{role: "user", content: text}
           ]
         ) do
      {:ok, %{:choices => choices}} ->
        {:ok, Enum.at(choices, 0)["message"]["content"]}

      {:error, _} ->
        {:error, :failed}
    end
  end
end
