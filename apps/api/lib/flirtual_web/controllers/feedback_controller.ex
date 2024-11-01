defmodule FlirtualWeb.FeedbackController do
  use FlirtualWeb, :controller

  alias Flirtual.Users
  alias Flirtual.User.Profile.Image

  action_fallback(FlirtualWeb.FallbackController)

  def authenticated?(conn) do
    String.match?(conn.assigns[:authorization_token_type], ~r/bearer/i) and
      conn.assigns[:authorization_token] ==
        Application.fetch_env!(:flirtual, :feedback_access_token)
  end

  def feedback_profile(conn, %{"slug" => slug}) do
    if authenticated?(conn) do
      user = Users.get_by_slug(slug)

      case user do
        %{status: :visible, profile: profile} ->
          response = %{
            "bio" => profile.biography,
            # "prompts" =>
            #   profile.prompts
            #   |> Enum.map(fn prompt ->
            #     %{
            #       "question" => prompt.prompt.name,
            #       "answer" => prompt.response
            #     }
            #   end),
            # "interests" =>
            #   profile.attributes
            #   |> Enum.filter(fn attr ->
            #     attr.type == "interest"
            #   end)
            #   |> Enum.map(fn attr ->
            #     attr.name
            #   end),
            # "games" =>
            #   profile.attributes
            #   |> Enum.filter(fn attr ->
            #     attr.type == "game"
            #   end)
            #   |> Enum.map(fn attr ->
            #     attr.name
            #   end),
            "image_count" => length(profile.images),
            "image_url" => profile.images |> List.first() |> Image.url("profile")
          }

          conn
          |> json(response)

        _ ->
          conn
          |> put_status(:not_found)
          |> json(%{success: false})
      end
    else
      {:error, {:unauthorized, :invalid_access_token}}
    end
  end
end
