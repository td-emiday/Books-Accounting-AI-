export type ChatMessage = {
  id: number;
  me: boolean;
  text: string;
  data?: [string, string][];
};

export const CHAT_THREAD: ChatMessage[] = [
  { id: 1, me: true, text: "What did we spend on payroll this month vs last?" },
  {
    id: 2,
    me: false,
    text:
      "April payroll came in at ₦4.82M across 42 employees. That's +8.3% vs March (₦4.45M), driven mostly by two new hires in Ops.",
    data: [
      ["April 2026", "₦4,820,000"],
      ["March 2026", "₦4,450,000"],
      ["Δ month-over-month", "+₦370,000"],
    ],
  },
  { id: 3, me: true, text: "Will we have enough for the VAT filing on the 21st?" },
  {
    id: 4,
    me: false,
    text:
      "Yes — current operating balance is ₦28.4M against a VAT liability of ₦3.24M. I've earmarked it and set a reminder to review the return tomorrow.",
  },
];

export const CHAT_SUGGESTIONS = [
  "What's my runway?",
  "Explain this spike",
  "Prep my VAT return",
];
