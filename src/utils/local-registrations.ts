export interface LocalRegistration {
  id: string;
  user_id: string;
  tournament_id: string;
  game_handle: string;
  payment_id: string | null;
  status: "pending" | "confirmed" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface LocalPayment {
  id: string;
  user_id: string;
  tournament_id: string;
  amount: number;
  method: string;
  transaction_code: string;
  screenshot_url: string | null;
  status: "pending" | "verified" | "rejected";
  created_at: string;
}

const REGISTRATIONS_KEY = "esports_local_registrations_v1";
const PAYMENTS_KEY = "esports_local_payments_v1";

export function getLocalRegistrations(): LocalRegistration[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REGISTRATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalRegistration(reg: LocalRegistration): void {
  if (typeof window === "undefined") return;
  try {
    const current = getLocalRegistrations();
    // Replace if exists, else append
    const index = current.findIndex(
      (r) => r.tournament_id === reg.tournament_id && r.user_id === reg.user_id,
    );
    if (index >= 0) {
      current[index] = reg;
    } else {
      current.unshift(reg);
    }
    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(current));
  } catch (e) {
    console.error("Failed to save local registration", e);
  }
}

export function getLocalPayments(): LocalPayment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalPayment(payment: LocalPayment): void {
  if (typeof window === "undefined") return;
  try {
    const current = getLocalPayments();
    const index = current.findIndex((p) => p.id === payment.id);
    if (index >= 0) {
      current[index] = payment;
    } else {
      current.unshift(payment);
    }
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(current));
  } catch (e) {
    console.error("Failed to save local payment", e);
  }
}
