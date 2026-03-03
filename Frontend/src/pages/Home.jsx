import Hero from "../components/hero/Hero";
import Discover from "../components/discover/Discover";
import AIInsights from "../components/ai/AIInsights";
import HowItWorks from "../components/how/HowItWorks";
import Testimonials from "../components/testimonials/Testimonials";
import CTA from "../components/cta/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <Discover />
      <AIInsights />
      <HowItWorks />
      <Testimonials />
      <CTA />
    </>
  );
}