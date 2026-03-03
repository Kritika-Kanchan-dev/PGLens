export default function Footer() {
  return (
    <footer className="border-t border-tealbrand-900 mt-24">

      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-12">

        {/* Brand */}
        <div>
          <div className="flex items-center gap-3 font-heading font-extrabold text-tealbrand-400 text-xl mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-tealbrand-500 to-tealbrand-700 rounded-lg flex items-center justify-center">
              🏠
            </div>
            TrustNest
          </div>

          <p className="text-sm text-tealbrand-300 leading-relaxed">
            Bringing transparency to India's student housing market using AI,
            real reviews, and geo intelligence.
          </p>
        </div>

        {/* Platform */}
        <div>
          <h4 className="font-heading font-bold text-sm mb-4">Platform</h4>
          <ul className="space-y-2 text-sm text-tealbrand-300">
            <li><a href="#" className="hover:text-tealbrand-400 transition">Search PGs</a></li>
            <li><a href="#" className="hover:text-tealbrand-400 transition">AI Insights</a></li>
            <li><a href="#" className="hover:text-tealbrand-400 transition">Safety Scores</a></li>
            <li><a href="#" className="hover:text-tealbrand-400 transition">Roommate Match</a></li>
            <li><a href="#" className="hover:text-tealbrand-400 transition">Price Checker</a></li>
          </ul>
        </div>

        {/* For Owners */}
        <div>
          <h4 className="font-heading font-bold text-sm mb-4">For Owners</h4>
          <ul className="space-y-2 text-sm text-tealbrand-300">
            <li><a href="#" className="hover:text-tealbrand-400 transition">List Your PG</a></li>
            <li><a href="#" className="hover:text-tealbrand-400 transition">Verification Badge</a></li>
            <li><a href="#" className="hover:text-tealbrand-400 transition">Owner Dashboard</a></li>
            <li><a href="#" className="hover:text-tealbrand-400 transition">Pricing</a></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="font-heading font-bold text-sm mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-tealbrand-300">
            <li><a href="#" className="hover:text-tealbrand-400 transition">About</a></li>
            <li><a href="#" className="hover:text-tealbrand-400 transition">Blog</a></li>
            <li><a href="#" className="hover:text-tealbrand-400 transition">Careers</a></li>
            <li><a href="#" className="hover:text-tealbrand-400 transition">Contact</a></li>
            <li><a href="#" className="hover:text-tealbrand-400 transition">Privacy Policy</a></li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="border-t border-tealbrand-900 text-center py-6 text-xs text-tealbrand-400">
        © 2025 TrustNest. All rights reserved. · Made for Students. Powered by AI.
      </div>

    </footer>
  );
}