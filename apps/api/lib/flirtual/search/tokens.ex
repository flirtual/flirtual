defmodule Flirtual.Search.Tokens do
  # Namespaced tokens shared between the search document's `boosts` field and
  # queries (both scoring and boost-backed advanced filters); matched verbatim
  # after hashing.

  # Ids are only unique within their own file.
  def entry(%module{id: id}), do: entry(module, id)
  def entry(module, id) when is_atom(module) and is_binary(id), do: "#{module.file()}:#{id}"

  def tag(entry), do: "tag:" <> entry(entry)
  def tag_lf(entry), do: "lf:" <> entry(entry)
  def custom_interest(value), do: "cust:#{normalize_custom_interest(value)}"
  def country(value), do: "country:#{String.downcase(to_string(value))}"
  def language(value), do: "lang:#{String.downcase(to_string(value))}"
  def relationship(value), do: "rel:#{value}"
  def monopoly(value), do: "monopoly:#{value}"
  def domsub(value), do: "domsub:#{value}"
  def public_domsub(value), do: "public-domsub:#{value}"
  def personality(value), do: "personality:#{value}"

  def normalize_custom_interest(value) do
    value
    |> String.downcase()
    |> String.replace(~r/[^[:alnum:]]/u, "")
  end
end
