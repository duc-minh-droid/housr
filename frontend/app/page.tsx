'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, animate } from "framer-motion";
import {
  Receipt, Home as HomeIcon, Gift, Wallet, Users, MessageSquare, ArrowRight, Sparkles,
  CheckCircle2, Building2, UserRound, Loader2,
} from "lucide-react";
import { useDemoLogin } from "@/lib/useDemoLogin";

const features = [
  { icon: Receipt, title: "Bills & payments", description: "Every bill in one place, with overdue and due-soon alerts. Tenants pay through Stripe Checkout." },
  { icon: HomeIcon, title: "Rent plans", description: "Landlords propose a plan (rent, deposit, term); the tenant accepts by paying the deposit." },
  { icon: Gift, title: "Rewards", description: "On-time payments and staying under budget earn points that can be spent in the rewards shop." },
  { icon: Wallet, title: "Expenses & budgets", description: "Log spending by category and split a monthly budget with a draggable pie chart." },
  { icon: Users, title: "Tenants & properties", description: "Landlords see occupancy, revenue, late payments and outstanding balances per tenant." },
  { icon: MessageSquare, title: "AI assistant", description: "A Gemini-backed chat that answers questions using the tenant's own expenses and bills." },
];

const bars = [38, 62, 45, 80, 54, 70, 92];

function CountUp({ to, prefix = "" }: { to: number; prefix?: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const c = animate(0, to, { duration: 1.6, delay: 0.6, ease: "easeOut", onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [to]);
  return <>{prefix}{v.toLocaleString()}</>;
}

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md h-[340px]">
      {/* main card */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 80 }}
        className="absolute inset-x-4 top-6 rounded-3xl bg-card-bg border border-border p-6 shadow-2xl"
      >
        <p className="text-xs uppercase tracking-wide text-card-text/60">Spent this month</p>
        <p className="text-4xl font-bold text-card-text mt-1"><CountUp to={870} prefix="$" /></p>
        <div className="mt-6 flex items-end gap-2 h-28">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: 0.7 + i * 0.08, type: "spring", stiffness: 90 }}
              className="flex-1 rounded-t-md bg-gradient-to-t from-primary to-primary-light"
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-card-text/50">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i} className="flex-1 text-center">{d}</span>)}
        </div>
      </motion.div>

      {/* points badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
        transition={{ opacity: { delay: 1.1 }, scale: { delay: 1.1, type: "spring" }, y: { delay: 1.6, duration: 4, repeat: Infinity, ease: "easeInOut" } }}
        className="absolute -right-2 top-0 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 px-4 py-3 shadow-xl text-amber-950"
      >
        <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">Reward points</p>
        <p className="text-2xl font-extrabold flex items-center gap-1"><Gift className="w-5 h-5" /><CountUp to={350} /></p>
      </motion.div>

      {/* paid toast */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0, y: [0, 6, 0] }}
        transition={{ opacity: { delay: 1.5 }, x: { delay: 1.5, type: "spring" }, y: { delay: 2, duration: 5, repeat: Infinity, ease: "easeInOut" } }}
        className="absolute -left-4 bottom-2 flex items-center gap-3 rounded-2xl bg-card-bg border border-border px-4 py-3 shadow-xl"
      >
        <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-card-text">Rent paid on time</p>
          <p className="text-xs text-card-text/60">+50 points</p>
        </div>
      </motion.div>
    </div>
  );
}

export default function Home() {
  const { loginAsDemo, pending } = useDemoLogin();

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* ambient glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-primary/30 blur-[120px]"
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-40 w-[480px] h-[480px] rounded-full bg-emerald-500/10 blur-[120px]"
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* nav */}
      <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg shadow-primary/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">Financr</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/login" className="px-4 py-2 rounded-lg text-foreground/80 hover:text-foreground transition-colors">Sign in</Link>
          <Link href="/signup" className="px-4 py-2 rounded-lg bg-foreground/10 hover:bg-foreground/15 transition-colors font-medium">Create account</Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* hero */}
        <section className="grid lg:grid-cols-2 gap-12 items-center pt-10 pb-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card-bg/60 text-xs font-medium text-foreground/80">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Built in a weekend hackathon · Nov 2025
            </span>
            <h1 className="mt-6 text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight">
              Rent, bills and budgets,{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-primary-light">in one place.</span>
            </h1>
            <p className="mt-6 text-lg text-foreground/70 max-w-xl">
              Financr is a rental finance app for tenants and landlords. Landlords propose rent plans and issue bills;
              tenants pay, track spending, and earn points for paying on time.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              {([
                { role: "tenant", label: "Try as a tenant", icon: UserRound },
                { role: "landlord", label: "Try as a landlord", icon: Building2 },
              ] as const).map(({ role, label, icon: Icon }, i) => (
                <motion.button
                  key={role}
                  data-demo={role}
                  onClick={() => loginAsDemo(role)}
                  disabled={pending !== null}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={
                    i === 0
                      ? "inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-primary to-primary-light shadow-lg shadow-primary/30"
                      : "inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold border border-border bg-card-bg text-card-text"
                  }
                >
                  {pending === role ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                  {label}
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              ))}
            </div>
            <p className="mt-3 text-xs text-foreground/50">Demo accounts run on built-in sample data, so no sign-up or backend is needed.</p>
          </motion.div>

          <HeroPreview />
        </section>

        {/* features */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-24"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              whileHover={{ y: -6 }}
              className="rounded-2xl p-6 bg-card-bg border border-border"
            >
              <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-emerald-300" />
              </div>
              <h3 className="text-lg font-semibold text-card-text mb-1.5">{f.title}</h3>
              <p className="text-sm text-card-text/70 leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </motion.section>
      </main>

      <footer className="relative z-10 border-t border-border py-8 text-center text-xs text-foreground/50">
        Hackathon project by{" "}
        <a className="underline hover:text-foreground" href="https://github.com/duc-minh-droid">@duc-minh-droid</a> and{" "}
        <a className="underline hover:text-foreground" href="https://github.com/moelnahhas">@moelnahhas</a>
      </footer>
    </div>
  );
}
