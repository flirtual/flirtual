defmodule FlirtualWeb.Session do
  def init(opts), do: opts

  def call(conn, _opts) do
    Plug.Session.call(conn, Plug.Session.init(options()))
  end

  def options do
    [
      store: :cookie,
      same_site: Application.fetch_env!(:flirtual, FlirtualWeb.Session)[:same_site],
      secure: Application.fetch_env!(:flirtual, FlirtualWeb.Session)[:secure],
      domain: Application.fetch_env!(:flirtual, :cookie_origin) |> Map.get(:host),
      signing_salt: Application.fetch_env!(:flirtual, :session_signing_salt),
      max_age: 3_888_000,
      key: "session"
    ]
  end
end
