defmodule Flirtual.Data do
  @moduledoc """
  Flirtual's reference data from `content/`, compiled into a module per file, named for the type
  `meta.json` gives it: `ban-reasons.json` becomes `Flirtual.Data.BanReason`.
  """

  alias Flirtual.Data.{Content, Definition}

  @paths Content.paths()
  for path <- @paths, do: @external_resource(path)

  # Weblate adds an overlay for each new locale, which @external_resource can't see coming.
  def __mix_recompile__?, do: Content.paths() != @paths

  @modules (for file <- Content.files() do
              Module.create(file.module, Definition.of(file), Macro.Env.location(__ENV__))
              file.module
            end)

  def modules, do: @modules

  @version @paths
           |> Enum.sort()
           |> Enum.map(&[Path.basename(&1), File.read!(&1)])
           |> then(&:crypto.hash(:sha256, &1))
           |> Base.url_encode64(padding: false)
           |> binary_part(0, 12)

  def version, do: @version
end
