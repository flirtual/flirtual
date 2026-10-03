import config from "@flirtual/config/oxfmt";
import { defineConfig } from "oxfmt";

export default defineConfig({
  ...config,
  ignorePatterns: ["apps/", "packages/", "pulumi/", "pnpm-lock.yaml"],
});
