defmodule Flirtual.VRChatSession do
  use GenServer
  require Logger

  @name __MODULE__

  def start_link(_) do
    GenServer.start_link(__MODULE__, [], name: @name)
  end

  def get_connection do
    GenServer.call(@name, :get_connection, 30_000)
  end

  def invalidate_session do
    GenServer.cast(@name, :invalidate_session)
  end

  @impl true
  def init(_opts) do
    config = Application.get_env(:flirtual, Flirtual.VRChat)

    if config[:username] && config[:password] do
      {:ok, %{connection: nil, config: config}}
    else
      {:ok, %{connection: nil, config: nil}}
    end
  end

  @impl true
  def handle_call(:get_connection, _from, %{config: nil} = state) do
    {:reply, {:error, :not_configured}, state}
  end

  @impl true
  def handle_call(:get_connection, _from, state) do
    case get_valid_connection(state) do
      {:ok, connection, new_state} ->
        {:reply, {:ok, connection}, new_state}

      {:error, reason} ->
        Logger.error("Failed to get VRChat connection: #{inspect(reason)}")
        {:reply, {:error, reason}, %{state | connection: nil}}
    end
  end

  @impl true
  def handle_cast(:invalidate_session, state) do
    {:noreply, %{state | connection: nil}}
  end

  defp get_valid_connection(%{connection: nil, config: config} = state) do
    authenticate(config, state)
  end

  defp get_valid_connection(%{connection: conn} = state) do
    {:ok, conn, state}
  end

  defp authenticate(config, state) do
    case VRChat.Authentication.login(
           username: config[:username],
           password: config[:password],
           totp_secret: config[:totp_secret]
         ) do
      {:ok, connection, _} ->
        new_state = %{state | connection: connection}

        {:ok, connection, new_state}

      {:error, reason} ->
        Logger.error("VRChat authentication failed: #{inspect(reason)}")
        {:error, reason}
    end
  end
end
