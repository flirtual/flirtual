defmodule FlirtualWeb.Router do
  use FlirtualWeb, :router
  use Plug.ErrorHandler
  use Flirtual.Logger, :router

  import Phoenix.Router
  import Plug.Conn

  import FlirtualWeb.ErrorHelpers
  import FlirtualWeb.SessionController

  pipeline :api do
    plug(:accepts, ["json"])
  end

  def require_authenticated_user(conn, _opts) do
    if conn.assigns[:session] do
      conn
    else
      conn |> put_error(:unauthorized, :invalid_credentials) |> halt()
    end
  end

  def fetch_authorization_token(conn, _) do
    with authorization_header when is_list(authorization_header) <-
           get_req_header(conn, "authorization"),
         authorization_value when is_binary(authorization_value) <-
           List.first(authorization_header),
         [token_type, token] <- String.split(authorization_value, " ") do
      conn
      |> assign(:authorization_token_type, token_type)
      |> assign(:authorization_token, token)
    else
      _ ->
        conn
        |> put_error(:unauthorized, :invalid_credentials)
        |> halt()
    end
  end

  def require_valid_user(conn, _opts) do
    user = conn.assigns[:session].user

    if user.deactivated_at !== nil do
      conn
      |> put_error(:forbidden, :account_deactivated)
      |> halt()
    else
      conn
    end
  end

  scope "/", FlirtualWeb do
    pipe_through(:api)

    scope "/v1" do
      get("/config", ConfigController, :get)

      scope "/attributes" do
        scope "/:attribute_type" do
          get("/", AttributeController, :list)

          scope "/:attribute_id" do
            get("/", AttributeController, :get)
          end
        end
      end

      scope "/users" do
        get("/count", UsersController, :count)

        scope "/:user_id" do
          get("/preview", UsersController, :preview)
        end
      end

      scope "/images" do
        post("/", ImageController, :upload)

        scope "/variants" do
          pipe_through(:fetch_authorization_token)

          post("/", ImageController, :update_variants)
        end

        scope "/scan-queue" do
          pipe_through(:fetch_authorization_token)

          get("/", ImageController, :scan_queue)
          post("/", ImageController, :resolve_scan_queue)
        end

        scope "/:image_id" do
          get("/view", ImageController, :view)
        end
      end

      scope "/feedback" do
        pipe_through(:fetch_authorization_token)

        scope "/:slug" do
          get("/", FeedbackController, :feedback_profile)
        end
      end

      scope "/chargebee" do
        pipe_through(:fetch_authorization_token)

        post("/", ChargebeeController, :webhook)
      end

      scope "/revenuecat" do
        pipe_through(:fetch_authorization_token)

        post("/", RevenueCatController, :webhook)
      end

      scope "/unsubscribe" do
        get("/", UnsubscribeController, :get)
        post("/", UnsubscribeController, :post)
      end

      get("/health", HealthController, :health)
    end

    scope "/" do
      pipe_through([:fetch_session, :fetch_current_session])

      scope "/v1/" do
        scope "/session" do
          post("/", SessionController, :login)

          scope "/" do
            pipe_through(:require_authenticated_user)

            get("/", SessionController, :get)
            delete("/", SessionController, :delete)
          end
        end

        scope "/auth" do
          scope "/email/confirm" do
            post("/", UsersController, :confirm_email)

            scope "/" do
              pipe_through(:require_authenticated_user)

              delete("/", UsersController, :resend_confirm_email)
            end
          end

          scope "/password" do
            delete("/", UsersController, :reset_password)

            scope "/reset" do
              post("/", UsersController, :confirm_reset_password)
            end
          end

          scope "/passkey" do
            get("/registration-challenge", PasskeyController, :get_registration_challenge)
            get("/authentication-challenge", PasskeyController, :get_authentication_challenge)
            post("/", PasskeyController, :create)
            delete("/", PasskeyController, :delete)
            post("/authenticate", PasskeyController, :authenticate)
          end

          scope "/sudo" do
            pipe_through(:require_authenticated_user)

            post("/", SessionController, :sudo)
            delete("/", SessionController, :revoke_sudo)
          end

          scope "/sso" do
            scope "/canny" do
              get("/", CannyController, :login)
            end
          end

          scope "/verification" do
            post("/", SessionController, :verify)
            post("/resend", SessionController, :resend_verification)
          end
        end

        scope "/translate" do
          pipe_through([:require_authenticated_user])

          post("/", OpenAIController, :translate)
        end

        scope "/vrchat" do
          pipe_through([:require_authenticated_user])

          get("/worlds/search", VRChatController, :search_worlds)
          get("/worlds/:category", VRChatController, :get_worlds_by_category)

          # post("/instances", VRChatController, :create_instance)
        end

        scope "/connections" do
          get("/available", ConnectionController, :list_available)
          get("/authorize", ConnectionController, :authorize)
          get("/grant", ConnectionController, :grant)

          scope "/" do
            pipe_through(:require_authenticated_user)

            delete("/", ConnectionController, :delete)
          end
        end

        scope "/plans" do
          get("/", SubscriptionController, :list_plans)
        end

        scope "/images" do
          pipe_through(:require_authenticated_user)

          scope "/:image_id" do
            get("/", ImageController, :get)

            delete("/", ImageController, :delete)
          end
        end

        scope "/subscriptions" do
          pipe_through(:require_authenticated_user)

          get("/checkout", SubscriptionController, :checkout)
          get("/manage", SubscriptionController, :manage)
          post("/cancel", SubscriptionController, :cancel)
        end

        scope "/reports" do
          pipe_through([:require_authenticated_user, :require_valid_user])

          get("/", ReportController, :list)
          post("/", ReportController, :create)
          delete("/", ReportController, :delete)

          scope "/:report_id" do
            get("/", ReportController, :get)
            delete("/", ReportController, :delete)
          end
        end

        scope "/conversations" do
          pipe_through([:require_authenticated_user, :require_valid_user])

          get("/", ConversationController, :list)
          delete("/unread", ConversationController, :mark_read)
          post("/observe", ConversationController, :observe)

          scope "/:conversation_id" do
            get("/", ConversationController, :get)
            delete("/", ConversationController, :leave)
          end
        end

        scope "/queue" do
          pipe_through([:require_authenticated_user, :require_valid_user])
          get("/", MatchmakingController, :queue_information)
          get("/inspect", MatchmakingController, :inspect_query)

          post("/", MatchmakingController, :response)
          delete("/", MatchmakingController, :undo_response)
        end

        scope "/matches" do
          pipe_through([:require_authenticated_user, :require_valid_user])
          delete("/", MatchmakingController, :unmatch)
        end

        scope "/likes" do
          pipe_through([:require_authenticated_user, :require_valid_user])

          get("/", MatchmakingController, :list_likes)
          delete("/", MatchmakingController, :reset_likes)
        end

        scope "/passes" do
          pipe_through([:require_authenticated_user, :require_valid_user])
          delete("/", MatchmakingController, :reset_passes)
        end

        scope "/users" do
          post("/", UsersController, :create)
          delete("/", UsersController, :delete)

          scope "/" do
            pipe_through([:require_authenticated_user, :require_valid_user])

            get("/", UsersController, :search)
            post("/bulk", UsersController, :bulk)
          end

          scope "/:slug/name" do
            pipe_through([:require_authenticated_user, :require_valid_user])

            get("/", UsersController, :get)
          end

          scope "/:user_id" do
            pipe_through(:require_authenticated_user)

            get("/", UsersController, :get)
            get("/relationship", UsersController, :get_relationship)
            post("/", UsersController, :update)

            delete("/", UsersController, :admin_delete)

            get("/inspect", UsersController, :inspect)

            post("/deactivate", UsersController, :deactivate)
            delete("/deactivate", UsersController, :reactivate)

            post("/block", UsersController, :block)
            delete("/block", UsersController, :unblock)

            post("/suspend", UsersController, :suspend)
            delete("/suspend", UsersController, :unsuspend)

            post("/indef-shadowban", UsersController, :indef_shadowban)
            delete("/indef-shadowban", UsersController, :unindef_shadowban)

            post("/payments-ban", UsersController, :payments_ban)
            delete("/payments-ban", UsersController, :payments_unban)

            scope "/warn" do
              post("/", UsersController, :warn)
              delete("/", UsersController, :revoke_warn)
              put("/", UsersController, :acknowledge_warn)
            end

            scope "/note" do
              post("/", UsersController, :add_note)
              delete("/", UsersController, :remove_note)
            end

            scope "/email" do
              post("/", UsersController, :update_email)
            end

            post("/password", UsersController, :update_password)

            post("/push-token", UsersController, :add_push_token)
            delete("/push-count", UsersController, :reset_push_count)
            post("/rating-prompts", UsersController, :update_rating_prompts)

            scope "/preferences" do
              post("/", UsersController, :update_preferences)
              post("/privacy", UsersController, :update_privacy_preferences)
              post("/notifications", UsersController, :update_notifications_preferences)
            end

            scope "/profile" do
              post("/", ProfileController, :update)

              scope "/personality" do
                get("/", ProfileController, :get_personality)
                post("/", ProfileController, :update_personality)
              end

              post("/colors", ProfileController, :update_colors)

              scope "/images" do
                post("/", ProfileController, :update_images)
                put("/", ProfileController, :create_images)
              end

              post("/prompts", ProfileController, :update_prompts)
              post("/preferences", ProfileController, :update_preferences)
              post("/custom-weights", ProfileController, :update_custom_weights)
              post("/custom-filters", ProfileController, :update_custom_filters)
            end
          end
        end
      end
    end
  end

  if Mix.env() == :dev do
    pipeline :browser do
      plug(:accepts, ["html"])
      plug(:fetch_session)
      plug(:protect_from_forgery)
      plug(:put_secure_browser_headers)
    end

    scope "/dev" do
      pipe_through(:browser)

      forward("/mailbox", Plug.Swoosh.MailboxPreview)
    end
  end

  @impl Plug.ErrorHandler
  def handle_errors(conn, %{reason: %Phoenix.Router.NoRouteError{}}) do
    conn
    |> put_error(:not_found)
    |> halt()
  end

  @impl Plug.ErrorHandler
  def handle_errors(conn, %{reason: %Phoenix.ActionClauseError{}}) do
    conn
    |> put_error(:bad_request)
    |> halt()
  end

  @impl Plug.ErrorHandler
  def handle_errors(conn, %{reason: %Ecto.Query.CastError{}}) do
    conn
    |> put_error(:bad_request)
    |> halt()
  end

  @impl Plug.ErrorHandler
  def handle_errors(conn, params) do
    log(:critical, ["unhandled request error"], params)

    conn
    |> put_error(:internal_server_error)
    |> halt()
  end
end
