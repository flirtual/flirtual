defmodule FlirtualWeb.PasskeyController do
  use FlirtualWeb, :controller

  alias Ecto.UUID
  alias Flirtual.User
  alias Flirtual.User.{Login, Passkey}
  alias FlirtualWeb.SessionController

  action_fallback(FlirtualWeb.FallbackController)

  defp get_aaguid(attestation_object) do
    with {:ok, decoded_attestation_object, _remainder} <- CBOR.decode(attestation_object),
         {:ok, %CBOR.Tag{tag: :bytes, value: auth_data}} <-
           Map.fetch(decoded_attestation_object, "authData") do
      aaguid_binary = binary_part(auth_data, 37, 16)

      case UUID.load(aaguid_binary) do
        {:ok, aaguid} ->
          aaguid

        _ ->
          <<0::128>>
      end
    else
      _ -> <<0::128>>
    end
  end

  def get_registration_challenge(conn, params) do
    user = conn.assigns[:session].user
    challenge = Wax.new_registration_challenge()

    exclude_credentials =
      Enum.map(user.passkeys, fn passkey ->
        %{id: Base.encode64(passkey.credential_id), type: "public-key"}
      end)

    conn
    |> put_session(:challenge, challenge)
    |> json(%{
      publicKey: %{
        challenge: Base.encode64(challenge.bytes),
        rp: %{
          name: "Flirtual",
          id: challenge.rp_id
        },
        user: %{
          id: Base.encode64(user.id),
          name: user.email,
          displayName: User.display_name(user)
        },
        pubKeyCredParams: [
          %{alg: -7, type: "public-key"},
          %{alg: -257, type: "public-key"}
        ],
        excludeCredentials: exclude_credentials,
        authenticatorSelection:
          if(params["platform"] == "true",
            do: %{
              requireResidentKey: true,
              userVerification: "preferred",
              authenticatorAttachment: "platform"
            },
            else: %{
              requireResidentKey: false,
              userVerification: "preferred"
            }
          )
      }
    })
  end

  def get_authentication_challenge(conn, _) do
    challenge = Wax.new_authentication_challenge()

    conn
    |> put_session(:authentication_challenge, challenge)
    |> json(%{
      publicKey: %{
        challenge: Base.encode64(challenge.bytes),
        rpId: challenge.rp_id,
        allowCredentials: [],
        userVerification: "preferred"
      }
    })
  end

  def create(conn, %{"raw_id" => raw_id, "response" => response}) do
    user = conn.assigns[:session].user

    raw_id = Base.decode64!(raw_id)
    attestation_object = Base.decode64!(response["attestation_object"])
    client_data_json = Base.decode64!(response["client_data_json"])
    aaguid = get_aaguid(attestation_object)

    challenge = get_session(conn, :challenge)
    conn = delete_session(conn, :challenge)

    with {:ok, {authenticator_data, _}} <-
           Wax.register(attestation_object, client_data_json, challenge),
         {:ok, _} <-
           Passkey.create(
             user.id,
             raw_id,
             authenticator_data.attested_credential_data.credential_public_key,
             aaguid
           ) do
      conn
      |> put_status(:created)
      |> json(%{})
    else
      {:error, reason} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: reason})
    end
  end

  def delete(conn, %{"passkey_id" => passkey_id}) do
    user = conn.assigns[:session].user

    with :ok <- Passkey.delete(user.id, passkey_id) do
      conn |> json(%{deleted: true})
    end
  end

  def authenticate(conn, %{"raw_id" => raw_id, "response" => response} = params) do
    raw_id = Base.decode64!(raw_id)
    authenticator_data = Base.decode64!(response["authenticator_data"])
    signature = Base.decode64!(response["signature"])
    client_data_json = Base.decode64!(response["client_data_json"])
    device_id = params["device_id"]

    challenge = get_session(conn, :authentication_challenge)
    conn = delete_session(conn, :authentication_challenge)

    with passkey <- Passkey.get(raw_id),
         %Passkey{credential_id: credential_id, cose_key: cose_key, user_id: user_id} <- passkey,
         {:ok, _} <-
           Wax.authenticate(
             raw_id,
             authenticator_data,
             signature,
             client_data_json,
             challenge,
             [{credential_id, :erlang.binary_to_term(cose_key)}]
           ),
         login_user <- User.get(user_id),
         %User{banned_at: nil} <- login_user do
      {session, conn} = SessionController.create(conn, login_user, false, device_id)

      conn
      |> put_status(:ok)
      |> json(session)
    else
      %User{} = user ->
        Login.log_login_attempt(conn, user.id, nil, device_id)
        {:error, {:unauthorized, :account_banned}}

      _ ->
        Login.log_login_attempt(conn, nil, nil, device_id)
        {:error, {:unauthorized, :passkey_login_failed}}
    end
  end
end
