defmodule Flirtual.ImageClassification do
  use Flirtual.Logger, :image_classification

  def hash(image) when is_binary(image) do
    with url when is_binary(url) <- Application.get_env(:flirtual, :image_classification_origin),
         token when is_binary(token) <- Application.get_env(:flirtual, :image_access_token),
         {:ok, %Req.Response{status: 200, body: body}} <-
           Req.request(
             method: :post,
             url: url <> "/hash",
             body: image,
             headers: [
               {"authorization", "Bearer " <> token},
               {"content-type", "application/octet-stream"}
             ],
             receive_timeout: 15_000,
             decode_body: false,
             retry: false,
             finch: Flirtual.FinchInternal
           ),
         {:ok, %{"hash" => hash} = hashes} when is_binary(hash) <- Jason.decode(body) do
      {:ok, {hash, hashes["flipped"]}}
    else
      reason ->
        log(:error, ["hash"], reason)
        {:error, :hash_failed}
    end
  end
end
