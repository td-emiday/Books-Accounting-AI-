"use client";

import { Hero195 } from "@/components/ui/hero-195";

const DemoOne = () => {
  return (
    <Hero195
      greeting="Good morning"
      firstName="Alex"
      dateString="Thursday, 17 April 2026"
      netProfit={12450}
      profitMargin="34.5"
      transactionCount={127}
      currency="GBP"
      revenue={{ label: "Revenue", value: "£36,000", compactValue: "£36k" }}
      expenses={{ label: "Expenses", value: "£23,550", compactValue: "£23.5k" }}
      vatLiability={{ label: "VAT Due", value: "£7,200", compactValue: "£7.2k" }}
      formatCurrency={(amount, currency) =>
        new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount)
      }
      formatCompactCurrency={(amount, currency) =>
        new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency,
          notation: "compact",
        }).format(amount)
      }
    />
  );
};

export { DemoOne };
