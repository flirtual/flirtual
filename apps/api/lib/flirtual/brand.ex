defmodule Flirtual.Brand do
  def get(key) when is_atom(key), do: Application.fetch_env!(:flirtual, :brand)[key]

  def name, do: get(:name)
  def legal_address, do: get(:legal_address)
  def background_color, do: get(:background_color)
  def logo_light_url, do: get(:logo_light_url)
  def logo_dark_url, do: get(:logo_dark_url)
  def support_origin, do: get(:support_origin)

  # Only the configured ones, in display order.
  def socials do
    [:discord, :x, :bluesky, :instagram]
    |> Enum.map(&{&1, get(:socials)[&1]})
    |> Enum.reject(fn {_, url} -> is_nil(url) end)
  end

  def date_color(index) when index in [0, 1], do: get(:date_colors) |> elem(index)
  def date_dark_color(index) when index in [0, 1], do: get(:date_dark_colors) |> elem(index)
end
