defmodule Flirtual.Jwt do
  use Joken.Config

  import Ecto.Changeset
  import Joken.Config

  def config(audience, expire_in \\ 3600) do
    default_claims(
      default_exp: expire_in,
      iss: "flirtual",
      aud: audience,
      skip: [:iat, :nbf, :jti]
    )
  end

  defp generate_claims(config, claims \\ %{}) do
    config |> Joken.generate_claims(claims)
  end

  def sign(config, claims) do
    with {:ok, claims} <- generate_claims(config, claims),
         {:ok, token, _} <- generate_and_sign(claims) do
      {:ok, token}
    end
  end

  def sign(config, claims, key, algorithm) do
    with {:ok, claims} <- generate_claims(config, claims),
         signer <- Joken.Signer.create(algorithm, key),
         {:ok, token, _} <- Joken.generate_and_sign(config, claims, signer) do
      {:ok, token}
    end
  end

  def validate_jwt(changeset, field, token_config, validate_claims) do
    with true <- changeset.valid?,
         {:ok, claims} <- Joken.verify_and_validate(token_config, get_field(changeset, field)),
         {:ok, value} <- validate_claims.(claims) do
      case value do
        nil -> changeset
        {k, v} -> put_change(changeset, k, v)
      end
    else
      false -> changeset
      _ -> add_error(changeset, field, "is invalid")
    end
  end
end
