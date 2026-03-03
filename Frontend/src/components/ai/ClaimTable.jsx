export default function ClaimTable() {
  return (
    <div className="bg-tealbrand-950 border border-tealbrand-900 rounded-2xl p-6">
      <h3 className="font-heading text-lg font-bold text-tealbrand-300 mb-6">
        🔍 Claim Verification Engine
      </h3>

      <table className="w-full text-sm">
        <thead className="text-tealbrand-400 border-b border-tealbrand-900">
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
            <td className="py-3">Owner Behavior</td>
            <td>Very Helpful</td>
            <td className="text-tealbrand-300">4.6 / 5</td>
            <td className="text-tealbrand-300 font-semibold">✔ Verified</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}