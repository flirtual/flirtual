defmodule FlirtualWeb.Router do
  use FlirtualWeb, :router

  import Phoenix.Router
  import Plug.Conn

  import FlirtualWeb.ErrorHelpers
  import FlirtualWeb.SessionController

  pipeline :api do
    plug :accepts, ["json"]
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

    scope "/v1" do
      scope "/attributes" do
        scope "/:attribute_type" do
          get "/", AttributeController, :list

          scope "/:attribute_id" do
            get "/", AttributeController, :get
          end
        end
      end
    end

    scope "/" do
      pipe_through [:fetch_session, :fetch_current_session]

      scope "/v1/" do
        scope "/auth" do
          scope "/session" do
            post "/", SessionController, :login

            scope "/" do
              pipe_through :require_authenticated_user

              get "/", SessionController, :get
              delete "/", SessionController, :delete
            end
          end

          scope "/email/confirm" do
            post "/", UsersController, :confirm_email

            scope "/" do
              pipe_through :require_authenticated_user

              delete "/", UsersController, :resend_confirm_email
            end
          end

          scope "/password" do
            delete "/", UsersController, :reset_password

            scope "/reset" do
              post "/", UsersController, :confirm_reset_password
            end
          end

          scope "/sudo" do
            pipe_through :require_authenticated_user

            post "/", SessionController, :sudo
            delete "/", SessionController, :revoke_sudo
          end

          scope "/user" do
            pipe_through :require_authenticated_user

            get "/", UsersController, :get_current_user
            delete "/", UsersController, :delete
          end

          scope "/sso" do
            pipe_through :require_authenticated_user

            scope "/canny" do
              get "/", CannyController, :create_token
            end
          end
        end

        post "/evaluate", DebugController, :evaluate
        get "/error", DebugController, :error

        scope "/vrchat" do
          pipe_through([:require_authenticated_user])

          get "/search", VRChatController, :search
        end

        scope "/connections" do
          pipe_through([:require_authenticated_user])

          get "/available", ConnectionController, :list_available

          get "/authorize", ConnectionController, :authorize
          get "/grant", ConnectionController, :grant
        end

        scope "/plans" do
          pipe_through :require_authenticated_user

          get "/", SubscriptionController, :list_plans
        end

        scope "/images" do
          pipe_through :require_authenticated_user

          scope "/:image_id" do
            get "/", ImageController, :get
            get "/view", ImageController, :view

            delete "/", ImageController, :delete
          end
        end

        scope "/subscriptions" do
          pipe_through :require_authenticated_user

          get "/checkout", SubscriptionController, :checkout
          get "/manage", SubscriptionController, :manage
        end

        scope "/reports" do
          pipe_through([:require_authenticated_user, :require_valid_user])

          get "/", ReportController, :list
          post "/", ReportController, :create
          delete "/", ReportController, :delete

          scope "/:report_id" do
            delete "/", ReportController, :delete
          end
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
          delete "/", MatchmakingController, :reset_prospects

          get "/inspect", MatchmakingController, :inspect_query

          post "/respond", MatchmakingController, :respond
          delete "/respond", MatchmakingController, :reverse_respond
        end

        scope "/matches" do
          pipe_through([:require_authenticated_user, :require_valid_user])

          get "/", MatchmakingController, :list_matches
          delete "/", MatchmakingController, :unmatch
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
            get "/inspect", UsersController, :inspect

            post "/deactivate", UsersController, :deactivate
            delete "/deactivate", UsersController, :reactivate

            post "/block", UsersController, :block
            delete "/block", UsersController, :unblock

            post "/suspend", UsersController, :suspend
            delete "/suspend", UsersController, :unsuspend

            scope "/email" do
              post "/", UsersController, :update_email
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
      end
    end
  end

  if Mix.env() == :dev do
    pipeline :browser do
      plug :accepts, ["html"]
      plug :fetch_session
      plug :protect_from_forgery
      plug :put_secure_browser_headers
    end

    scope "/dev" do
      pipe_through :browser

      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
