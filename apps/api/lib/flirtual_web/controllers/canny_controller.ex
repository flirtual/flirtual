defmodule FlirtualWeb.CannyController do
  use FlirtualWeb, :controller

  alias Flirtual.Canny

  def login(conn, params) do
    case conn.assigns[:session] do
      nil ->
        next =
          Application.fetch_env!(:flirtual, :origin)
          |> URI.merge(current_url(conn))
          |> URI.to_string()
          |> URI.encode_www_form()

        redirect(conn,
          external:
            Application.fetch_env!(:flirtual, :frontend_origin)
            |> URI.merge("/login?next=#{next}")
            |> URI.to_string()
        )

      session ->
        {:ok, token} = Canny.create_token(session.user)
        company_id = Application.fetch_env!(:flirtual, Flirtual.Canny)[:company_id]
        to = Map.get(params, "redirect")

        redirect(conn,
          external:
            "https://canny.io/api/redirects/sso?companyID=#{company_id}&ssoToken=#{token}&redirect=#{to}"
        )
    end
  end
end
