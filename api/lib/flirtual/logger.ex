defmodule Flirtual.Logger do
  @inspect_options [
    pretty: true,
    limit: 10,
    syntax_colors: [
      string: :light_green,
      number: :light_yellow,
      boolean: :light_magenta,
      atom: :cyan,
      nil: :light_red
    ]
  ]

  defmacro __using__(name) when is_atom(name) do
    quote do
      require Logger

      defmacrop log(level, list, details \\ nil) do
        logger_name = to_string(unquote(name))
        inspect_options = unquote(@inspect_options)

        quote do
          Logger.unquote(level)(
            unquote(logger_name) <>
              case unquote(list) do
                [] -> ""
                list -> "(" <> Enum.join(list, "/") <> ")"
              end <>
              case unquote(details) do
                nil ->
                  ""

                details ->
                  if(is_binary(details),
                    do: ": ",
                    else: ":\n"
                  ) <> inspect(details, unquote(inspect_options))
              end
          )
        end
      end
    end
  end
end
