defmodule Flirtual.Data.MixProject do
  use Mix.Project

  def project do
    [
      app: :flirtual_data,
      version: "0.0.0",
      elixir: "~> 1.20",
      deps: deps()
    ]
  end

  # Only `Flirtual.Data`'s compile uses JSV.
  defp deps, do: [{:jsv, "~> 0.27", runtime: false}]
end
