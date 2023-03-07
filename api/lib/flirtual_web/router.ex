defmodule FlirtualWeb.Router do
  use FlirtualWeb, :router

  import Phoenix.Router
  import Plug.Conn

  import FlirtualWeb.ErrorHelpers
  import FlirtualWeb.SessionController

  @internal_api_key "***REMOVED***"

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, {FlirtualWeb.LayoutView, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
    plug :fetch_session
    plug :fetch_current_session
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

  def require_authenticated_user(conn, _opts) do
    if conn.assigns[:session] do
      conn
    else
      conn |> put_error(:unauthorized, "Missing credentials") |> halt()
    end
  end

  def require_valid_user(conn, _opts) do
    user = conn.assigns[:session].user

    if user.email_confirmed_at === nil do
      conn
      |> put_error(:forbidden, "Email verification required")
      |> halt()
    else
      if user.deactivated_at !== nil do
        conn
        |> put_error(:forbidden, "User account deactivated")
        |> halt()
      else
        conn
      end
    end
  end

  scope "/", FlirtualWeb do
    pipe_through :api

    scope "/v1/" do
      scope "/auth" do
        scope "/session" do
          post "/", SessionController, :create

          scope "/" do
            pipe_through :require_authenticated_user

            get "/", SessionController, :get
            delete "/", SessionController, :delete
          end
        end

        scope "/sudo" do
          post "/", SessionController, :sudo
          delete "/", SessionController, :revoke_sudo
        end

        scope "/user" do
          pipe_through :require_authenticated_user

          get "/", UsersController, :get_current_user
        end

        scope "/connect/:connection_type" do
          pipe_through([:require_authenticated_user])

          get "/authorize", UsersController, :start_connection
          get "/", UsersController, :assign_connection
        end
      end

      scope "/reports" do
        pipe_through([:require_authenticated_user, :require_valid_user])

        get "/", ReportController, :list
        post "/", ReportController, :create
      end

      scope "/conversations" do
        pipe_through([:require_authenticated_user, :require_valid_user])

        get "/", ConversationController, :list
        get "/unread", ConversationController, :list_unread

        scope "/:user_id" do
          get "/", ConversationController, :list_messages
          post "/", ConversationController, :create
        end
      end

      scope "/prospects" do
        pipe_through([:require_authenticated_user, :require_valid_user])

        get "/", MatchmakingController, :list_prospects
        get "/inspect", MatchmakingController, :inspect_query

        post "/respond", MatchmakingController, :respond
      end

      scope "/users" do
        post "/", UsersController, :create

        post "/bulk", UsersController, :bulk

        scope "/:username/username" do
          pipe_through([:require_authenticated_user, :require_valid_user])

          get "/", UsersController, :get
        end

        scope "/:user_id" do
          pipe_through :require_authenticated_user

          get "/", UsersController, :get
          post "/", UsersController, :update

          get "/visible", UsersController, :visible

          post "/deactivate", UsersController, :deactivate
          delete "/deactivate", UsersController, :reactivate

          scope "/email" do
            post "/", UsersController, :update_email

            scope "/confirm" do
              post "/", UsersController, :confirm_email
              post "/resend", UsersController, :resend_confirm_email
            end
          end

          post "/password", UsersController, :update_password

          get "/connections", UsersController, :list_connections

          scope "/preferences" do
            post "/", UsersController, :update_preferences
            post "/privacy", UsersController, :update_privacy_preferences
            post "/notifications", UsersController, :update_notifications_preferences
          end

          scope "/profile" do
            post "/", ProfileController, :update

            scope "/personality" do
              get "/", ProfileController, :get_personality
              post "/", ProfileController, :update_personality
            end

            scope "/images" do
              post "/", ProfileController, :update_images
              put "/", ProfileController, :create_images
            end

            post "/preferences", ProfileController, :update_preferences
            post "/custom-weights", ProfileController, :update_custom_weights
          end
        end
      end

      scope "/attributes" do
        scope "/:attribute_type" do
          get "/", AttributeController, :list
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

  match :*, "/*any", FlirtualWeb.FallbackController, :not_found
end
