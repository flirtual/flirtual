defmodule FlirtualWeb.DataControllerTest do
  use ExUnit.Case, async: false

  import Phoenix.ConnTest

  alias Flirtual.Data.Game

  @endpoint FlirtualWeb.Endpoint

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Flirtual.Repo)
    :ets.delete(:popularity, Game)
    :ok
  end

  defp ids(path), do: build_conn() |> get(path) |> json_response(200) |> Enum.map(& &1["id"])

  test "orders curated entries first by default" do
    assert ids("/v1/relationships") == ["serious", "vr", "hookups", "friends"]
  end

  test "puts curated entries first, then the rest by name" do
    assert Enum.take(ids("/v1/games"), 7) ==
             ["vrchat", "resonite", "chilloutvr", "roblox", "cluster", "aces_of_thunder", "after_the_fall"]
  end

  test "orders by name in the requested locale" do
    # Casual dating, Hookups, New friends, Serious dating
    assert ids("/v1/relationships?order=name") == ["vr", "hookups", "friends", "serious"]
    # Ernsthaftes Dating, Hookups, Lockeres Dating, Neue Freundschaften
    assert ids("/v1/relationships?order=name&locale=de") == ["serious", "hookups", "vr", "friends"]
  end

  test "reverses a key prefixed with -" do
    assert ids("/v1/relationships?order=-curated") == ["friends", "hookups", "vr", "serious"]
    assert ids("/v1/relationships?order=-name") == ["serious", "friends", "hookups", "vr"]
  end

  test "orders games by popularity, most popular first with -popularity" do
    :ets.insert(:popularity, {Game, %{"statik" => 100, "vrchat" => 50}})

    assert ["statik", "vrchat" | _] = ids("/v1/games?order=-popularity,name")
  end

  test "refuses a key it doesn't know, or popularity for a file without it" do
    assert build_conn() |> get("/v1/games?order=random") |> json_response(400)
    assert build_conn() |> get("/v1/games?order=") |> json_response(400)
    assert build_conn() |> get("/v1/genders?order=popularity") |> json_response(400)
  end

  # A file whose text fails to format, or that has no route, would break here.
  test "serves every file meta.json gives an endpoint, in every locale" do
    for module <- Flirtual.Data.modules(),
        function_exported?(module, :endpoint, 0),
        query <- ["", "?locale=de"] do
      assert [%{"id" => _} | _] = build_conn() |> get("/v1/#{module.file()}#{query}") |> json_response(200)
    end
  end

  test "refuses a locale it doesn't ship" do
    assert build_conn() |> get("/v1/genders?locale=xx") |> json_response(400)
  end
end
