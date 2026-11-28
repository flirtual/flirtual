defmodule Flirtual.Chat.Message do
  use Flirtual.Schema

  import Ecto.Changeset

  alias Flirtual.Chat.{Conversation, Message, Reaction}
  alias Flirtual.User

  @timestamps_opts [type: :utc_datetime_usec, inserted_at: :created_at]

  @max_text_length 10_000
  @max_gif_size 10_000

  schema "messages" do
    belongs_to(:conversation, Conversation, type: :string)
    belongs_to(:sender, User)
    belongs_to(:reply_to, Message)
    has_many(:reactions, Reaction, preload_order: [asc: :created_at])

    field(:seq, :integer)
    field(:version, :integer)
    field(:system, :boolean, default: false)
    field(:kind, Ecto.Enum, values: [:match])
    field(:text, :string)
    field(:gif_width, :integer)
    field(:gif_height, :integer)
    field(:client_id, Ecto.UUID)
    field(:edited_at, :utc_datetime_usec)
    field(:deleted_at, :utc_datetime_usec)

    timestamps(updated_at: false)
  end

  def changeset(%Message{} = message, attrs) do
    message
    |> cast(attrs, [:text, :client_id])
    |> update_change(:text, &(&1 |> String.replace("\r\n", "\n") |> String.trim()))
    |> validate_required(:text)
    |> validate_change(:text, fn :text, text ->
      if String.valid?(text), do: [], else: [text: {"is not valid text", validation: :format}]
    end)
    |> validate_length(:text, max: @max_text_length)
    |> put_gif(attrs["gif"])
  end

  defp put_gif(changeset, %{"width" => width, "height" => height})
       when is_integer(width) and is_integer(height) and width > 0 and height > 0 and
              width <= @max_gif_size and height <= @max_gif_size,
       do: change(changeset, gif_width: width, gif_height: height)

  defp put_gif(changeset, _), do: changeset

  def error(%Ecto.Changeset{errors: errors}) do
    case {errors[:text], errors[:client_id]} do
      {{_, options}, _} -> text_error(options[:validation])
      {nil, {_, _}} -> :invalid_client_id
      _ -> :invalid_message
    end
  end

  defp text_error(:length), do: :message_too_long
  defp text_error(:format), do: :invalid_message
  defp text_error(_), do: :empty_message
end
