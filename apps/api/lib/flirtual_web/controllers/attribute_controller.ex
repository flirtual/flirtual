defmodule FlirtualWeb.AttributeController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller
  import FlirtualWeb.Utilities

  alias Flirtual.{Attribute, Policy, Repo}
  alias Flirtual.Attribute.Cache

  action_fallback(FlirtualWeb.FallbackController)

  def get(conn, %{"attribute_type" => attribute_type, "attribute_id" => attribute_id}) do
    attributes = Attribute.get(attribute_id, attribute_type)

    conn
    |> cache_control([:public, {"max-age", [day: 1]}])
    |> json_with_etag(attributes)
  end

  def list(conn, %{"attribute_type" => attribute_type}) do
    conn
    |> cache_control([:public, {"max-age", [day: 1]}])
    |> json_with_etag(Cache.list(attribute_type))
  end

  def index(conn, %{"type" => type}) do
    with :ok <- Policy.can(conn, :index, %Attribute{}, policy: Attribute.Policy),
         true <- Attribute.editable_type?(type) do
      conn |> json(Attribute.list(type: type))
    else
      false -> {:error, {:bad_request, :invalid_attribute_type}}
      value -> value
    end
  end

  def create(conn, params) do
    with :ok <- Policy.can(conn, :create, %Attribute{}, policy: Attribute.Policy),
         {:ok, attribute} <- Attribute.create(params) do
      conn |> json(Policy.transform(conn, attribute))
    end
  end

  def update(conn, %{"attribute_id" => attribute_id} = params) do
    with :ok <- Policy.can(conn, :update, %Attribute{}, policy: Attribute.Policy),
         {:ok, attribute} <- fetch(attribute_id),
         {:ok, attribute} <- Attribute.update(attribute, params) do
      conn |> json(Policy.transform(conn, attribute))
    end
  end

  def delete(conn, %{"attribute_id" => attribute_id}) do
    with :ok <- Policy.can(conn, :delete, %Attribute{}, policy: Attribute.Policy),
         {:ok, attribute} <- fetch(attribute_id),
         {:ok, _} <- Attribute.delete(attribute) do
      conn |> json(%{deleted: true})
    end
  end

  defp fetch(attribute_id) do
    with {:ok, _} <- Ecto.ShortUUID.dump(attribute_id),
         %Attribute{} = attribute <- Repo.get(Attribute, attribute_id) do
      {:ok, attribute}
    else
      _ -> {:error, {:not_found, :attribute_not_found}}
    end
  end
end
