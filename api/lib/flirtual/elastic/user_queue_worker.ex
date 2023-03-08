defmodule Flirtual.Elastic.UserQueueWorker do
  use GenServer

  alias Flirtual.Elastic

  def start_link(_) do
    GenServer.start_link(__MODULE__, [])
  end

  def handle_info(:update_pending, state) do
    schedule()
    #{:ok, _} = Elastic.User.update_pending()
    {:noreply, state}
  end

  def init(state) do
    schedule()
    {:ok, state}
  end

  def schedule() do
    Process.send_after(self(), :update_pending, 30000)
  end
end
