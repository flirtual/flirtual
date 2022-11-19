defmodule Flirtual.Target do
  defmacro __using__(opts) do
    quote bind_quoted: [opts: opts] do
      if policy = Keyword.get(opts, :policy) do
        defdelegate authorize(action, session, params), to: policy
        defdelegate transform(key, conn, params), to: policy
        defdelegate transform(conn, params), to: policy
      end
    end
  end
end
