// Primary bank feed metadata — the "synced 4 min ago" line and
// the monthly totals shown beneath the Inbox card.

export type BankAccountMeta = {
  name: string;
  accountMask: string;
  subtype: string; // "Business"
  lastSynced: string;
  totalMonth: number; // 412
  netFlow: number;    // +₦2,137,290
};

export const PRIMARY_BANK_META: BankAccountMeta = {
  name: "GTBank Business",
  accountMask: "**2041",
  subtype: "Business",
  lastSynced: "4 min ago",
  totalMonth: 412,
  netFlow: 2_137_290,
};
