import {
  makeCreateSubscriptionCheckoutUrl,
  makeCreateOneTimePaymentCheckoutUrl
} from './create-checkout';
import Stripe from 'stripe';
import {
  type SrtipedProduct,
  type SrtipedPrice,
  type PreStripedConfig,
  type CheckoutUrlParams
} from './types';

// Extended CheckoutUrlParams to include new options
interface ExtendedCheckoutUrlParams extends CheckoutUrlParams {
  quantity?: number;
}

// Simplified EnhancedStripedConfig type
export type EnhancedStripedConfig<T extends PreStripedConfig> = T & {
  products: {
    [K in keyof T['products']]: EnhancedStripedProduct<T['products'][K]>;
  };
};

// Simplified EnhancedStripedProduct type
type EnhancedStripedProduct<T extends SrtipedProduct> = T & {
  prices: {
    [K in keyof T['prices']]: T['prices'][K] & EnhancedStripedPrice<T['prices'][K]>;
  };
};

// Simplified EnhancedStripedPrice type
type EnhancedStripedPrice<T extends SrtipedPrice> = T['type'] extends 'recurring'
  ? T & { createSubscriptionCheckoutUrl: (params: ExtendedCheckoutUrlParams & { trialPeriodDays?: number }) => Promise<string> }
  : T & { createOneTimePaymentCheckoutUrl: (params: ExtendedCheckoutUrlParams) => Promise<string> };

export const createStriped = <T extends PreStripedConfig>(
  config: T,
  dependencies: { stripe: Stripe }
): EnhancedStripedConfig<T> => {
  const { stripe } = dependencies;
  const createSubscriptionCheckoutUrl = makeCreateSubscriptionCheckoutUrl(stripe);
  const createOneTimePaymentCheckoutUrl = makeCreateOneTimePaymentCheckoutUrl(stripe);

  const enhancePrice = (productId: string, priceId: string, price: SrtipedPrice) => {
    if (price.type === 'recurring') {
      return {
        ...price,
        createSubscriptionCheckoutUrl: (params: CheckoutUrlParams) =>
          createSubscriptionCheckoutUrl({
            ...params,
            productKey: productId,
            priceKey: priceId,
            trialPeriodDays: price.trialPeriodDays,
          }),
      };
    } else {
      return {
        ...price,
        createOneTimePaymentCheckoutUrl: (params: CheckoutUrlParams) =>
          createOneTimePaymentCheckoutUrl({ ...params, productKey: productId, priceKey: priceId }),
      };
    }
  };

  const enhanceProduct = (productId: string, product: SrtipedProduct) => {
    const enhancedPrices = Object.fromEntries(
      Object.entries(product.prices).map(([priceId, price]) => [
        priceId,
        enhancePrice(productId, priceId, price),
      ])
    );

    return { ...product, prices: enhancedPrices };
  };

  const enhancedProducts = Object.fromEntries(
    Object.entries(config.products).map(([productId, product]) => [
      productId,
      enhanceProduct(productId, product),
    ])
  );

  return {
    ...config,
    products: enhancedProducts,
  } as EnhancedStripedConfig<T>;
};
