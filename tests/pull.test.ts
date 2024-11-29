import { test } from "bun:test";
import { pull } from "../src/pull";

test("Stripe Plans pull", async () => {
  await pull("./test/striped.config.ts", ".env.local");
}, 20_000);

