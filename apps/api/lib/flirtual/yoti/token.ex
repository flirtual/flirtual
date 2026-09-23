defmodule Flirtual.Yoti.Token do
  use GenServer

  alias Flirtual.Yoti

  @name __MODULE__

  @refresh_margin 60

  def start_link(_), do: GenServer.start_link(__MODULE__, [], name: @name)

  def configured?,
    do: Yoti.config(:sdk_id) not in [nil, ""] and Yoti.config(:private_key) not in [nil, ""]

  def get do
    case GenServer.whereis(@name) do
      nil -> {:error, :yoti_unauthorized}
      _ -> GenServer.call(@name, :get, 20_000)
    end
  end

  @impl true
  def init(_), do: {:ok, nil}

  @impl true
  def handle_call(:get, _from, state) do
    now = System.system_time(:second)

    case state do
      %{access_token: access_token, expires_at: expires_at} when expires_at > now ->
        {:reply, {:ok, access_token}, state}

      _ ->
        case Yoti.request_access_token(Yoti.config(:sdk_id), Yoti.config(:private_key)) do
          {:ok, access_token, expires_in} ->
            state = %{
              access_token: access_token,
              expires_at: now + max(expires_in - @refresh_margin, @refresh_margin)
            }

            {:reply, {:ok, access_token}, state}

          {:error, reason} ->
            {:reply, {:error, reason}, nil}
        end
    end
  end
end
