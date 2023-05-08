defmodule Flirtual.Flag do
  use Flirtual.Schema

  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.{Flag, Repo, Users}

  schema "flags" do
    field :type, :string
    field :flag, :string

    timestamps(inserted_at: false)
  end

  def changeset(flag, attrs) do
    flag
    |> cast(attrs, [:type, :flag])
    |> validate_required([:type, :flag])
    |> unique_constraint([:type, :flag])
  end

  def get(flag, type) when is_binary(flag) and is_binary(type) do
    Flag
    |> where(flag: ^flag, type: ^type)
    |> Repo.one()
  end

  def validate_allowed_email(changeset, field) do
    domain = get_field(changeset, field) |> String.split("@") |> List.last()
    flag = get(domain, "email")

    if is_nil(flag) do
      changeset
    else
      add_error(changeset, field, "Sorry, your email service has been blocked due to abuse.")
    end
  end

  def check_flags(user_id, text) do
    user = Users.get(user_id)

    query = """
      SELECT flag
      FROM flags
      WHERE type = 'text'
      AND $1 ~* ('(?<![[:alnum:]])' || flag || '(?![[:alnum:]])')
    """

    case Repo.query(query, [text]) do
      {:ok, %Postgrex.Result{rows: []}} ->
        :ok

      {:ok, %Postgrex.Result{rows: rows}} when is_list(rows) ->
        flags = Enum.map_join(rows, ", ", fn [flag] -> flag end)
        Flirtual.Discord.deliver_webhook(:flagged_text, user: user, flags: flags)
        :ok

      {:error, reason} ->
        Flirtual.Discord.deliver_webhook(:flagged_text,
          user: user,
          flags: "error: #{inspect(reason)}"
        )

        :ok
    end
  end

  def check_openai_moderation(user_id, text) do
    user = Users.get(user_id)

    IO.inspect(text)

    case OpenAI.moderations(input: text) do
      {:ok, %{results: [%{"categories" => categories, "category_scores" => scores}]}} ->
        flagged_categories =
          categories
          |> Enum.reject(fn {category, _flagged} -> category == "sexual" end)
          |> Enum.filter(fn {_category, flagged} -> flagged end)

        IO.inspect(flagged_categories)

        if Enum.any?(flagged_categories) do
          flags =
            flagged_categories
            |> Enum.map(fn {category, _flagged} ->
              "#{category} (#{Float.round(scores[category], 2)})"
            end)
            |> Enum.join(", ")

          Flirtual.Discord.deliver_webhook(:flagged_text, user: user, flags: flags)
        end

        :ok

      {:error, reason} ->
        Flirtual.Discord.deliver_webhook(:flagged_text,
          user: user,
          flags: "error: #{inspect(reason)}"
        )

        :ok
    end
  end
end
