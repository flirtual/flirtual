defmodule Flirtual.ObanWorkers.Email do
  use Oban.Worker, unique: [period: :infinity, states: [:available, :scheduled]]

  alias Flirtual.{Mailer, User}

  @impl Oban.Worker
  def perform(%Oban.Job{
        args: %{
          "user_id" => user_id,
          "subject" => subject,
          "action_url" => action_url,
          "body_text" => body_text,
          "body_html" => body_html
        }
      }) do
    user = User.get(user_id)

    Mailer.send(
      user,
      subject: subject,
      action_url: action_url,
      body_text: body_text,
      body_html: body_html
    )
  end
end
