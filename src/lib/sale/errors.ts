import { formatE8s, e6ToUsd } from "./math";
import type { SaleErrorCandid } from "./types";

export function formatSaleError(err: SaleErrorCandid): string {
  if ("Unauthorized" in err) return "This identity is not authorised to buy.";
  if ("Paused" in err) return "The sale is paused.";
  if ("AmountTooSmall" in err) {
    const min = e6ToUsd(err.AmountTooSmall.min_usd_e6);
    return `Below the minimum purchase of $${min.toFixed(2)}.`;
  }
  if ("RateNotSet" in err) return "The ICP/USD rate has not been set.";
  if ("LedgerNotSet" in err) return "The $SYN ledger is not linked to the sale.";
  if ("IcpLedgerNotSet" in err) return "The ICP ledger is not linked to the sale.";
  if ("CapExceeded" in err) {
    return `Only ${formatE8s(err.CapExceeded.remaining_e8s)} $SYN remains mintable.`;
  }
  if ("InvalidAmount" in err) return err.InvalidAmount;
  if ("PurchaseInProgress" in err)
    return "A purchase for this identity is already in progress.";
  if ("IcpTransferFailed" in err)
    return `ICP transfer failed: ${err.IcpTransferFailed}`;
  if ("MintFailed" in err) return `Mint failed: ${err.MintFailed}`;
  if ("RefundFailed" in err)
    return `Mint failed and ICP refund failed: ${err.RefundFailed}`;
  if ("ArithmeticOverflow" in err) return "Amount overflowed the sale arithmetic.";
  return "The sale rejected this purchase.";
}

export function formatUnknown(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unexpected error.";
  }
}

export function formatApproveError(err: unknown): string {
  if (!err || typeof err !== "object") return formatUnknown(err);
  const rec = err as Record<string, unknown>;
  if ("InsufficientFunds" in rec) {
    const inner = rec.InsufficientFunds as { balance?: bigint };
    if (inner?.balance !== undefined) {
      return `Insufficient ICP (balance ${formatE8s(inner.balance)}).`;
    }
    return "Insufficient ICP to approve the spender.";
  }
  if ("AllowanceChanged" in rec)
    return "The existing ICP allowance changed. Try again.";
  if ("TemporarilyUnavailable" in rec)
    return "The ICP ledger is temporarily unavailable.";
  if ("GenericError" in rec) {
    const inner = rec.GenericError as { message?: string };
    return inner?.message ?? "ICP approve failed.";
  }
  return `ICP approve failed: ${formatUnknown(err)}`;
}
