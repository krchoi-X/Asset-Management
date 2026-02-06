"use client";

import React, { useEffect, useMemo, useState } from "react";

type Holding = {
  id: number;
  ticker: string;
  name: string | null;
  shares: number;
  buy_price: number;
  current_price: number;
  sector: string | null;
  country: string | null;
  themes: string;
  notes: string | null;
};

type HoldingFormState = {
  ticker: string;
  name: string;
  shares: string;
  buy_price: string;
  current_price: string;
  sector: string;
  country: string;
  themes: string;
  notes: string;
};

const emptyForm: HoldingFormState = {
  ticker: "",
  name: "",
  shares: "",
  buy_price: "",
  current_price: "",
  sector: "",
  country: "",
  themes: "",
  notes: "",
};

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function DashboardPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formState, setFormState] = useState<HoldingFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const rows = useMemo(() => {
    return holdings.map((holding) => {
      const costValue = holding.shares * holding.buy_price;
      const marketValue = holding.shares * holding.current_price;
      const profitLoss = marketValue - costValue;
      const profitLossPct = costValue === 0 ? 0 : (profitLoss / costValue) * 100;

      return { ...holding, costValue, marketValue, profitLoss, profitLossPct };
    });
  }, [holdings]);

  const totals = useMemo(() => {
    const totalCost = rows.reduce((acc, r) => acc + r.costValue, 0);
    const totalMarket = rows.reduce((acc, r) => acc + r.marketValue, 0);
    const totalPL = totalMarket - totalCost;
    const totalPLPct = totalCost === 0 ? 0 : (totalPL / totalCost) * 100;
    return { totalCost, totalMarket, totalPL, totalPLPct };
  }, [rows]);

  const fetchHoldings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/holdings", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load holdings");
      const payload = await res.json();
      setHoldings(payload.data ?? payload ?? []);
    } catch (e) {
      console.error(e);
      setHoldings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchHoldings();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setFormState(emptyForm);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (h: Holding) => {
    setEditingId(h.id);
    setFormState({
      ticker: h.ticker,
      name: h.name ?? "",
      shares: String(h.shares),
      buy_price: String(h.buy_price),
      current_price: String(h.current_price),
      sector: h.sector ?? "",
      country: h.country ?? "",
      themes: h.themes ?? "",
      notes: h.notes ?? "",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSubmitting) return;
    setIsFormOpen(false);
    setFormError(null);
  };

  const updateField = (field: keyof HoldingFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const ticker = formState.ticker.trim().toUpperCase();
    if (!ticker) return "Ticker is required.";

    const shares = toNumber(formState.shares);
    if (shares < 0) return "Shares must be 0 or more.";

    const buyPrice = toNumber(formState.buy_price);
    if (buyPrice < 0) return "Buy price must be 0 or more.";

    const currentPrice = toNumber(formState.current_price);
    if (currentPrice < 0) return "Current price must be 0 or more.";

    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      ticker: formState.ticker.trim().toUpperCase(),
      name: formState.name.trim() || null,
      shares: toNumber(formState.shares),
      buy_price: toNumber(formState.buy_price),
      current_price: toNumber(formState.current_price),
      sector: formState.sector.trim() || null,
      country: formState.country.trim() || null,
      themes: formState.themes.trim(),
      notes: formState.notes.trim() || null,
    };

    try {
      const res = await fetch(editingId ? `/api/holdings/${editingId}` : "/api/holdings", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Unable to save holding");
      }

      await fetchHoldings();
      setIsFormOpen(false);
      setEditingId(null);
      setFormState(emptyForm);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unable to save";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (h: Holding) => {
    const confirmed = window.confirm(`Delete ${h.ticker}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/holdings/${h.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Unable to delete holding");
      await fetchHoldings();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Portfolio overview</p>
          <h1 className="text-3xl font-semibold text-white">Personal Stock Portfolio</h1>
          <p className="text-slate-300">Track your holdings, cost basis, and market performance.</p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          Add Holding
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
          <p className="text-sm text-slate-400">Total Cost</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(totals.totalCost)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
          <p className="text-sm text-slate-400">Total Market Value</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(totals.totalMarket)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
          <p className="text-sm text-slate-400">Total P/L</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">
            {formatCurrency(totals.totalPL)}{" "}
            <span className="text-sm text-slate-400">({totals.totalPLPct.toFixed(2)}%)</span>
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">Holdings</h2>
          <p className="text-sm text-slate-400">{rows.length} positions</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Ticker</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Shares</th>
                <th className="px-5 py-3 font-medium">Buy Price</th>
                <th className="px-5 py-3 font-medium">Current Price</th>
                <th className="px-5 py-3 font-medium">Cost Value</th>
                <th className="px-5 py-3 font-medium">Market Value</th>
                <th className="px-5 py-3 font-medium">P/L</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-400">
                    Loading holdings...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-400">
                    No holdings yet. Click “Add Holding” to get started.
                  </td>
                </tr>
              ) : (
                rows.map((h) => (
                  <tr key={h.id} className="border-t border-slate-800 text-slate-200">
                    <td className="px-5 py-4 font-semibold text-white">{h.ticker}</td>
                    <td className="px-5 py-4 text-slate-300">{h.name ?? "-"}</td>
                    <td className="px-5 py-4">{h.shares}</td>
                    <td className="px-5 py-4">{formatCurrency(h.buy_price)}</td>
                    <td className="px-5 py-4">{formatCurrency(h.current_price)}</td>
                    <td className="px-5 py-4">{formatCurrency(h.costValue)}</td>
                    <td className="px-5 py-4">{formatCurrency(h.marketValue)}</td>
                    <td className="px-5 py-4">
                      {formatCurrency(h.profitLoss)}{" "}
                      <span className="text-xs text-slate-400">({h.profitLossPct.toFixed(2)}%)</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(h)}
                          className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-100 hover:border-slate-500"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(h)}
                          className="rounded-md border border-rose-500/50 px-2 py-1 text-xs text-rose-200 hover:border-rose-400"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8">
          <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{editingId ? "Edit Holding" : "Add Holding"}</h3>
                <p className="text-sm text-slate-400">Prices are stored in USD.</p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-300">
                  Ticker *
                  <input
                    value={formState.ticker}
                    onChange={(e) => updateField("ticker", e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                    placeholder="AAPL"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  Name
                  <input
                    value={formState.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                    placeholder="Apple Inc."
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  Shares *
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.shares}
                    onChange={(e) => updateField("shares", e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                    placeholder="10"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  Buy Price *
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.buy_price}
                    onChange={(e) => updateField("buy_price", e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                    placeholder="150"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  Current Price *
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.current_price}
                    onChange={(e) => updateField("current_price", e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                    placeholder="180"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  Sector
                  <input
                    value={formState.sector}
                    onChange={(e) => updateField("sector", e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                    placeholder="Technology"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  Country
                  <input
                    value={formState.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                    placeholder="USA"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  Themes
                  <input
                    value={formState.themes}
                    onChange={(e) => updateField("themes", e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                    placeholder="AI, Consumer"
                  />
                </label>
              </div>

              <label className="space-y-2 text-sm text-slate-300">
                Notes
                <textarea
                  value={formState.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  className="min-h-[90px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  placeholder="Add any personal notes."
                />
              </label>

              {formError ? (
                <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {formError}
                </p>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Saving..." : editingId ? "Update Holding" : "Add Holding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
