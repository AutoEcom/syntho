import { AuthClient } from "@dfinity/auth-client";
import { II_PROVIDER } from "../config";

/** Delegation lifetime: 7 days, in nanoseconds. */
export const SESSION_TTL_NS =
  BigInt(7) * BigInt(24) * BigInt(3_600_000_000_000);

const II_WINDOW_FEATURES =
  "toolbar=0,location=0,menubar=0,width=525,height=705";

let clientPromise: Promise<AuthClient> | null = null;

/**
 * Browser-only AuthClient singleton.
 *
 * IndexedDB is the default store, so a successful login survives reloads
 * until the delegation expires or `logout` is called.
 */
export function getAuthClient(): Promise<AuthClient> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Internet Identity AuthClient is only available in the browser.")
    );
  }

  if (!clientPromise) {
    clientPromise = AuthClient.create({
      idleOptions: {
        // Telemetry surfaces stay open; idle logout would be surprising.
        disableIdle: true,
        disableDefaultIdleCallback: true,
      },
    });
  }

  return clientPromise;
}

export const II_LOGIN_OPTIONS = {
  identityProvider: II_PROVIDER,
  maxTimeToLive: SESSION_TTL_NS,
  windowOpenerFeatures: II_WINDOW_FEATURES,
} as const;
