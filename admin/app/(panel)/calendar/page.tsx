"use client";
import { usePageMotion } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import { calendarEvents } from "@/lib/data";
import { Card, PageHead } from "@/components/ui";
import { QuickConnects, RailHead } from "@/components/rail";

const tone = (t: string) => (t === "iris" ? "lav" : t);

export default function CalendarPage() {
  usePageMotion();
  const toast = useToast();
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <>
      <PageHead eyebrow="September 2026" title="Calendar"
        sub="Advocate calls, settlements and reviews at a glance."
        actions={<>
          <button className="btn btn-ghost sm">‹ Aug</button>
          <button className="btn btn-ghost sm">Oct ›</button>
          <button className="btn btn-brand sm" onClick={() => toast("Event composer opened")}>+ New event</button></>} />

      <div className="canvas-grid">
        <div className="stream">
          <Card>
            <div className="cal-grid">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div className="cal-dow" key={d}>{d}</div>)}
              <div className="cal-day mute">31</div>
              {days.map((d) => {
                const ev = calendarEvents[d];
                const today = d === 1;
                return (
                  <div className={`cal-day ${today ? "today" : ""}`} key={d}>
                    {d}
                    {ev && (
                      <div className="cal-ev" style={today
                        ? { background: "rgba(255,255,255,.16)", color: "#fff" }
                        : { background: `var(--${tone(ev.tone)})`, color: `var(--${tone(ev.tone)}-ink)` }}>
                        {ev.label}
                      </div>
                    )}
                  </div>
                );
              })}
              {[1, 2, 3, 4].map((d) => <div className="cal-day mute" key={`n${d}`}>{d}</div>)}
            </div>
          </Card>
        </div>
        <aside className="rail">
          <RailHead title="Up next" />
          <Card className="pad-sm">
            {[
              ["1", "SEP", "Advocate sync", "Weekly stand-up · 5 pm", "lav"],
              ["3", "SEP", "Divya Rao — signing", "Final agreement · office", "mint"],
              ["7", "SEP", "C4 campaign review", "With Varun · budget reset", "sea"],
              ["10", "SEP", "Axis settlement", "Karthik S. · bank negotiation", "sand"],
            ].map(([d, m, t, s, tn]) => (
              <div className="up-ev" key={t}>
                <div className="up-date" style={{ background: `var(--${tn})`, color: `var(--${tn}-ink)` }}>{d}<small>{m}</small></div>
                <div><div className="row-name">{t}</div><div className="row-sub">{s}</div></div>
              </div>
            ))}
          </Card>
          <QuickConnects />
        </aside>
      </div>
    </>
  );
}
