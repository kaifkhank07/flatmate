/** Mock data. Swap these for API/DB calls — the components take props only. */

export const M = (n: number) => `https://randomuser.me/api/portraits/men/${n}.jpg`;
export const W = (n: number) => `https://randomuser.me/api/portraits/women/${n}.jpg`;

export type Status = "Hot" | "Pending" | "Signed";

export type Customer = {
  id: string; name: string; city: string; salary: string; debt: string;
  campaign: string; status: Status; tone: "iris" | "sand" | "mint";
  photo: string; progress: number;
};

export const customers: Customer[] = [
  { id: "c1",  name: "Arjun Khanna",   city: "Hyderabad", salary: "₹2.4 L", debt: "₹21.5 L", campaign: "C4", status: "Hot",     tone: "iris", photo: M(11), progress: 72 },
  { id: "c2",  name: "Divya Rao",      city: "Bengaluru", salary: "₹1.8 L", debt: "₹14.2 L", campaign: "C2", status: "Signed",  tone: "mint", photo: W(48), progress: 100 },
  { id: "c3",  name: "Farhan Syed",    city: "Hyderabad", salary: "₹1.2 L", debt: "₹9.6 L",  campaign: "C4", status: "Pending", tone: "sand", photo: M(85), progress: 45 },
  { id: "c4",  name: "Lakshmi Nair",   city: "Kochi",     salary: "₹2.1 L", debt: "₹17.8 L", campaign: "C2", status: "Hot",     tone: "iris", photo: W(65), progress: 60 },
  { id: "c5",  name: "Ravi Deshmukh",  city: "Pune",      salary: "₹1.5 L", debt: "₹9.0 L",  campaign: "C1", status: "Hot",     tone: "iris", photo: M(53), progress: 38 },
  { id: "c6",  name: "Meera Joshi",    city: "Mumbai",    salary: "₹2.6 L", debt: "₹24.1 L", campaign: "C4", status: "Pending", tone: "sand", photo: W(17), progress: 52 },
  { id: "c7",  name: "Sameer Iqbal",   city: "Hyderabad", salary: "₹1.1 L", debt: "₹7.4 L",  campaign: "C3", status: "Signed",  tone: "mint", photo: M(77), progress: 100 },
  { id: "c8",  name: "Neha Bansal",    city: "Delhi",     salary: "₹1.9 L", debt: "₹12.3 L", campaign: "C2", status: "Hot",     tone: "iris", photo: W(29), progress: 30 },
  { id: "c9",  name: "Karthik Shetty", city: "Bengaluru", salary: "₹2.2 L", debt: "₹19.7 L", campaign: "C4", status: "Signed",  tone: "mint", photo: M(68), progress: 100 },
  { id: "c10", name: "Priya Raghavan", city: "Chennai",   salary: "₹1.7 L", debt: "₹11.5 L", campaign: "C1", status: "Pending", tone: "sand", photo: W(63), progress: 48 },
  { id: "c11", name: "Vikram Goud",    city: "Hyderabad", salary: "₹2.8 L", debt: "₹26.4 L", campaign: "C4", status: "Hot",     tone: "iris", photo: M(36), progress: 64 },
  { id: "c12", name: "Anil Mehta",     city: "Kolkata",   salary: "₹2.0 L", debt: "₹18.0 L", campaign: "C2", status: "Hot",     tone: "iris", photo: M(45), progress: 22 },
  { id: "c13", name: "Sneha Kulkarni", city: "Pune",      salary: "₹1.4 L", debt: "₹8.8 L",  campaign: "C3", status: "Signed",  tone: "mint", photo: W(33), progress: 100 },
  { id: "c14", name: "Rohit Verma",    city: "Gurgaon",   salary: "₹3.1 L", debt: "₹28.9 L", campaign: "C4", status: "Pending", tone: "sand", photo: M(19), progress: 35 },
  { id: "c15", name: "Aisha Khan",     city: "Hyderabad", salary: "₹1.6 L", debt: "₹10.2 L", campaign: "C1", status: "Hot",     tone: "iris", photo: W(90), progress: 58 },
];

export const quickConnects = [
  { name: "Anil Mehta",     sub: "Callback · ₹18L debt",  photo: M(45) },
  { name: "Priya Raghavan", sub: "Docs pending · HDFC",   photo: W(63) },
  { name: "Karthik Shetty", sub: "Settlement review",     photo: M(68) },
  { name: "Neha Bansal",    sub: "EMI relief query",      photo: W(29) },
];

export const tasks = [
  { name: "Ravi Deshmukh", sub: "Send settlement draft — Axis",   time: "2:30 pm", photo: M(53) },
  { name: "Meera Joshi",   sub: "Advocate call · onboarding fee", time: "4:00 pm", photo: W(17) },
  { name: "Sameer Iqbal",  sub: "Harassment complaint filing",    time: "5:15 pm", photo: M(77) },
];

export const todayCalls = [
  { time: "10:00", who: "Ravi Deshmukh", what: "Discovery call · ₹9L personal loan", photo: M(53), now: false },
  { time: "11:30", who: "Arjun Khanna",  what: "Advocate consult — happening now",   photo: M(11), now: true },
  { time: "14:30", who: "Meera Joshi",   what: "Fee discussion · credit card dues",  photo: W(17), now: false },
  { time: "16:00", who: "Sameer Iqbal",  what: "Recovery harassment — legal notice", photo: M(77), now: false },
];

export const leadStatus = [
  { name: "Vikram Goud",  sub: "Hot prospect",     when: "1 Sep, 10:20",  pill: "Active",  tone: "iris" as const, photo: M(36) },
  { name: "Divya Rao",    sub: "Docs verified",    when: "1 Sep, 09:40",  pill: "Signed",  tone: "mint" as const, photo: W(48) },
  { name: "Farhan Syed",  sub: "Awaiting fee",     when: "31 Aug, 18:05", pill: "Pending", tone: "rose" as const, photo: M(85) },
  { name: "Lakshmi Nair", sub: "Settlement talks", when: "31 Aug, 16:30", pill: "Active",  tone: "sea"  as const, photo: W(65) },
];

export const advocates = [
  { name: "Srivalya T.", role: "Senior closer", cases: 64, signed: 31, revenue: "₹9.8 L", rate: "48%", tone: "mint", target: 86, photo: W(21) },
  { name: "Varun S.",    role: "Sales manager", cases: 52, signed: 22, revenue: "₹7.1 L", rate: "42%", tone: "sea",  target: 71, photo: M(22) },
  { name: "Ananya P.",   role: "Advocate",      cases: 41, signed: 14, revenue: "₹4.6 L", rate: "34%", tone: "sand", target: 52, photo: W(56) },
  { name: "Rahul K.",    role: "Telecaller",    cases: 88, signed: 9,  revenue: "₹2.9 L", rate: "10%", tone: "rose", target: 28, photo: M(64) },
];

export const kanbanColumns = [
  { id: "new",   title: "New leads",     dot: "var(--ink-4)", cards: [
    { name: "Anil Mehta",  sub: "₹18L across 3 banks",     amount: "₹18.0 L", chip: "C2", tone: "iris", photo: M(45) },
    { name: "Neha Bansal", sub: "Credit card + app loans", amount: "₹12.3 L", chip: "C2", tone: "iris", photo: W(29) },
    { name: "Rohit Verma", sub: "Business loan restructure", amount: "₹28.9 L", chip: "C4", tone: "iris", photo: M(19) },
  ]},
  { id: "call",  title: "Advocate call", dot: "var(--sea-ink)", cards: [
    { name: "Arjun Khanna", sub: "Consult booked · today 11:30", amount: "₹21.5 L", chip: "Hot", tone: "sea", photo: M(11) },
    { name: "Lakshmi Nair", sub: "Second consult · waiver talks", amount: "₹17.8 L", chip: "Hot", tone: "sea", photo: W(65) },
  ]},
  { id: "fee",   title: "Fee shared",    dot: "var(--sand-ink)", cards: [
    { name: "Farhan Syed", sub: "Awaiting onboarding fee", amount: "₹9.6 L",  chip: "Pending", tone: "sand", photo: M(85) },
    { name: "Meera Joshi", sub: "Split-fee requested",     amount: "₹24.1 L", chip: "Pending", tone: "sand", photo: W(17) },
  ]},
  { id: "signed", title: "Signed",       dot: "var(--mint-ink)", cards: [
    { name: "Divya Rao",      sub: "Docs verified · assigned",  amount: "₹14.2 L", chip: "Won", tone: "mint", photo: W(48) },
    { name: "Karthik Shetty", sub: "Axis settlement approved",  amount: "₹19.7 L", chip: "Won", tone: "mint", photo: M(68) },
    { name: "Sneha Kulkarni", sub: "Payment plan active",       amount: "₹8.8 L",  chip: "Won", tone: "mint", photo: W(33) },
  ]},
];

export const transactions = [
  { name: "Divya Rao",      meta: "UPI · HDFC",        type: "Onboarding",  inv: "#LS-2081", date: "1 Sep",  amount: "₹42,000",   status: "Paid",    tone: "mint", photo: W(48) },
  { name: "Karthik Shetty", meta: "Netbanking",        type: "Success fee", inv: "#LS-2079", date: "31 Aug", amount: "₹1,18,200", status: "Paid",    tone: "mint", photo: M(68) },
  { name: "Farhan Syed",    meta: "Payment link sent", type: "Onboarding",  inv: "#LS-2078", date: "30 Aug", amount: "₹36,000",   status: "Pending", tone: "sand", photo: M(85) },
  { name: "Meera Joshi",    meta: "Split · 1 of 2",    type: "Onboarding",  inv: "#LS-2074", date: "29 Aug", amount: "₹31,000",   status: "Pending", tone: "sand", photo: W(17) },
  { name: "Rohit Verma",    meta: "Reminder sent ×2",  type: "Onboarding",  inv: "#LS-2062", date: "14 Aug", amount: "₹48,000",   status: "Overdue", tone: "rose", photo: M(19) },
  { name: "Sneha Kulkarni", meta: "UPI · GPay",        type: "Success fee", inv: "#LS-2058", date: "12 Aug", amount: "₹52,800",   status: "Paid",    tone: "mint", photo: W(33) },
];

export const campaigns = [
  { name: "C4 — High salary",     sub: "₹1.5L+ salary · debt ₹15L+",  leads: 412, cpl: "96",  conv: "9.2",  spent: "39,500", pct: 78, live: true,  tone: "iris" },
  { name: "C2 — EMI relief",      sub: "Salaried · EMI stress angle", leads: 386, cpl: "74",  conv: "6.8",  spent: "28,600", pct: 64, live: true,  tone: "mint" },
  { name: "C5 — Bengaluru",       sub: "Blr metro · IT corridor",     leads: 118, cpl: "132", conv: "4.1",  spent: "15,600", pct: 31, live: true,  tone: "sea"  },
  { name: "C1 — Broad intent",    sub: "Debt keywords · wide net",    leads: 264, cpl: "58",  conv: "3.2",  spent: "15,300", pct: 92, live: false, tone: "sand" },
  { name: "C3 — Retargeting",     sub: "Site visitors · drop-offs",   leads: 96,  cpl: "44",  conv: "11.6", spent: "4,200",  pct: 40, live: true,  tone: "rose" },
];

export const conversations = [
  { name: "Srivalya T.",      time: "11:42", last: "Arjun's advocate call went well — sending fee sheet", photo: W(21) },
  { name: "Varun S.",         time: "10:15", last: "C4 leads converting better this week",                photo: M(22) },
  { name: "Ananya P.",        time: "Mon",   last: "Need the Axis settlement template",                   photo: W(56) },
  { name: "Telecalling floor", time: "Mon",  last: "Rahul: 88 dials done, 12 callbacks set",              photo: M(64) },
];

export const calendarEvents: Record<number, { label: string; tone: string }> = {
  1:  { label: "Advocate sync",     tone: "iris" },
  3:  { label: "Divya — signing",   tone: "mint" },
  7:  { label: "C4 review",         tone: "sea"  },
  10: { label: "Settlement — Axis", tone: "sand" },
  15: { label: "Payroll",           tone: "rose" },
  18: { label: "Bengaluru visit",   tone: "iris" },
  24: { label: "Board review",      tone: "sea"  },
  29: { label: "Month close",       tone: "mint" },
};
