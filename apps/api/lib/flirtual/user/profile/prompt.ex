defmodule Flirtual.User.Profile.Prompt do
  use Flirtual.Schema, primary_key: false

  import Ecto.Query

  alias Flirtual.Attribute
  alias Flirtual.User.Profile
  alias Flirtual.User.Profile.Prompt

  schema "profile_prompts" do
    belongs_to(:profile, Profile, references: :user_id, primary_key: true)
    belongs_to(:prompt, Attribute, references: :id, primary_key: true)
    field(:response, :string)
    field(:order, :integer)
  end

  def default_assoc do
    from(prompt in Prompt, order_by: [asc: :order], preload: [:prompt])
  end

  defimpl Jason.Encoder do
    use Flirtual.Encoder,
      only: [
        :prompt,
        :response
      ]
  end
end
