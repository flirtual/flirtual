defmodule Flirtual.Flag do
  use Flirtual.Schema

  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.{Discord, Flag, Repo, Users}

  schema "flags" do
    field(:type, :string)
    field(:flag, :string)

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

  def validate_allowed_username(%Ecto.Changeset{valid?: true} = changeset, field) do
    username = get_field(changeset, field)
    flag = get(username, "username")

    if is_nil(flag) do
      changeset
    else
      add_error(changeset, field, "has already been taken")
    end
  end

  def validate_allowed_username(changeset, _) do
    changeset
  end

  def check_flags(_, nil), do: :ok

  def check_flags(user_id, text) do
    user = Users.get(user_id)

    flags =
      Flag
      |> where([flag], flag.type == "text")
      |> where(
        [flag],
        fragment("? ~* ('(\\?<![[:alnum:]])' || ? || '(\\?![[:alnum:]])')", ^text, flag.flag)
      )
      |> Repo.all()
      |> Enum.map(& &1.flag)

    if flags != [] do
      Discord.deliver_webhook(:flagged_text, user: user, flags: Enum.join(flags, ", "))
    end

    :ok
  end

  def check_email_flags(_, nil), do: :ok

  def check_email_flags(user_id, email) do
    user = Users.get(user_id)

    keywords =
      "(?:alumno|escola|escolas|escuela|escuelas|estudante|estudantes|estudiante|estudiantes|k12|school|schools|scoala|scuola|scuole|skola|skolas|stu|student|students)"

    if Regex.match?(~r/@#{keywords}|@.*\.#{keywords}|@.*#{keywords}\./, email) and
         not String.ends_with?(email, ".edu") do
      Discord.deliver_webhook(:flagged_text,
        user: user,
        flags: email |> String.split("@") |> List.last()
      )
    end

    :ok
  end

  def check_openai_moderation(_, nil), do: :ok

  def check_openai_moderation(user_id, text) do
    user = Users.get(user_id)

    case OpenAI.moderations(input: text) do
      {:ok, %{results: [%{"categories" => categories, "category_scores" => scores}]}} ->
        flagged_categories =
          categories
          |> Enum.reject(fn {category, _} -> category == "sexual" end)
          |> Enum.filter(fn {category, _} -> scores[category] >= 0.5 end)

        if Enum.any?(flagged_categories) do
          flags =
            flagged_categories
            |> Enum.map(fn {category, _flagged} ->
              "#{category} (#{Float.round(scores[category], 2)})"
            end)
            |> Enum.join(", ")

          Discord.deliver_webhook(:flagged_text, user: user, flags: flags)
        end

        :ok

      {:error, reason} ->
        Discord.deliver_webhook(:flagged_text,
          user: user,
          flags: "error: #{inspect(reason)}"
        )

        :ok
    end
  end
end
