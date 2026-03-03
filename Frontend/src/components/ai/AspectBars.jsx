export default function AspectBars() {
  const aspects = [
    { label: "WiFi", score: 1.8 },
    { label: "Food", score: 3.3 },
    { label: "Hygiene", score: 2.0 },
    { label: "Owner", score: 4.6 },
    { label: "Deposit", score: 1.0 },
  ];

  return (
    <div className="bg-tealbrand-950 border border-tealbrand-900 rounded-2xl p-6">
      <h3 className="font-heading text-lg font-bold text-tealbrand-300 mb-6">
        📊 Aspect-Based Review Analysis
      </h3>

      <div className="space-y-5">
        {aspects.map((item, index) => {
          const width = (item.score / 5) * 100;

          let color = "bg-tealbrand-500";
          if (item.score < 2.5) color = "bg-red-500";
          else if (item.score < 3.5) color = "bg-yellow-500";

          return (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-tealbrand-300">{item.label}</span>
                <span className="font-heading">{item.score}</span>
              </div>

              <div className="w-full bg-tealbrand-900 h-2 rounded-full">
                <div
                  className={`${color} h-2 rounded-full transition-all duration-700`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}