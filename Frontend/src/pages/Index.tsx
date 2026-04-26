import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Shield, Star, IndianRupee, Eye, ArrowRight, MapPin, Users, Building, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CountUp from "@/components/CountUp";
import heroBg from "@/assets/hero-bg.jpg";
import pgRoom1 from "@/assets/pg-room-1.jpg";
import pgRoom2 from "@/assets/pg-room-2.jpg";
import pgRoom3 from "@/assets/pg-room-3.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  }),
};

const features = [
  { icon: Shield, title: "AI Transparency Score", desc: "Every PG gets an unbiased score based on real data, reviews, and AI analysis.", color: "bg-primary/10 text-primary" },
  { icon: Star, title: "Verified Anonymous Reviews", desc: "Only verified residents can review — anonymously and without fear.", color: "bg-accent/20 text-primary" },
  { icon: IndianRupee, title: "Fair Pricing Estimation", desc: "AI estimates fair rent so you know if you're overpaying.", color: "bg-success/10 text-success" },
  { icon: Eye, title: "Cleanliness Detection", desc: "AI-powered image analysis rates actual hygiene conditions.", color: "bg-primary/10 text-primary" },
];

const steps = [
  { num: "01", title: "Search PG", desc: "Find PGs near your college, office, or preferred location.", icon: Search },
  { num: "02", title: "View Transparency Score", desc: "See AI-powered scores for hygiene, pricing, safety, and more.", icon: Shield },
  { num: "03", title: "Make Data-Driven Decision", desc: "Compare PGs objectively and choose the best fit for you.", icon: CheckCircle2 },
];

const testimonials = [
  { name: "Priya Sharma", role: "Student, IIT Bangalore", text: "PGLens helped me find a PG with a transparency score of 94. The AI pricing told me I was saving ₹2,000/month compared to similar PGs!", rating: 5 },
  { name: "Rahul Mehta", role: "Software Engineer", text: "As a professional relocating to Bangalore, PGLens was a lifesaver. Verified reviews gave me confidence in my choice.", rating: 5 },
  { name: "Sneha Patel", role: "PG Owner", text: "Listing my PG on PGLens increased my occupancy by 40%. The transparency score builds trust with potential residents.", rating: 4 },
];

const Index = () => {
  const [liveStats, setLiveStats] = useState([
    { value: 0, suffix: "+", label: "PGs Listed",       icon: Building },
    { value: 0, suffix: "+", label: "Verified Reviews", icon: Star },
    { value: 0, suffix: "+", label: "Cities Covered",   icon: MapPin },
    { value: 0, suffix: "+", label: "Happy Residents",  icon: Users },
  ]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/admin/public-stats`)
      .then((r) => r.json())
      .then((data) => {
        setLiveStats([
          { value: data.approved_pgs   || 0, suffix: "+", label: "PGs Listed",       icon: Building },
          { value: data.total_reviews  || 0, suffix: "+", label: "Verified Reviews", icon: Star },
          { value: data.cities_covered || 0, suffix: "+", label: "Cities Covered",   icon: MapPin },
          { value: data.total_users    || 0, suffix: "+", label: "Happy Residents",  icon: Users },
        ]);
      })
      .catch(() => {}); // silently keep zeros if API is down
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative hero-gradient overflow-hidden">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left - Content */}
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-pulse-ring" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  AI-Powered Transparency Platform
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl"
              >
                Transparent PG &{" "}
                <br className="hidden sm:block" />
                Co-Living{" "}
                <span className="text-gradient-primary">Discovery</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-5 max-w-lg text-lg text-muted-foreground leading-relaxed"
              >
                Stop guessing. Use AI-powered transparency scores, verified reviews, and fair pricing insights to find your perfect PG.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="mt-8 flex gap-4 flex-wrap"
              >
                <Link to="/explore">
                  <Button size="xl" variant="hero" className="gap-2">
                    <Search className="h-5 w-5" /> Explore PGs
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="xl" variant="hero-outline" className="gap-2">
                    List Your PG <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8 flex items-center gap-6 text-sm text-muted-foreground"
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Verified PGs
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-primary" /> AI-Scored
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-primary" /> Anonymous Reviews
                </span>
              </motion.div>
            </div>

            {/* Right - Image collage */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Main image */}
                <div className="overflow-hidden rounded-2xl shadow-2xl glow-orange">
                  <img src={heroBg} alt="Modern co-living space" className="h-80 w-full object-cover" />
                </div>
                {/* Floating cards */}
                <motion.div className="absolute -bottom-6 -left-6 glass-card rounded-xl p-4 animate-float">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-success text-success font-bold">
                      94
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">Elite Stay</p>
                      <p className="text-xs text-muted-foreground">Top Rated PG</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div className="absolute -top-4 -right-4 glass-card rounded-xl p-3 animate-float-delayed">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-foreground">4.9/5</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">2,500+ Reviews</p>
                </motion.div>
                {/* Small images */}
                <div className="absolute -right-4 bottom-8 flex gap-2">
                  <div className="h-20 w-16 overflow-hidden rounded-lg shadow-lg ring-2 ring-background">
                    <img src={pgRoom1} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="h-20 w-16 overflow-hidden rounded-lg shadow-lg ring-2 ring-background translate-y-3">
                    <img src={pgRoom2} alt="" className="h-full w-full object-cover" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar — LIVE from database */}
      <section className="border-y border-border bg-card/50">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {liveStats.map((s, i) => (
              <motion.div
                key={s.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="text-center"
              >
                <s.icon className="mx-auto h-6 w-6 text-primary mb-2" />
                <div className="text-3xl font-extrabold text-foreground">
                  <CountUp target={s.value} suffix={s.suffix} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why PGLens */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center max-w-2xl mx-auto">
            <motion.span variants={fadeUp} custom={0} className="text-sm font-semibold uppercase tracking-wider text-primary">Why Choose Us</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="mt-3 text-3xl font-extrabold text-foreground md:text-4xl">Why PGLens?</motion.h2>
            <motion.p variants={fadeUp} custom={2} className="mt-3 text-muted-foreground text-lg">Making PG discovery fair, transparent, and data-driven.</motion.p>
          </motion.div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 2}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className={`relative flex h-12 w-12 items-center justify-center rounded-xl ${f.color}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="relative mt-5 text-lg font-bold text-foreground">{f.title}</h3>
                <p className="relative mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-28 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center max-w-2xl mx-auto">
            <motion.span variants={fadeUp} custom={0} className="text-sm font-semibold uppercase tracking-wider text-primary">Simple Process</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="mt-3 text-3xl font-extrabold text-foreground md:text-4xl">How It Works</motion.h2>
            <motion.p variants={fadeUp} custom={2} className="mt-3 text-muted-foreground text-lg">Three simple steps to your ideal PG.</motion.p>
          </motion.div>
          <div className="mt-14 grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 2}
                whileHover={{ scale: 1.03 }}
                className="relative rounded-2xl border border-border bg-card p-8 text-center transition-all hover:shadow-lg hover:border-primary/20"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground shadow-lg shadow-primary/20">
                  {s.num}
                </div>
                <h3 className="mt-5 text-lg font-bold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="h-5 w-5 text-primary" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured PGs Preview */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <motion.span variants={fadeUp} custom={0} className="text-sm font-semibold uppercase tracking-wider text-primary">Featured PGs</motion.span>
              <motion.h2 variants={fadeUp} custom={1} className="mt-3 text-3xl font-extrabold text-foreground md:text-4xl">Top Rated PGs Near You</motion.h2>
            </div>
            <motion.div variants={fadeUp} custom={2}>
              <Link to="/explore">
                <Button variant="hero-outline" size="default" className="gap-2">
                  View All PGs <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Elite Stay",    location: "Whitefield, Bangalore",   price: "₹15,000", score: 94, img: pgRoom1, tag: "Fair Price" },
              { name: "Metro Living",  location: "Indiranagar, Bangalore",  price: "₹7,500",  score: 91, img: pgRoom2, tag: "Underpriced" },
              { name: "Sunshine PG",  location: "Koramangala, Bangalore",  price: "₹8,500",  score: 87, img: pgRoom3, tag: "Verified" },
            ].map((pg, i) => (
              <motion.div
                key={pg.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 2}
                whileHover={{ y: -6 }}
                className="group rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="relative h-48 overflow-hidden">
                  <img src={pg.img} alt={pg.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-3 right-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-success bg-background/90 backdrop-blur-sm text-sm font-bold text-success">
                    {pg.score}
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="rounded-full bg-primary/90 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur-sm">
                      {pg.tag}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-foreground text-lg">{pg.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {pg.location}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-extrabold text-foreground">
                      {pg.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </span>
                    <Link to="/explore">
                      <Button size="sm" variant="default" className="gap-1">
                        View <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center max-w-2xl mx-auto">
            <motion.span variants={fadeUp} custom={0} className="text-sm font-semibold uppercase tracking-wider text-primary">Testimonials</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="mt-3 text-3xl font-extrabold text-foreground md:text-4xl">What Our Users Say</motion.h2>
          </motion.div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 2}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-border bg-card p-7 transition-all hover:shadow-lg"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={`h-4 w-4 ${j < t.rating ? "fill-primary text-primary" : "text-border"}`} />
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed italic">"{t.text}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-cta py-20 md:py-28">
        <div className="absolute inset-0 animate-shimmer" />
        <div className="container relative mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl font-extrabold text-cta-foreground md:text-4xl">
              Ready to find your ideal PG?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mx-auto mt-4 max-w-lg text-muted-foreground text-lg">
              Join thousands of students and professionals making smarter housing decisions.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="mt-8 flex justify-center gap-4 flex-wrap">
              <Link to="/explore">
                <Button size="xl" variant="hero" className="gap-2">
                  Get Started — It's Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;