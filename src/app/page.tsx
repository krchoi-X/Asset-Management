import { prisma } from "@/lib/prisma";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

export default async function DashboardPage() {
  const holdings = await prisma.holding.findMany({
    orderBy: { ticker: "asc" }
  });

  const rows = holdings.map((holding) => {
    const costValue = holding.shares * holding.buy_price;
    const marketValue = holding.shares * holding.current_price;
    const profitLoss = marketValue - costValue;

    return {
      ...holding,
      costValue,
      marketValue,
      profitLoss
    };
  });

  const totalCost = rows.reduce((sum, row) => sum + row.costValue, 0);
  const totalMarket = rows.reduce((sum, row) => sum + row.marketValue, 0);
  const totalProfitLoss = totalMarket - totalCost;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
          Portfolio overview
        </p>
        <h1 className="text-3xl font-semibold text-white">
          Personal Stock Portfolio
        </h1>
        <p className="text-slate-300">
          Track your holdings, cost basis, and market performance.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-400">Total Cost</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(totalCost)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-400">Total Market Value</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(totalMarket)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm text-slate-400">Total P/L</p>
          <p
            className={`mt-2 text-2xl font-semibold ${
              totalProfitLoss >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatCurrency(totalProfitLoss)}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="text-lg font-semibold">Holdings</h2>
          <p className="text-sm text-slate-400">
            {holdings.length} position{holdings.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-300">
              <tr>
                <th className="px-5 py-3 font-medium">Ticker</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Shares</th>
                <th className="px-5 py-3 font-medium">Buy Price</th>
                <th className="px-5 py-3 font-medium">Current Price</th>
                <th className="px-5 py-3 font-medium">Cost Value</th>
                <th className="px-5 py-3 font-medium">Market Value</th>
                <th className="px-5 py-3 font-medium">P/L</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-8 text-center text-slate-400"
                  >
                    No holdings yet. Add holdings via the API to see them here.
                  </td>
                </tr>
              ) : (
                rows.map((holding) => (
                  <tr
                    key={holding.id}
                    className="border-t border-slate-800 text-slate-200"
                  >
                    <td className="px-5 py-4 font-semibold text-white">
                      {holding.ticker}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {holding.name ?? "-"}
                    </td>
                    <td className="px-5 py-4">{holding.shares}</td>
                    <td className="px-5 py-4">
                      {formatCurrency(holding.buy_price)}
                    </td>
                    <td className="px-5 py-4">
                      {formatCurrency(holding.current_price)}
                    </td>
                    <td className="px-5 py-4">
                      {formatCurrency(holding.costValue)}
                    </td>
                    <td className="px-5 py-4">
                      {formatCurrency(holding.marketValue)}
                    </td>
                    <td
                      className={`px-5 py-4 font-medium ${
                        holding.profitLoss >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {formatCurrency(holding.profitLoss)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
