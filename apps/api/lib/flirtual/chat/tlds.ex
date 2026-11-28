defmodule Flirtual.Chat.Tlds do
  use GenServer
  use Flirtual.Logger, :chat_tlds

  alias Flirtual.Chat.Links

  @url "https://data.iana.org/TLD/tlds-alpha-by-domain.txt"

  def start_link([]) do
    GenServer.start_link(__MODULE__, [], name: __MODULE__)
  end

  @refresh :timer.hours(24 * 7)
  @retry :timer.minutes(5)

  @impl true
  def init([]) do
    send(self(), :update)
    {:ok, %{}}
  end

  @impl true
  def handle_info(:update, state) do
    Process.send_after(self(), :update, if(update() == :ok, do: @refresh, else: @retry))
    {:noreply, state}
  end

  def update do
    case Req.request(
           method: :get,
           url: @url,
           decode_body: false,
           retry: false,
           finch: [name: Flirtual.Finch]
         ) do
      {:ok, %Req.Response{status: 200, body: body}} ->
        case parse(body) do
          [] ->
            log(:error, [:update], :empty)
            :error

          tlds ->
            Links.use_tlds(tlds)
        end

      reason ->
        log(:error, [:update], reason)
        :error
    end
  end

  def parse(body) do
    body
    |> String.split("\n", trim: true)
    |> Enum.map(&(&1 |> String.trim() |> String.downcase()))
    |> Enum.filter(&String.match?(&1, ~r/^[a-z0-9-]+$/))
  end
end
