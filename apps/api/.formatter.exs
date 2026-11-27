[
  import_deps: [:ecto, :phoenix],
  inputs: [
    "*.{ex,exs}",
    "priv/*/*seeds.exs",
    "{config,lib}/**/*.{ex,exs}",
    "../../packages/data/mix.exs",
    "../../packages/data/lib/**/*.ex"
  ],
  subdirectories: ["priv/*/migrations"]
]
