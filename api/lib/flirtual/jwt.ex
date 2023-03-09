defmodule Flirtual.Jwt do
  use Joken.Config

  import Joken.Config

  defp config(audience, expire_in \\ 3600) do
    default_claims(default_exp: expire_in, iss: "flirtual", aud: "flirtual/" <> audience)
  end

  defp generate_claims(config, claims \\ %{}) do
    config |> Joken.generate_claims(claims)
  end

  def sign_email_confirmation(user) do
    {:ok, claims} =
      generate_claims(config("confirm-email"), %{
        "sub" => user.id,
        "email" => user.email
      })

    generate_and_sign(claims)
  end

  def validate_email_confirmation(token) do
    config("confirm-email") |> Joken.verify_and_validate(token)
  end
end
