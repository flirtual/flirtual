defmodule Flirtual.NoEmailTest do
  use ExUnit.Case, async: false

  import Ecto.Changeset

  alias Flirtual.{Flag, Repo, User, Users}
  alias Flirtual.ObanWorkers

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
    Ecto.Adapters.SQL.Sandbox.mode(Repo, {:shared, self()})
    :ok
  end

  test "an email to an account without email is cancelled, not retried" do
    {:ok, user} = Users.create_from_connection(nil)

    job = %Oban.Job{
      args: %{
        "user_id" => user.id,
        "type" => "transactional",
        "subject" => "Subject",
        "body_text" => "Body",
        "body_html" => "<p>Body</p>"
      }
    }

    assert ObanWorkers.Email.perform(job) == {:cancel, :no_email}
  end

  test "a missing email is a validation error, not a crash" do
    changeset =
      %User{}
      |> cast(%{}, [:email])
      |> validate_required([:email])
      |> Flag.validate_allowed_email(:email)

    refute changeset.valid?
    assert {"can't be blank", _} = changeset.errors[:email]
  end
end
