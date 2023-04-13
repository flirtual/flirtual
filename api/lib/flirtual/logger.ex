defmodule Flirtual.Logger do
  @inspect_options [
    pretty: true,
    limit: 100,
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

      defmacrop log(level, list, details \\ nil) when is_list(list) do
        logger_name = to_string(unquote(name))
        inspect_options = unquote(@inspect_options)

        quote do
          list = unquote(list)
          details = unquote(details)

          Logger.unquote(level)(
            unquote(logger_name) <>
              if(length(list) === 0, do: "", else: "(" <> Enum.join(list, "/") <> ")") <>
              if(is_binary(details),
                do: ": ",
                else: ":\n"
              ) <>
              inspect(details, unquote(inspect_options))
          )
        end
      end
    end
  end
end
