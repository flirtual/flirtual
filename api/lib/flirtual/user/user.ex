defmodule Flirtual.User do
  use Flirtual.Schema
  use Flirtual.Target, policy: Flirtual.User.Policy

  import Ecto.Changeset

  @derive {Jason.Encoder,
           only: [
             :id,
             :email,
             :username,
             :language,
             :born_at,
             :tags,
             :connections,
             :subscription,
             :preferences,
             :profile,
             :updated_at,
             :created_at
           ]}

  schema "users" do
    field :email, :string
    field :username, :string
    field :password, :string, virtual: true, redact: true
    field :password_hash, :string, redact: true
    field :talkjs_signature, :string
    field :language, :string, default: "en"

    field :tags, {:array, Ecto.Enum},
      values: [:admin, :moderator, :beta_tester, :debugger, :verified],
      default: []

    field :born_at, :naive_datetime
    field :email_confirmed_at, :naive_datetime
    field :banned_at, :naive_datetime
    field :shadowbanned_at, :naive_datetime
    field :disabled_at, :naive_datetime
    field :incognito_at, :naive_datetime

    has_many :connections, Flirtual.User.Connection
    has_many :sessions, Flirtual.User.Session

    has_one :preferences, Flirtual.User.Preferences
    has_one :subscription, Flirtual.User.Subscription
    has_one :profile, Flirtual.User.Profile

    timestamps(inserted_at: :created_at)
  end

  def default_assoc do
    [
      :connections,
      :subscription,
      preferences: Flirtual.User.Preferences.default_assoc(),
      profile: Flirtual.User.Profile.default_assoc()
    ]
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
    |> validate_length(:username, max: 160)
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
  def email_changeset(user, attrs) do
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
  def password_changeset(user, attrs, opts \\ []) do
    user
    |> cast(attrs, [:password])
    |> validate_confirmation(:password, message: "does not match password")
    |> validate_password(opts)
  end

  @doc """
  Confirms the account by setting `confirmed_at`.
  """
  def confirm_email_changeset(user) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
    change(user, email_confirmed_at: now)
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
  def validate_current_password(changeset, password) do
    if valid_password?(changeset.data, password) do
      changeset
    else
      add_error(changeset, :current_password, "is not valid")
    end
  end
end
