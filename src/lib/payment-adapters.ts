/**
 * Payment Gateway Abstraction Layer
 * Supports: eWAY (primary), Stripe (stub), Razorpay (stub), PayPal (stub)
 */

export type GatewayType = "eway" | "stripe" | "razorpay" | "paypal" | "other";

export interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  invoiceId: string;
  returnUrl?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  gatewayReference?: string;
  errorMessage?: string;
  redirectUrl?: string;
}

export interface SubscriptionRequest {
  amount: number;
  currency: string;
  frequency: "monthly" | "yearly";
  customerEmail: string;
  customerName: string;
}

export interface PaymentAdapter {
  type: GatewayType;
  createPayment(req: PaymentRequest): Promise<PaymentResult>;
  verifyPayment(payload: Record<string, unknown>): Promise<PaymentResult>;
  refundPayment(transactionId: string, amount?: number): Promise<PaymentResult>;
  createSubscription(req: SubscriptionRequest): Promise<PaymentResult>;
  cancelSubscription(subscriptionId: string): Promise<PaymentResult>;
}

// ─── eWAY Adapter ───────────────────────────────────────────
export class EwayAdapter implements PaymentAdapter {
  type: GatewayType = "eway";

  async createPayment(req: PaymentRequest): Promise<PaymentResult> {
    // eWAY Rapid API integration placeholder
    // In production: call eWAY CreateAccessCode → return hosted page URL
    console.log("[eWAY] createPayment", req);
    return {
      success: true,
      transactionId: `EWAY-${Date.now()}`,
      gatewayReference: `REF-${req.invoiceId}`,
    };
  }

  async verifyPayment(payload: Record<string, unknown>): Promise<PaymentResult> {
    console.log("[eWAY] verifyPayment", payload);
    return { success: true, transactionId: payload.transactionId as string };
  }

  async refundPayment(transactionId: string): Promise<PaymentResult> {
    console.log("[eWAY] refundPayment", transactionId);
    return { success: true, transactionId };
  }

  async createSubscription(req: SubscriptionRequest): Promise<PaymentResult> {
    console.log("[eWAY] createSubscription", req);
    return { success: true, transactionId: `EWAY-SUB-${Date.now()}` };
  }

  async cancelSubscription(subscriptionId: string): Promise<PaymentResult> {
    console.log("[eWAY] cancelSubscription", subscriptionId);
    return { success: true, transactionId: subscriptionId };
  }
}

// ─── Stripe Adapter (Stub) ─────────────────────────────────
export class StripeAdapter implements PaymentAdapter {
  type: GatewayType = "stripe";
  async createPayment(): Promise<PaymentResult> { return { success: false, errorMessage: "Stripe not configured" }; }
  async verifyPayment(): Promise<PaymentResult> { return { success: false, errorMessage: "Stripe not configured" }; }
  async refundPayment(): Promise<PaymentResult> { return { success: false, errorMessage: "Stripe not configured" }; }
  async createSubscription(): Promise<PaymentResult> { return { success: false, errorMessage: "Stripe not configured" }; }
  async cancelSubscription(): Promise<PaymentResult> { return { success: false, errorMessage: "Stripe not configured" }; }
}

// ─── Razorpay Adapter (Stub) ───────────────────────────────
export class RazorpayAdapter implements PaymentAdapter {
  type: GatewayType = "razorpay";
  async createPayment(): Promise<PaymentResult> { return { success: false, errorMessage: "Razorpay not configured" }; }
  async verifyPayment(): Promise<PaymentResult> { return { success: false, errorMessage: "Razorpay not configured" }; }
  async refundPayment(): Promise<PaymentResult> { return { success: false, errorMessage: "Razorpay not configured" }; }
  async createSubscription(): Promise<PaymentResult> { return { success: false, errorMessage: "Razorpay not configured" }; }
  async cancelSubscription(): Promise<PaymentResult> { return { success: false, errorMessage: "Razorpay not configured" }; }
}

// ─── PayPal Adapter (Stub) ─────────────────────────────────
export class PayPalAdapter implements PaymentAdapter {
  type: GatewayType = "paypal";
  async createPayment(): Promise<PaymentResult> { return { success: false, errorMessage: "PayPal not configured" }; }
  async verifyPayment(): Promise<PaymentResult> { return { success: false, errorMessage: "PayPal not configured" }; }
  async refundPayment(): Promise<PaymentResult> { return { success: false, errorMessage: "PayPal not configured" }; }
  async createSubscription(): Promise<PaymentResult> { return { success: false, errorMessage: "PayPal not configured" }; }
  async cancelSubscription(): Promise<PaymentResult> { return { success: false, errorMessage: "PayPal not configured" }; }
}

// ─── Factory ────────────────────────────────────────────────
export function getPaymentAdapter(gatewayType: GatewayType): PaymentAdapter {
  switch (gatewayType) {
    case "eway": return new EwayAdapter();
    case "stripe": return new StripeAdapter();
    case "razorpay": return new RazorpayAdapter();
    case "paypal": return new PayPalAdapter();
    default: return new EwayAdapter();
  }
}
