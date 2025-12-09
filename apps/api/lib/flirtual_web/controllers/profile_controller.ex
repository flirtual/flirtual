defmodule FlirtualWeb.ProfileController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller
  import FlirtualWeb.Utilities

  alias Flirtual.User.Profile
  alias Flirtual.{Policy, Profiles, Users}

  action_fallback(FlirtualWeb.FallbackController)

  def update(conn, %{"user_id" => user_id} = params) do
    user = Users.get(user_id)
    profile = %Profile{user.profile | user: user}

    if is_nil(user) or Policy.cannot?(conn, :update, profile) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
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
      {:error, {:not_found, :user_not_found, Map.take(stub_profile, [:user_id])}}
    else
      conn |> json_with_etag(personality)
    end
  end

  def update_personality(conn, %{"user_id" => user_id} = params) do
    user = Users.get(user_id)
    profile = %Profile{user.profile | user: user}

    if is_nil(user) or Policy.cannot?(conn, :update, profile) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
    else
      with {:ok, profile} <- Profiles.update_personality(profile, params) do
        conn |> json(profile)
      end
    end
  end

  def update_preferences(conn, %{"user_id" => user_id} = params) do
    user = Users.get(user_id)
    profile = %Profile{user.profile | user: user}

    if is_nil(user) or Policy.cannot?(conn, :update, profile) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
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
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
    else
      custom_weights =
        (profile.custom_weights || %Profile.CustomWeights{})
        |> Map.put(:profile, profile)

      with {:ok, preferences} <- Profiles.update_custom_weights(custom_weights, params) do
        conn |> json(preferences)
      end
    end
  end

  def update_custom_filters(conn, %{"user_id" => user_id, "_json" => filters}) do
    user = Users.get(user_id)
    profile = %Profile{user.profile | user: user}

    if is_nil(user) or Policy.cannot?(conn, :update, profile) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
    else
      with {:ok, preferences} <- Profiles.update_custom_filters(profile, filters) do
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
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
    else
      with {:ok, profile} <- Profiles.update_colors(user.profile, params) do
        conn |> json(Policy.transform(conn, profile))
      end
    end
  end

  def create_images(conn, %{"user_id" => user_id, "_json" => files}) do
    user = Users.get(user_id)
    profile = %Profile{user.profile | user: user}

    if is_nil(user) or Policy.cannot?(conn, :update, profile) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
    else
      with {:ok, images} <- Profiles.create_images(profile, files) do
        conn |> json(Policy.transform(conn, images))
      end
    end
  end

  def update_images(conn, %{"user_id" => user_id, "_json" => image_ids}) do
    user = Users.get(user_id)
    profile = %Profile{user.profile | user: user}

    if is_nil(user) or Policy.cannot?(conn, :update, profile) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
    else
      with {:ok, images} <- Profiles.update_images(profile, image_ids) do
        conn |> json(Policy.transform(conn, images))
      end
    end
  end

  def update_prompts(conn, %{"user_id" => user_id, "_json" => prompts}) do
    user = Users.get(user_id)
    profile = %Profile{user.profile | user: user}

    if is_nil(user) or Policy.cannot?(conn, :update, profile) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
    else
      with {:ok, prompts} <-
             Profiles.update_prompts(profile, prompts) do
        conn |> json(prompts)
      end
    end
  end

  def update_geolocation(conn, %{"user_id" => user_id} = params) do
    user = Users.get(user_id)
    profile = %Profile{user.profile | user: user}

    if is_nil(user) or Policy.cannot?(conn, :update, profile) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
    else
      geolocation =
        case params do
          %{"longitude" => lon, "latitude" => lat} -> %{"longitude" => lon, "latitude" => lat}
          _ -> nil
        end

      case Profiles.update_geolocation(profile, geolocation) do
        {:ok, profile} ->
          conn |> json(%{success: true, geolocation: not is_nil(profile.longitude)})

        {:error, :geolocation_rate_limit} ->
          {:error, {:too_many_requests, :geolocation_rate_limit}}

        {:error, reason} ->
          {:error, reason}
      end
    end
  end

  def delete_geolocation(conn, %{"user_id" => user_id}) do
    user = Users.get(user_id)
    profile = %Profile{user.profile | user: user}

    if is_nil(user) or Policy.cannot?(conn, :update, profile) do
      {:error, {:forbidden, :missing_permission, %{user_id: user_id}}}
    else
      with {:ok, _} <- Profiles.update_geolocation(profile, nil) do
        conn |> json(%{success: true})
      end
    end
  end
end
