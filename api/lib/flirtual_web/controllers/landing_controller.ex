defmodule FlirtualWeb.LandingController do
  use FlirtualWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end

  def new(conn, _params) do
    render(conn, :new, page_title: "The First VR Dating App 💘🥽")
  end
end
