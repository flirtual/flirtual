defmodule Flirtual.Report do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.Report.Policy

  require Flirtual.Utilities
  import Flirtual.Utilities

  import Flirtual.Attribute, only: [validate_attribute: 3]

  import Ecto.Changeset
  import Ecto.Query
  import Flirtual.Utilities.Changeset

  alias Flirtual.{User, Attribute, Report, Repo}
  alias Flirtual.User.ChangeQueue

  @derive [
    {Jason.Encoder,
     only: [
       :id,
       :reason,
       :message,
       :user_id,
       :target_id,
       :updated_at,
       :created_at
     ]},
    {Inspect, only: [:id, :user_id, :target_id, :reason]}
  ]

  schema "reports" do
    field :message, :string

    belongs_to :user, User
    belongs_to :target, User
    belongs_to :reason, Attribute

    timestamps(inserted_at: :created_at)
  end

  def default_assoc() do
    [:reason]
  end

  def changeset(%Report{} = report, attrs) do
    cast(report, attrs, [:user_id, :target_id, :reason_id, :message])
    |> validate_required(:user_id)
    |> validate_uuid(:user_id)
    |> foreign_key_constraint(:user_id)
    |> validate_required(:target_id)
    |> validate_uuid(:target_id)
    |> foreign_key_constraint(:target_id)
    |> then(
      &validate_change(&1, :target_id, fn _, target_id ->
        if(target_id === get_change(&1, :user_id),
          do: [target_id: "cannot report yourself"],
          else: []
        )
      end)
    )
    |> validate_required(:reason_id)
    |> validate_attribute(:reason_id, "report-reason")
    |> validate_required(:message)
    |> validate_length(:message, min: 8, max: 256)
  end

  def create(attrs) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    Repo.transaction(fn ->
      with {:ok, report} <- %Report{} |> changeset(attrs) |> Repo.insert(),
           %User{} = target_user <- User.get(report.target_id),
           existing_unique_reports <-
             list(target_id: target_user.id)
             |> Enum.map(& &1.user_id)
             |> MapSet.new()
             |> MapSet.to_list(),
           {:ok, _} <-
             if(length(existing_unique_reports) < 2,
               do: {:ok, nil},
               else:
                 target_user
                 |> change(%{
                   shadowbanned_at: now
                 })
                 |> Repo.update()
             ),
           {:ok, _} <- ChangeQueue.add(target_user.id) do
        report |> Repo.preload(default_assoc())
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def validate_query(changeset, field, query) do
    validate_change(changeset, field, fn field, value ->
      if not Repo.exists?(query.(value)) do
        [{field, "does not exist"}]
      else
        []
      end
    end)
  end

  def validate_queries(changeset, queries) do
    Enum.reduce(queries, changeset, fn {field, query}, changeset ->
      validate_query(changeset, field, query)
    end)
  end

  def list(target_id: target_id) when is_uuid(target_id) do
    Report |> where(target_id: ^target_id) |> Repo.all()
  end

  def list(attrs) do
    with {:ok, _} <-
           cast_arbitrary(
             %{
               reason_id: :string,
               target_id: :string,
               user_id: :string
             },
             attrs
           )
           |> validate_attribute(:reason_id, "report-reason")
           |> validate_uuid(:target_id)
           |> validate_uuid(:user_id)
           |> validate_queries(
             target_id: &where(User, id: ^&1),
             user_id: &where(User, id: ^&1)
           )
           |> apply_action(:read) do
      {:ok, Report |> preload(^default_assoc()) |> Repo.all()}
    end
  end
end
