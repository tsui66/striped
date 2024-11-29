import { test } from "bun:test";
import { destroy } from "../src/destroy";

test("Delete Stripe Products and Prices", async () => {
  await destroy("./test/striped.config.ts", ".env.local");
}, 20_000);
