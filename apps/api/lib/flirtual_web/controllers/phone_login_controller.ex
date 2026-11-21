defmodule FlirtualWeb.PhoneLoginController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller
  import FlirtualWeb.Utilities

  alias Flirtual.{Features, IpAddress, Notify, Phone, PhoneVerification, Policy, Turnstile, Users}
  alias FlirtualWeb.SessionController

  action_fallback(FlirtualWeb.FallbackController)

  @one_hour 3_600_000

  def send_code(conn, params) do
    with :ok <- available(),
         {:ok, _} <- rate_limit("phone_send_ip:#{IpAddress.normalize(get_conn_ip(conn))}"),
         true <-
           Turnstile.valid?(params["captcha"]) || {:error, {:unauthorized, :turnstile_invalid}},
         {:ok, phone_number} <- parse(params["phone_number"]),
         {:ok, _} <- rate_limit("phone_send:#{phone_number}"),
         {:ok, code} <- PhoneVerification.create(phone_number),
         {:ok, _} <- sent(Notify.send_code(phone_number, code)) do
      json(conn, %{phone_number: phone_number})
    end
  end

  def verify(conn, params) do
    with :ok <- available(),
         {:ok, phone_number} <- parse(params["phone_number"]),
         :ok <- verified(PhoneVerification.verify(phone_number, params["code"])),
         {:ok, user, status} <- account(phone_number, params["signup"] == true) do
      {session, conn} =
        SessionController.create(conn, user, method: :phone, device_id: params["device_id"])

      conn
      |> put_status(status)
      |> json(Policy.transform(conn, session))
    end
  end

  defp available do
    if Features.login?(:phone) and Notify.configured?(),
      do: :ok,
      else: {:error, {:forbidden, :phone_login_disabled}}
  end

  defp rate_limit(bucket) do
    case ExRated.check_rate(bucket, @one_hour, 5) do
      {:ok, _} = ok -> ok
      {:error, _} -> {:error, {:too_many_requests, :phone_rate_limit}}
    end
  end

  defp parse(input) do
    case Phone.parse(input) do
      {:ok, _} = ok -> ok
      {:error, reason} -> {:error, {:bad_request, reason}}
    end
  end

  defp sent({:ok, _} = ok), do: ok
  defp sent({:error, reason}), do: {:error, {:bad_gateway, reason}}

  defp verified(:ok), do: :ok

  defp verified({:error, :verification_rate_limit}),
    do: {:error, {:too_many_requests, :verification_rate_limit}}

  defp verified({:error, reason}), do: {:error, {:unauthorized, reason}}

  defp account(phone_number, signup) do
    case Users.get_by_phone(phone_number) do
      nil when signup ->
        case Users.create_from_phone(phone_number) do
          {:ok, user} -> {:ok, user, :created}
          {:error, _} = error -> error
        end

      nil ->
        {:error, {:not_found, :phone_not_registered}}

      user ->
        {:ok, user, :ok}
    end
  end
end
