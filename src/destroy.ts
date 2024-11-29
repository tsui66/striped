import path from "path";
import fs from "fs";
import Stripe from "stripe";
import dotenv from "dotenv";
import { type PreStripedConfig, type SrtipedPrice, type SrtipedProduct } from "./types";

// Load environment variables from .env file

export async function destroy(
  configPath: string = "striped.config.ts",
  envFilePath: string = ".env"
): Promise<void> {
  console.log("Starting destroy process...");

  // Check if the .env file exists before loading
  if (fs.existsSync(envFilePath)) {
    dotenv.config({ path: envFilePath });
    console.log("Environment variables loaded from:", envFilePath);
  } else {
    console.warn(`Environment file not found: ${envFilePath}`);
    console.warn("Proceeding without loading environment variables.");
  }

  // Resolve the config path relative to the current working directory
  const resolvedConfigPath = path.resolve(process.cwd(), configPath);

  if (!fs.existsSync(resolvedConfigPath)) {
    throw new Error(`Configuration file not found: ${resolvedConfigPath}`);
  }

  // Import the configuration using the resolved path
  const { config }: { config: PreStripedConfig } = await import(resolvedConfigPath);
  console.log("Config:", config);
  // Initialize Stripe with your secret key
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error(
      "Stripe secret key not found. Set STRIPE_SECRET_KEY in your environment variables or .env file."
    );
  }
  if (!stripeSecretKey.startsWith('sk_test_')) {
    throw new Error(
      "For safety reasons, destroy operations are restricted to test environments only."
    );
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: config.apiVersion as Stripe.StripeConfig['apiVersion'] || "2024-11-20.acacia" });

  console.log("Destroying products and prices from Stripe...");

  // Initialize the mapping object
  const priceIdMapping: Record<string, any> = {};

  // Sync products and prices, collecting IDs into priceIdMapping
  await destroyProductsAndPrices(stripe, config, priceIdMapping);

  // Destroy webhooks
  // if (config.webhooks) {
  //   await destroyWebhooks(stripe, config);
  // }

  console.log("Destruction completed successfully.");
}

// Add this new function at the end of the file
async function destroyProductsAndPrices(
  stripe: Stripe,
  config: PreStripedConfig,
  priceIdMapping: Record<string, any>
): Promise<void> {
  console.log("Synchronizing products and prices...");

  const { products } = config;
  console.log("Products to synchronize:", products);

  for (const productKey in products) {
    const productConfig = products[productKey] as SrtipedProduct;
    console.log(`Processing product: ${productKey}`, productConfig);
    // await inactivePrices(stripe, productConfig, productConfig.prices);

    // Check if product already exists
    const existingProducts = await stripe.products.list({ limit: 100 });
    console.log(`Fetched existing products: ${existingProducts.data.length}`);

    let product = existingProducts.data.find(
      (p) => p.metadata.striped_product_key === productKey
    );

    if (product) {
      await stripe.products.del(product.id);
      console.log(`Deleted product: ${product.name} with id: ${product.id} and tax code: ${product.tax_code}`);
    }

  }
  console.log("All products destroyed.");
}

async function inactivePrices(
  stripe: Stripe,
  product: SrtipedProduct,
  pricesConfig: { [key: string]: SrtipedPrice },
): Promise<void> {
  console.log(`Destroying prices for product: ${product.name}`);
  for (const priceKey in pricesConfig) {
    const priceConfig = pricesConfig[priceKey];

    const existingPrices = await stripe.prices.list({
      product: product.id,
      limit: 100,
    });
    console.log(`Fetched existing prices: ${existingPrices.data.length}`);

    let price = existingPrices.data.find((p) => {
      const matchesKey = p.metadata.striped_price_key === priceKey;
      const matchesAmount = p.unit_amount === priceConfig.amount;
      const matchesInterval = priceConfig.type === "recurring"
        ? p.recurring?.interval === priceConfig.interval
        : !p.recurring;
      const matchesType = p.recurring ? "recurring" : "one_time";
      return matchesKey && matchesAmount && matchesInterval && matchesType === priceConfig.type;
    });

    if (price) {
      await stripe.prices.update(price.id, { active: false });
      console.log(
        `Set price for product ${product.name}: $${priceConfig.amount / 100
        }/${priceConfig.type === "recurring" ? priceConfig.interval : "one-time"}${priceConfig.trialPeriodDays ? ` with ${priceConfig.trialPeriodDays}-day trial` : ''
        } to inactive`
      );
    }
  }
  console.log(`All prices set to inactive for product: ${product.name}`);
}