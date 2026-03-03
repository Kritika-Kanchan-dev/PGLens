import { useParams } from "react-router-dom";
import { pgData } from "../data/pgData";
import { useState } from "react";

export default function PGDetail() {
  const { id } = useParams();

  // Dummy PG Data (later will come from backend)
    const pg = pgData.find((item) => item.id === parseInt(id));
    const [selectedImage, setSelectedImage] = useState(null);

    if (!pg) {
    return (
        <div className="pt-32 text-center text-tealbrand-300">
        PG Not Found
        </div>
    );
    }

  return (
    <div className="pt-32 px-6 max-w-6xl mx-auto space-y-12">
        {/* Image Gallery */}
        <div className="grid md:grid-cols-3 gap-4">
        {Array.isArray(pg.images) && pg.images.map((img, index) => (
            <img
            key={index}
            src={img}
            alt="PG"
            onClick={() => setSelectedImage(img)}
            className="rounded-xl cursor-pointer hover:scale-105 transition"
            />
        ))}
        </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-4xl font-extrabold">
            {pg.name}
          </h1>
          <p className="text-tealbrand-300 mt-2">
            📍 {pg.location}
          </p>
        </div>

        <div className="bg-tealbrand-900 px-6 py-4 rounded-2xl text-center">
          <div className="text-sm text-tealbrand-400">AI Transparency Score</div>
          <div className="text-3xl font-heading font-bold text-tealbrand-300">
            {pg.aiScore} / 10
          </div>
        </div>
      </div>

      {/* Price Section */}
      <div className="bg-tealbrand-950 border border-tealbrand-900 rounded-2xl p-6 flex justify-between items-center">
        <div className="text-2xl font-heading font-bold text-tealbrand-400">
          ₹{pg.price} / month
        </div>
        <div className="text-sm bg-tealbrand-900 px-4 py-2 rounded-md">
          {pg.priceTag}
        </div>
      </div>

      {/* Aspect Breakdown */}
      <div className="bg-tealbrand-950 border border-tealbrand-900 rounded-2xl p-8">
        <h2 className="font-heading text-xl font-bold mb-6 text-tealbrand-300">
          Review Intelligence Breakdown
        </h2>

        <div className="space-y-5">
          {pg.aspects.map((item, index) => {
            const width = (item.score / 5) * 100;

            let color = "bg-tealbrand-500";
            if (item.score < 2.5) color = "bg-red-500";
            else if (item.score < 3.5) color = "bg-yellow-500";

            return (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-tealbrand-300">
                    {item.label}
                  </span>
                  <span className="font-heading">
                    {item.score} / 5
                  </span>
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


      {/* Claim Verification */}
      <div className="bg-tealbrand-950 border border-tealbrand-900 rounded-2xl p-8">
        <h2 className="font-heading text-xl font-bold mb-6 text-tealbrand-300">
          Claim Verification Engine
        </h2>

        <table className="w-full text-sm">
          <thead className="border-b border-tealbrand-900 text-tealbrand-400">
            <tr>
              <th className="text-left py-2">Feature</th>
              <th className="text-left py-2">Owner Claim</th>
              <th className="text-left py-2">User Score</th>
              <th className="text-left py-2">AI Verdict</th>
            </tr>
          </thead>

          <tbody className="text-tealbrand-200">

            <tr className="border-b border-tealbrand-900">
              <td className="py-3">WiFi</td>
              <td>High Speed</td>
              <td className="text-red-400">1.8 / 5</td>
              <td className="text-red-400 font-semibold">❌ Misleading</td>
            </tr>

            <tr className="border-b border-tealbrand-900">
              <td className="py-3">Food</td>
              <td>Excellent</td>
              <td className="text-yellow-400">3.3 / 5</td>
              <td className="text-yellow-400 font-semibold">⚠ Overstated</td>
            </tr>

            <tr>
              <td className="py-3">Owner</td>
              <td>Very Helpful</td>
              <td className="text-tealbrand-300">4.6 / 5</td>
              <td className="text-tealbrand-300 font-semibold">✔ Verified</td>
            </tr>

          </tbody>
        </table>
      </div>

      {/* Safety Intelligence */}
      <div className="bg-tealbrand-950 border border-tealbrand-900 rounded-2xl p-8">
        <h2 className="font-heading text-xl font-bold mb-8 text-tealbrand-300">
          Safety Intelligence
        </h2>

        <div className="grid md:grid-cols-2 gap-10 items-center">

          {/* Circular Score */}
          <div className="flex justify-center">
            <div className="relative w-40 h-40">

              <svg className="w-40 h-40 -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#013f3f"
                  strokeWidth="12"
                  fill="none"
                />

                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#22d3d3"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray="440"
                  strokeDashoffset="88"
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-heading font-bold text-tealbrand-400">
                  7.8
                </span>
                <span className="text-xs text-tealbrand-300">
                  / 10
                </span>
              </div>

            </div>
          </div>

          {/* Safety Details */}
          <div className="space-y-4 text-sm text-tealbrand-200">

            <div className="flex justify-between border-b border-tealbrand-900 pb-2">
              <span>Police Station Distance</span>
              <span className="text-tealbrand-400">1.2 km ✔</span>
            </div>

            <div className="flex justify-between border-b border-tealbrand-900 pb-2">
              <span>Street Lighting</span>
              <span className="text-tealbrand-400">Good ✔</span>
            </div>

            <div className="flex justify-between border-b border-tealbrand-900 pb-2">
              <span>Night Access</span>
              <span className="text-yellow-400">10 PM Curfew ⚠</span>
            </div>

            <div className="flex justify-between">
              <span>CCTV Detected</span>
              <span className="text-tealbrand-400">Yes ✔</span>
            </div>

          </div>

        </div>
      </div>

        {/* Image Modal */}
        {selectedImage && (
        <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
            onClick={() => setSelectedImage(null)}
        >
            <img
            src={selectedImage}
            alt="Preview"
            className="max-h-[80%] max-w-[80%] rounded-xl"
            />
        </div>
        )}

    </div>
  );
}