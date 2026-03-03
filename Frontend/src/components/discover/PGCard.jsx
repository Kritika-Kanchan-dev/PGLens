import { Link } from "react-router-dom";

export default function PGCard({ pg, recommended }) {
  return (
    <Link to={`/pg/${pg.id}`}>

      <div className="relative bg-tealbrand-950 border border-tealbrand-900 rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">

        {/* ⭐ Top Recommended Badge */}
        {recommended && (
          <div className="absolute top-4 left-4 bg-tealbrand-500 text-black text-xs font-bold px-3 py-1 rounded-full z-10 shadow-md">
            ⭐ Top Recommended
          </div>
        )}

        {/* Image Section */}
        <div className="h-40 bg-gradient-to-br from-tealbrand-800 to-tealbrand-700 flex items-center justify-center text-4xl">
          🏠
        </div>

        {/* Body */}
        <div className="p-5">
          <h3 className="font-heading font-bold text-lg mb-2">
            {pg.name}
          </h3>

          <p className="text-sm text-tealbrand-300 mb-4">
            📍 {pg.location}
          </p>

          <div className="flex justify-between items-center border-t border-tealbrand-900 pt-4">
            <div className="font-heading font-bold text-tealbrand-400">
              ₹{pg.price}/mo
            </div>

            <span className="text-xs bg-tealbrand-900 px-3 py-1 rounded-md">
              {pg.priceTag}
            </span>
          </div>
        </div>

      </div>

    </Link>
  );
}