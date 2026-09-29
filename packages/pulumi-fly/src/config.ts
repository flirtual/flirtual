// Generated from https://json.schemastore.org/fly.json by `pnpm generate:config`.

/**
 * HTTP-based health checks run against the `internal_port`. These checks will pass when receiving a 2xx response. Any other response is considered a failure.
 */
export type HttpChecks = {
  /**
   * The time to wait after a VM starts before checking its health. Units are milliseconds unless you specify them like `10s` or `1m`.
   */
  grace_period?: number | string;
  /**
   * Length of the pause between connectivity checks. Units are milliseconds unless you specify them like `10s` or `1m`.
   */
  interval?: number | string;
  /**
   * The number of consecutive check failures to allow before attempting to restart the VM. The default is `0`, which disables restarts based on failed health checks.
   */
  restart_limit?: number;
  /**
   * The maximum time a connection can take before being reported as failing its healthcheck. Units are milliseconds unless you specify them like `10s` or `1m`.
   */
  timeout?: number | string;
  /**
   * The HTTP method to be used for the check.
   */
  method?: string;
  /**
   * The path of the URL to be requested.
   */
  path?: string;
  /**
   * The protocol to be used (`http` or `https`)
   */
  protocol?: "http" | "https";
  /**
   * When set to `true` (and `protocol` is set to `https`), skip verifying the certificates sent by the server.
   */
  tls_skip_verify?: boolean;
  /**
   * Set key/value pairs of HTTP headers to pass along with the check request.
   */
  headers?: {
    [k: string]: unknown;
  };
  [k: string]: unknown;
}[];

/**
 * https://fly.io/docs/reference/configuration
 */
export interface FlyIoConfigSchemaFlyToml {
  files?: {
    /**
     * The path in the guest where the file will be written.
     */
    guest_path: string;
    /**
     * Base64 encoded content to be written to the file.
     */
    raw_value?: string;
    /**
     * The name of the secret whose value will be written to the file.
     */
    secret_name?: string;
    /**
     * Local path of the file to be written to the guest.
     */
    local_path?: string;
    /**
     * List of process names that this file configuration applies to.
     */
    processes?: string[];
    [k: string]: unknown;
  }[];
  http_service?: {
    /**
     * The port this service (and application) will use to communicate with clients. Default is 8080.
     */
    internal_port?: number;
    /**
     * A Boolean which determines whether to enforce HTTP to HTTPS redirects.
     */
    force_https?: boolean;
    /**
     * Whether to automatically stop or suspend an application’s Machines when there’s excess capacity, per region. Options are "off", "stop", and "suspend". If there’s only one Machine in a region, then the Machine is stopped or suspended if it has no traffic. The Fly Proxy runs a process to automatically stop Machines every few minutes. The default if not set is "off".
     */
    auto_stop_machines?: "off" | "stop" | "suspend";
    /**
     * Whether to automatically start an application’s Machines when a new request is made to the application and there’s no excess capacity, per region.
     */
    auto_start_machines?: boolean;
    /**
     * The number of Machines to keep running, in the primary region only, when `auto_stop_machines` is true.
     */
    min_machines_running?: number;
    concurrency?: {
      /**
       * Specifies what metric is used to determine when to auto start or stop, or when a given Machine should receive more or less traffic (load balancing).
       */
      type?: "connections" | "requests";
      /**
       * When a Fly Machine is at or over this number of concurrent connections or requests, the system will deprioritize sending new traffic to that Machine.
       */
      soft_limit?: number;
      /**
       * When a Fly Machine is at or over this number of concurrent connections or requests, the system will stop sending new traffic to that Machine.
       */
      hard_limit?: number;
      [k: string]: unknown;
    };
    http_options?: {
      response?: {
        /**
         * Configures Fly Proxy to not add any Fly headers to HTTP responses.
         */
        pristine?: boolean;
        /**
         * Add or remove HTTP response headers.
         */
        headers?: {
          [k: string]: boolean | string | string[];
        };
        [k: string]: unknown;
      };
      /**
       * Indicates whether the app supports HTTP/2 cleartext (H2C) with prior knowledge or not.
       */
      h2_backend?: boolean;
      [k: string]: unknown;
    };
    tls_options?: {
      alpn?: string[];
      versions?: string[];
      /**
       * When `true`, serve a self-signed certificate if no certificate exists. Default is `false`.
       */
      default_self_signed?: boolean;
      [k: string]: unknown;
    };
    checks?: HttpChecks;
    [k: string]: unknown;
  };
  /**
   * The primary region where the application will be deployed. This setting also sets the PRIMARY_REGION environment variable.
   */
  primary_region?: string;
  /**
   * Command to run when you execute 'fly console'. This opens your framework's console in a new, dedicated Machine.
   */
  console_command?: string;
  /**
   * Size in megabytes for the swap file on the VM. Helps in handling memory spikes.
   */
  swap_size_mb?: number;
  metrics?: Metrics[] | Metrics;
  http_checks?: HttpChecks;
  processes?: {
    [k: string]: string;
  };
  /**
   * Fly.io application name
   */
  app?: string;
  host_dedication_id?: string;
  vm?: {
    size?:
      | "shared-cpu-1x"
      | "shared-cpu-2x"
      | "shared-cpu-4x"
      | "shared-cpu-8x"
      | "performance-1x"
      | "performance-2x"
      | "performance-4x"
      | "performance-8x"
      | "performance-16x";
    memory?: string | number;
    cpus?: 1 | 2 | 4 | 8 | 16;
    cpu_kind?: "shared" | "performance";
    gpus?: 1 | 2 | 4 | 8;
    gpu_kind?: "a10" | "a100-40gb" | "a100-80gb" | "l40s";
    kernel_args?: string[] | string;
    host_dedication_id?: string;
    processes?: string[];
    [k: string]: unknown;
  }[];
  /**
   * Seconds to wait before forcing a VM process to exit. Default is 5 seconds.
   */
  kill_timeout?: number | string;
  /**
   * Signal to send to a process to shut it down gracefully. Default is SIGINT.
   */
  kill_signal?: "SIGINT" | "SIGTERM" | "SIGQUIT" | "SIGUSR1" | "SIGUSR2" | "SIGKILL" | "SIGSTOP";
  /**
   * The `statics` sections expose static assets built into your application's container to Fly's Anycast network. You can serve HTML files, Javascript, and images without needing to run a web server inside your container.
   */
  statics?: Statics | Statics[];
  services?: Services | Services[];
  deploy?: {
    /**
     * Command to run after a build, with access to the production environment, but before deployment. Non-zero exit status will abort the deployment.
     *
     * ```toml
     * [deploy]
     *   release_command ="bundle exec rails db:migrate"
     * ```
     */
    release_command?: string;
    /**
     * VM configuration to use when running the release command.
     */
    release_command_vm?: {
      size?:
        | "shared-cpu-1x"
        | "shared-cpu-2x"
        | "shared-cpu-4x"
        | "shared-cpu-8x"
        | "performance-1x"
        | "performance-2x"
        | "performance-4x"
        | "performance-8x"
        | "performance-16x";
      memory?: string | number;
      cpus?: 1 | 2 | 4 | 8 | 16;
      cpu_kind?: "shared" | "performance";
      [k: string]: unknown;
    };
    /**
     * For rolling deploys, you can use max_unavailable to control how many Machines can be down at a time.
     */
    max_unavailable?: number;
    /**
     * Strategy for replacing VMs during a deployment.
     */
    strategy?: "canary" | "rolling" | "bluegreen" | "immediate";
    /**
     * Timeout for waiting for the Machine to be in a started state during a deploy.
     */
    wait_timeout?: string;
  };
  mounts?: Mounts | Mounts[];
  /**
   * Flags and features that are subject to change, deprecation or promotion to the main configuration.
   */
  experimental?: {
    /**
     * Override the server command (CMD) set by the Dockerfile. Specify as an array of strings:
     *
     * ```toml
     * cmd = ["path/to/command", "arg1", "arg2"]
     * ```
     */
    cmd?: string | string[];
    /**
     * Override the ENTRYPOINT set by the Dockerfile. Specify as an array of strings:
     *
     * ```toml
     * entrypoint = ["path/to/command", "arg1", "arg2"]
     * ```
     */
    entrypoint?: string | string[];
    /**
     * Failed deployments should roll back automatically to the previous successfully deployed release. Defaults to `true`
     */
    auto_rollback?: boolean;
    /**
     * Enables private network access to the Fly organization. Defaults to `true`.
     */
    private_network?: boolean;
    [k: string]: unknown;
  };
  /**
   * Set non-sensitive information as environment variables in the application's [runtime environment](https://fly.io/docs/reference/runtime-environment/).
   * For sensitive information, such as credentials or passwords, use the [secrets command](https://fly.io/docs/reference/secrets). For anything else though, the `env` section provides a simple way to set environment variables. Here's an example:
   * ```toml
   * [env]
   *   LOG_LEVEL = "debug"
   *   S3_BUCKET = "my-bucket"
   * ```
   */
  env?: {
    [k: string]: string;
  };
  /**
   * Build configuration options. See docs at https://fly.io/docs/reference/builders.
   */
  build?: {
    /**
     * Builder Docker image to be used with the 'buildpacks' option
     */
    builder?: string;
    /**
     * Buildpacks to be run by the 'builder' Docker image
     *
     * @minItems 1
     */
    buildpacks?: [string, ...string[]];
    /**
     * Build arguments passed to both Dockerfile and Buildpack builds. These arguments are **not available** on VMs at runtime.
     * ```toml
     * [build.args]
     *   USER = "julieta"
     *   MODE = "production"
     * ```
     */
    args?: {
      [k: string]: string;
    };
    /**
     * Specify the target stage for [multistage Dockerfile builds](https://docs.docker.com/develop/develop-images/multistage-build/).
     */
    "build-target"?: string;
    /**
     * Docker image to be deployed (skips the build process)
     */
    image?: string;
    /**
     * Dockerfile used for builds. Defaults to './Dockerfile'
     */
    dockerfile?: string;
    /**
     * A relative path to a .dockerignore file. Defaults to './.dockerignore'
     */
    ignorefile?: string;
  };
  [k: string]: unknown;
}
export interface Metrics {
  /**
   * Port on which the application exposes metrics data.
   */
  port?: number;
  /**
   * Path under which the metrics are exposed, typically '/metrics'.
   */
  path?: string;
  /**
   * List of process names that this metrics configuration applies to.
   */
  processes?: string[];
  [k: string]: unknown;
}
export interface Statics {
  /**
   * The path inside your container where the assets to serve are located.
   */
  guest_path: string;
  /**
   * The URL prefix that should serve the static assets.
   */
  url_prefix: string;
}
/**
 * Configure the mapping of ports from the public Fly proxy to your application.
 *
 * You can have:
 * * **No services section**: The application has no mappings to the external internet - typically apps like databases or background job workers that talk over 6PN private networking to other apps.
 * * **One services section**: One internal port mapped to one external port on the internet.
 * * **Multiple services sections**: Map multiple internal ports to multiple external ports.
 */
export interface Services {
  /**
   * @deprecated
   * Health checks that run as one-off commands directly on the VM.
   *
   * This type of check is **deprecated**. See `tcp_checks` or `http_checks` for alternatives.
   */
  script_checks?: {
    [k: string]: unknown;
  };
  /**
   * The protocol used to communicate with your application. Can be: `tcp` or `udp`.
   */
  protocol?: "tcp" | "udp";
  /**
   * The port this application listens on to communicate with clients. The default is 8080. We recommend applications use the default.
   */
  internal_port?: number;
  /**
   * The action, if any, that Fly Proxy should take when the app is idle for several minutes. Options are "off", "stop", or "suspend".
   */
  auto_stop_machines?: "off" | "stop" | "suspend";
  /**
   * Whether to automatically start an application’s Machines when a new request is made to the application and there’s no excess capacity, per region. If there’s only one Machine in a region, then it’s started whenever a request is made to the application. The default if not set is true.
   */
  auto_start_machines?: boolean;
  /**
   * The number of Machines to keep running, in the primary region only, when auto_stop_machines = true.
   */
  min_machines_running?: number;
  /**
   * Control autoscaling metrics (connections or requests) and limits (hard and soft).
   */
  concurrency?: {
    type?: "connections" | "requests";
    /**
     * When an application instance is __at__ or __over__ this number, the system will bring up another instance.
     */
    hard_limit?: number;
    /**
     * When an application instance is __at__ or __over__ this number, the system is likely to bring up another instance.
     */
    soft_limit?: number;
    [k: string]: unknown;
  };
  /**
   * For each external port you want to accept connections on, add a `ports` section.
   */
  ports?: {
    /**
     * An array of strings that select handlers to terminate the connection at the edge.
     *
     * Valid options: http, tls, proxy_proto, pg_tls, edge_http.
     */
    handlers?: ("http" | "tls" | "proxy_proto" | "pg_tls" | "edge_http")[];
    /**
     * The port to accept traffic on. Valid ports: 1-65535
     */
    port?: number;
    start_port?: number;
    end_port?: number;
    /**
     * Force HTTP connections to HTTPS. `force_https` requires the `http` handler in the `handlers` section.
     */
    force_https?: boolean;
    http_options?: {
      response?: {
        pristine?: boolean;
        headers?: {
          [k: string]: boolean | string | string[];
        };
        [k: string]: unknown;
      };
      h2_backend?: boolean;
      [k: string]: unknown;
    };
    proxy_proto_options?: {
      version?: string;
      [k: string]: unknown;
    };
    tls_options?: {
      alpn?: string[];
      versions?: string[];
      default_self_signed?: boolean;
      [k: string]: unknown;
    };
    [k: string]: unknown;
  }[];
  machine_checks?: {
    command: string[];
    entrypoint: string[];
    image?: string;
    kill_signal: string;
    kill_timeout: string;
    [k: string]: unknown;
  }[];
  /**
   * Basic TCP connection health checks. This is the default check that runs against the configured `internal_port`.
   */
  tcp_checks?: {
    /**
     * The time to wait after a VM starts before checking its health. Units are milliseconds unless you specify them like `10s` or `1m`.
     */
    grace_period?: number | string;
    /**
     * Length of the pause between connectivity checks. Units are milliseconds unless you specify them like `10s` or `1m`.
     */
    interval?: number | string;
    /**
     * The number of consecutive TCP check failures to allow before attempting to restart the VM. The default is `0`, which disables restarts based on failed TCP health checks.
     */
    restart_limit?: number;
    /**
     * The maximum time a connection can take before being reported as failing its healthcheck. Units are milliseconds unless you specify them like `10s` or `1m`.
     */
    timeout?: number | string;
    [k: string]: unknown;
  }[];
  http_checks?: HttpChecks;
  [k: string]: unknown;
}
/**
 * Mount [persistent storage volumes](https://fly.io/docs/reference/volumes) previously setup via `flyctl`. Both settings are required. Example:
 *
 * ```toml
 * [mounts]
 *   source = "myapp_data"
 *   destination = "/data"
 * ```
 */
export interface Mounts {
  /**
   * The name of the volume to mount as shown in `fly volumes list`.
   *
   * A volume of this name *must exist* in each of the app regions. If there's more than one volume in the target region with the same one, one will be picked randomly.
   */
  source: string;
  /**
   * The number of snapshots to retain for the volume. Snapshots are taken daily.
   */
  snapshot_retention?: number;
  /**
   * The path at which the `source` volume should be mounted in the running app VM.
   */
  destination: string;
  /**
   * The name of the process(es) to which this mount should be applied. See [multiple processes](https://community.fly.io/t/preview-multi-process-apps-get-your-workers-here/2316).
   */
  processes?: string[];
  /**
   * The size of the volume to be created on first deploy.
   */
  initial_size?: string | number;
  /**
   * The usage percentage threshold that triggers volume extension.
   */
  auto_extend_size_threshold?: number;
  /**
   * The size increment by which to extend the volume.
   */
  auto_extend_size_increment?: string;
  /**
   * The total amount to extend a volume.
   */
  auto_extend_size_limit?: string;
}
