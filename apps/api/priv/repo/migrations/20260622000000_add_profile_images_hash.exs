defmodule Flirtual.Repo.Migrations.AddProfileImagesHash do
  use Ecto.Migration

  # 64-bit perceptual hash as a signed integer. Hamming distance bit_count((a # b)::bit(64)).
  def change do
    alter table(:profile_images) do
      add(:hash, :bigint)
    end
  end
end
