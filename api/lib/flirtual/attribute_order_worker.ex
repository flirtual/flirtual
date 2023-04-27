defmodule Flirtual.AttributeOrderWorker do
  use GenServer

  alias Flirtual.User.Profile

  def start_link(_) do
    GenServer.start_link(__MODULE__, [])
  end

  def handle_info(:process, state) do
    schedule()
    {:ok, _} = Profile.Attributes.update_order("game", :popularity)
    {:noreply, state}
  end

  def init(state) do
    schedule()
    {:ok, state}
  end

  @hour_in_milliseconds 3_600_000

  def schedule() do
    Process.send_after(self(), :process, @hour_in_milliseconds)
  end
end
