defmodule FlirtualWeb.Router do
  use FlirtualWeb, :router

  import FlirtualWeb.UserAuth

  @internal_api_key "***REMOVED***"

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, {FlirtualWeb.LayoutView, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug :fetch_current_user
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  def require_internal_authorization(conn, _opts) do
    if List.first(Plug.Conn.get_req_header(conn, "api-key")) === @internal_api_key do
      conn
    else
      conn
      |> resp(:forbidden, "")
      |> halt()
    end
  end

  scope "/", FlirtualWeb do
    pipe_through :api

    scope "/v1/" do
      scope "/auth" do
        # pipe_through [:fetch_session, :fetch_current_user]

        scope "/session" do
          # pipe_through :require_authenticated_user
          get "/", SessionController, :get
          post "/", UserRegistrationController, :create
          delete "/", SessionController, :delete
        end
      end

      scope "/internal" do
        pipe_through :require_internal_authorization

        post "/seed", MatchmakingController, :seed

        scope "/user/:id" do
          post "/", MatchmakingController, :update
          get "/matches", MatchmakingController, :compute
          post "/like/:target_id", MatchmakingController, :like
          post "/pass/:target_id", MatchmakingController, :pass
          post "/block/:target_id", MatchmakingController, :block
        end
      end
    end
  end

  if Mix.env() == :dev do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser

      forward "/mailbox", Plug.Swoosh.MailboxPreview
      live_dashboard "/dashboard", metrics: FlirtualWeb.Telemetry
    end
  end
end
