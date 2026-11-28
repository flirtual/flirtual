defmodule FlirtualWeb.DataController do
  use FlirtualWeb, :controller

  import FlirtualWeb.Utilities

  alias Flirtual.{Order, Timezones}
  alias Flirtual.Data.Locale
  alias FlirtualWeb.DataJSON

  action_fallback(FlirtualWeb.FallbackController)

  def timezones(conn, _) do
    conn
    |> cache_control([:public, {"max-age", [day: 1]}])
    |> json_with_etag(Timezones.with_offsets())
  end

  # The router gives each file it serves its module, as `Gender` at `/v1/genders`.
  def list(%{assigns: %{data: module}} = conn, params) do
    with {:ok, locale} <- locale(params["locale"]),
         {:ok, order} <- order(module, params["order"]) do
      entries = module.all() |> Order.sort(order, locale) |> Enum.map(&DataJSON.entry(&1, locale))

      conn
      |> cache_control([:public | lifetime(params["v"], order)])
      |> json_with_etag(entries)
    end
  end

  defp lifetime(nil, _), do: [{"max-age", [day: 1]}]

  defp lifetime(version, order) do
    cond do
      version != Flirtual.Data.version() -> [:"no-cache"]
      Enum.any?(order, &match?({:popularity, _}, &1)) -> [{"max-age", [day: 1]}]
      true -> [{"max-age", [day: 365]}, :immutable]
    end
  end

  defp locale(nil), do: {:ok, Locale.default().id}

  defp locale(id) do
    if Locale.get(id), do: {:ok, id}, else: {:error, {:bad_request, :invalid_locale}}
  end

  defp order(module, nil), do: Order.parse(module, module.endpoint().order)

  defp order(module, keys) when is_binary(keys) do
    with :error <- Order.parse(module, String.split(keys, ",")),
         do: {:error, {:bad_request, :invalid_order}}
  end

  defp order(_, _), do: {:error, {:bad_request, :invalid_order}}
end
