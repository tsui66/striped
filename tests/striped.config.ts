import { type PreStripedConfig } from "../src/types";
import { taxCodes } from "../src/zod/tax-codes";

export const config = {
  apiVersion: "2024-11-20.acacia",
  features: {
    basicAnalytics: "Basic Analytics",
    aiReporting: "AI Reporting",
  },
  products: {
    hobby: {
      name: "Hobby Plan",
      id: "hobby",
      taxCode: taxCodes.SOFTWARE_AS_A_SERVICE,
      prices: {
        monthly: {
          currency: "usd",
          amount: 1000,
          interval: "month",
          type: "recurring",
          trialPeriodDays: 7, // Add trial period for monthly plan
        },
        lifetime: {
          currency: "usd",
          amount: 20000,
          interval: null,
          type: "one_time",
        },
      },
      features: ["basicAnalytics"],
    },
    pro: {
      name: "Pro Plan",
      id: "pro",
      taxCode: taxCodes.SOFTWARE_AS_A_SERVICE,
      prices: {
        annual: {
          currency: "usd",
          amount: 20000,
          interval: "year",
          type: "recurring",
        },
      },
      features: ["basicAnalytics", "aiReporting"],
    },
    enterprise: {
      name: "Enterprise Plan",
      id: "enterprise",
      prices: {
        annual: {
          currency: "usd",
          amount: 20000,
          interval: "year",
          type: "recurring",
          trialPeriodDays: 3, // Add trial period for enterprise plan
          // tax_code is optional; will default if not specified
        },
      },
      features: ["basicAnalytics", "aiReporting"],
    },
  },
  webhooks: {
    // tip for vercel use e.g `${process.env.VERCEL_BRANCH_URL}/webhook`
    // to get auto-deployed 
    endpoint: "https://striped-example-app.vercel.app/api/webhooks",
    events: [
      "checkout.session.completed",
      "customer.subscription.deleted",
      "invoice.payment_failed",
    ],
  },
} satisfies PreStripedConfig;