defmodule Flirtual.ObanWorkers.ImageClassify do
  use Oban.Worker,
    queue: :image_classification,
    unique: [
      keys: [:image_id],
      period: :infinity,
      states: [:available, :scheduled, :executing, :retryable, :suspended]
    ]

  alias Flirtual.User.Profile.Image
  alias Flirtual.User.Profile.Image.Moderation

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"image_id" => image_id}}) do
    case Image.get(image_id) do
      %Image{external_id: external_id, profile_id: profile_id} = image
      when is_binary(external_id) and not is_nil(profile_id) ->
        case Moderation.classify_remote(image) do
          {:ok, %{classifications: classifications, hashes: hashes}} ->
            Moderation.classify_image(image, classifications, hashes)
            :ok

          {:error, reason} ->
            {:error, reason}
        end

      _ ->
        :cancel
    end
  end
end
