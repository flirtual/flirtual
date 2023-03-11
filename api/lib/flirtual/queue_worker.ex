defmodule Flirtual.UserQueueWorker do
  use GenServer

  alias Flirtual.User

  def start_link(_) do
    GenServer.start_link(__MODULE__, [])
  end

  def handle_info(:process, state) do
    schedule()
    {:ok, _} = User.ChangeQueue.next()
    {:noreply, state}
  end

  def init(state) do
    schedule()
    {:ok, state}
  end

  def schedule() do
    Process.send_after(self(), :process, 30000)
  end
end
