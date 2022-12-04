defmodule FlirtualWeb.ProfileController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller

  alias Flirtual.{Policy,Profiles}
  alias Flirtual.User.{Profile}

  action_fallback FlirtualWeb.FallbackController

  def update(conn, %{"user_id" => user_id} = params) do
    profile = Profiles.get_by_user_id(user_id)

    with {:ok, profile} <- Profiles.update(profile, params) do
      conn |> json(profile)
    end
  end

  def get_personality(conn, %{"user_id" => user_id}) do
    personality = Profiles.get_personality_by_user_id(user_id)
    stub_profile = %Profile{ user_id: user_id }

    if is_nil(personality) or Policy.cannot?(conn, :read, stub_profile) do
      {:error, {:not_found, "User not found", Map.take(stub_profile, [:user_id])}}
    else
      conn |> json(personality)
    end
  end

  def update_personality(conn, %{"user_id" => user_id} = params) do
    profile = Profiles.get_by_user_id(user_id)

    with {:ok, personality} <- Profiles.update_personality(profile, params) do
      conn |> json(personality)
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
