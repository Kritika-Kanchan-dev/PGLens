import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 px-8 py-5 backdrop-blur-lg bg-bgdark/90 border-b border-tealbrand-900">
      <div className="max-w-7xl mx-auto flex justify-between items-center">

        {/* Logo (Clickable → Home) */}
        <Link
          to="/"
          className="flex items-center gap-3 font-heading font-extrabold text-tealbrand-400 text-xl"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-tealbrand-500 to-tealbrand-700 rounded-lg flex items-center justify-center">
            🏠
          </div>
          TrustNest
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex gap-8 text-sm text-tealbrand-200">

          <Link
            to="/search"
            className="hover:text-tealbrand-300 transition"
          >
            Discover
          </Link>

          <Link
            to="/"
            className="hover:text-tealbrand-300 transition"
          >
            AI Insights
          </Link>

          <Link
            to="/"
            className="hover:text-tealbrand-300 transition"
          >
            How It Works
          </Link>

          <Link
            to="/search"
            className="bg-tealbrand-600 text-black px-4 py-2 rounded-lg font-heading font-bold hover:bg-tealbrand-500 transition"
          >
            List Your PG
          </Link>

        </div>

      </div>
    </nav>
  );
}