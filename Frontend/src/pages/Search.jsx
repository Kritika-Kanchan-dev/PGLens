import { useState } from "react";
import { pgData } from "../data/pgData";
import PGCard from "../components/discover/PGCard";

export default function Search() {
  const [maxPrice, setMaxPrice] = useState(10000);
  const [gender, setGender] = useState("All");
  const [sortOrder, setSortOrder] = useState("none");

  // Step 1: Filter
  let filtered = pgData.filter((pg) => {
    const priceMatch = pg.price <= maxPrice;
    const genderMatch = gender === "All" || pg.gender === gender;
    return priceMatch && genderMatch;
  });

  // Step 2: Sort
  if (sortOrder === "low") {
    filtered.sort((a, b) => a.price - b.price);
  }

  if (sortOrder === "high") {
    filtered.sort((a, b) => b.price - a.price);
  }

  if (sortOrder === "ai") {
    filtered.sort((a, b) => b.aiScore - a.aiScore);
  }

  return (
    <div className="pt-32 px-6 max-w-7xl mx-auto">

      {/* Filters Section */}
      <div className="bg-tealbrand-950 border border-tealbrand-900 rounded-2xl p-6 mb-12 grid md:grid-cols-3 gap-6">

        {/* Budget Filter */}
        <div>
          <label className="text-sm text-tealbrand-300 block mb-2">
            Max Budget: ₹{maxPrice}
          </label>
          <input
            type="range"
            min="3000"
            max="10000"
            step="500"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Gender Filter */}
        <div>
          <label className="text-sm text-tealbrand-300 block mb-2">
            Gender
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full bg-tealbrand-900 border border-tealbrand-800 rounded-md p-2 text-tealbrand-200"
          >
            <option value="All">All</option>
            <option value="Girls">Girls</option>
            <option value="Boys">Boys</option>
            <option value="Co-ed">Co-ed</option>
          </select>
        </div>

        {/* Sort Filter */}
        <div>
          <label className="text-sm text-tealbrand-300 block mb-2">
            Sort
          </label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full bg-tealbrand-900 border border-tealbrand-800 rounded-md p-2 text-tealbrand-200"
          >
            <option value="none">None</option>
            <option value="ai">AI Recommended</option>
            <option value="low">Price: Low → High</option>
            <option value="high">Price: High → Low</option>
          </select>
        </div>

      </div>

      {/* Results */}
      <div className="grid md:grid-cols-3 gap-8">
        {filtered.length > 0 ? (
          filtered.map((pg, index) => (
            <PGCard
              key={pg.id}
              pg={pg}
              recommended={sortOrder === "ai" && index === 0}
            />
          ))
        ) : (
          <p className="text-tealbrand-300">
            No PGs match your criteria.
          </p>
        )}
      </div>

    </div>
  );
}