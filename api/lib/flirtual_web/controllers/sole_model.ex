defmodule FlirtualWeb.SoleModelController do
  use FlirtualWeb, :controller

  plug :put_layout, :sole_model

  def login(conn, _params) do
    render(conn, :login, page_title: "Login")
  end

  def register(conn, _params) do
    render(conn, :register, page_title: "Register")
  end
end
