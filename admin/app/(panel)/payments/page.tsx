"use client";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import { transactions } from "@/lib/data";
import Band from "@/components/band";
import { Avatar, Card, CardHead, PageHead } from "@/components/ui";
import { Donut, Kpi } from "@/components/charts";
import { FollowUpTasks, RailHead } from "@/components/rail";

export default function PaymentsPage() {
  usePageMotion();
  const toast = useToast();
  return (
    <>
      <PageHead eyebrow="Finance" title="Payments"
        sub="Onboarding fees, success fees and settlements — reconciled daily."
        actions={<>
          <button className="btn btn-ghost sm" onClick={() => toast("Statement exported")}>Export</button>
          <button className="btn btn-brand sm" onClick={() => toast("Invoice generator opened")}>+ New invoice</button></>} />

      <Band eyebrow="Finance · September"
        title='₹<em class="num" data-count="8.4" data-suffix=" L">0</em> collected, ₹<em class="num" data-count="6.4" data-suffix=" L">0</em> still out.'
        body="Twelve invoices are pending and three have passed fifteen days. Automated reminders go out at 6 pm daily."
        metrics={[
          { label: "Collected", value: "0", count: "38.6", prefix: "₹", suffix: " L" },
          { label: "Pending", value: "0", count: "12" }, { label: "Overdue", value: "0", count: "3" },
        ]}
        tiles={[
          { icon: "₹", value: "0", label: "Avg. invoice value", count: "47.2", prefix: "₹", suffix: " K" },
          { icon: "◷", value: "0", label: "Avg. days to pay", count: "9" },
        ]}
        bar={{ pct: 21, left: "Week 1 of September", right: "₹40 L monthly target" }} />

      <div className="canvas-grid">
        <div className="stream">
          <div className="kpis" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
            <Kpi icon="₹" iconBg="var(--mint)" iconInk="var(--mint-ink)" chip="▲ 9.2%" value="0" count="38.6" prefix="₹" suffix=" L" label="Collected this month" spark="M0 30 L20 26 L40 28 L60 19 L80 22 L100 13 L120 15" stroke="var(--mint-ink)" />
            <Kpi icon="◷" iconBg="var(--sand)" iconInk="var(--sand-ink)" chip="12 invoices" chipTone="sand" value="0" count="6.4" prefix="₹" suffix=" L" label="Pending collection" spark="M0 22 L20 24 L40 20 L60 25 L80 21 L100 26 L120 23" />
            <Kpi icon="!" iconBg="var(--rose)" iconInk="var(--rose-ink)" chip="3 overdue" chipTone="rose" value="0" count="1.2" prefix="₹" suffix=" L" label="Overdue > 15 days" spark="M0 18 L20 21 L40 19 L60 24 L80 22 L100 27 L120 25" stroke="var(--rose-ink)" />
          </div>

          <Card>
            <CardHead title="Recent transactions" sub="All fee types · last 30 days"
              right={<div className="seg"><button className="on">All</button><button>Onboarding</button><button>Success fee</button></div>} />
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Client</th><th>Type</th><th>Invoice</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.inv}>
                      <td className="td-person"><Avatar src={t.photo} size={38} /><div>{t.name}<span>{t.meta}</span></div></td>
                      <td>{t.type}</td><td>{t.inv}</td><td>{t.date}</td><td><b>{t.amount}</b></td>
                      <td><span className={`chip ${t.tone}`}><span className="dot" />{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <aside className="rail">
          <RailHead title="This month" />
          <Card className="pad-sm invoice">
            <div className="blob" />
            <div className="card-head" style={{ marginBottom: 12, position: "relative" }}>
              <span className="card-title">Collections</span>
              <span className="chip" style={{ background: "rgba(255,255,255,.14)", color: "#fff" }}>Week 1</span>
            </div>
            <div className="kpi-num num" style={{ position: "relative" }} data-count="8.4" data-prefix="₹" data-suffix=" L">0</div>
            <div style={{ color: "rgba(255,255,255,.6)", fontSize: 12.5, marginTop: 6, position: "relative" }}>of ₹40 L monthly target</div>
            <div className="bar-thin" style={{ background: "rgba(255,255,255,.16)", marginTop: 16, position: "relative" }}><i data-w="21" /></div>
          </Card>
          <Card className="pad-sm">
            <div className="card-head" style={{ marginBottom: 14 }}><span className="card-title">Fee split</span></div>
            <Donut size={140} segments={[{ fill: 0.58, color: "var(--ember)", rotate: -90 }]} />
            <div className="donut-legend">
              <div className="row"><i style={{ width: 9, height: 9, borderRadius: 3, background: "var(--ember)" }} />Onboarding <b>58%</b></div>
              <div className="row"><i style={{ width: 9, height: 9, borderRadius: 3, background: "var(--hair-2)" }} />Success fee <b>42%</b></div>
            </div>
          </Card>
          <FollowUpTasks />
        </aside>
      </div>
    </>
  );
}
