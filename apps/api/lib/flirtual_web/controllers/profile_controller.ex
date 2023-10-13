defmodule FlirtualWeb.ProfileController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller
  import FlirtualWeb.Utilities

  alias Flirtual.{Policy, Users, Profiles}
  alias Flirtual.User.{Profile}

  action_fallback(FlirtualWeb.FallbackController)

  def update(conn, %{"user_id" => user_id} = params) do
    user = Users.get(user_id)
    profile = %Profile{user.profile | user: user}

    if is_nil(user) or Policy.cannot?(conn, :update, profile) do
      {:error, {:forbidden, "Cannot update this user's profile", %{user_id: user_id}}}
    else
      with {:ok, profile} <-
             Profiles.update(profile, params,
               required: split_to_atom_list(params["required"]),
               required_attributes: split_to_atom_list(params["required_attributes"])
             ) do
        conn |> json(Policy.transform(conn, profile))
      end
    end
  end

  def get_personality(conn, %{"user_id" => user_id}) do
    personality = Profiles.get_personality_by_user_id(user_id)
    stub_profile = %Profile{user_id: user_id}

    if is_nil(personality) or Policy.cannot?(conn, :read, stub_profile) do
      {:error, {:not_found, "User not found", Map.take(stub_profile, [:user_id])}}
    else
      conn |> json_with_etag(personality)
    end
  end

  def update_personality(conn, %{"user_id" => user_id} = params) do
    user = Users.get(user_id)
    profile = %Profile{user.profile | user: user}

    if is_nil(user) or Policy.cannot?(conn, :update, profile) do
      {:error, {:forbidden, "Cannot update this profile's personality", %{user_id: user_id}}}
    else
      with {:ok, personality} <- Profiles.update_personality(profile, params) do
        conn |> json(personality)
      end
    end
  end

  def update_preferences(conn, %{"user_id" => user_id} = params) do
    user = Users.get(user_id)
    profile = %Profile{user.profile | user: user}

    if is_nil(user) or Policy.cannot?(conn, :update, profile) do
      {:error, {:forbidden, "Cannot update this profile's preferences", %{user_id: user_id}}}
    else
      with {:ok, preferences} <-
             Profiles.update_preferences(profile.preferences, params,
               required: split_to_atom_list(params["required"]),
               required_attributes: split_to_atom_list(params["required_attributes"])
             ) do
        conn |> json(preferences)
      end
    end
  end

  def update_custom_weights(conn, %{"user_id" => user_id} = params) do
    user = Users.get(user_id)
    profile = %Profile{user.profile | user: user}

    if is_nil(user) or Policy.cannot?(conn, :update, profile) do
      {:error, {:forbidden, "Cannot update this profile's custom weights", %{user_id: user_id}}}
    else
      custom_weights =
        (profile.custom_weights || %Profile.CustomWeights{})
        |> Map.put(:profile, profile)

      with {:ok, preferences} <- Profiles.update_custom_weights(custom_weights, params) do
        conn |> json(preferences)
      end
    end
  end

  def update_colors(conn, %{"user_id" => user_id} = params) do
    user =
      if(conn.assigns[:session].user.id === user_id,
        do: conn.assigns[:session].user,
        else: Users.get(user_id)
      )

    if is_nil(user) or Policy.cannot?(conn, :update_colors, user.profile) do
      {:error, {:forbidden, "Cannot update this user's profile colors", %{user_id: user_id}}}
    else
      with {:ok, profile} <- Profiles.update_colors(user.profile, params) do
        conn |> json(Policy.transform(conn, profile))
      end
    end
  end

  def create_images(conn, %{"user_id" => user_id, "_json" => file_ids}) do
    user = Users.get(user_id)
    profile = %Profile{user.profile | user: user}

    if is_nil(user) or Policy.cannot?(conn, :update, profile) do
      {:error, {:forbidden, "Cannot add images to this profile", %{user_id: user_id}}}
    else
      with {:ok, images} <- Profiles.create_images(profile, file_ids) do
        conn |> json(Policy.transform(conn, images))
      end
    end
  end

  def update_images(conn, %{"user_id" => user_id, "_json" => image_ids}) do
    user = Users.get(user_id)
    profile = %Profile{user.profile | user: user}

    if is_nil(user) or Policy.cannot?(conn, :update, profile) do
      {:error, {:forbidden, "Cannot update this profile's images", %{user_id: user_id}}}
    else
      with {:ok, images} <- Profiles.update_images(profile, image_ids) do
        conn |> json(Policy.transform(conn, images))
      end
    end
  end
end
