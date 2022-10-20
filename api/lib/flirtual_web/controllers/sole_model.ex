defmodule FlirtualWeb.SoleModelController do
  use FlirtualWeb, :controller

  plug :put_layout, :sole_model

  def login(conn, _params) do
    render(conn, :login, page_title: "Login")
  end

  def register(conn, _params) do
    render(conn, :register, page_title: "Register")
  end

  def onboarding(conn, _params) do
    render(conn, :onboarding_1, page_title: "Matchmaking")
  end
end
