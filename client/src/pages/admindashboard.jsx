import React, { useEffect, useState } from "react";
import { addCandidate, fetchResults, fetchCandidates } from "../api";

const INITIAL_FORM = { name: "", party: "", age: "", imageUrl: "" };

// Helper: safely extract array from various API response shapes
function extractArray(res, keys) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  for (const key of keys) {
    if (res[key] && Array.isArray(res[key])) return res[key];
  }
  return [];
}

// Helper: get vote count regardless of field name
function getVotes(item) {
  return item.votes ?? item.voteCount ?? item.count ?? 0;
}

export default function AdminDashboard() {
  const [form, setForm]         = useState(INITIAL_FORM);
  const [candidates, setCandidates] = useState([]);
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [adding, setAdding]     = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [c, r] = await Promise.all([fetchCandidates(), fetchResults()]);
      setCandidates(extractArray(c, ["candidates"]));
      setResults(extractArray(r, ["results", "voteRecord"]));
    } catch (err) {
      setError("Failed to load data from server.");
    } finally {
      setLoading(false);
    }
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.party.trim()) {
      setError("Name and Party are required.");
      return;
    }

    const payload = {
      name    : form.name.trim(),
      party   : form.party.trim(),
      age     : form.age      ? Number(form.age)        : undefined,
      imageUrl: form.imageUrl ? form.imageUrl.trim()    : undefined,
    };

    setAdding(true);
    try {
      const res = await addCandidate(payload);
      if (res && (res.success || res._id || res.name)) {
        setForm(INITIAL_FORM);
        await loadAll();
      } else {
        throw new Error(res?.error || res?.message || "Failed to add candidate.");
      }
    } catch (err) {
      setError(err.message || "Network error.");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this candidate?")) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("No token found. Please log in as admin.");
      return;
    }

    try {
      const res  = await fetch(`${process.env.REACT_APP_BASE_URL}/api/candidate/${id}`, {
        method : "DELETE",
        headers: {
          "Content-Type" : "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        await loadAll();
      } else {
        setError(data.message || "Failed to delete candidate.");
      }
    } catch (err) {
      setError("Network error while deleting.");
    }
  }

  const sortedResults = [...results].sort((a, b) => getVotes(b) - getVotes(a));
  const totalVotes    = sortedResults.reduce((sum, r) => sum + getVotes(r), 0);

  // Use results if available, else fall back to candidates list
  const tableRows = sortedResults.length > 0
    ? sortedResults.map((r) => ({
        _id  : r._id || r.name,
        name : r.name  || r.candidateName || "",
        party: r.party || r.partyName     || "",
        votes: getVotes(r),
      }))
    : candidates.map((c) => ({
        _id  : c._id || c.name,
        name : c.name,
        party: c.party,
        votes: getVotes(c),
      }));

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">Admin Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Manage candidates and review voting results</p>
          </div>

          <div className="flex gap-3">
            <StatCard label="Candidates" value={candidates.length} />
            <StatCard label="Total Votes" value={totalVotes} />
          </div>
        </header>

        {/* Global error */}
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-6">

          {/* Add Candidate */}
          <section className="bg-white rounded-2xl shadow p-5 self-start">
            <h2 className="text-lg font-semibold mb-3">Add Candidate</h2>

            <form onSubmit={handleAdd} className="space-y-3">
              <input
                name="name"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Name"
                value={form.name}
                onChange={handleFormChange}
                required
              />
              <input
                name="party"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Party"
                value={form.party}
                onChange={handleFormChange}
                required
              />
              <div className="flex gap-2">
                <input
                  name="age"
                  type="number"
                  className="w-28 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Age"
                  value={form.age}
                  onChange={handleFormChange}
                />
                <input
                  name="imageUrl"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Image URL"
                  value={form.imageUrl}
                  onChange={handleFormChange}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                >
                  {adding ? "Adding..." : "Add Candidate"}
                </button>
                <button
                  type="button"
                  onClick={() => setForm(INITIAL_FORM)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Reset
                </button>
              </div>
            </form>
          </section>

          {/* Right column */}
          <div className="space-y-6">

            {/* Candidates Grid */}
            <section className="bg-white rounded-2xl shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">All Candidates</h2>
                <span className="text-sm text-slate-500">
                  {loading ? "Refreshing..." : `${candidates.length} total`}
                </span>
              </div>

              {loading && <p className="text-sm text-slate-500">Loading candidates…</p>}

              {!loading && candidates.length === 0 && (
                <p className="text-sm text-slate-500">No candidates yet.</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!loading && candidates.map((c) => (
                  <article
                    key={c._id || c.name}
                    className="rounded-lg overflow-hidden border border-slate-100 shadow-sm hover:-translate-y-1 transition-transform"
                  >
                    <img
                      src={c.imageUrl || c.image || "https://via.placeholder.com/600x360?text=No+Image"}
                      alt={c.name}
                      className="w-full h-48 object-cover bg-slate-100"
                    />
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{c.name}</span>
                        <span className="text-sm text-slate-500">{c.age || "—"}</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{c.party}</p>
                      <p className="mt-2 font-bold text-indigo-600">{getVotes(c)} votes</p>
                      <button
                        onClick={() => handleDelete(c._id)}
                        className="mt-3 w-full py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Results Table */}
            <section className="bg-white rounded-2xl shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Results (sorted)</h2>
                <span className="text-sm text-slate-500">{tableRows.length} rows</span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[480px] w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-100">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-4 py-3">Party</th>
                      <th className="px-4 py-3 text-center">Votes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.length > 0 ? tableRows.map((row, idx) => (
                      <tr key={row._id} className="odd:bg-slate-50">
                        <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium">{row.name}</td>
                        <td className="px-4 py-3 text-slate-600">{row.party}</td>
                        <td className="px-4 py-3 text-center font-extrabold text-indigo-600">{row.votes}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                          No results yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

// Small reusable stat card
function StatCard({ label, value }) {
  return (
    <div className="bg-white shadow rounded-xl px-4 py-3 text-center min-w-[80px]">
      <div className="text-lg font-bold text-indigo-600">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}