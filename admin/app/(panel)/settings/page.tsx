"use client";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import { brand } from "@/brand.config";
import { advocates, M } from "@/lib/data";
import { Avatar, Card, CardHead, PageHead } from "@/components/ui";
import { Field, Input, Select, Switch } from "@/components/forms";

export default function SettingsPage() {
  usePageMotion();
  const toast = useToast();
  return (
    <>
      <PageHead eyebrow="Workspace" title="Settings" sub="Profile, notifications and team access." />
      <div className="canvas-grid no-rail">
        <div className="stream">
          <div className="pair-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card>
              <CardHead title="Profile" />
              <div style={{ display: "flex", alignItems: "center", gap: 15, marginBottom: 22 }}>
                <Avatar src={M(32)} size={62} ring />
                <div><b style={{ fontSize: 15, fontWeight: 700 }}>Rohit</b>
                  <p style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 3 }}>Founder &amp; CEO · {brand.name}</p></div>
                <button className="btn btn-ghost sm" style={{ marginLeft: "auto" }} onClick={() => toast("Photo upload coming soon")}>Change</button>
              </div>
              <div className="form-grid">
                <Field label="Display name"><Input defaultValue="Rohit" /></Field>
                <Field label="Role"><Input defaultValue="Founder & CEO" /></Field>
                <Field label="Email" full><Input defaultValue={`rohit@${brand.name.toLowerCase()}.com`} /></Field>
                <Field label="City"><Select defaultValue="Hyderabad"><option>Hyderabad</option><option>Bengaluru</option><option>Kolkata</option></Select></Field>
                <Field label="Timezone"><Select><option>IST (UTC+5:30)</option></Select></Field>
              </div>
              <button className="btn btn-ink sm" style={{ marginTop: 18 }} onClick={() => toast("Profile saved")}>Save changes</button>
            </Card>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Card>
                <CardHead title="Notifications" />
                {[
                  ["New lead alerts", "Ping when a Meta Ads lead lands", true],
                  ["Payment received", "Onboarding & success fee payments", true],
                  ["Daily summary", "Pipeline digest at 8 pm", false],
                  ["Advocate reports", "Weekly close-rate report", true],
                ].map(([t, s, on]) => (
                  <div className="pref-row" key={t as string}>
                    <div><b>{t}</b><p>{s}</p></div><Switch defaultOn={on as boolean} />
                  </div>
                ))}
              </Card>
              <Card>
                <CardHead title="Team" right={<button className="btn btn-ghost sm" onClick={() => toast("Invite flow opened")}>+ Invite</button>} />
                {advocates.map((a, i) => (
                  <div className="row-item" key={a.name}>
                    <Avatar src={a.photo} size={38} />
                    <div><div className="row-name">{a.name}</div><div className="row-sub">{a.role}</div></div>
                    <span className={`chip ${a.tone}`} style={{ marginLeft: "auto" }}>{i === 0 ? "Admin" : i < 3 ? "Editor" : "Viewer"}</span>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
