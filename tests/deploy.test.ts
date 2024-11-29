import { test } from "bun:test";
import { deploy } from "../src/deploy";

test("Stripe Plans deploy", async () => {
  await deploy("./test/striped.config.ts", ".env.local");
}, 20_000);
