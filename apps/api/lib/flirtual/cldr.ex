defmodule Flirtual.Cldr do
  # Enabling a locale in `locales.json` installs its CLDR data, which ex_cldr downloads at compile time.
  use Cldr,
    locales:
      for(%Flirtual.Data.Locale{enabled: true, id: id} <- Flirtual.Data.Locale.all(), do: id),
    default_locale: Flirtual.Data.Locale.default().id,
    providers: [Cldr.Number, Cldr.List, Cldr.Message]
end
