defmodule FlirtualWeb.Session do
  def init(opts), do: opts

  def call(conn, _opts) do
    runtime_opts =
      [store: :cookie, same_site: "Lax", max_age: 3_888_000, key: "session"]
      |> Keyword.put(:domain, Application.fetch_env!(:flirtual, :root_origin) |> Map.get(:host))
      |> Keyword.put(:signing_salt, Application.fetch_env!(:flirtual, :session_signing_salt))

    Plug.Session.call(conn, Plug.Session.init(runtime_opts))
  end
end
