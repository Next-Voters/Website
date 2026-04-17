/**
 * Referral utilities for k-factor tracking.
 */

/**
 * Generate a deterministic 8-character referral code from an email address.
 */
export function generateReferralCode(email: string): string {
  const normalized = email.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  const unsigned = hash >>> 0;
  return unsigned.toString(36).padStart(8, "0").slice(0, 8);
}

/**
 * Build a full referral link pointing to /request-region with the ref code.
 */
export function buildReferralLink(
  code: string,
  destination: string = "/request-region",
): string {
  return `https://nextvoters.com${destination}?ref=${encodeURIComponent(code)}`;
}
