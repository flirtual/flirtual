defmodule Flirtual.ObanWorkers.DeleteImageObjects do
  use Oban.Worker, queue: :default, max_attempts: 20

  alias Flirtual.User.Profile.Image

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"objects" => objects}}) do
    objects
    |> Enum.map(fn [bucket, key] -> {bucket, key} end)
    |> Image.delete_objects()
  end
end
