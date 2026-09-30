"use client";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import { M, W } from "@/lib/data";
import Band from "@/components/band";
import Icon from "@/components/icons";
import { Card, PageHead } from "@/components/ui";
import { FollowUpTasks, RailHead } from "@/components/rail";
import {
  Autocomplete, ChipSelect, Dropzone, Field, FloatInput, FormSection,
  Input, OptionCard, Otp, Select, Slider, Stepper, Switch, TagInput, Textarea, Wizard,
} from "@/components/forms";

export default function FormsPage() {
  usePageMotion();
  const toast = useToast();
  const inr = (v: number) => "₹" + v.toLocaleString("en-IN");

  return (
    <>
      <PageHead eyebrow="Design system" title="Form kit"
        sub="Every input the panel uses, in one place — import any of these from components/forms."
        actions={<>
          <button className="btn btn-ghost sm" onClick={() => toast("Reset")}>Reset</button>
          <button className="btn btn-brand sm" onClick={() => toast("Lead saved to pipeline")}>Save lead</button>
        </>} />

      <Band eyebrow="Components · inputs" title="Inputs that feel <em>considered</em>."
        body="Text, select, autocomplete, tags, sliders, OTP, uploads, validation states and a multi-step wizard — all keyboard-friendly and touch-sized on mobile."
        metrics={[
          { label: "Field types", value: "0", count: "22" },
          { label: "States", value: "0", count: "6" },
          { label: "Min. tap target", value: "44px" },
          { label: "iOS zoom", value: "None" },
        ]}
        tiles={[
          { icon: "✓", value: "0%", label: "Accessible by default", count: "100", suffix: "%" },
          { icon: "⌘", value: "0", label: "Keyboard shortcuts", count: "8" },
        ]} />

      <div className="canvas-grid">
        <div className="stream">
          <Card><Wizard steps={["Contact", "Debt profile", "Documents", "Review"]} current={1} /></Card>

          <Card>
            <FormSection n={1} title="Text inputs" sub="Plain, floating label, with icon, prefix and suffix" />
            <div className="fkit">
              <Field label="Full name" hint="As printed on the PAN card">
                <Input placeholder="e.g. Arjun Khanna" />
              </Field>
              <FloatInput id="float-demo" label="Floating label" />
              <Field label="Email address" hint="We'll send the agreement here">
                <Input type="email" placeholder="name@email.com" lead={<Icon name="mail" size={13} />} />
              </Field>
              <Field label="Mobile number" hint="Used for call-back reminders">
                <Input type="tel" placeholder="98490 55018" lead="🇮🇳 +91"
                  action={{ label: "Send OTP", onClick: () => toast("OTP sent") }} />
              </Field>
              <Field label="Monthly salary">
                <Input type="number" placeholder="150000" lead="₹" trail="/ month" />
              </Field>
              <Field label="Case reference">
                <Input placeholder="2081" lead="#LS-" trail={<Icon name="check" size={13} />} />
              </Field>
              <Field label="Case notes" full hint="Markdown supported · visible to assigned advocate only">
                <Textarea placeholder="Situation, urgency, creditor pressure, anything the advocate should know…" />
              </Field>
            </div>
          </Card>

          <Card>
            <FormSection n={2} title="Selection" sub="Select, autocomplete, chips, checkbox, radio and switches" />
            <div className="fkit">
              <Field label="City">
                <Select defaultValue="Hyderabad">
                  {["Hyderabad", "Bengaluru", "Mumbai", "Kolkata", "Chennai"].map((c) => <option key={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Assign advocate" hint="Type to filter · click to select">
                <Autocomplete placeholder="Start typing a name…" items={[
                  { label: "Srivalya T.", photo: W(21) }, { label: "Varun S.", photo: M(22) },
                  { label: "Ananya P.", photo: W(56) }, { label: "Rahul K.", photo: M(64) },
                ]} />
              </Field>
              <Field label="Debt type" full hint="Multi-select · at least one required">
                <ChipSelect defaultSelected={["Personal loan"]}
                  options={["Personal loan", "Credit card", "App loans", "Business loan", "Gold loan", "Vehicle loan"]} />
              </Field>
              <Field label="Creditor tags" full>
                <TagInput defaultTags={["HDFC", "Axis"]} placeholder="Add a bank and press Enter" />
              </Field>
              <Field label="Consultation mode">
                <div className="opt-row">
                  <OptionCard type="radio" name="mode" defaultChecked title="Phone call" desc="Advocate calls at the scheduled slot" />
                  <OptionCard type="radio" name="mode" title="Office visit" desc="Jubilee Hills, Hyderabad" />
                </div>
              </Field>
              <Field label="Intake checklist">
                <div className="opt-row">
                  <OptionCard defaultChecked title="Recording consent" desc="Verbal consent captured on call" />
                  <OptionCard title="KYC collected" desc="PAN and salary slip on file" />
                </div>
              </Field>
              <Field label="Preferences" full>
                <div className="pref-row"><div><b>Send WhatsApp updates</b><p>Case status at every stage change</p></div><Switch defaultOn /></div>
                <div className="pref-row"><div><b>Auto-assign advocate</b><p>Based on city and current load</p></div><Switch /></div>
              </Field>
            </div>
          </Card>

          <Card>
            <FormSection n={3} title="Numbers, files and codes" sub="Sliders, steppers, dropzone and OTP" />
            <div className="fkit">
              <Field label="Total debt">
                <Slider min={100000} max={5000000} step={50000} defaultValue={2150000} format={inr} />
              </Field>
              <Field label="Settlement target">
                <Slider min={10} max={80} step={1} defaultValue={52} format={(v) => `${v}% waiver`} />
              </Field>
              <Field label="Number of creditors" hint="Banks and apps combined"><Stepper defaultValue={4} /></Field>
              <Field label="Verification code" hint="Sent to the registered mobile">
                <Otp length={4} onComplete={() => toast("Code verified")} />
              </Field>
              <Field label="Consultation date"><Input type="date" defaultValue="2026-09-04" /></Field>
              <Field label="Preferred time"><Input type="time" defaultValue="11:30" /></Field>
              <Field label="Documents" full>
                <Dropzone initial={[{ name: "pan-card.pdf", meta: "248 KB · uploaded today" }]} onAdd={() => toast("File added")} />
              </Field>
            </div>
          </Card>

          <Card>
            <FormSection n={4} title="States" sub="Valid, error, disabled and read-only" />
            <div className="fkit">
              <Field label="Valid" hint="Verified email" tone="ok"><Input state="ok" defaultValue="arjun.khanna@gmail.com" /></Field>
              <Field label="Error" hint="Mobile number needs 10 digits" tone="err"><Input state="err" defaultValue="9849" /></Field>
              <Field label="Disabled" hint="Set by the system">
                <Input defaultValue="Auto-generated on save" disabled style={{ opacity: 0.55, cursor: "not-allowed" }} /></Field>
              <Field label="Read only" hint="Case reference is fixed">
                <Input defaultValue="#LS-2081" readOnly style={{ background: "var(--card-2)" }} /></Field>
            </div>
            <div className="fdiv" style={{ margin: "20px 0 16px" }} />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-brand" onClick={() => toast("Lead saved to pipeline")}>Save lead</button>
              <button className="btn btn-ink" onClick={() => toast("Draft saved")}>Save draft</button>
              <button className="btn btn-ghost" onClick={() => toast("Cancelled")}>Cancel</button>
            </div>
          </Card>
        </div>

        <aside className="rail">
          <RailHead title="Usage" />
          <Card className="pad-sm">
            <div className="card-head" style={{ marginBottom: 12 }}><span className="card-title">Guidelines</span></div>
            {[
              ["1", "Label everything", "Uppercase micro-labels, sentence-case hints", "var(--sand)", "var(--sand-ink)"],
              ["2", "One column on mobile", "16px text prevents iOS zoom on focus", "var(--lav)", "var(--lav-ink)"],
              ["3", "Validate on input", "Never wait for submit to show an error", "var(--mint)", "var(--mint-ink)"],
              ["4", "44px tap targets", "Every control is thumb-sized on phones", "var(--sea)", "var(--sea-ink)"],
            ].map(([n, t, s, bg, ink]) => (
              <div className="row-item" key={n}>
                <span className="n-ic" style={{ background: bg, color: ink }}>{n}</span>
                <div><div className="row-name">{t}</div><div className="row-sub">{s}</div></div>
              </div>
            ))}
          </Card>
          <FollowUpTasks />
        </aside>
      </div>
    </>
  );
}
