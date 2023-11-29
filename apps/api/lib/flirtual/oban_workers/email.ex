defmodule Flirtual.ObanWorkers.Email do
  use Oban.Worker, unique: [period: :infinity, states: [:available, :scheduled]]

  alias Flirtual.{Mailer, User}

  @impl Oban.Worker
  def perform(%Oban.Job{
        args:
          %{
            "user_id" => user_id,
            "subject" => subject,
            "body_text" => body_text,
            "body_html" => body_html
          } = args
      }) do
    user = User.get(user_id)
    from = Map.get(args, "from", nil)
    action_url = Map.get(args, "action_url", nil)

    Mailer.send(
      user,
      from: from,
      subject: subject,
      action_url: action_url,
      body_text: body_text,
      body_html: body_html
    )
  end
end
