// Workspace, active user and current period.
// In a real app these come from session + DB; for now they're
// the single source of truth consumed by Sidebar, TopBar, Chat, etc.

export type Workspace = {
  id: string;
  name: string;
  tradingAs: string;
  rcNumber: string;
  sector: string;
  location: string; // "Lagos · Small biz"
  avatarInitial: string;
  address: string;
  email: string;
  phone: string;
  fiscalYearEnd: string;
  baseCurrency: string;
};

export type ActiveUser = {
  name: string;
  email: string;
  role: string;
  avatarInitials: string;
};

export type CurrentPeriod = {
  label: string;
  range: string; // "Apr 2026 · month-to-date"
};

export const WORKSPACE: Workspace = {
  id: "kadara-foods",
  name: "Kadara Foods Ltd",
  tradingAs: "Kadara",
  rcNumber: "RC 1882301",
  sector: "Food & Beverage",
  location: "Lagos · Small biz",
  avatarInitial: "K",
  address: "14 Akin Adesola Street, Victoria Island, Lagos",
  email: "finance@kadarafoods.ng",
  phone: "+234 803 004 1182",
  fiscalYearEnd: "31 December",
  baseCurrency: "Nigerian Naira (₦)",
};

export const ACTIVE_USER: ActiveUser = {
  name: "Adaeze O.",
  email: "adaeze@kadarafoods.ng",
  role: "Finance Lead",
  avatarInitials: "AO",
};

export const CURRENT_PERIOD: CurrentPeriod = {
  label: "Month",
  range: "Apr 2026 · month-to-date",
};
