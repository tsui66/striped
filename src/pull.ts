import dotenv from 'dotenv';
import fs from 'fs';
import Stripe from 'stripe';
import { type SrtipedPrice, type PreStripedConfig } from './types';
import { type TaxCode } from './zod/tax-codes';

export async function pull(
  configPath: string = 'striped.config.ts',
  envFilePath: string = '.env'
): Promise<void> {
  console.error('Starting pull process...'); // Use console.error for logging

  // Check if the .env file exists before loading
  if (fs.existsSync(envFilePath)) {
    dotenv.config({ path: envFilePath });
    console.error('Environment variables loaded from:', envFilePath);
  } else {
    console.error(`Environment file not found: ${envFilePath}`);
    console.error('Proceeding without loading environment variables.');
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in the environment variables.');
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' });

  try {
    const products = await fetchProducts(stripe);
    const configString = generateConfigString(products);

    // Output the configuration to stdout
    console.log(configString);

    console.error('Configuration pulled from Stripe and output to stdout');
  } catch (error) {
    console.error('Error pulling configuration from Stripe:', error);
    throw error;
  }
}

async function fetchProducts(stripe: Stripe): Promise<Array<{
  id: string;
  name: string;
  taxCode: string | null;
  prices: Array<{
    id: string;
    amount: number | null;
    interval: string | null;
    type: string;
    currency: Stripe.Price['currency'];
  }>;
}>> {
  const products = await stripe.products.list({ active: true, expand: ['data.default_price'] });
  return Promise.all(products.data.map(async (product) => {
    const prices = await stripe.prices.list({ product: product.id });
    console.log(prices, 'priceprice')
    return {
      id: product.id,
      name: product.name,
      taxCode: product.tax_code as string | null,
      prices: prices.data.map(price => ({
        id: price.id,
        currency: price.currency,
        amount: price.unit_amount,
        interval: price.type === 'recurring' ? price.recurring?.interval || null : null,
        type: price.type,
      }))
    };
  }));
}

function generateConfigString(products: ReturnType<typeof fetchProducts> extends Promise<infer T> ? T : never): string {
  const config: PreStripedConfig = {
    features: {},
    products: products.reduce((acc, product) => {
      acc[product.id] = {
        name: product.name,
        id: product.id,
        taxCategory: product.taxCode as TaxCode,
        prices: product.prices.reduce<Record<string, SrtipedPrice>>((priceAcc, price) => {
          priceAcc[price.id] = {
            amount: price.amount as number,
            currency: price.currency,
            interval: price.interval as Stripe.Price.Recurring.Interval,
            type: price.type as Stripe.Price.Type,
          };
          return priceAcc;
        }, {}),
        features: []
      };
      return acc;
    }, {} as Record<string, any>)
  };

  return `import { PreStripedConfig } from "striped-node";
import { taxCodes } from "striped-node";

export const config = ${JSON.stringify(config, null, 2)} as PreStripedConfig;
`;
}