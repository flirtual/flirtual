defmodule Flirtual.Disposable do
  use GenServer
  use Flirtual.Logger, :disposable

  @url "https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf"

  def start_link([]) do
    GenServer.start_link(__MODULE__, [], name: __MODULE__)
  end

  @impl true
  def init([]) do
    create_table()
    Task.start(fn -> update() end)
    {:ok, %{}}
  end

  def disposable?(domain) when is_binary(domain) do
    normalized_domain = String.downcase(domain)

    case :ets.lookup(:disposable, normalized_domain) do
      [{^normalized_domain, true}] -> true
      [] -> false
    end
  end

  def update do
    case HTTPoison.get(@url) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        domains = body |> String.split("\n", trim: true)

        :ets.delete_all_objects(:disposable)

        entries =
          domains
          |> Enum.map(&String.downcase/1)
          |> Enum.uniq()
          |> Enum.map(&{&1, true})

        :ets.insert(:disposable, entries)

        :ok

      reason ->
        log(:error, [:update], reason)
        :error
    end
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
