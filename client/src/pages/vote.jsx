import React, { useEffect, useState } from "react";
import { fetchCandidates, submitVote } from "../api";

export default function Vote() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(null);
  const [toast, setToast] = useState(null);
  const [localVotes, setLocalVotes] = useState({});
  const [flash, setFlash] = useState({});
  const [voted, setVoted] = useState(null); // ✅ NEW: track voted candidate
  const token = localStorage.getItem("token");

  useEffect(() => {
    loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCandidates() {
    setLoading(true);
    try {
      const res = await fetchCandidates();
      let list = [];
      if (!res) list = [];
      else if (Array.isArray(res)) list = res;
      else if (res.candidates && Array.isArray(res.candidates)) list = res.candidates;
      else list = res || [];

      setCandidates(list);

      const lv = {};
      const fs = {};
      list.forEach((c) => {
        const id = c._id || c.id || c.name;
        lv[id] = 0;
        fs[id] = false;
      });
      setLocalVotes(lv);
      setFlash(fs);
    } catch (err) {
      console.error("Failed to load candidates:", err);
      showToast({ type: "error", text: "Failed to load candidates" });
    } finally {
      setLoading(false);
    }
  }

  function showToast(t) {
    setToast(t);
    setTimeout(() => setToast(null), 2500);
  }

  function flashButton(candidateId, ms = 1200) {
    setFlash((prev) => ({ ...prev, [candidateId]: true }));
    setTimeout(() => {
      setFlash((prev) => ({ ...prev, [candidateId]: false }));
    }, ms);
  }

  async function handleVote(candidateId) {
    if (!token) {
      showToast({ type: "error", text: "You must log in to vote." });
      return;
    }
    if (voting) return;

    setVoting(candidateId);
    try {
      const data = await submitVote(candidateId);

      if (data && (data.success || data.voted === true)) {
        setLocalVotes((prev) => ({ ...prev, [candidateId]: (prev[candidateId] || 0) + 1 }));
        flashButton(candidateId, 1200);
        setVoted(candidateId); // ✅ NEW: mark as voted
        showToast({ type: "success", text: data.message || "Vote recorded — thank you!" });
      } else {
        const msg = (data && (data.message || data.error)) || "Vote failed";
        showToast({ type: "error", text: msg });
      }
    } catch (err) {
      console.error("Vote error:", err);
      showToast({ type: "error", text: err.message || "Network error" });
    } finally {
      setVoting(null);
    }
  }

  function handlePreview(candidateId) {
    setLocalVotes((prev) => ({ ...prev, [candidateId]: (prev[candidateId] || 0) + 1 }));
    flashButton(candidateId, 1200);
    showToast({ type: "info", text: "Preview: local vote increment" });
  }

  const totalLocalVotes = Object.values(localVotes).reduce((s, v) => s + (v || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">

        {/* ✅ NEW: Thank you banner */}
        {voted && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-lg px-4 py-3">
            Your vote has been recorded. Thank you for participating!
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900">Vote for your candidate</h1>
            <p className="text-lg text-slate-500 mt-2">Choose one candidate and cast your vote securely.</p>
          </div>

          <div className="flex gap-3">
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-xl text-center">
              <div className="text-xl font-semibold text-indigo-600">{candidates.length}</div>
              <div className="text-xs text-slate-500">Candidates</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-xl text-center">
              <div className="text-xl font-semibold text-indigo-600">{totalLocalVotes}</div>
              <div className="text-xs text-slate-500">Local Votes</div>
            </div>
          </div>
        </div>

        {/* loading / empty states */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
                <div className="h-36 bg-slate-100 rounded-md mb-3"></div>
                <div className="h-4 bg-slate-100 w-3/4 rounded mb-2"></div>
                <div className="h-3 bg-slate-100 w-1/2 rounded mb-4"></div>
                <div className="h-9 bg-slate-100 w-32 rounded"></div>
              </div>
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <p className="text-slate-600">No candidates yet. Admin can add candidates at <b>/admin</b>.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((c) => {
                const id = c._id || c.id || c.name;
                const votes = localVotes[id] || 0;
                const isVoting = voting === id;
                const isFlashed = !!flash[id];
                const isVoted = voted === id; // ✅ NEW

                return (
                  <article
                    key={id}
                    // ✅ NEW: green border when voted, default otherwise
                    className={`bg-white rounded-2xl overflow-hidden border transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg
                      ${isVoted ? "border-2 border-emerald-400" : "border border-slate-100"}`}
                    aria-live="polite"
                  >
                    {/* image */}
                    <div className="h-44 bg-slate-100 flex items-center justify-center overflow-hidden">
                      <img
                        src={c.imageUrl || c.image || "https://via.placeholder.com/600x360?text=No+Image"}
                        alt={c.name}
                        className="w-full h-44 object-cover"
                      />
                    </div>

                    {/* body */}
                    <div className="p-4 pt-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{c.name}</h3>
                          <div className="text-sm text-slate-500 mt-2">
                            {c.party} <span className="mx-2">•</span> Age: {c.age || "-"}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-slate-500">Votes</div>
                          <div className="text-xl font-bold mt-2 text-indigo-600">{votes}</div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleVote(id)}
                            disabled={isVoting || !!voting || !!voted}
                            // ✅ NEW: green when voted, indigo otherwise
                            className={`inline-flex items-center gap-2 px-10 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition
                              ${isVoted
                                ? "bg-emerald-500 cursor-default"
                                : "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600"}
                              ${isVoting ? "opacity-70 cursor-wait" : ""}
                              ${voted && !isVoted ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {isVoting ? (
                              <svg className="w-4 h-4 animate-spin" viewBox="3 3 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 5v2" stroke="white" strokeWidth="2" strokeLinecap="round" />
                              </svg>
                            ) : null}
                            {isVoted ? "Voted ✓" : "Vote"} {/* ✅ NEW: button text changes */}
                          </button>

                          <button
                            onClick={() => handlePreview(id)}
                            disabled={isVoting || !!voting}
                            aria-pressed={false}
                            className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-white shadow-sm transition 
                              ${isFlashed ? "bg-red-800 hover:bg-rose-800" : "bg-rose-300 hover:bg-rose-400"}
                              ${isVoting ? "opacity-70 cursor-wait" : ""}`}
                            title="Preview vote"
                          >
                          </button>
                        </div>

                        <div>
                          <button
                            onClick={() => handlePreview(id)}
                            className="text-sm px-5 py-2 border rounded-md text-slate-700 hover:bg-slate-100 transition"
                          >
                            +1 preview
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* small help / login CTA */}
            {!token && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 bg-white border border-slate-100 px-4 py-2 rounded-2xl shadow-sm">
                  <div className="text-sm text-slate-600">You are not logged in —</div>
                  <a href="/" className="text-sm font-semibold text-indigo-600 hover:underline">
                    Log in to cast your vote
                  </a>
                </div>
              </div>
            )}
          </>
        )}

        {/* Toast */}
        {toast && (
          <div
            role="status"
            className={`fixed right-6 bottom-6 z-50 rounded-lg px-4 py-3 shadow-lg text-sm font-medium
              ${toast.type === "success" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : ""}
              ${toast.type === "error" ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200" : ""}
              ${toast.type === "info" ? "bg-slate-50 text-slate-700 ring-1 ring-slate-200" : ""}`}
          >
            {toast.text}
          </div>
        )}
      </div>
    </div>
  );
}