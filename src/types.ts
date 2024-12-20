import Stripe from "stripe";
import type { TaxCode } from "./zod/tax-codes";

export interface PreStripedConfig {
  readonly apiVersion?: string;
  readonly features?: Record<string, string>;
  readonly products: Record<string, SrtipedProduct>;
  readonly webhooks?: {
    readonly endpoint: string;
    readonly events: SubscriptionWebhookEvent[];
  };
}

export type SubscriptionWebhookEvent =
  | "checkout.session.completed"
  | "customer.created"
  | "customer.subscription.created"
  | "customer.subscription.deleted"
  | "customer.subscription.paused"
  | "customer.subscription.resumed"
  | "customer.subscription.trial_will_end"
  | "customer.subscription.updated"
  | "entitlements.active_entitlement_summary.updated"
  | "invoice.created"
  | "invoice.finalized"
  | "invoice.finalization_failed"
  | "invoice.paid"
  | "invoice.payment_action_required"
  | "invoice.payment_failed"
  | "invoice.upcoming"
  | "invoice.updated"
  | "payment_intent.created"
  | "payment_intent.succeeded"
  | "subscription_schedule.aborted"
  | "subscription_schedule.canceled"
  | "subscription_schedule.completed"
  | "subscription_schedule.created"
  | "subscription_schedule.expiring"
  | "subscription_schedule.released"
  | "subscription_schedule.updated";

export interface SrtipedProduct {
  readonly name: string;
  readonly id: string; // Added 'id'
  readonly prices: Record<string, SrtipedPrice>; // Added 'prices'
  readonly features: readonly string[]; // Changed to readonly
  readonly taxCode?: TaxCode;
}

export interface SrtipedPriceBase {
  readonly amount: number;
  readonly currency: Stripe.Price['currency'];
  readonly interval: Stripe.Price.Recurring.Interval | null;
  readonly type: Stripe.Price.Type;
  readonly trialPeriodDays?: number;
}

export interface RecurringSrtipedPrice extends SrtipedPriceBase {
  readonly type: "recurring";
}

export interface OneTimeSrtipedPrice extends SrtipedPriceBase {
  readonly type: "one_time";
}


export type SrtipedPrice = RecurringSrtipedPrice | OneTimeSrtipedPrice;

export interface CheckoutUrlParams {
  userId: string;
  successUrl: string;
  cancelUrl: string;
  allowPromotionCodes?: boolean;
}