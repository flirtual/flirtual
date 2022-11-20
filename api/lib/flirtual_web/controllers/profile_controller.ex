defmodule FlirtualWeb.ProfileController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller

  alias FlirtualWeb.SessionController
  alias Flirtual.{Users, Profiles}

  action_fallback FlirtualWeb.FallbackController

  def update(conn, %{"user_id" => user_id} = params) do
    profile = Profiles.get_by_user_id(user_id)

    with {:ok, profile} <- Profiles.update(profile, params) do
      conn |> json(profile)
    end
  end

  def update_preferences(conn, %{"user_id" => user_id} = params) do
    profile = Profiles.get_by_user_id(user_id)

    with {:ok, preferences} <- Profiles.update_preferences(profile.preferences, params) do
      conn |> json(preferences)
    end
  end
end
