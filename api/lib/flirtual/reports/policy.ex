defmodule Flirtual.Report.Policy do
  use Flirtual.Policy

  alias Flirtual.Report

  def authorize(
        :read,
        %Plug.Conn{
          assigns: %{
            session: %{
              user_id: user_id
            }
          }
        },
        %Report{
          user_id: user_id
        }
      ),
      do: true
end
