defmodule Flirtual.Plans do
  alias Flirtual.Data.Plan

  def get(chargebee_id: id) when is_binary(id), do: Enum.find(list(), &(&1.chargebee_id == id))

  # RevenueCat names a product by its App Store or Play Store id.
  def get(revenuecat_id: id) when is_binary(id),
    do: Enum.find(list(), &(id in [&1.apple_id, &1.google_id]))

  defp list, do: Plan.all()
end
