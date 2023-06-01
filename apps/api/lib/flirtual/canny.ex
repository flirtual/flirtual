defmodule Flirtual.Canny do
  alias Flirtual.Jwt
  alias Flirtual.User

  defp config(key) do
    Application.get_env(:flirtual, Flirtual.Canny)[key]
  end

  def create_token(%User{} = user) do
    Jwt.config("canny")
    |> Jwt.sign(
      %{
        "avatarURL" => User.avatar_url(user),
        "email" => user.email,
        "id" => user.id,
        "name" => User.display_name(user)
      },
      config(:access_token),
      "HS256"
    )
  end
end
