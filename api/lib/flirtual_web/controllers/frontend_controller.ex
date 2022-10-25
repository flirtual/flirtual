defmodule FlirtualWeb.FrontendController do
  use FlirtualWeb, :controller

  def index(conn, _params) do
    render(conn, :index, page_title: "The First VR Dating App 💘🥽")
  end
end
