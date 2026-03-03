export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Search & Filter",
      desc: "Set budget, distance, gender preference, food type and sharing. AI narrows the best matches."
    },
    {
      number: "02",
      title: "View AI Scores",
      desc: "See NLP-extracted aspect scores, claim verification results and safety ratings."
    },
    {
      number: "03",
      title: "Compare Transparently",
      desc: "Compare hygiene, pricing fairness, safety and owner behavior side-by-side."
    },
    {
      number: "04",
      title: "Book with Confidence",
      desc: "Contact owner knowing the full truth — no hidden surprises."
    }
  ];

  return (
    <section id="how" className="py-24 px-6 max-w-7xl mx-auto">

      <div className="mb-16">
        <h2 className="font-heading text-4xl font-extrabold mb-4">
          From Search to<br/>
          <span className="text-tealbrand-400">Signed Lease</span>
        </h2>
        <p className="text-tealbrand-300 max-w-xl">
          Four simple steps — backed by AI intelligence at every stage.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        {steps.map((step, index) => (
          <div
            key={index}
            className="bg-tealbrand-950 border border-tealbrand-900 rounded-2xl p-8 text-center hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-tealbrand-700 flex items-center justify-center font-heading font-bold text-xl text-tealbrand-400">
              {step.number}
            </div>

            <h3 className="font-heading font-bold text-lg mb-3">
              {step.title}
            </h3>

            <p className="text-sm text-tealbrand-300 leading-relaxed">
              {step.desc}
            </p>
          </div>
        ))}
      </div>

    </section>
  );
}