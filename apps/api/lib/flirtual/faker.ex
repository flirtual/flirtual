defmodule Flirtual.Faker do
  use Flirtual.Logger, :faker

  alias Flirtual.User.Profile.Image
  alias Flirtual.User
  alias Flirtual.Attribute
  alias Flirtual.Countries
  alias Flirtual.Languages
  alias Flirtual.Profiles
  alias Flirtual.Users
  alias Flirtual.Repo

  import Ecto.Changeset
  import Flirtual.Utilities

  def get_random_images() do
    with {:ok, %HTTPoison.Response{body: body}} <-
           HTTPoison.post(
             "https://api.waifu.pics/many/sfw/waifu",
             Jason.encode!(%{exclude: []}),
             [
               {"Content-Type", "application/json"}
             ]
           ),
         {:ok, %{"files" => urls}} <- Jason.decode(body) do
      urls |> Enum.map(&upload_image_url(&1))
    end
  end

  def upload_image_url_status(token) do
    with {:ok, %HTTPoison.Response{body: body}} <-
           HTTPoison.get("https://upload.uploadcare.com/from_url/status/?token=#{token}"),
         {:ok, body} <- Jason.decode(body) do
      case body["status"] do
        "waiting" -> upload_image_url_status(token)
        "progress" -> upload_image_url_status(token)
        "error" -> {:error, body}
        "success" -> {:ok, body["file_id"]}
      end
    end
  end

  def upload_image_url(url) do
    log(:info, ["upload-image"], url)

    with {:ok, %HTTPoison.Response{body: body}} <-
           HTTPoison.post(
             "https://upload.uploadcare.com/from_url/",
             {:multipart,
              [
                {"pub_key", "130267e8346d9a7e9bea"},
                {"source_url", url},
                {"store", "1"},
                {"check_URL_duplicates", "1"},
                {"save_URL_duplicates", "1"}
              ]},
             [{"Content-Type", "multipart/form-data"}]
           ),
         {:ok, body} <- Jason.decode(body),
         {:ok, file_id} <-
           (case body["type"] do
              "token" -> upload_image_url_status(body["token"])
              "file_info" -> {:ok, body["file_id"]}
            end) do
      file_id
    end
  end

  def random_n_of(range, list) do
    Enum.shuffle(list) |> Enum.take(Enum.random(range))
  end

  def async_create_n_users(n) do
    Enum.map(0..2, fn _ ->
      spawn(fn ->
        create_n_users((n / 2) |> trunc(), reuse_images: true)
      end)
    end)
  end

  def create_n_users(n, opts \\ []) do
    file_ids =
      if(Keyword.get(opts, :reuse_images, false)) do
        Image |> Repo.all() |> Enum.map(& &1.external_id)
      else
        List.duplicate(
          nil,
          (n / 30)
          |> Float.ceil()
          |> trunc()
        )
        |> Enum.map(fn _ -> get_random_images() end)
        |> List.flatten()
      end

    Enum.map(1..n, fn index -> create_user(file_ids: file_ids, file_id_offset: index) end)
  end

  def create_user(options \\ []) do
    file_id_offset =
      Keyword.get(
        options,
        :file_id_offset,
        0
      )

    file_ids =
      Keyword.get(
        options,
        :file_ids
      ) || get_random_images()

    file_id_offset = if(length(file_ids) <= file_id_offset, do: 0, else: file_id_offset)

    file_ids =
      file_ids
      |> Enum.slice(
        file_id_offset,
        Enum.random(1..8)
      )

    now =
      DateTime.utc_now()
      |> DateTime.truncate(:second)

    born_at =
      DateTime.new!(
        Faker.Date.between(get_years_ago(18), Date.from_iso8601!("1980-01-01")),
        Time.new!(0, 0, 0, 0)
      )
      |> DateTime.truncate(:second)

    username = Faker.Internet.user_name() |> Recase.to_snake()
    email = (username |> Recase.to_dot()) <> "@example.com"
    display_name = username |> Recase.to_title() |> String.split(" ") |> List.first()

    Repo.transaction(fn ->
      with {:ok, user} <-
             Users.create(
               %{
                 username: username,
                 email: email,
                 password: "password",
                 service_agreement: true,
                 notifications: Enum.random([true, false])
               },
               captcha: false
             ),
           {:ok, user} <-
             change(user, %{
               born_at: born_at,
               email_confirmed_at: now,
               active_at: now
             })
             |> Repo.update(),
           {:ok, preferences} <-
             Users.update_preferences(user.preferences, %{
               nsfw: [true, false] |> Enum.random(),
               theme: Ecto.Enum.values(Flirtual.User.Preferences, :theme) |> Enum.random()
             }),
           {:ok, _} <-
             Users.update_privacy_preferences(
               preferences.privacy,
               [:personality, :connections, :sexuality, :country, :kinks]
               |> Enum.map(
                 &{
                   &1,
                   User.Preferences.Privacy.get_possible_values()
                   |> Enum.random()
                 }
               )
               |> Map.new()
               |> Map.put(:analytics, [true, false] |> Enum.random())
             ),
           {:ok, _} <-
             Users.update_notification_preferences(
               preferences.email_notifications,
               [:matches, :messages, :likes, :reminders, :newsletter]
               |> Enum.map(&{&1, [true, false] |> Enum.random()})
               |> Map.new()
             ),
           {:ok, _} <-
             Users.update_notification_preferences(
               preferences.push_notifications,
               [:matches, :messages, :likes, :reminders, :newsletter]
               |> Enum.map(&{&1, [true, false] |> Enum.random()})
               |> Map.new()
             ),
           {:ok, profile} <-
             Profiles.update(user.profile, %{
               display_name: display_name,
               biography:
                 "<p>" <>
                   (Faker.Lorem.paragraphs(Enum.random(1..4))
                    |> Enum.join("<br/><br/>")) <>
                   "</p>",
               serious: Enum.random([true, false, nil]),
               new: Enum.random([true, false, nil]),
               country:
                 if(Enum.random(1..4) === 4,
                   do: nil,
                   else: Enum.random(Countries.list(:iso_3166_1))
                 ),
               domsub: Enum.random([nil | Ecto.Enum.values(Flirtual.User.Profile, :domsub)]),
               monopoly: Enum.random([nil | Ecto.Enum.values(Flirtual.User.Profile, :monopoly)]),
               languages: random_n_of(1..3, Languages.list(:bcp_47)),
               gender_id: random_n_of(1..4, Attribute.list(type: "gender") |> Enum.map(& &1.id)),
               sexuality_id:
                 random_n_of(0..3, Attribute.list(type: "sexuality") |> Enum.map(& &1.id)),
               kink_id: random_n_of(0..8, Attribute.list(type: "kink") |> Enum.map(& &1.id)),
               game_id: random_n_of(1..5, Attribute.list(type: "game") |> Enum.map(& &1.id)),
               platform_id:
                 random_n_of(1..8, Attribute.list(type: "platform") |> Enum.map(& &1.id)),
               interest_id:
                 random_n_of(2..7, Attribute.list(type: "interest") |> Enum.map(& &1.id))
             }),
           {:ok, profile} <-
             if(Enum.random(0..4) === 4,
               do: {:ok, profile},
               else:
                 Profiles.update_personality(profile, %{
                   question0: Enum.random([true, false, nil]),
                   question1: Enum.random([true, false, nil]),
                   question2: Enum.random([true, false, nil]),
                   question3: Enum.random([true, false, nil]),
                   question4: Enum.random([true, false, nil]),
                   question5: Enum.random([true, false, nil]),
                   question6: Enum.random([true, false, nil]),
                   question7: Enum.random([true, false, nil]),
                   question8: Enum.random([true, false, nil])
                 })
             ),
           agemin = if(Enum.random(1..4) === 4, do: nil, else: Enum.random(18..50)),
           agemax = if(Enum.random(1..4) === 4, do: nil, else: Enum.random((agemin || 18)..100)),
           {:ok, _} <-
             Profiles.update_preferences(profile.preferences, %{
               agemin: agemin,
               agemax: agemax,
               attributes:
                 [
                   random_n_of(
                     1..3,
                     Attribute.list(type: "gender")
                     |> Enum.filter(&(&1.metadata["simple"] === true))
                     |> Enum.map(& &1.id)
                   )
                 ]
                 |> List.flatten()
             }),
           {:ok, _} <-
             Profiles.create_images(profile, file_ids) do
        user = Map.put(user, :profile, profile)
        log(:info, ["create-user"], user.id)
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end
end
