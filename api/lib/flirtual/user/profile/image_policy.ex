defmodule Flirtual.User.Profile.Image.Policy do
  use Flirtual.Policy

  alias Flirtual.User.Session
  alias Flirtual.User
  alias Flirtual.User.Profile
  alias Flirtual.User.Profile.Image

  defguard is_within_list(value, [head | tail] = list)
           when head == value or is_within_list(value, tail)

  def authorize(:read, _, _), do: true
  def authorize(_, _, _), do: false

  def transform(
        :scanned,
        %Plug.Conn{assigns: %{session: %Session{user: %User{tags: tags}}}},
        %Image{scanned: scanned}
      )
      when is_within_list(:admin, tags) do
    IO.inspect(tags)
    scanned
  end

  def transform(:scanned, _, _), do: nil

  def transform(
        :updated_at,
        %Plug.Conn{assigns: %{session: %{user_id: user_id}}},
        %Image{profile: %Profile{user: %User{id: user_id}}, updated_at: updated_at}
      ),
      do: updated_at

  def transform(:updated_at, _, _), do: nil

  def transform(
        :created_at,
        %Plug.Conn{assigns: %{session: %{user_id: user_id}}},
        %Image{profile: %Profile{user: %User{id: user_id}}, created_at: created_at}
      ),
      do: created_at

  def transform(:created_at, _, _), do: nil
end
