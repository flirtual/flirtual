defmodule Flirtual.Stereo2Spatial do
  use Flirtual.Logger, :spatial_processing

  alias Flirtual.User.Profile.Image

  @receive_timeout 180_000

  def convert(%Image{original_file: original_file} = image, spatial_id)
      when is_binary(original_file) and is_binary(spatial_id) do
    origin = Application.fetch_env!(:flirtual, :stereo2spatial_origin)
    request(image, spatial_id, origin, Image.url(:uploads, original_file))
  end

  def convert(_, _), do: {:error, :missing_original}

  defp request(%Image{} = image, spatial_id, origin, source_url) do
    token = Application.get_env(:flirtual, :stereo2spatial_access_token)

    result =
      Req.request(
        method: :get,
        url: origin <> "/convert",
        params: [url: source_url, strip: 1],
        headers: if(is_binary(token), do: [{"authorization", "Bearer " <> token}], else: []),
        receive_timeout: @receive_timeout,
        decode_body: false,
        retry: false,
        finch: Flirtual.Finch
      )

    case result do
      {:ok, %Req.Response{status: 200, body: body}}
      when is_binary(body) and byte_size(body) > 0 ->
        case Image.put_spatial(spatial_id, body) do
          :ok -> :ok
          :error -> {:error, :store_failed}
        end

      {:ok, %Req.Response{status: status, body: body}} ->
        log(:error, ["convert", image.id], %{status: status, body: truncate(body)})
        {:error, {:convert_failed, status}}

      {:error, reason} ->
        log(:warning, ["convert", image.id, "unreachable"], reason)
        :unreachable
    end
  end

  defp truncate(body) when is_binary(body), do: String.slice(body, 0, 200)
  defp truncate(body), do: inspect(body, limit: 5)
end
