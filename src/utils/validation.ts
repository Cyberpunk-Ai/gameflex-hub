export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex =
    /^(?:254|\+254|0)?(7(?:(?:[129][0-9])|(?:0[0-8])|(?:4[0-35689])|(?:5[7-9])|(?:6[89])|(?:8[0-25-9])|(?:3[0-9]))[0-9]{6})$/;
  const phoneRegex01 = /^(?:254|\+254|0)?(1(?:(?:[1][0-5])|(?:[0][0-2]))[0-9]{6})$/;
  return phoneRegex.test(phone) || phoneRegex01.test(phone);
}

export function isValidPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push("Password must be at least 8 characters long");
  if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter");
  if (!/[0-9]/.test(password)) errors.push("Password must contain at least one number");

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

export function isValidAmount(amount: number, min: number = 0, max: number = Infinity): boolean {
  return typeof amount === "number" && !isNaN(amount) && amount >= min && amount <= max;
}

export function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, "");
}

export function validateTournamentInput(data: Record<string, unknown>): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!data.title || typeof data.title !== "string") errors.title = "Title is required";
  if (!data.game || typeof data.game !== "string") errors.game = "Game is required";
  if (typeof data.entry_fee !== "number" || data.entry_fee < 0)
    errors.entry_fee = "Valid entry fee is required";

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
