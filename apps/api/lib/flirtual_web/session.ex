defmodule FlirtualWeb.Session do
  def init(opts) do
    runtime_opts =
      opts
      |> Keyword.merge(
        store: :cookie,
        same_site: "Lax",
        max_age: 3_888_000,
        key: "session"
      )
      |> Keyword.put(:domain, Application.fetch_env!(:flirtual, :root_origin) |> Map.get(:host))
      |> Keyword.put(:signing_salt, Application.fetch_env!(:flirtual, :session_signing_salt))

    Plug.Session.init(runtime_opts)
  end

  def call(conn, opts) do
    Plug.Session.call(conn, opts)
  end
end
