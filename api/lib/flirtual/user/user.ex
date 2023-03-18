defmodule Flirtual.User do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.User.Policy

  import Ecto.Changeset
  import Flirtual.Utilities

  alias Flirtual.Languages
  alias Flirtual.User

  schema "users" do
    field :email, :string
    field :username, :string
    field :password_hash, :string, redact: true
    field :talkjs_signature, :string, redact: true
    field :language, :string, default: "en"

    field :password, :string, virtual: true, redact: true
    field :visible, :boolean, virtual: true, default: false

    field :tags, {:array, Ecto.Enum},
      values: [:admin, :moderator, :beta_tester, :debugger, :verified],
      default: []

    field :born_at, :naive_datetime
    field :email_confirmed_at, :naive_datetime
    field :deactivated_at, :naive_datetime
    field :banned_at, :naive_datetime
    field :shadowbanned_at, :naive_datetime
    field :incognito_at, :naive_datetime
    field :active_at, :naive_datetime

    has_many :connections, Flirtual.User.Connection
    has_many :sessions, Flirtual.User.Session

    has_one :preferences, Flirtual.User.Preferences
    has_one :subscription, Flirtual.User.Subscription
    has_one :profile, Flirtual.User.Profile

    timestamps(inserted_at: :created_at)
  end

  def default_assoc do
    [
      :subscription,
      preferences: Flirtual.User.Preferences.default_assoc(),
      profile: Flirtual.User.Profile.default_assoc()
    ]
  end

  def avatar_url(%User{} = user) do
    external_id =
      Enum.at(user.profile.images, 0)[:external_id] ||
        "e8212f93-af6f-4a2c-ac11-cb328bbc4aa4"

    "https://media.flirtu.al/" <> external_id <> "/"
  end

  def visible?(%User{} = user) do
    case visible(user) do
      {:ok, _} -> true
      {:error, _} -> false
    end
  end

  def visible(%User{} = user) do
    %{profile: profile} = user

    [
      {
        not is_nil(user.banned_at),
        %{reason: "account suspended"}
      },
      {
        not is_nil(user.deactivated_at),
        %{reason: "account deactivated", to: "/settings/deactivate"}
      },
      {
        not is_nil(user.incognito_at),
        %{reason: "account hidden"}
      },
      {
        not is_nil(user.shadowbanned_at),
        %{reason: "account shadow banned", silent: true}
      },
      # onboarding validations
      ## onboarding/1
      {
        length(filter_by(profile.preferences.attributes, :type, "gender")) == 0,
        %{reason: "missing gender preferences", to: "/onboarding/1"}
      },
      ## onboarding/2
      {
        is_nil(user.born_at),
        %{reason: "missing birthday", to: "/onboarding/2"}
      },
      {
        length(filter_by(profile.attributes, :type, "gender")) === 0,
        %{reason: "missing profile genders", to: "/onboarding/2"}
      },
      {
        is_nil(profile.country),
        %{reason: "missing profile country", to: "/onboarding/2"}
      },
      {
        length(profile.languages) === 0,
        %{reason: "missing profile languages", to: "/onboarding/2"}
      },
      {
        length(filter_by(profile.attributes, :type, "platform")) === 0,
        %{reason: "missing profile platforms", to: "/onboarding/2"}
      },
      {
        length(filter_by(profile.attributes, :type, "interest")) === 0,
        %{reason: "missing profile interests", to: "/onboarding/2"}
      },
      ## onboarding/3
      {
        is_nil(profile.biography) or String.length(profile.biography) <= 48,
        %{reason: "profile biography too short", to: "/onboarding/3"}
      },
      {
        length(profile.images) == 0,
        %{reason: "missing profile pictures", to: "/onboarding/3"}
      },
      # email verification
      {
        is_nil(user.email_confirmed_at),
        %{reason: "email not verified", to: "/confirm-email"}
      }
    ]
    |> Enum.map_reduce(true, fn {condition, value}, acc ->
      if(condition,
        do: {value, false},
        else: {nil, if(acc, do: true, else: false)}
      )
    end)
    |> then(fn {errors, visible} ->
      errors = errors |> Enum.filter(&(not is_nil(&1)))
      if(visible, do: {:ok, user}, else: {:error, errors})
    end)
  end

  def changeset(user, attrs, options \\ []) do
    user
    |> cast(attrs, [
      :language,
      :born_at
    ])
    |> validate_required(Keyword.get(options, :required, []))
    |> validate_inclusion(:language, Languages.list(:iso_639_1),
      message: "is an unrecognized language"
    )
    |> validate_change(:born_at, fn _, born_at ->
      now = Date.utc_today()

      if Date.compare(born_at, Date.new!(now.year - 18, now.month, now.day)) === :gt do
        %{born_at: "must be at least 18 years old"}
      else
        %{}
      end
    end)
  end

  @doc """
  A user changeset for registration.

  It is important to validate the length of both email and password.
  Otherwise databases may truncate the email without warnings, which
  could lead to unpredictable or insecure behaviour. Long passwords may
  also be very expensive to hash for certain algorithms.

  ## Options

    * `:hash_password` - Hashes the password so it can be stored securely
      in the database and ensures the password field is cleared to prevent
      leaks in the logs. If password hashing is not needed and clearing the
      password field is not desired (like when using this changeset for
      validations on a LiveView form), this option can be set to `false`.
      Defaults to `true`.
  """
  def registration_changeset(user, attrs, opts \\ []) do
    user
    |> cast(attrs, [:username, :email, :password])
    |> validate_username()
    |> validate_email()
    |> validate_password(opts)
  end

  def validate_username(changeset) do
    changeset
    |> validate_required([:username])
    |> validate_length(:username, min: 3, max: 32)
  end

  def validate_unique_username(changeset) do
    changeset
    |> validate_username()
    |> unsafe_validate_unique(:username, Flirtual.Repo)
    |> unique_constraint(:username)
  end

  def validate_email(changeset) do
    changeset
    |> validate_required([:email])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/, message: "must have the @ sign and no spaces")
    |> validate_length(:email, max: 160)
  end

  def validate_unique_email(changeset) do
    changeset
    |> validate_email()
    |> unsafe_validate_unique(:email, Flirtual.Repo)
    |> unique_constraint(:email)
  end

  def validate_password(changeset, opts \\ []) do
    changeset
    |> validate_required([:password])
    |> validate_length(:password, min: 8, max: 72)
    # |> validate_format(:password, ~r/[a-z]/, message: "at least one lower case character")
    # |> validate_format(:password, ~r/[A-Z]/, message: "at least one upper case character")
    # |> validate_format(:password, ~r/[!?@#$%^&*_0-9]/, message: "at least one digit or punctuation character")
    |> maybe_hash_password(opts)
  end

  defp maybe_hash_password(changeset, opts) do
    hash_password? = Keyword.get(opts, :password_hash, true)
    password = get_change(changeset, :password)

    if hash_password? && password && changeset.valid? do
      changeset
      # If using Bcrypt, then further validate it is at most 72 bytes long
      |> validate_length(:password, max: 72, count: :bytes)
      |> put_change(:password_hash, Bcrypt.hash_pwd_salt(password))
      |> delete_change(:password)
    else
      changeset
    end
  end

  @doc """
  A user changeset for changing the email.

  It requires the email to change otherwise an error is added.
  """
  def update_email_changeset(user, attrs) do
    user
    |> cast(attrs, [:email])
    |> validate_unique_email()
    |> case do
      %{changes: %{email: _}} = changeset -> changeset
      %{} = changeset -> add_error(changeset, :email, "did not change")
    end
  end

  @doc """
  A user changeset for changing the password.

  ## Options

    * `:hash_password` - Hashes the password so it can be stored securely
      in the database and ensures the password field is cleared to prevent
      leaks in the logs. If password hashing is not needed and clearing the
      password field is not desired (like when using this changeset for
      validations on a LiveView form), this option can be set to `false`.
      Defaults to `true`.
  """
  def update_password_changeset(user, attrs, opts \\ []) do
    user
    |> cast(attrs, [:password])
    |> validate_confirmation(:password, message: "does not match password")
    |> validate_password(opts)
  end

  @doc """
  Verifies the password.

  If there is no user or the user doesn't have a password, we call
  `Bcrypt.no_user_verify/0` to avoid timing attacks.
  """
  def valid_password?(%Flirtual.User{password_hash: password_hash}, password)
      when is_binary(password_hash) and byte_size(password) > 0 do
    Bcrypt.verify_pass(password, password_hash)
  end

  def valid_password?(_, _) do
    Bcrypt.no_user_verify()
    false
  end

  @doc """
  Validates the current password otherwise adds an error to the changeset.
  """
  def validate_current_password(changeset, user, options \\ []) do
    field = Keyword.get(options, :field, :current_password)

    if valid_password?(user, get_field(changeset, field)) do
      changeset
    else
      add_error(changeset, field, "is not valid")
    end
  end
end

defimpl Elasticsearch.Document, for: Flirtual.User do
  alias Flirtual.User

  import Flirtual.Utilities

  def id(%User{} = user), do: user.id
  def routing(_), do: false

  def encode(%User{} = user) do
    profile = user.profile

    document =
      Map.merge(
        %{
          id: user.id,
          dob: user.born_at,
          active_at: user.active_at,
          agemin: profile.preferences.agemin || 18,
          agemax: profile.preferences.agemax || 128,
          openness: profile.openness,
          conscientiousness: profile.conscientiousness,
          agreeableness: profile.agreeableness,
          custom_interests: [],
          attributes:
            if(user.preferences.nsfw,
              do: profile.attributes,
              else: exclude_by(profile.attributes, :type, "kink")
            )
            |> Enum.map(& &1.id),
          attributes_lf:
            if(user.preferences.nsfw,
              do:
                (profile.preferences.attributes |> Enum.map(& &1.id)) ++
                  (filter_by(profile.attributes, :type, "kink")
                   |> Enum.map(& &1.metadata["pair"])),
              else: exclude_by(profile.preferences.attributes, :type, "kink") |> Enum.map(& &1.id)
            ),
          country: profile.country,
          monopoly: profile.monopoly,
          serious: profile.serious,
          nsfw: user.preferences.nsfw
          # liked: profile.liked_and_passed |> Enum.filter(&(&1.type === :like)),
          # blocked: profile.blocked
        },
        if(user.preferences.nsfw,
          do: %{
            domsub: user.profile.domsub
          },
          else: %{}
        )
      )

    document
  end
end

defimpl Swoosh.Email.Recipient, for: Flirtual.User do
  alias Flirtual.User

  def format(%User{} = user) do
    {user.profile.display_name || user.username, user.email}
  end
end

defimpl Jason.Encoder, for: Flirtual.User do
  def encode(value, opts) do
    Jason.Encode.map(
      Map.take(value, [
        :id,
        :email,
        :username,
        :language,
        :born_at,
        :talkjs_signature,
        :email_confirmed_at,
        :deactivated_at,
        :active_at,
        :tags,
        :visible,
        :subscription,
        :preferences,
        :profile,
        :updated_at,
        :created_at
      ])
      |> Map.filter(fn {_, value} -> value !== nil end),
      opts
    )
  end
end

defimpl Inspect, for: Flirtual.User do
  import Inspect.Algebra

  def inspect(conn, opts) do
    document =
      Map.take(conn, [
        :id,
        :email,
        :username,
        :profile,
        :created_at,
        :tags,
        :subscription
      ])
      |> Map.to_list()

    concat(["#User<", to_doc(document, opts), ">"])
  end
end
