defmodule Flirtual.ObanWorkers.Email do
  use Oban.Worker, priority: 1, unique: [period: :infinity, states: [:available, :scheduled]]

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
    case ExRated.check_rate(
           "email",
           1000,
           Application.get_env(:flirtual, Flirtual.ObanWorkers)[:email_rate_limit]
         ) do
      {:ok, _} ->
        user = User.get(user_id)
        from = Map.get(args, "from", "noreply@flirtu.al")
        action_url = Map.get(args, "action_url", nil)

        Mailer.send(
          user,
          from: from,
          subject: subject,
          action_url: action_url,
          body_text: body_text,
          body_html: body_html
        )

      {:error, _} ->
        {:snooze, 1}
    end
  end
end
