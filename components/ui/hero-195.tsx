"use client";

import * as React from "react";
import Link from "next/link";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Plus, Upload, Bot, DollarSign, Receipt, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BorderBeam } from "@/components/ui/border-beam";
import { cn } from "@/lib/utils";

interface HeroMetric {
  label: string;
  value: string;
  compactValue: string;
}

interface Hero195Props {
  greeting: string;
  firstName: string;
  dateString: string;
  netProfit: number;
  profitMargin: string;
  transactionCount: number;
  currency: string;
  revenue: HeroMetric;
  expenses: HeroMetric;
  vatLiability: HeroMetric;
  formatCurrency: (amount: number, currency: string) => string;
  formatCompactCurrency: (amount: number, currency: string) => string;
}

export function Hero195({
  greeting,
  firstName,
  dateString,
  netProfit,
  profitMargin,
  transactionCount,
  currency,
  revenue,
  expenses,
  vatLiability,
  formatCurrency,
  formatCompactCurrency,
}: Hero195Props) {
  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{dateString}</p>
          <h1 className="text-2xl md:text-[34px] font-extrabold text-foreground tracking-tight leading-tight">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here&apos;s your financial overview.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Button asChild>
            <Link href="/transactions">
              <Plus size={15} className="mr-1.5" />
              Add Transaction
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/transactions/import">
              <Upload size={15} className="mr-1.5" />
              Import
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/ai-chat">
              <Bot size={15} className="mr-1.5" />
              Ask AI
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero card with border beam */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[#312E81] via-[#4F46E5] to-[#6366F1] text-white">
        <BorderBeam
          size={250}
          duration={12}
          colorFrom="#818CF8"
          colorTo="#C7D2FE"
          borderWidth={2}
        />

        {/* Background effects */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="heroGrid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#heroGrid)" />
        </svg>
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-white/[0.07] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent animate-shimmer" />
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />

        <CardContent className="relative p-6 md:p-8">
          <Tabs defaultValue="profit" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              {/* Left: main metric */}
              <div>
                <TabsList className="bg-white/10 border border-white/10 mb-4">
                  <TabsTrigger value="profit" className="text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-none">
                    Profit
                  </TabsTrigger>
                  <TabsTrigger value="revenue" className="text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-none">
                    Revenue
                  </TabsTrigger>
                  <TabsTrigger value="expenses" className="text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-none">
                    Expenses
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profit" className="mt-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                      <TrendingUp size={15} />
                    </div>
                    <p className="text-sm font-medium text-indigo-200">Net Profit</p>
                  </div>
                  <p className="text-4xl md:text-5xl font-bold tabular-nums tracking-tight">
                    {formatCurrency(netProfit, currency)}
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    {netProfit >= 0
                      ? <ArrowUpRight size={16} className="text-emerald-300" />
                      : <ArrowDownRight size={16} className="text-red-300" />}
                    <span className={cn("text-sm font-medium", netProfit >= 0 ? "text-emerald-300" : "text-red-300")}>
                      {profitMargin}% margin
                    </span>
                    <span className="text-indigo-300 text-sm">&middot; {transactionCount} transactions</span>
                  </div>
                </TabsContent>

                <TabsContent value="revenue" className="mt-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                      <DollarSign size={15} />
                    </div>
                    <p className="text-sm font-medium text-indigo-200">Total Revenue</p>
                  </div>
                  <p className="text-4xl md:text-5xl font-bold tabular-nums tracking-tight">
                    {revenue.value}
                  </p>
                </TabsContent>

                <TabsContent value="expenses" className="mt-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                      <Receipt size={15} />
                    </div>
                    <p className="text-sm font-medium text-indigo-200">Total Expenses</p>
                  </div>
                  <p className="text-4xl md:text-5xl font-bold tabular-nums tracking-tight">
                    {expenses.value}
                  </p>
                </TabsContent>
              </div>

              {/* Right: summary cards */}
              <div className="flex items-center gap-3">
                <div className="text-center px-6 py-4 rounded-xl bg-white/[0.08] backdrop-blur-sm border border-white/[0.06]">
                  <p className="text-[11px] text-indigo-200 font-medium mb-1.5 uppercase tracking-wide">Revenue</p>
                  <p className="text-lg font-bold tabular-nums">{revenue.compactValue}</p>
                </div>
                <div className="text-center px-6 py-4 rounded-xl bg-white/[0.08] backdrop-blur-sm border border-white/[0.06]">
                  <p className="text-[11px] text-indigo-200 font-medium mb-1.5 uppercase tracking-wide">Expenses</p>
                  <p className="text-lg font-bold tabular-nums">{expenses.compactValue}</p>
                </div>
                <div className="text-center px-6 py-4 rounded-xl bg-white/[0.08] backdrop-blur-sm border border-white/[0.06]">
                  <p className="text-[11px] text-indigo-200 font-medium mb-1.5 uppercase tracking-wide">VAT Due</p>
                  <p className="text-lg font-bold tabular-nums">{vatLiability.compactValue}</p>
                </div>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Mobile quick actions */}
      <div className="flex sm:hidden gap-2 -mx-1 px-1 overflow-x-auto scrollbar-hide">
        <Button asChild size="sm" className="rounded-full flex-shrink-0">
          <Link href="/transactions">
            <Plus size={13} className="mr-1" />
            Add
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-full flex-shrink-0">
          <Link href="/transactions/import">
            <Upload size={13} className="mr-1" />
            Import
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-full flex-shrink-0">
          <Link href="/ai-chat">
            <Bot size={13} className="mr-1" />
            Ask AI
          </Link>
        </Button>
      </div>
    </div>
  );
}
