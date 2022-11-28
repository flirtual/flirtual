defmodule FlirtualWeb.ProfileController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller

  alias Flirtual.{Profiles}

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

  def create_images(conn, %{"user_id" => user_id, "image_ids" => image_ids}) do
    profile = Profiles.get_by_user_id(user_id)

    with {:ok, images} <- Profiles.create_images(profile, image_ids) do
      conn |> json(images)
    end
  end

end
