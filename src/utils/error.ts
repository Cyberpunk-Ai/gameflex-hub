import React from "react";

export type AppError = {
  code: string;
  message: string;
  details?: unknown;
};

export function parseSupabaseError(error: any): string {
  if (typeof error === "string") return error;
  if (error?.message) return error.message;
  if (error?.error_description) return error.error_description;
  return "An unexpected error occurred";
}

export function isNetworkError(error: any): boolean {
  return error?.message === "Network Error" || error?.message === "Failed to fetch";
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

export function createErrorBoundaryFallback(componentName: string) {
  return function ErrorBoundaryFallback({ error }: { error: Error }) {
    return React.createElement(
      "div",
      { className: "p-4 border border-red-500 rounded bg-red-50 text-red-700" },
      React.createElement("h3", { className: "font-bold mb-2" }, `Error in ${componentName}`),
      React.createElement(
        "p",
        { className: "text-sm" },
        error.message || "An unexpected error occurred.",
      ),
    );
  };
}

export function logError(error: unknown, context?: Record<string, unknown>): void {
  console.error("[App Error]:", error, context ? context : "");
}
