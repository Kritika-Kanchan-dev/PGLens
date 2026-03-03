import ClaimTable from "./ClaimTable";
import AspectBars from "./AspectBars";
import SafetyScore from "./SafetyScore";

export default function AIInsights() {
  return (
    <section id="ai" className="py-24 px-6 max-w-7xl mx-auto">

      <div className="mb-12">
        <h2 className="font-heading text-4xl font-extrabold mb-4">
          Truth vs Claims.<br/>
          <span className="text-tealbrand-400">We Show Both.</span>
        </h2>
        <p className="text-tealbrand-300 max-w-xl">
          Our AI cross-verifies owner claims against actual user reviews, photos, and geo data.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <ClaimTable />
        <div className="space-y-8">
          <AspectBars />
          <SafetyScore />
        </div>
      </div>

    </section>
  );
}