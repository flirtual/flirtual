defmodule Flirtual.HCaptcha do
  import Ecto.Changeset, only: [validate_change: 3, validate_required: 2]

  defp config(key) do
    Application.get_env(:flirtual, Flirtual.HCaptcha)[key]
  end

  def validate(""), do: %{"success" => false}
  def validate(nil), do: %{"success" => false}

  def validate(token) do
    with {:ok, response} <-
           HTTPoison.post(
             "https://hcaptcha.com/siteverify",
             URI.encode_query(%{
               response: token,
               secret: config(:access_token),
               sitekey: config(:app_id)
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

  def validate_captcha(changeset, field \\ :captcha) do
    changeset
    |> validate_required(field)
    |> validate_change(field, fn _, value ->
      case validate(value) do
        %{"success" => true} ->
          []

        %{"success" => false, "error-codes" => error_codes} ->
          IO

          if length(error_codes) === 0 do
            [{field, "is invalid"}]
          else
            Enum.map(error_codes, &{field, &1})
          end

        _ ->
          [{field, "is invalid"}]
      end
    end)
  end
end
