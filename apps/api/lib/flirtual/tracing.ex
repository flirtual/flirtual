defmodule Tracing do
  @moduledoc """
  Tracing features for elixir apps.

  Just call `use Tracing` in a module and you're good to go.

  You'll probably just need to use the `span` functions, as the other functions
  are here just for compatibility. Check the `Usage` section below.

  All other functions in this module have the same name and arity from
  `OpenTelemetry.Tracer`. Whenever possible, these functions will actually be
  `defdelegate`. When not possible, this means that some quality-of-life was
  added before calling the corresponding `OpenTelemetry.Tracer` function.

  ## Usage

  When you `use Tracing` it will include all required modules to start
  using tracing, as well as importing the `span/1`, `span/2` and `span/3`
  functions.

  ```elixir
  defmodule MyModule do
    use Tracing

    def my_function do
      span do
        # ... some code here
      end
    end
  end
  ```

  ## On Span Names

  By default, if no name is specified, the generated span name will include the
  module, function name and function arity.

  ```
  MyApp.Portal.Users.create/1
  ```

  When adding custom names, keep in mind the official guideline for span names.

  The span name concisely identifies the work represented by the Span, for
  example, an RPC method name, a function name, or the name of a subtask or
  stage within a larger computation. The span name SHOULD be the most general
  string that identifies a (statistically) interesting class of Spans, rather
  than individual Span instances while still being human-readable. That is,
  “get_user” is a reasonable name, while “get_user/314159”, where “314159” is a
  user ID, is not a good name due to its high cardinality. Generality SHOULD be
  prioritized over human-readability, like “get_account/{accountId}”.
  """
  require OpenTelemetry.Tracer

  defguard is_ast(value) when is_tuple(value) and tuple_size(value) == 3
  defguard valid_opts(opts) when is_map(opts) or is_ast(opts)
  defguard valid_name(name) when is_binary(name) or is_nil(name) or is_ast(name)

  @doc """
  Setup the target module to use tracing tools.

  It will also import the `span` function for a quickstart.
  """
  defmacro __using__(_opts) do
    quote do
      require OpenTelemetry.Tracer

      require unquote(__MODULE__)
      import unquote(__MODULE__), only: [span: 1, span: 2, span: 3]
    end
  end

  @doc """
  This is a custom and simpler version of `with_span`.

  The order of parameters is slightly different in order to favour automatic
  name generation.

  - start_opts: a map with starting options. Check the `start_otps/1` function
    for more information
  - name: a string with the name of the span (default to nil). When nil, the
    name will be automatically generated based on the caller context (module +
    function)

  Creates a new span which is set to the currently active Span in the Context of
  the block. The Span is ended automatically when the `block` completes and the
  Context is what it was before the block.

  If the name is `nil`, a span name is automatically generated based on the
  module and function that started the span, like
  `MyApp.Portal.Users.create/1`.
  """
  defmacro span(start_opts \\ quote(do: %{}), name \\ nil, do: block)
           when valid_opts(start_opts) and valid_name(name) do
    name = name || gen_span_name(__CALLER__)

    quote do
      __MODULE__
      |> :opentelemetry.get_application_tracer()
      |> :otel_tracer.with_span(
        unquote(name),
        unquote(start_opts),
        fn ctx ->
          try do
            unquote(block)
          rescue
            e ->
              type =
                e
                |> Map.get(:__struct__)
                |> to_string()
                |> String.replace("Elixir.", "")

              attrs = %{
                "type" => type,
                "message" => Exception.message(e),
                "stacktrace" => Exception.format_stacktrace(__STACKTRACE__)
              }

              Tracing.set_attributes("exception", attrs)
              OpenTelemetry.Tracer.set_status(:error, "exception")
              :otel_span.end_span(ctx)
              reraise e, __STACKTRACE__
          end
        end
      )
    end
  end

  defp gen_span_name(caller) do
    {function, arity} = caller.function

    base_name =
      caller.module
      |> Atom.to_string()
      |> String.replace("Elixir.", "")
      |> String.replace("/", ".")

    base_name <> ".#{function}/#{arity}"
  end

  @doc """
  Generate a valid start_opts map to start a trace.

  When overriding, make sure that the value is correct, as this function does
  not perform any checks.

  Accepted keys: :kind, :attributes, :links, :start_time, and :is_recording.
  """
  @spec build_span_opts(Keyword.t()) :: map()
  def build_span_opts(opts \\ []) do
    opts
    |> Keyword.take([:kind, :attributes, :links, :start_time, :is_recording])
    |> Map.new()
  end

  # Simple guard to detect if a variable is a set of values or not
  defguardp is_set(value) when is_map(value) or is_list(value) or is_tuple(value)

  @doc """
  End the currently active Span and sets its end timestamp.
  This has no effect on any child Spans that may exist of this Span.

  To end a specific span, see `OpenTelemetry.Span.end_span/1`.

  The Span in the current Context has its `is_recording` set to `false`.
  """
  @spec end_span(:opentelemetry.timestamp() | :undefined) ::
          :opentelemetry.span_ctx() | :undefined
  defdelegate end_span(timestamp \\ :undefined), to: OpenTelemetry.Tracer

  @doc """
  Starts a new span and does not make it the current active span of the current
  process.

  The current active Span is used as the parent of the created Span.

  A Span represents a single operation within a trace. Spans can be nested to
  form a trace tree. Each trace contains a root span, which typically describes
  the entire operation and, optionally, one or more sub-spans for its
  sub-operations.

  Referece:
  https://opentelemetry.io/docs/reference/specification/trace/api/#span
  """
  defmacro start_span(name, opts) do
    opts =
      opts
      |> enumerable_to_attrs()
      |> Macro.escape()

    quote bind_quoted: [name: name, start_opts: opts] do
      __MODULE__
      |> :opentelemetry.get_application_tracer()
      |> :otel_tracer.start_span(
        name,
        Map.new(start_opts)
      )
    end
  end

  @doc """
  Starts a new span and does not make it the current active span of the current
  process.

  The current active Span is used as the parent of the created Span.

  A Span represents a single operation within a trace. Spans can be nested to
  form a trace tree. Each trace contains a root span, which typically describes
  the entire operation and, optionally, one or more sub-spans for its
  sub-operations.

  Referece:
  https://opentelemetry.io/docs/reference/specification/trace/api/#span
  """
  defmacro start_span(ctx, name, opts) do
    opts =
      opts
      |> enumerable_to_attrs()
      |> Macro.escape()

    quote bind_quoted: [ctx: ctx, name: name, start_opts: opts] do
      :otel_tracer.start_span(
        ctx,
        :opentelemetry.get_application_tracer(__MODULE__),
        name,
        Map.new(start_opts)
      )
    end
  end

  @doc """
  Takes a `t:OpenTelemetry.span_ctx/0` and the Tracer sets it to the currently
  active Span.
  """
  @spec set_current_span(:opentelemetry.span_ctx() | :undefined) ::
          :opentelemetry.span_ctx() | :undefined
  defdelegate set_current_span(span_context), to: OpenTelemetry.Tracer

  @doc """
  Takes a `t:OpenTelemetry.Ctx.t/0` and the `t:OpenTelemetry.span_ctx/0` and the
  Tracer sets it to the current span in the pass Context.
  """
  @spec set_current_span(:otel_ctx.t(), :opentelemetry.span_ctx() | :undefined) :: :otel_ctx.t()
  defdelegate set_current_span(context, span_context), to: OpenTelemetry.Tracer

  @doc """
  Creates and sets the Status of the currently active Span.

  If used, this will override the default Span Status, which is `:unset`.

  Reference:
  https://opentelemetry.io/docs/reference/specification/trace/api/#set-status
  """
  @spec set_status(OpenTelemetry.status() | OpenTelemetry.status_code(), String.t()) :: boolean()
  def set_status(status_or_status_code, description \\ "")

  def set_status(status, _description) when is_tuple(status) do
    OpenTelemetry.Tracer.set_status(status)
  end

  def set_status(status_code, description) do
    OpenTelemetry.Tracer.set_status(status_code, description)
  end

  # @doc """
  # Creates a new span which is set to the currently active Span in the Context of
  # the block. The Span is ended automatically when the `block` completes and the
  # Context is what it was before the block.

  # See `start_span/2` and `end_span/0`.
  # """
  defmacro with_span(name, start_opts \\ quote(do: %{}), do: block) do
    quote do
      __MODULE__
      |> :opentelemetry.get_application_tracer()
      |> :otel_tracer.with_span(
        unquote(name),
        Map.new(unquote(start_opts)),
        fn _arg -> unquote(block) end
      )
    end
  end

  @doc """
  Creates a new span which is set to the currently active Span in the Context of
  the block. The Span is ended automatically when the `block` completes and the
  Context is what it was before the block.

  See `start_span/2` and `end_span/0`.
  """
  defmacro with_span(ctx, name, start_opts, do: block) do
    start_opts =
      start_opts
      |> enumerable_to_attrs()
      |> Macro.escape()

    quote do
      :otel_tracer.with_span(
        unquote(ctx),
        :opentelemetry.get_application_tracer(__MODULE__),
        unquote(name),
        Map.new(unquote(start_opts)),
        fn _arg -> unquote(block) end
      )
    end
  end

  @doc """
  Returns the currently active `t:OpenTelemetry.span_ctx/0`.
  """
  @spec current_span_ctx() :: :opentelemetry.span_ctx() | :undefined
  defdelegate current_span_ctx, to: OpenTelemetry.Tracer

  @doc """
  Returns the `t:OpenTelemetry.span_ctx/0` active in Context `ctx`.
  """
  @spec current_span_ctx(:otel_ctx.t()) :: :opentelemetry.span_ctx() | :undefined
  defdelegate current_span_ctx(context), to: OpenTelemetry.Tracer

  @doc """
  Set an attribute with key and value on the currently active Span.

  Attributes are keys and values that are applied as metadata to your spans and
  are useful for aggregating, filtering, and grouping traces. Attributes can be
  added at span creation, or at any other time during the lifecycle of a span
  before it has completed.

  If the value is a set (map, list or tuple), its value is converted to a format
  that is supported by OpenTelemetryApi.

  Reference:
  https://opentelemetry.io/docs/reference/specification/common/attribute-naming/
  """
  @spec set_attribute(OpenTelemetry.attribute_key(), OpenTelemetry.attribute_value()) :: boolean()
  def set_attribute(key, value)

  def set_attribute(key, value) when is_set(value) do
    set_attributes(key, value)
  end

  def set_attribute(key, value) do
    OpenTelemetry.Tracer.set_attribute(key, value)
  end

  @doc """
  Add a list of attributes to the currently active Span.

  The list of attributes can be a plain list, keyword lists, maps or tuples.

  Reference:
  https://opentelemetry.io/docs/reference/specification/common/attribute-naming/
  """
  @spec set_attributes(OpenTelemetry.attribute_key(), map() | list() | tuple()) :: boolean()
  def set_attributes(key, values) do
    key
    |> enumerable_to_attrs(values)
    |> OpenTelemetry.Tracer.set_attributes()
  end

  @doc """
  Add an event to the currently active Span.

  An event is a human-readable message on a span that represents “something
  happening” during it’s lifetime. For example, imagine a function that requires
  exclusive access to a resource that is under a mutex. An event could be
  created at two points - once, when we try to gain access to the resource, and
  another when we acquire the mutex.

  A useful characteristic of events is that their timestamps are displayed as
  offsets from the beginning of the span, allowing you to easily see how much
  time elapsed between them.

  Events can also have attributes of their own.

  Reference:
  https://opentelemetry.io/docs/reference/specification/trace/api/#add-events
  """
  @spec add_event(OpenTelemetry.event_name(), OpenTelemetry.attributes_map()) :: boolean
  def add_event(name, attributes \\ %{}) do
    :otel_span.add_event(
      :otel_tracer.current_span_ctx(),
      name,
      attributes
    )
  end

  @doc """
  Add a list of events to the currently active Span.

  See also `add_event/2`.

  Reference:
  https://opentelemetry.io/docs/reference/specification/trace/api/#add-events
  """
  @spec add_events([OpenTelemetry.event()]) :: boolean()
  defdelegate add_events(events), to: OpenTelemetry.Tracer

  @doc """
  Record an exception as an event, following the semantics convetions for exceptions.

  If trace is not provided, the stacktrace is retrieved from `Process.info/2`
  """
  @spec record_exception(Exception.t(), any(), any()) :: boolean
  defdelegate record_exception(exception, trace \\ nil, attributes \\ []),
    to: OpenTelemetry.Tracer

  @doc """
  Updates the Span name.

  It is highly discouraged to update the name of a Span after its creation. Span
  name is often used to group, filter and identify the logical groups of spans.
  And often, filtering logic will be implemented before the Span creation for
  performance reasons. Thus the name update may interfere with this logic.

  The function name is called UpdateName to differentiate this function from the
  regular property setter. It emphasizes that this operation signifies a major
  change for a Span and may lead to re-calculation of sampling or filtering
  decisions made previously depending on the implementation.
  """
  @spec update_name(String.t()) :: boolean()
  defdelegate update_name(name), to: OpenTelemetry.Tracer

  # Transforms an enumerable into a map of attributes that can be used by
  # OpenTelemetry.

  # Simple enumerables
  defp enumerable_to_attrs(enumerable)

  defp enumerable_to_attrs(s) when is_struct(s) do
    enumerable_to_attrs(Map.from_struct(s))
  end

  defp enumerable_to_attrs(enumerable) when is_map(enumerable) or is_list(enumerable) do
    enumerable
    |> Enum.with_index()
    |> Map.new(fn
      {{key, value}, _index} ->
        {key, inspect(value)}

      {value, index} ->
        {index, inspect(value)}
    end)
  end

  defp enumerable_to_attrs(enumerable) when is_tuple(enumerable) do
    enumerable_to_attrs(Tuple.to_list(enumerable))
  end

  # Named enumerables
  defp enumerable_to_attrs(name, enumerable)

  defp enumerable_to_attrs(name, s) when is_struct(s) do
    enumerable_to_attrs(name, Map.from_struct(s))
  end

  defp enumerable_to_attrs(name, enumerable) when is_map(enumerable) or is_list(enumerable) do
    enumerable
    |> Enum.with_index()
    |> Map.new(fn
      {{key, _value} = item, index} when is_set(key) ->
        {"#{name}.#{index}", inspect(item)}

      {{key, value}, _index} ->
        {"#{name}.#{key}", inspect(value)}

      {value, index} ->
        {"#{name}.#{index}", inspect(value)}
    end)
  end

  defp enumerable_to_attrs(name, enumerable) when is_tuple(enumerable) do
    enumerable_to_attrs(name, Tuple.to_list(enumerable))
  end
end
