defmodule Flirtual.Disposable do
  use GenServer
  use Flirtual.Logger, :disposable

  @url "https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf"

  def start_link([]) do
    GenServer.start_link(__MODULE__, [], name: __MODULE__)
  end

  @refresh :timer.hours(24 * 7)
  @retry :timer.minutes(5)

  @impl true
  def init([]) do
    create_table()
    send(self(), :update)
    {:ok, %{}}
  end

  @impl true
  def handle_info(:update, state) do
    Process.send_after(self(), :update, if(update() == :ok, do: @refresh, else: @retry))
    {:noreply, state}
  end

  def disposable?(domain) when is_binary(domain) do
    normalized_domain = String.downcase(domain)

    case :ets.lookup(:disposable, normalized_domain) do
      [{^normalized_domain, true}] -> true
      [] -> false
    end
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
        case String.split(body, "\n", trim: true) do
          [] ->
            log(:error, [:update], :empty)
            :error

          domains ->
            put(domains)
        end

      reason ->
        log(:error, [:update], reason)
        :error
    end
  end

  def put(domains) when is_list(domains) do
    domains = MapSet.new(domains, &String.downcase/1)
    :ets.insert(:disposable, Enum.map(domains, &{&1, true}))

    for {domain, true} <- :ets.tab2list(:disposable), domain not in domains do
      :ets.delete(:disposable, domain)
    end

    :ok
  end

  defp create_table do
    :ets.new(:disposable, [
      :set,
      :named_table,
      :public,
      read_concurrency: true
    ])
  end
end
