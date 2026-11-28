defmodule FlirtualWeb.Presence do
  use Phoenix.Presence, otp_app: :flirtual, pubsub_server: Flirtual.PubSub
end
