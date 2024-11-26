defmodule Flirtual.Turnstile do
  import Ecto.Changeset, only: [validate_change: 3, validate_required: 2]

  defp config(key) do
    Application.get_env(:flirtual, Flirtual.Turnstile)[key]
  end

  def validate(""), do: %{"success" => false}
  def validate(nil), do: %{"success" => false}

  def validate(token) do
    with {:ok, response} <-
           HTTPoison.post(
             "https://challenges.cloudflare.com/turnstile/v0/siteverify",
             URI.encode_query(%{
               secret: config(:access_token),
               response: token
             }),
             [
               {"content-type", "application/x-www-form-urlencoded"}
             ]
           ),
         {:ok, body} <- Poison.decode(response.body) do
      body
    else
      _ ->
        :error
    end
  end

  def valid?(token) do
    case validate(token) do
      %{"success" => true} -> true
      _ -> false
    end
  end

  defp format_error_code("missing-input-secret"), do: "not_configured"
  defp format_error_code("invalid-input-secret"), do: "not_configured"
  defp format_error_code("invalid-input-response"), do: "turnstile_invalid"
  defp format_error_code("timeout-or-duplicate"), do: "turnstile_expired"
  defp format_error_code("internal-error"), do: "internal_server_error"
  defp format_error_code(value), do: value

  def validate_captcha(changeset, field \\ :captcha) do
    changeset
    |> validate_required(field)
    |> validate_change(field, fn _, value ->
      case validate(value) do
        %{"success" => true} ->
          []

        %{"success" => false, "error-codes" => error_codes} ->
          if Enum.empty?(error_codes) do
            [{field, "is invalid"}]
          else
            Enum.map(error_codes, &{field, {format_error_code(&1), raw: &1}})
          end

        _ ->
          [{field, "is invalid"}]
      end
    end)
  end
end
