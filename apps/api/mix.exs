defmodule Flirtual.MixProject do
  use Mix.Project

  def project do
    [
      app: :flirtual,
      version: "0.1.0",
      elixir: "~> 1.17",
      elixirc_paths: elixirc_paths(Mix.env()),
      compilers: Mix.compilers(),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps()
    ]
  end

  # Configuration for the OTP application.
  #
  # Type `mix help compile.app` for more information.
  def application do
    [
      mod: {Flirtual.Application, []},
      extra_applications: [:logger, :runtime_tools, :ecto_sql]
    ]
  end

  # Specifies which paths to compile per environment.
  defp elixirc_paths(_), do: ["lib"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [
      {:bcrypt_elixir, "~> 3.0"},
      {:phoenix, "~> 1.7.0"},
      {:phoenix_view, "~> 2.0"},
      {:bodyguard, "~> 2.4"},
      {:phoenix_ecto, "~> 4.4"},
      {:plug_redirect, "~> 1.0"},
      {:cors_plug, "~> 3.0"},
      {:shortuuid, "~> 2.0"},
      {:ecto_shortuuid, "~> 0.2"},
      {:ecto_sql, "~> 3.10"},
      {:postgrex, ">= 0.0.0"},
      {:oban, "~> 2.16"},
      {:timex, "~> 3.7"},
      {:ex_rated, "~> 2.1"},
      {:paginator, "~> 1.2.0"},
      {:fly_postgres, "~> 0.3.4"},
      {:redisgraph, "~> 0.1.0"},
      {:elasticsearch, "~> 1.1.0"},
      {:stripity_stripe, "~> 3.1.1"},
      {:chargebeex, "~> 0.4.0"},
      {:phoenix_html, "~> 4.1.1"},
      {:faker, "~> 0.17"},
      {:recase, "~> 0.5"},
      {:swoosh, "~> 1.3"},
      {:openai, "~> 0.6.1"},
      {:leaked_passwords, "~> 1.0"},
      {:phoenix_swoosh, "~> 1.0"},
      {:gen_smtp, "~> 1.2"},
      {:goth, "~> 1.4"},
      {:pigeon, "~> 2.0.1"},
      {:wax_, "~> 0.6.0"},
      {:httpoison, "~> 2.0", override: true},
      {:tls_certificate_check, "~> 1.20"},
      {:finch, "~> 0.18.0"},
      {:telemetry_metrics, "~> 1.0"},
      {:telemetry_poller, "~> 1.0"},
      {:gettext, "~> 0.18"},
      {:poison, "~> 6.0"},
      {:jason, "~> 1.4"},
      {:joken, "~> 2.5"},
      {:sentry, "~> 10.6.2"},
      {:bandit, "~> 1.6"},
      {:libcluster, "~> 3.3"},
      {:floki, "~> 0.36.0"},
      {:fast_html, "~> 2.0"},
      {:ex_check, "~> 0.16.0", only: [:dev], runtime: false},
      {:credo, "~> 1.7", only: [:dev, :test], runtime: false},
      {:kadabra, "~> 0.6"},
      {:vrchat, "~> 1.20.0"}
    ]
  end

  # Aliases are shortcuts or tasks specific to the current project.
  # For example, to install project dependencies and perform other setup tasks, run:
  #
  #     $ mix setup
  #
  # See the documentation for `Mix` for more info on aliases.
  defp aliases do
    [
      setup: ["deps.get", "ecto.setup"],
      "ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
      "ecto.reset": ["ecto.drop", "ecto.setup"]
    ]
  end
end
