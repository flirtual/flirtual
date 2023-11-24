defmodule Flirtual.ObanWorkers do
  alias Flirtual.ObanWorkers.{Elasticsearch, Listmonk, PremiumReset, Talkjs}
  alias Flirtual.User

  def update_user(user_ids, workers \\ [:elasticsearch, :listmonk, :premium_reset, :talkjs])

  def update_user(%User{id: user_id}, workers) do
    update_user(user_id, workers)
  end

  def update_user([], _workers), do: {:ok, 0}

  def update_user(user_ids, workers) do
    args =
      case user_ids do
        user_id when is_binary(user_id) -> %{"user_id" => user_id}
        user_ids when is_list(user_ids) -> %{"user_ids" => user_ids}
      end

    enabled_workers = Application.get_env(:flirtual, Flirtual.ObanWorkers)[:enabled_workers]

    results =
      workers
      |> Enum.filter(&(&1 in enabled_workers))
      |> Enum.map(fn worker ->
        job =
          case worker do
            :elasticsearch -> Elasticsearch.new(args)
            :listmonk -> Listmonk.new(args)
            :premium_reset -> PremiumReset.new(args)
            :talkjs -> Talkjs.new(args)
          end

        Oban.insert(job)
      end)

    if results == [] or Enum.all?(results, &match?({:ok, _}, &1)) do
      {:ok,
       case user_ids do
         user_id when is_binary(user_id) -> 1
         user_ids when is_list(user_ids) -> length(user_ids)
       end}
    else
      {:error, Enum.filter(results, &match?({:error, _}, &1))}
    end
  end
end
