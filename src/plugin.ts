import { Plugin } from "@opencode/plugin";
import pkg from "../package.json" with { type: "json" };
import { registerMemPlugin } from "./v2-register.js";

export const id =
  typeof pkg.name === "string" && pkg.name.trim() ? pkg.name.trim() : "opencode-mem";

export default Plugin.define({
  id,
  setup: registerMemPlugin,
});
