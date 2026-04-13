import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const colors = {
  brand: '#5B21B6',
  brandLight: '#A78BFA',
  textPrimary: '#1A1028',
  textSecondary: '#6B6280',
  border: '#E5E7EB',
  success: '#059669',
  danger: '#DC2626',
  bgLight: '#F9FAFB',
};

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: colors.textPrimary },
  header: { marginBottom: 24, borderBottom: `2px solid ${colors.brand}`, paddingBottom: 16 },
  title: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: colors.brand, marginBottom: 4 },
  subtitle: { fontSize: 11, color: colors.textSecondary },
  companyName: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  dateRange: { fontSize: 9, color: colors.textSecondary, marginTop: 4 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: colors.brand, marginBottom: 8, paddingBottom: 4, borderBottom: `1px solid ${colors.border}` },
  row: { flexDirection: 'row', paddingVertical: 6, borderBottom: `1px solid ${colors.border}` },
  rowAlt: { flexDirection: 'row', paddingVertical: 6, borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgLight },
  headerRow: { flexDirection: 'row', paddingVertical: 6, borderBottom: `2px solid ${colors.border}`, backgroundColor: colors.bgLight },
  cellLabel: { flex: 3, fontSize: 10 },
  cellAmount: { flex: 1, fontSize: 10, textAlign: 'right' },
  cellHeaderLabel: { flex: 3, fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.textSecondary, textTransform: 'uppercase' },
  cellHeaderAmount: { flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.textSecondary, textAlign: 'right', textTransform: 'uppercase' },
  totalRow: { flexDirection: 'row', paddingVertical: 8, borderTop: `2px solid ${colors.brand}`, marginTop: 4 },
  totalLabel: { flex: 3, fontSize: 12, fontFamily: 'Helvetica-Bold' },
  totalAmount: { flex: 1, fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  positive: { color: colors.success },
  negative: { color: colors.danger },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: colors.textSecondary, borderTop: `1px solid ${colors.border}`, paddingTop: 8 },
  metricBox: { padding: 12, border: `1px solid ${colors.border}`, borderRadius: 4, flex: 1, marginHorizontal: 4 },
  metricLabel: { fontSize: 8, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
  metricValue: { fontSize: 16, fontFamily: 'Helvetica-Bold' },
  metricsRow: { flexDirection: 'row', marginBottom: 20, marginHorizontal: -4 },
});

const formatNGN = (amount: number) => `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

interface PLData {
  companyName: string;
  startDate: string;
  endDate: string;
  incomeCategories: { name: string; amount: number }[];
  expenseCategories: { name: string; amount: number }[];
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}

export function ProfitLossReport({ data }: { data: PLData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Profit & Loss Statement</Text>
          <Text style={styles.companyName}>{data.companyName}</Text>
          <Text style={styles.dateRange}>{data.startDate} to {data.endDate}</Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Total Revenue</Text>
            <Text style={[styles.metricValue, styles.positive]}>{formatNGN(data.totalIncome)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Total Expenses</Text>
            <Text style={[styles.metricValue, styles.negative]}>{formatNGN(data.totalExpenses)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Net Profit</Text>
            <Text style={[styles.metricValue, data.netProfit >= 0 ? styles.positive : styles.negative]}>{formatNGN(data.netProfit)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue</Text>
          <View style={styles.headerRow}>
            <Text style={styles.cellHeaderLabel}>Category</Text>
            <Text style={styles.cellHeaderAmount}>Amount</Text>
          </View>
          {data.incomeCategories.map((cat, i) => (
            <View key={i} style={i % 2 === 0 ? styles.row : styles.rowAlt}>
              <Text style={styles.cellLabel}>{cat.name}</Text>
              <Text style={[styles.cellAmount, styles.positive]}>{formatNGN(cat.amount)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Revenue</Text>
            <Text style={[styles.totalAmount, styles.positive]}>{formatNGN(data.totalIncome)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expenses</Text>
          <View style={styles.headerRow}>
            <Text style={styles.cellHeaderLabel}>Category</Text>
            <Text style={styles.cellHeaderAmount}>Amount</Text>
          </View>
          {data.expenseCategories.map((cat, i) => (
            <View key={i} style={i % 2 === 0 ? styles.row : styles.rowAlt}>
              <Text style={styles.cellLabel}>{cat.name}</Text>
              <Text style={styles.cellAmount}>{formatNGN(cat.amount)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Expenses</Text>
            <Text style={[styles.totalAmount, styles.negative]}>{formatNGN(data.totalExpenses)}</Text>
          </View>
        </View>

        <View style={[styles.totalRow, { borderTop: `3px solid ${colors.brand}`, marginTop: 8, paddingTop: 12 }]}>
          <Text style={[styles.totalLabel, { fontSize: 14 }]}>Net Profit / (Loss)</Text>
          <Text style={[styles.totalAmount, { fontSize: 14 }, data.netProfit >= 0 ? styles.positive : styles.negative]}>
            {formatNGN(data.netProfit)}
          </Text>
        </View>

        <Text style={styles.footer}>Generated by Emiday • {new Date().toLocaleDateString()}</Text>
      </Page>
    </Document>
  );
}

interface CashFlowData {
  companyName: string;
  startDate: string;
  endDate: string;
  months: { month: string; inflow: number; outflow: number; net: number }[];
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
}

export function CashFlowReport({ data }: { data: CashFlowData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Cash Flow Statement</Text>
          <Text style={styles.companyName}>{data.companyName}</Text>
          <Text style={styles.dateRange}>{data.startDate} to {data.endDate}</Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Total Inflow</Text>
            <Text style={[styles.metricValue, styles.positive]}>{formatNGN(data.totalInflow)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Total Outflow</Text>
            <Text style={[styles.metricValue, styles.negative]}>{formatNGN(data.totalOutflow)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Net Cash Flow</Text>
            <Text style={[styles.metricValue, data.netCashFlow >= 0 ? styles.positive : styles.negative]}>{formatNGN(data.netCashFlow)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
          <View style={styles.headerRow}>
            <Text style={[styles.cellHeaderLabel, { flex: 2 }]}>Month</Text>
            <Text style={styles.cellHeaderAmount}>Inflow</Text>
            <Text style={styles.cellHeaderAmount}>Outflow</Text>
            <Text style={styles.cellHeaderAmount}>Net</Text>
          </View>
          {data.months.map((m, i) => (
            <View key={i} style={i % 2 === 0 ? styles.row : styles.rowAlt}>
              <Text style={[styles.cellLabel, { flex: 2 }]}>{m.month}</Text>
              <Text style={[styles.cellAmount, styles.positive]}>{formatNGN(m.inflow)}</Text>
              <Text style={[styles.cellAmount, styles.negative]}>{formatNGN(m.outflow)}</Text>
              <Text style={[styles.cellAmount, m.net >= 0 ? styles.positive : styles.negative]}>{formatNGN(m.net)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { flex: 2 }]}>Total</Text>
            <Text style={[styles.totalAmount, styles.positive]}>{formatNGN(data.totalInflow)}</Text>
            <Text style={[styles.totalAmount, styles.negative]}>{formatNGN(data.totalOutflow)}</Text>
            <Text style={[styles.totalAmount, data.netCashFlow >= 0 ? styles.positive : styles.negative]}>{formatNGN(data.netCashFlow)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>Generated by Emiday • {new Date().toLocaleDateString()}</Text>
      </Page>
    </Document>
  );
}

interface VATReportData {
  companyName: string;
  vatNumber: string;
  period: string;
  outputVAT: number;
  inputVAT: number;
  netPayable: number;
  transactions: { date: string; description: string; amount: number; vat: number; type: string }[];
}

interface WHTReportData {
  companyName: string;
  quarter: string;
  year: number;
  transactions: { date: string; vendor: string; description: string; amount: number; whtRate: number; whtAmount: number }[];
  totalWHTDeducted: number;
}

export function WHTReport({ data }: { data: WHTReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>WHT Deduction Summary</Text>
          <Text style={styles.companyName}>{data.companyName}</Text>
          <Text style={styles.dateRange}>{data.quarter} {data.year}</Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Total WHT Deducted</Text>
            <Text style={[styles.metricValue, { color: colors.brand }]}>{formatNGN(data.totalWHTDeducted)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Transactions</Text>
            <Text style={styles.metricValue}>{data.transactions.length}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WHT Deductions</Text>
          <View style={styles.headerRow}>
            <Text style={[styles.cellHeaderLabel, { flex: 1 }]}>Date</Text>
            <Text style={[styles.cellHeaderLabel, { flex: 2 }]}>Vendor / Description</Text>
            <Text style={styles.cellHeaderAmount}>Amount</Text>
            <Text style={[styles.cellHeaderAmount, { flex: 0.5 }]}>Rate</Text>
            <Text style={styles.cellHeaderAmount}>WHT</Text>
          </View>
          {data.transactions.map((tx, i) => (
            <View key={i} style={i % 2 === 0 ? styles.row : styles.rowAlt}>
              <Text style={[styles.cellLabel, { flex: 1 }]}>{tx.date}</Text>
              <Text style={[styles.cellLabel, { flex: 2 }]}>{tx.vendor || tx.description}</Text>
              <Text style={styles.cellAmount}>{formatNGN(tx.amount)}</Text>
              <Text style={[styles.cellAmount, { flex: 0.5 }]}>{(tx.whtRate * 100).toFixed(0)}%</Text>
              <Text style={[styles.cellAmount, { color: colors.brand }]}>{formatNGN(tx.whtAmount)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { flex: 3 }]}>Total WHT Deducted</Text>
            <Text style={[styles.totalAmount, { flex: 0.5 }]}></Text>
            <Text style={[styles.totalAmount, { color: colors.brand }]}>{formatNGN(data.totalWHTDeducted)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>Generated by Emiday • {new Date().toLocaleDateString()}</Text>
      </Page>
    </Document>
  );
}

interface PAYEScheduleData {
  companyName: string;
  period: string;
  employees: { name: string; department: string; grossMonthly: number; annualGross: number; monthlyPAYE: number; annualPAYE: number; effectiveRate: number }[];
  totalMonthlyPAYE: number;
  totalAnnualPAYE: number;
}

export function PAYEScheduleReport({ data }: { data: PAYEScheduleData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        <View style={styles.header}>
          <Text style={styles.title}>PAYE Schedule</Text>
          <Text style={styles.companyName}>{data.companyName}</Text>
          <Text style={styles.dateRange}>Period: {data.period}</Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Total Monthly PAYE</Text>
            <Text style={[styles.metricValue, { color: colors.brand }]}>{formatNGN(data.totalMonthlyPAYE)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Total Annual PAYE</Text>
            <Text style={[styles.metricValue, { color: colors.brand }]}>{formatNGN(data.totalAnnualPAYE)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Employees</Text>
            <Text style={styles.metricValue}>{data.employees.length}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employee PAYE Breakdown</Text>
          <View style={styles.headerRow}>
            <Text style={[styles.cellHeaderLabel, { flex: 2 }]}>Employee</Text>
            <Text style={[styles.cellHeaderLabel, { flex: 1 }]}>Dept</Text>
            <Text style={styles.cellHeaderAmount}>Gross Monthly</Text>
            <Text style={styles.cellHeaderAmount}>Monthly PAYE</Text>
            <Text style={styles.cellHeaderAmount}>Annual PAYE</Text>
            <Text style={[styles.cellHeaderAmount, { flex: 0.5 }]}>Rate</Text>
          </View>
          {data.employees.map((emp, i) => (
            <View key={i} style={i % 2 === 0 ? styles.row : styles.rowAlt}>
              <Text style={[styles.cellLabel, { flex: 2 }]}>{emp.name}</Text>
              <Text style={[styles.cellLabel, { flex: 1 }]}>{emp.department || '—'}</Text>
              <Text style={styles.cellAmount}>{formatNGN(emp.grossMonthly)}</Text>
              <Text style={[styles.cellAmount, { color: colors.brand }]}>{formatNGN(emp.monthlyPAYE)}</Text>
              <Text style={styles.cellAmount}>{formatNGN(emp.annualPAYE)}</Text>
              <Text style={[styles.cellAmount, { flex: 0.5 }]}>{(emp.effectiveRate * 100).toFixed(1)}%</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { flex: 3 }]}>Totals</Text>
            <Text style={[styles.totalAmount, { color: colors.brand }]}>{formatNGN(data.totalMonthlyPAYE)}</Text>
            <Text style={styles.totalAmount}>{formatNGN(data.totalAnnualPAYE)}</Text>
            <Text style={[styles.totalAmount, { flex: 0.5 }]}></Text>
          </View>
        </View>

        <Text style={styles.footer}>Generated by Emiday • {new Date().toLocaleDateString()}</Text>
      </Page>
    </Document>
  );
}

export function VATReport({ data }: { data: VATReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>VAT Return Summary</Text>
          <Text style={styles.companyName}>{data.companyName}</Text>
          <Text style={styles.subtitle}>VAT Reg: {data.vatNumber}</Text>
          <Text style={styles.dateRange}>Period: {data.period}</Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Output VAT</Text>
            <Text style={styles.metricValue}>{formatNGN(data.outputVAT)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Input VAT</Text>
            <Text style={styles.metricValue}>{formatNGN(data.inputVAT)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Net Payable</Text>
            <Text style={[styles.metricValue, data.netPayable > 0 ? styles.negative : styles.positive]}>{formatNGN(data.netPayable)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VAT-Applicable Transactions</Text>
          <View style={styles.headerRow}>
            <Text style={[styles.cellHeaderLabel, { flex: 1 }]}>Date</Text>
            <Text style={[styles.cellHeaderLabel, { flex: 3 }]}>Description</Text>
            <Text style={styles.cellHeaderAmount}>Amount</Text>
            <Text style={styles.cellHeaderAmount}>VAT</Text>
          </View>
          {data.transactions.map((tx, i) => (
            <View key={i} style={i % 2 === 0 ? styles.row : styles.rowAlt}>
              <Text style={[styles.cellLabel, { flex: 1 }]}>{tx.date}</Text>
              <Text style={[styles.cellLabel, { flex: 3 }]}>{tx.description}</Text>
              <Text style={styles.cellAmount}>{formatNGN(tx.amount)}</Text>
              <Text style={styles.cellAmount}>{formatNGN(tx.vat)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>Generated by Emiday • {new Date().toLocaleDateString()}</Text>
      </Page>
    </Document>
  );
}
