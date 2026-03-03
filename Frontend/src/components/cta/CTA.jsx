export default function CTA() {
  return (
    <section className="relative py-24 px-6 max-w-6xl mx-auto">

      <div className="bg-gradient-to-br from-tealbrand-900 to-tealbrand-950 border border-tealbrand-800 rounded-3xl p-16 text-center relative overflow-hidden">

        {/* Glow Background Effect */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-tealbrand-600 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600 opacity-10 rounded-full blur-3xl"></div>

        <h2 className="font-heading font-extrabold text-4xl mb-6 relative z-10">
          Find Your PG with<br/>
          <span className="text-tealbrand-300">Zero Anxiety</span>
        </h2>

        <p className="text-tealbrand-300 max-w-xl mx-auto mb-10 relative z-10">
          Join 12,000+ students who made smarter housing decisions using AI-backed transparency.
          Free for students. Always.
        </p>

        <div className="flex justify-center gap-6 relative z-10">
          <button className="bg-tealbrand-500 text-black font-heading font-bold px-8 py-4 rounded-xl hover:bg-tealbrand-400 transition">
            Search PGs Now →
          </button>

          <button className="border border-tealbrand-500 text-tealbrand-300 font-heading font-bold px-8 py-4 rounded-xl hover:bg-tealbrand-900 transition">
            List Your PG
          </button>
        </div>

      </div>

    </section>
  );
}