import Config

root_origin = URI.parse("https://flirtu.al")
origin = URI.parse("https://api.flirtu.al")

config :flirtual,
  origin: origin,
  root_origin: root_origin

config :flirtual, FlirtualWeb.Endpoint,
  url: [
    host: origin.host,
    port: origin.port
  ],
  http: [
    # Enable IPv6 and bind on all interfaces.
    # Set it to  {0, 0, 0, 0, 0, 0, 0, 1} for local network only access.
    # See the documentation on https://hexdocs.pm/plug_cowboy/Plug.Cowboy.html
    # for details about using IPv6 vs IPv4 and loopback vs public addresses.
    ip: {0, 0, 0, 0, 0, 0, 0, 0}
  ]

# Do not print debug messages in production
config :logger, level: :info
