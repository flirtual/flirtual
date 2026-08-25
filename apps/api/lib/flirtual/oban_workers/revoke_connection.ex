defmodule Flirtual.ObanWorkers.RevokeConnection do
  use Oban.Worker, queue: :default, max_attempts: 10

  alias Flirtual.Connection

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"type" => type} = args}) do
    %Connection{
      type: String.to_existing_atom(type),
      access_token: args["access_token"],
      refresh_token: args["refresh_token"]
    }
    |> Connection.revoke()
  end
end
