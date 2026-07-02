defmodule Flirtual.LLM do
  defp model, do: Application.get_env(:flirtual, Flirtual.LLM)[:model]

  def translate(language, text) do
    context =
      ReqLLM.Context.new([
        ReqLLM.Context.system(
          "Translate the following text to #{language}. Respond only with the translation verbatim."
        ),
        ReqLLM.Context.user(text)
      ])

    case ReqLLM.generate_text(model(), context, max_tokens: 8192) do
      {:ok, response} -> {:ok, ReqLLM.Response.text(response)}
      {:error, reason} -> {:error, reason}
    end
  end
end
