"use client";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import { advocates } from "@/lib/data";
import Band from "@/components/band";
import { Avatar, Card, CardHead, PageHead, SelectPill } from "@/components/ui";
import { AreaChart, Bars, Donut, Heatmap } from "@/components/charts";
import { FollowUpTasks, RailHead } from "@/components/rail";

export default function AnalyticsPage() {
  usePageMotion();
  const toast = useToast();
  return (
    <>
      <PageHead eyebrow="Performance" title="Analytics"
        sub="How campaigns, calls and closings performed across August."
        actions={<><SelectPill>This month</SelectPill>
          <button className="btn btn-brand sm" onClick={() => toast("Report downloading…")}>Download report</button></>} />

      <Band eyebrow="Performance · August"
        title='Cost per signed case fell to ₹<em class="num" data-count="4120">0</em>.'
        body="Down 8% month on month. Meta drives 62% of volume, but referrals convert at nearly twice the rate."
        metrics={[
          { label: "Leads", value: "0", count: "1284" }, { label: "Signed", value: "0", count: "87" },
          { label: "Close rate", value: "0%", count: "42", suffix: "%" }, { label: "Connect rate", value: "0%", count: "34", suffix: "%" },
        ]}
        tiles={[
          { icon: "◲", value: "0", label: "Avg. dials per day", count: "428" },
          { icon: "₹", value: "0", label: "Revenue · August", count: "38.6", prefix: "₹", suffix: " L" },
        ]} />

      <div className="canvas-grid">
        <div className="stream">
          <Card>
            <CardHead title="Pipeline performance" sub="Conversion at each stage" />
            <Bars data={[
              { label: "New", pct: 0.14 }, { label: "Contacted", pct: 0.40 }, { label: "Qualified", pct: 0.30 },
              { label: "Advocate", pct: 0.20 }, { label: "Fee shared", pct: 0.16 }, { label: "Negotiation", pct: 0.14 },
              { label: "Signed", pct: 0.70 },
            ]} />
          </Card>

          <div className="pair-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card>
              <CardHead title="Leads vs signed" sub="Weekly, last 8 weeks" />
              <AreaChart id="ag2"
                labels={["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"]}
                values={["128 leads", "141", "156", "171", "182", "204", "238", "251"]}
                line="M0 170 C50 150 80 120 130 128 C180 136 210 90 260 96 C310 102 340 60 390 68 C440 76 470 40 520 46 C560 50 585 30 600 32"
                fill="M0 170 C50 150 80 120 130 128 C180 136 210 90 260 96 C310 102 340 60 390 68 C440 76 470 40 520 46 C560 50 585 30 600 32 L600 240 L0 240 Z" />
            </Card>
            <Card>
              <CardHead title="Call activity" sub="Dials per hour · Mon–Fri" />
              <Heatmap />
              <div style={{ display: "flex", gap: 26, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--hair)" }}>
                <div className="meta"><span>Peak window</span><b>11 am – 1 pm</b></div>
                <div className="meta"><span>Avg. dials/day</span><b>428</b></div>
                <div className="meta"><span>Connect rate</span><b>34%</b></div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHead title="Advocate performance — August" sub="Close rate and revenue by team member"
              right={<button className="btn btn-ghost sm" onClick={() => toast("Report downloading…")}>Download</button>} />
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Advocate</th><th>Cases</th><th>Signed</th><th>Revenue</th><th>Close rate</th><th>Progress to target</th></tr></thead>
                <tbody>
                  {advocates.map((a) => (
                    <tr key={a.name}>
                      <td className="td-person"><Avatar src={a.photo} size={38} /><div>{a.name}<span>{a.role}</span></div></td>
                      <td>{a.cases}</td><td>{a.signed}</td><td>{a.revenue}</td>
                      <td><span className={`chip ${a.tone}`}>{a.rate}</span></td>
                      <td><div className="prog"><i data-w={a.target} /></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <aside className="rail">
          <RailHead title="Breakdown" />
          <Card className="pad-sm">
            <div className="card-head" style={{ marginBottom: 14 }}><span className="card-title">Lead sources</span></div>
            <Donut center="1.9k" size={150} segments={[
              { fill: 0.62, color: "var(--ember)", rotate: -90 },
              { fill: 0.22, color: "var(--mint-ink)", rotate: 140 },
            ]} />
            <div className="donut-legend">
              <div className="row"><i style={{ width: 9, height: 9, borderRadius: 3, background: "var(--ember)" }} />Meta Ads <b>62%</b></div>
              <div className="row"><i style={{ width: 9, height: 9, borderRadius: 3, background: "var(--mint-ink)" }} />Referrals <b>22%</b></div>
              <div className="row"><i style={{ width: 9, height: 9, borderRadius: 3, background: "var(--hair-2)" }} />Organic <b>16%</b></div>
            </div>
          </Card>
          <Card className="pad-sm">
            <div className="card-head" style={{ marginBottom: 10 }}>
              <span className="card-title">Cost per signed case</span><span className="chip mint">▼ 8%</span></div>
            <div className="kpi-num num" data-count="4120" data-prefix="₹">0</div>
            <div className="kpi-lbl">Down from ₹4,480 last month across C1–C5.</div>
          </Card>
          <FollowUpTasks />
        </aside>
      </div>
    </>
  );
}
