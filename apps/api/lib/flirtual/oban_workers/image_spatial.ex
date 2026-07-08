defmodule Flirtual.ObanWorkers.ImageSpatial do
  use Oban.Worker,
    queue: :image_spatial,
    unique: [
      keys: [:image_id],
      period: :infinity,
      states: [:available, :scheduled, :executing, :retryable, :suspended]
    ]

  import Ecto.Changeset

  alias Flirtual.Repo
  alias Flirtual.Stereo2Spatial
  alias Flirtual.User.Profile.Image

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"image_id" => image_id}}) do
    case Image.get(image_id) do
      %Image{spatial_id: spatial_id} when is_binary(spatial_id) ->
        :cancel

      %Image{original_file: original_file} = image when is_binary(original_file) ->
        spatial_id = Ecto.UUID.generate()

        case Stereo2Spatial.convert(image, spatial_id) do
          :ok ->
            image
            |> change(%{spatial_id: spatial_id})
            |> Repo.update()

            :ok

          # stereo2spatial likes to nap. Reschedule without an error when unreachable.
          :unreachable ->
            {:snooze, 3600}

          {:error, reason} ->
            {:error, reason}
        end

      _ ->
        :cancel
    end
  end
end
