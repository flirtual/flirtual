defmodule Flirtual.ObanWorkers.Email do
  use Oban.Worker, priority: 1, unique: [period: :infinity, states: [:available, :scheduled]]

  alias Flirtual.{Mailer, User}

  defp send_email(recipient, options) do
    with {:ok, _} <-
           ExRated.check_rate(
             "email",
             1000,
             Application.get_env(:flirtual, Flirtual.ObanWorkers)[:email_rate_limit]
           ),
         address <-
           (case recipient do
              %User{email: address} -> address
              address when is_binary(address) -> address
            end),
         {:ok, tokens, _} <- :smtp_rfc5322_scan.string(String.to_charlist(address)),
         {:ok, _} <- :smtp_rfc5322_parse.parse(tokens),
         {:ok, email} <- Mailer.send(recipient, options) do
      {:ok, email}
    else
      {:error, limit} when is_integer(limit) ->
        {:snooze, 1}

      {:error, %{code: "InvalidParameterValue", message: reason}} ->
        {:cancel, reason}

      {:error, {_, :smtp_rfc5322_parse, reason}} ->
        {:cancel, reason}

      {:error, reason} ->
        {:error, reason}

      reason ->
        reason
    end
  end

  @impl Oban.Worker
  def perform(%Oban.Job{
        args:
          %{
            "user_id" => user_id,
            "subject" => subject,
            "body_text" => body_text,
            "body_html" => body_html,
            "type" => type
          } = args
      }) do
    user = User.get(user_id)

    if Map.get(args, "reminder") == "true" and
         not user.preferences.email_notifications.reminders do
      :ok
    else
      send_email(
        user,
        from: Map.get(args, "from"),
        language: Map.get(args, "language", user.preferences.language),
        subject: subject,
        action_url: Map.get(args, "action_url"),
        unsubscribe_token: if(type === "marketing", do: user.unsubscribe_token),
        body_text: body_text,
        body_html: body_html
      )
    end
  end

  @impl Oban.Worker
  def perform(%Oban.Job{
        args:
          %{
            "to" => to,
            "subject" => subject,
            "body_text" => body_text,
            "body_html" => body_html
          } = args
      }) do
    send_email(
      to,
      from: Map.get(args, "from"),
      language: Map.get(args, "language"),
      subject: subject,
      body_text: body_text,
      body_html: body_html
    )
  end
end
