"use client";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import { campaigns } from "@/lib/data";
import Band from "@/components/band";
import Icon from "@/components/icons";
import { PageHead, SelectPill } from "@/components/ui";
import { Switch } from "@/components/forms";

export default function CampaignsPage() {
  usePageMotion();
  const toast = useToast();
  return (
    <>
      <PageHead eyebrow="Meta Ads" title="Campaigns"
        sub="Live performance across Hyderabad and Bengaluru ad sets."
        actions={<><SelectPill>Last 7 days</SelectPill>
          <button className="btn btn-brand sm" onClick={() => toast("Campaign builder opened")}>+ New campaign</button></>} />

      <Band eyebrow="Meta Ads · live"
        title='<em class="num" data-count="1276">0</em> leads from <em>five</em> active campaigns.'
        body="C4 is the workhorse at 412 leads. C3 retargeting converts best at 11.6% — small budget, big return."
        metrics={[
          { label: "Spend · 7d", value: "0", count: "103.2", prefix: "₹", suffix: " K" },
          { label: "Blended CPL", value: "0", count: "81", prefix: "₹" },
          { label: "Best CPL", value: "0", count: "44", prefix: "₹" },
        ]}
        tiles={[
          { icon: "◈", value: "0", label: "Active campaigns", count: "4" },
          { icon: "%", value: "0%", label: "Avg. conversion", count: "7", suffix: "%" },
        ]} />

      <div className="canvas-grid no-rail">
        <div className="stream">
          <div className="camp-grid">
            {campaigns.map((c) => (
              <div className="card camp gs hoverable" key={c.name}>
                <span className={`chip ${c.live ? "mint" : "rose"}`}><span className={`dot ${c.live ? "pulse" : ""}`} />{c.live ? "Live" : "Paused"}</span>
                <div className="camp-ic" style={{ background: `var(--${c.tone === "iris" ? "lav" : c.tone})`, color: `var(--${c.tone === "iris" ? "lav" : c.tone}-ink)` }}>
                  <Icon name="mega" size={20} />
                </div>
                <h3>{c.name}</h3>
                <div className="camp-sub">{c.sub}</div>
                <div className="camp-metrics">
                  <div><b className="num" data-count={String(c.leads)}>0</b><span>LEADS</span></div>
                  <div><b>₹{c.cpl}</b><span>CPL</span></div>
                  <div><b>{c.conv}%</b><span>CONV.</span></div>
                </div>
                <div className="budget"><span>₹{c.spent} spent</span><span>{c.pct}% of budget</span></div>
                <div className="bar-thin"><i data-w={c.pct} /></div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
                  <Switch defaultOn={c.live} />
                  <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>Delivery</span>
                  <button className="btn btn-ghost sm" style={{ marginLeft: "auto" }} onClick={() => toast("Opening Ads Manager…")}>Manage</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
