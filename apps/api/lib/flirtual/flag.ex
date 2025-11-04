defmodule Flirtual.Flag do
  use Flirtual.Schema

  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.{Connection, Discord, Disposable, Flag, Hash, Repo, User, Users}
  alias Flirtual.User.Profile

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

    cond do
      Disposable.disposable?(domain) ->
        add_error(changeset, field, "email_domain_blocked")

      not is_nil(get(domain, "email")) ->
        add_error(changeset, field, "email_domain_blocked")

      true ->
        changeset
    end
  end

  def validate_allowed_slug(%Ecto.Changeset{valid?: true} = changeset, field) do
    slug = get_field(changeset, field)
    flag = get(slug, "username")

    if is_nil(flag) do
      changeset
    else
      add_error(changeset, field, "has already been taken")
    end
  end

  def validate_allowed_slug(changeset, _) do
    changeset
  end

  def check_honeypot(_, nil), do: :ok
  def check_honeypot(_, ""), do: :ok

  def check_honeypot(user_id, _) do
    Discord.deliver_webhook(:honeypot, user: Users.get(user_id))
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
      Discord.deliver_webhook(:flagged_keyword, user: user, flags: Enum.join(flags, ", "))
    end

    :ok
  end

  def check_discord_in_biography(
        %Profile{
          user_id: user_id,
          discord: discord
        },
        biography
      ) do
    biography_downcased = String.downcase(biography)
    discord_connection = Connection.get(user_id, :discord)
    discord_display_name = discord_connection[:display_name] || discord

    if (discord_display_name !== nil && discord_display_name !== "" &&
          String.contains?(biography_downcased, discord_display_name)) ||
         ((discord_display_name === nil || discord_display_name === "") &&
            String.contains?(biography_downcased, "discord")) do
      now = DateTime.utc_now() |> DateTime.truncate(:second)

      User
      |> where(id: ^user_id)
      |> Repo.update_all(set: [tns_discord_in_biography: now])
    else
      User
      |> where(id: ^user_id)
      |> Repo.update_all(set: [tns_discord_in_biography: nil])
    end

    :ok
  end

  def check_discord_in_display_name(
        %Profile{
          user_id: user_id,
          discord: discord
        },
        display_name
      ) do
    display_name_downcased = String.downcase(display_name)
    discord_connection = Connection.get(user_id, :discord)
    discord_display_name = discord_connection[:display_name] || discord

    if discord_display_name == display_name_downcased do
      now = DateTime.utc_now() |> DateTime.truncate(:second)

      User
      |> where(id: ^user_id)
      |> Repo.update_all(set: [tns_discord_in_biography: now])
    else
      User
      |> where(id: ^user_id)
      |> Repo.update_all(set: [tns_discord_in_biography: nil])
    end

    :ok
  end

  def check_user_slug(_, nil), do: :ok
  def check_user_slug(%User{slug: slug}, slug), do: :ok

  def check_user_slug(user, slug) do
    with :ok <- check_flags(user.id, slug),
         :ok <- Hash.check_hash(user.id, "username", slug) do
      :ok
    end
  end

  def check_profile_display_name(_, nil), do: :ok
  def check_profile_display_name(%Profile{display_name: display_name}, display_name), do: :ok

  def check_profile_display_name(profile, display_name) do
    with :ok <- check_flags(profile.user_id, display_name),
         :ok <- check_discord_in_display_name(profile, display_name),
         :ok <- Hash.check_hash(profile.user_id, "display name", display_name) do
      :ok
    end
  end

  def check_profile_discord(_, nil), do: :ok

  def check_profile_discord(profile, discord) do
    with :ok <- check_flags(profile.user_id, discord),
         :ok <- Hash.check_hash(profile.user_id, "Discord", discord) do
      :ok
    end
  end

  def check_profile_vrchat(_, nil), do: :ok

  def check_profile_vrchat(profile, vrchat) do
    with :ok <- check_flags(profile.user_id, vrchat),
         :ok <- Hash.check_hash(profile.user_id, "VRChat", vrchat) do
      :ok
    end
  end

  def check_profile_facetime(_, nil), do: :ok

  def check_profile_facetime(profile, facetime) do
    with :ok <- check_flags(profile.user_id, facetime),
         :ok <- Hash.check_hash(profile.user_id, "FaceTime", facetime) do
      :ok
    end
  end

  def check_profile_biography(_, nil), do: :ok
  def check_profile_biography(%Profile{biography: biography}, biography), do: :ok

  def check_profile_biography(profile, biography) do
    with biography_text <- biography |> Floki.parse_fragment!() |> Floki.text(),
         :ok <- check_flags(profile.user_id, biography_text),
         :ok <- check_openai_moderation(profile.user_id, biography),
         :ok <- check_discord_in_biography(profile, biography) do
      :ok
    end
  end

  def check_profile_custom_interests(_, nil), do: :ok
  def check_profile_custom_interests(_, []), do: :ok

  def check_profile_custom_interests(profile, custom_interests) do
    with :ok <-
           check_flags(
             profile.user_id,
             Enum.join(custom_interests, " ")
           ) do
      :ok
    end
  end

  def check_profile_flags(profile, attrs) do
    with :ok <- check_profile_display_name(profile, attrs.display_name),
         :ok <- check_profile_discord(profile, attrs.discord),
         :ok <- check_profile_vrchat(profile, attrs.vrchat),
         :ok <- check_profile_facetime(profile, attrs.facetime),
         :ok <- check_profile_biography(profile, attrs.biography),
         :ok <- check_profile_custom_interests(profile, attrs.custom_interests) do
      :ok
    end
  end

  def check_email_flags(_, nil), do: :ok

  def check_email_flags(user_id, email) do
    user = Users.get(user_id)

    keywords =
      "(?:alumno|escola|escolas|escuela|escuelas|estudante|estudantes|estudiante|estudiantes|k12|school|schools|scoala|scuola|scuole|skola|skolas|stu|student|students)"

    if Regex.match?(~r/@#{keywords}|@.*\.#{keywords}|@.*#{keywords}\./i, email) and
         not String.ends_with?(email, ".edu") do
      Discord.deliver_webhook(:flagged_keyword,
        user: user,
        flags: email |> String.split("@") |> List.last()
      )
    end

    if Regex.match?(~r/^(?!.*\+flirtual).*flirtual.*@/i, email) do
      Discord.deliver_webhook(:flagged_keyword,
        user: user,
        flags: email |> String.split("@") |> List.first()
      )
    end

    :ok
  end

  def check_openai_moderation(_, nil), do: :ok

  def check_openai_moderation(user_id, text) do
    user = Users.get(user_id)

    case OpenAI.moderations(input: text, model: "omni-moderation-latest") do
      {:ok, %{results: [%{"categories" => categories, "category_scores" => scores}]}} ->
        flagged_categories =
          categories
          |> Enum.reject(fn {category, _} -> category == "sexual" end)
          |> Enum.filter(fn {category, _} -> scores[category] >= 0.9 end)

        if Enum.any?(flagged_categories) do
          flags =
            flagged_categories
            |> Enum.map(fn {category, _flagged} ->
              "#{category} (#{Float.round(scores[category], 2)})"
            end)
            |> Enum.join(", ")

          Discord.deliver_webhook(:flagged_bio, user: user, flags: flags)
        end

        :ok

      {:error, reason} ->
        Discord.deliver_webhook(:flagged_bio,
          user: user,
          flags: "error: #{inspect(reason)}"
        )

        :ok
    end
  end
end
