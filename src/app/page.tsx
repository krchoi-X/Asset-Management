
"use client";

import { useEffect, useMemo, useState } from "react";

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
  notes: ""
};

import { prisma } from "@/lib/prisma";
codex/initialize-mvp-web-app-for-stock-portfolio-4h0w5t
function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function DashboardPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<HoldingFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const rows = useMemo(() => {
    return holdings.map((holding) => {
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
  }, [holdings]);

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

  const fetchHoldings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/holdings", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load holdings");
      }
      const payload = await response.json();
      setHoldings(payload.data ?? []);
    } catch (error) {
      console.error(error);
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

  const openEditForm = (holding: Holding) => {
    setEditingId(holding.id);
    setFormState({
      ticker: holding.ticker,
      name: holding.name ?? "",
      shares: String(holding.shares),
      buy_price: String(holding.buy_price),
      current_price: String(holding.current_price),
      sector: holding.sector ?? "",
      country: holding.country ?? "",
      themes: holding.themes,
      notes: holding.notes ?? ""
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSubmitting) return;
    setIsFormOpen(false);
    setFormError(null);
  };

  const updateField = (
    field: keyof HoldingFormState,
    value: string
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const ticker = formState.ticker.trim().toUpperCase();
    if (!ticker) {
      return "Ticker is required.";
    }

    const shares = toNumber(formState.shares);
    if (shares < 0) return "Shares must be 0 or more.";

    const buyPrice = toNumber(formState.buy_price);
    if (buyPrice < 0) return "Buy price must be 0 or more.";

    const currentPrice = toNumber(formState.current_price);
    if (currentPrice < 0) return "Current price must be 0 or more.";

    if (!formState.themes.trim()) {
      return "Themes is required.";
    }

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
      notes: formState.notes.trim() || null
    };

    try {
      const response = await fetch(
        editingId ? `/api/holdings/${editingId}` : "/api/holdings",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Unable to save holding");
      }

      await fetchHoldings();
      setIsFormOpen(false);
      setEditingId(null);
      setFormState(emptyForm);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (holding: Holding) => {
    const confirmed = window.confirm(
      `Delete ${holding.ticker}? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/holdings/${holding.id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("Unable to delete holding");
      }
      await fetchHoldings();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
            Portfolio overview
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Personal Stock Portfolio
          </h1>
          <p className="text-slate-300">
            Track your holdings, cost basis, and market performance.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          Add Holding
        </button>

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
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-8 text-center text-slate-400"
                  >
                    Loading holdings...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-8 text-center text-slate-400"
                  >
                    No holdings yet. Click “Add Holding” to get started.
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
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(holding)}
                          className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-100 hover:border-slate-500"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(holding)}
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
                <h3 className="text-lg font-semibold text-white">
                  {editingId ? "Edit Holding" : "Add Holding"}
                </h3>
                <p className="text-sm text-slate-400">
                  Keep values simple. Prices are stored in USD.
                </p>
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
                    onChange={(event) =>
                      updateField("ticker", event.target.value)
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                    placeholder="AAPL"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-300">
                  Name
                  <input
                    value={formState.name}
                    onChange={(event) => updateField("name", event.target.value)}
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
                    onChange={(event) =>
                      updateField("shares", event.target.value)
                    }
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
                    onChange={(event) =>
                      updateField("buy_price", event.target.value)
                    }
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
                    onChange={(event) =>
                      updateField("current_price", event.target.value)
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                    placeholder="180"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-300">
                  Sector
                  <input
                    value={formState.sector}
                    onChange={(event) =>
                      updateField("sector", event.target.value)
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                    placeholder="Technology"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-300">
                  Country
                  <input
                    value={formState.country}
                    onChange={(event) =>
                      updateField("country", event.target.value)
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                    placeholder="USA"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-300">
                  Themes *
                  <input
                    value={formState.themes}
                    onChange={(event) =>
                      updateField("themes", event.target.value)
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                    placeholder="Consumer electronics"
                  />
                </label>
              </div>
              <label className="space-y-2 text-sm text-slate-300">
                Notes
                <textarea
                  value={formState.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
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
                  {isSubmitting
                    ? "Saving..."
                    : editingId
                    ? "Update Holding"
                    : "Add Holding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
