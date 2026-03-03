export default function SafetyScore() {
  return (
    <div className="bg-tealbrand-950 border border-tealbrand-900 rounded-2xl p-6">
      <h3 className="font-heading text-lg font-bold text-tealbrand-300 mb-6">
        🛡️ Safety Intelligence
      </h3>

      <div className="text-4xl font-heading text-tealbrand-400 mb-4">
        7.8 / 10
      </div>

      <div className="space-y-3 text-sm text-tealbrand-200">
        <div className="flex justify-between">
          <span>Police Station</span>
          <span className="text-tealbrand-300">1.2 km ✔</span>
        </div>
        <div className="flex justify-between">
          <span>Street Lighting</span>
          <span className="text-tealbrand-300">Good ✔</span>
        </div>
        <div className="flex justify-between">
          <span>Night Access</span>
          <span className="text-yellow-400">10 PM Curfew ⚠</span>
        </div>
      </div>
    </div>
  );
}