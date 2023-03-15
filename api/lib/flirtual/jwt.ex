defmodule Flirtual.Jwt do
  use Joken.Config

  import Ecto.Changeset
  import Joken.Config

  def config(audience, expire_in \\ 3600) do
    default_claims(default_exp: expire_in, iss: "flirtual", aud: audience)
  end

  defp generate_claims(config, claims \\ %{}) do
    config |> Joken.generate_claims(claims)
  end

  def sign_email_confirmation(user) do
    {:ok, claims} =
      generate_claims(config("confirm_email"), %{
        "sub" => user.id,
        "email" => user.email
      })

    generate_and_sign(claims)
  end

  def validate_jwt(changeset, field, token_config, validate_claims) do
    changeset = changeset |> validate_required(field)

    with {:ok, claims} <- Joken.verify_and_validate(token_config, get_field(changeset, field)),
         {:ok, value} <- validate_claims.(claims) do
      if is_nil(value) do
        changeset
      else
        change(changeset, Map.put(%{}, field, value))
      end
    else
      _ -> add_error(changeset, field, "is invalid")
    end
  end
end
