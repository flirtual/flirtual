defmodule Flirtual.Encoder do
  @type using_options :: [
          {:only, list(atom)}
        ]

  @spec __using__(using_options) :: any
  defmacro __using__(options) do
    properties = Keyword.get(options, :only, [])

    quote bind_quoted: [properties: properties] do
      def encode(value, encode_options) do
        Jason.Encode.map(
          unquote(
            properties
            |> Enum.map(fn property ->
              {property,
               quote do
                 value.unquote(property)
               end}
            end)
          )
          |> Enum.filter(&(not match?({_, nil}, &1)))
          |> Map.new(),
          encode_options
        )
      end
    end
  end
end
