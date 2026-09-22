export const CURRENCY_CODE = 'UGX';
export const CURRENCY_SYMBOL = 'UGX';
export const DEFAULT_BATCH_FEE_UGX = 1500; // Flat batch delivery fee in Ugandan Shillings

/**
 * Format any numerical price or total into Ugandan Shillings (e.g. "UGX 12,500")
 */
export function formatUGX(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'UGX 0';
  }
  return `UGX ${Math.round(amount).toLocaleString('en-UG')}`;
}
