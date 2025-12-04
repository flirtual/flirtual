defmodule FlirtualWeb.Session do
  def init(opts), do: opts

  def call(conn, _opts) do
    same_site = Application.fetch_env!(:flirtual, FlirtualWeb.Session)[:same_site]
    secure = Application.fetch_env!(:flirtual, FlirtualWeb.Session)[:secure]
    domain = Application.fetch_env!(:flirtual, :root_origin) |> Map.get(:host)
    signing_salt = Application.fetch_env!(:flirtual, :session_signing_salt)

    runtime_opts = [
      store: :cookie,
      same_site: same_site,
      secure: secure,
      domain: domain,
      signing_salt: signing_salt,
      max_age: 3_888_000,
      key: "session"
    ]

    Plug.Session.call(conn, Plug.Session.init(runtime_opts))
  end
end
