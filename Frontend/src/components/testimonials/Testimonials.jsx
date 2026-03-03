export default function Testimonials() {

  const reviews = [
    {
      name: "Priya Sharma",
      info: "2nd Year · AKTU Noida",
      text: "The claim verification tool saved me from renting a PG that falsely listed AC rooms. TrustNest caught it from reviews and photos. Game changer.",
      color: "from-tealbrand-700 to-tealbrand-500"
    },
    {
      name: "Rahul Verma",
      info: "3rd Year · KIET Ghaziabad",
      text: "The price benchmarking feature saved me ₹30,000 over a year. I almost overpaid before checking the fair price tag.",
      color: "from-purple-700 to-purple-500"
    },
    {
      name: "Anjali Singh",
      info: "1st Year · Meerut College",
      text: "My parents approved the PG instantly after seeing the safety score breakdown. That feature changed everything.",
      color: "from-orange-700 to-orange-500"
    },
    {
      name: "Kunal Tiwari",
      info: "2nd Year · IMS Ghaziabad",
      text: "Roommate matching actually worked. We have similar schedules and habits. Zero conflicts so far.",
      color: "from-green-700 to-green-500"
    }
  ];

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">

      <div className="mb-16">
        <h2 className="font-heading text-4xl font-extrabold mb-4">
          Students Who<br/>
          <span className="text-tealbrand-400">Stopped Guessing</span>
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {reviews.map((review, index) => (
          <div
            key={index}
            className="bg-tealbrand-950 border border-tealbrand-900 rounded-2xl p-8 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
          >
            <p className="text-tealbrand-200 italic mb-6">
              “{review.text}”
            </p>

            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${review.color} flex items-center justify-center font-bold text-black`}>
                {review.name[0]}
              </div>

              <div>
                <div className="font-heading font-bold text-sm">
                  {review.name}
                </div>
                <div className="text-xs text-tealbrand-400">
                  {review.info}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}