export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col justify-center items-center text-center px-6 pt-32">

      <div className="bg-tealbrand-500/10 border border-tealbrand-500/20 px-5 py-2 rounded-full text-tealbrand-300 text-xs mb-8">
        AI-Powered PG Transparency Platform
      </div>

      <h1 className="font-heading font-extrabold text-6xl leading-tight">
        No More <span className="text-tealbrand-400">Blind</span><br/>
        PG Decisions
      </h1>

      <p className="mt-6 max-w-xl text-tealbrand-200">
        Structured reviews, AI verification, hygiene scores, and price intelligence —
        everything you need to find the right PG without anxiety.
      </p>

      <div className="mt-8 flex gap-4">
        <button className="bg-tealbrand-500 text-black font-heading font-bold px-8 py-3 rounded-xl hover:bg-tealbrand-400 transition">
          Find PGs →
        </button>
        <button className="text-tealbrand-300 hover:underline">
          See how it works →
        </button>
      </div>

    </section>
  );
}