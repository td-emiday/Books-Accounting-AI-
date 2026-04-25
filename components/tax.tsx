"use client";

import { Fragment, useState } from "react";
import { Icon } from "./icon";
import {
  PAYMENT_SOURCES,
  type TaxItem,
} from "@/lib/data/tax";

const fmtN = (n: number) => "₦" + n.toLocaleString();

type PayPayload = TaxItem | { bulk: true };

export function Tax({ items }: { items: TaxItem[] }) {
  const [payItem, setPayItem] = useState<PayPayload | null>(null);
  const [paidIds, setPaidIds] = useState<string[]>([]);
  const totalDue = items
    .filter((t) => !paidIds.includes(t.id) && !t.scheduled)
    .reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <div className="card">
        <div className="card-head">
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              Filing calendar{" "}
              <span
                style={{
                  color: "var(--muted)",
                  fontWeight: 500,
                  fontSize: 15,
                }}
              >
                — next 60 days
              </span>
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              FIRS · Lagos IRS · NSITF · PenCom · Total payable{" "}
              <b
                style={{
                  color: "var(--ink)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {fmtN(totalDue)}
              </b>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="btn">
              <Icon name="calendar" size={13} /> View full calendar
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={() => setPayItem({ bulk: true })}
              disabled={totalDue === 0}
            >
              <Icon name="lightning" size={13} /> Pay all {fmtN(totalDue)}
            </button>
          </div>
        </div>

        <div className="tree">
          {items.map((t) => {
            const paid = paidIds.includes(t.id);
            return (
              <Fragment key={t.id}>
                <div className="tree-row">
                  <div className="date">
                    <b>{t.d}</b>
                    {t.m}
                  </div>
                  <div>
                    <div className="name">{t.name}</div>
                    <div className="desc">{t.desc}</div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 4,
                    }}
                  >
                    {paid ? (
                      <span className="chip up">
                        <Icon name="check" size={10} /> Paid
                      </span>
                    ) : t.scheduled ? (
                      <span className="chip up">
                        <Icon name="check" size={10} /> {t.due}
                      </span>
                    ) : (
                      <span className={`chip ${t.dueKind}`}>{t.due}</span>
                    )}
                    <span className="amount">{fmtN(t.amount)}</span>
                  </div>
                  {paid ? (
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: "6px 12px", fontSize: 11.5 }}
                      disabled
                    >
                      <Icon name="check" size={12} /> Receipt
                    </button>
                  ) : t.scheduled ? (
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: "6px 12px", fontSize: 11.5 }}
                      onClick={() => setPayItem(t)}
                    >
                      Manage
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: 4 }}>
                      {t.primary && (
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: "6px 12px", fontSize: 11.5 }}
                        >
                          {t.primary}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn accent"
                        style={{ padding: "6px 12px", fontSize: 11.5 }}
                        onClick={() => setPayItem(t)}
                      >
                        <Icon name="lightning" size={11} /> Pay now
                      </button>
                    </div>
                  )}
                </div>

                {t.id === "vat" && t.draft && (
                  <div className="tree-row nested">
                    <div className="date">
                      <b>19</b>Apr
                    </div>
                    <div>
                      <div className="name">Draft ready — review required</div>
                      <div className="desc">
                        Emiday prepared the return · 3 flagged transactions
                        pending your call
                      </div>
                    </div>
                    <div />
                    <span className="chip neutral">
                      <Icon name="eye" size={10} /> Preview
                    </span>
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </div>

      {payItem && (
        <PayDrawer
          item={payItem}
          allItems={items}
          onClose={() => setPayItem(null)}
          onPaid={(ids) => {
            setPaidIds([...paidIds, ...ids]);
            setPayItem(null);
          }}
        />
      )}
    </>
  );
}

type PayDrawerProps = {
  item: PayPayload;
  allItems: TaxItem[];
  onClose: () => void;
  onPaid: (ids: string[]) => void;
};

function PayDrawer({ item, allItems, onClose, onPaid }: PayDrawerProps) {
  const bulk = "bulk" in item && item.bulk;
  const items = bulk ? allItems.filter((t) => !t.scheduled) : [item as TaxItem];
  const total = items.reduce((s, t) => s + t.amount, 0);
  const [method, setMethod] = useState("gtbank");
  const [stage, setStage] = useState<"review" | "auth" | "success">("review");

  const sources = PAYMENT_SOURCES;
  const src = sources.find((s) => s.id === method);

  const pay = () => {
    setStage("auth");
    setTimeout(() => setStage("success"), 1400);
  };

  return (
    <div className="pay-overlay" onClick={onClose}>
      <div className="pay-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="pay-head">
          <div>
            <div
              style={{
                fontSize: 11,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 500,
              }}
            >
              {stage === "success"
                ? "Payment confirmed"
                : bulk
                ? "Pay all obligations"
                : "Pay obligation"}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                marginTop: 4,
              }}
            >
              {bulk ? `${items.length} authorities` : (item as TaxItem).name}
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} title="Close">
            <Icon name="close2" size={16} />
          </button>
        </div>

        {stage === "review" && (
          <div className="pay-body">
            <div className="pay-section">
              <div className="pay-section-t">Breakdown</div>
              <div className="pay-lines">
                {items.map((t) => (
                  <div key={t.id} className="pay-line">
                    <div>
                      <div style={{ fontWeight: 550, fontSize: 13 }}>
                        {t.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--muted)",
                          fontFamily: "var(--font-mono)",
                          marginTop: 2,
                        }}
                      >
                        {t.authority} · {t.ref}
                      </div>
                    </div>
                    <div className="num" style={{ fontWeight: 500 }}>
                      {fmtN(t.amount)}
                    </div>
                  </div>
                ))}
                <div className="pay-line total">
                  <div style={{ fontWeight: 600 }}>Total</div>
                  <div
                    className="num"
                    style={{ fontWeight: 600, fontSize: 16 }}
                  >
                    {fmtN(total)}
                  </div>
                </div>
              </div>
            </div>

            <div className="pay-section">
              <div className="pay-section-t">Pay from</div>
              <div className="pay-sources">
                {sources.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`pay-source ${method === s.id ? "on" : ""}`}
                    onClick={() => setMethod(s.id)}
                  >
                    <div className="tick">
                      {method === s.id && <Icon name="check" size={12} />}
                    </div>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ fontWeight: 550, fontSize: 13 }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>
                        {s.sub}
                      </div>
                    </div>
                    {s.bal !== null && (
                      <div
                        className="num"
                        style={{ fontSize: 11.5, color: "var(--muted)" }}
                      >
                        {fmtN(s.bal)}
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {src?.bal !== null && src && src.bal !== null && src.bal < total && (
                <div className="pay-note warn">
                  <Icon name="lightning" size={12} /> Insufficient balance on
                  this account.
                </div>
              )}
              {src?.bal !== null && src && src.bal !== null && src.bal >= total && (
                <div className="pay-note">
                  <Icon name="check" size={12} /> After payment, {src.name}{" "}
                  balance will be{" "}
                  <b className="num">{fmtN(src.bal - total)}</b>.
                </div>
              )}
            </div>

            <div className="pay-section">
              <div className="pay-section-t">Settlement</div>
              <div className="pay-schedule">
                <label className="pay-radio">
                  <input type="radio" name="when" defaultChecked />
                  <div>
                    <div style={{ fontWeight: 550, fontSize: 13 }}>Pay now</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                      Debits instantly · receipt in ~30 seconds
                    </div>
                  </div>
                </label>
                <label className="pay-radio">
                  <input type="radio" name="when" />
                  <div>
                    <div style={{ fontWeight: 550, fontSize: 13 }}>
                      Schedule for due date
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                      Auto-debit on the morning it&apos;s due
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {stage === "auth" && (
          <div
            className="pay-body"
            style={{ display: "grid", placeItems: "center", minHeight: 300 }}
          >
            <div style={{ textAlign: "center" }}>
              <div className="spinner" />
              <div style={{ fontWeight: 600, marginTop: 18, fontSize: 15 }}>
                Authorising with {src?.name}…
              </div>
              <div
                style={{
                  color: "var(--muted)",
                  fontSize: 12,
                  marginTop: 6,
                }}
              >
                Secure via NIBSS · you&apos;ll receive an SMS confirmation
              </div>
            </div>
          </div>
        )}

        {stage === "success" && (
          <div className="pay-body">
            <div style={{ textAlign: "center", padding: "24px 0 20px" }}>
              <div className="ok-mark">
                <Icon name="check" size={28} />
              </div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 18,
                  marginTop: 14,
                  letterSpacing: "-0.01em",
                }}
              >
                {fmtN(total)} paid
              </div>
              <div
                style={{
                  color: "var(--muted)",
                  fontSize: 12.5,
                  marginTop: 4,
                }}
              >
                Receipts attached to your books · filed under Tax payments
              </div>
            </div>
            <div className="pay-section">
              <div className="pay-lines">
                {items.map((t) => (
                  <div key={t.id} className="pay-line">
                    <div>
                      <div style={{ fontWeight: 550, fontSize: 13 }}>
                        {t.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--muted)",
                          fontFamily: "var(--font-mono)",
                          marginTop: 2,
                        }}
                      >
                        Ref: EMD-
                        {Math.floor(Math.random() * 900000 + 100000)} ·{" "}
                        {new Date().toLocaleDateString()}
                      </div>
                    </div>
                    <span className="chip up">
                      <Icon name="check" size={10} /> Settled
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="pay-foot">
          {stage === "review" && (
            <>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon name="shield" size={12} /> Secured by NIBSS · PCI-DSS
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="btn" onClick={onClose}>
                  Cancel
                </button>
                <button type="button" className="btn accent" onClick={pay}>
                  <Icon name="lightning" size={12} /> Pay {fmtN(total)}
                </button>
              </div>
            </>
          )}
          {stage === "success" && (
            <>
              <button type="button" className="btn">
                <Icon name="download" size={12} /> Download receipts
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => onPaid(items.map((t) => t.id))}
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
