defmodule Flirtual.ObanWorkers do
  alias Flirtual.ObanWorkers.{
    Chargebee,
    Listmonk,
    SearchIndex,
    Talkjs
  }

  alias Flirtual.Matchmaking
  alias Flirtual.User
  alias Flirtual.User.Profile.Queue

  def update_user(
        user_ids,
        workers \\ [:chargebee, :compute_queue, :listmonk, :search_index, :talkjs]
      )

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
      |> Enum.flat_map(fn worker ->
        case worker do
          :chargebee ->
            [Oban.insert(Chargebee.new(args))]

          :compute_queue ->
            insert_compute_queue(user_ids)

          :listmonk ->
            [Oban.insert(Listmonk.new(args))]

          :search_index ->
            [Oban.insert(SearchIndex.new(args))]

          :talkjs ->
            [Oban.insert(Talkjs.new(args))]
        end
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

  defp insert_compute_queue(user_ids) do
    user_ids
    |> List.wrap()
    |> Enum.flat_map(fn user_id ->
      Enum.map(Queue.kinds(), fn kind ->
        :ok = Matchmaking.enqueue_compute(user_id, kind)
        {:ok, user_id}
      end)
    end)
  end
end
