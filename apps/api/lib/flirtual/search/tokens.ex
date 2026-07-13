defmodule Flirtual.Search.Tokens do
  # Namespaced tokens shared between the search document's `boosts` field and
  # queries (both scoring and boost-backed advanced filters); matched verbatim
  # after hashing.

  def attribute(id), do: "attr:#{id}"
  def attribute_lf(id), do: "lf:#{id}"
  def custom_interest(value), do: "cust:#{normalize_custom_interest(value)}"
  def country(value), do: "country:#{String.downcase(to_string(value))}"
  def language(value), do: "lang:#{String.downcase(to_string(value))}"
  def relationship(value), do: "rel:#{value}"
  def monopoly(value), do: "monopoly:#{value}"
  def domsub(value), do: "domsub:#{value}"
  def personality(value), do: "personality:#{value}"

  def normalize_custom_interest(value) do
    value
    |> String.downcase()
    |> String.replace(~r/[^[:alnum:]]/u, "")
  end
end
