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

  scope "/", FlirtualWeb do
    pipe_through :browser

    get "/", LandingController, :index
    get "/login", SoleModelController, :login
    get "/register", SoleModelController, :register
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

  scope "/api", FlirtualWeb do
    pipe_through :api

    scope "/v1/" do
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

  # Other scopes may use custom stacks.
  # scope "/api", FlirtualWeb do
  #   pipe_through :api
  # end

  # Enables LiveDashboard only for development
  #
  # If you want to use the LiveDashboard in production, you should put
  # it behind authentication and allow only admins to access it.
  # If your application does not have an admins-only section yet,
  # you can use Plug.BasicAuth to set up some basic authentication
  # as long as you are also using SSL (which you should anyway).
  if Mix.env() in [:dev, :test] do
    import Phoenix.LiveDashboard.Router

    scope "/" do
      pipe_through :browser

      live_dashboard "/dashboard", metrics: FlirtualWeb.Telemetry
    end
  end

  # Enables the Swoosh mailbox preview in development.
  #
  # Note that preview only shows emails that were sent by the same
  # node running the Phoenix server.
  if Mix.env() == :dev do
    scope "/dev" do
      pipe_through :browser

      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end

  ## Authentication routes

  scope "/", FlirtualWeb do
    pipe_through [:browser, :redirect_if_user_is_authenticated]

    get "/users/register", UserRegistrationController, :new
    post "/users/register", UserRegistrationController, :create
    get "/users/log_in", UserSessionController, :new
    post "/users/log_in", UserSessionController, :create
    get "/users/reset_password", UserResetPasswordController, :new
    post "/users/reset_password", UserResetPasswordController, :create
    get "/users/reset_password/:token", UserResetPasswordController, :edit
    put "/users/reset_password/:token", UserResetPasswordController, :update
  end

  scope "/", FlirtualWeb do
    pipe_through [:browser, :require_authenticated_user]

    get "/users/settings", UserSettingsController, :edit
    put "/users/settings", UserSettingsController, :update
    get "/users/settings/confirm_email/:token", UserSettingsController, :confirm_email
  end

  scope "/", FlirtualWeb do
    pipe_through [:browser]

    delete "/users/log_out", UserSessionController, :delete
    get "/users/confirm", UserConfirmationController, :new
    post "/users/confirm", UserConfirmationController, :create
    get "/users/confirm/:token", UserConfirmationController, :edit
    post "/users/confirm/:token", UserConfirmationController, :update
  end
end
