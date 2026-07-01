import { useEffect, useState } from "react";

function MatchChips({ matches }) {
  if (!matches?.length) return <p className="meta">No topics matched.</p>;
  return (
    <div className="kb-matches">
      {matches.map((m) => (
        <div key={`${m.category}-${m.slug}`} className="kb-match-chip">
          <span className="kb-match-topic">
            {m.enriched ? "★ " : ""}
            {m.topic}
          </span>
          <span className="kb-match-scores">
            {m.score} · sem {m.semantic} · kw {m.keyword}
          </span>
        </div>
      ))}
    </div>
  );
}

function CorrectionEditor({ result, onSave, saving, savedId }) {
  const [approvedReply, setApprovedReply] = useState(result.reply || "");
  const top = result.matches?.[0];

  useEffect(() => {
    setApprovedReply(result.reply || "");
  }, [result.reply, result.message]);

  return (
    <div className="kb-correction-box">
      <strong>Save correct response</strong>
      <p className="meta">
        This will be saved to the knowledge base and used when similar messages
        appear in the app.
      </p>
      <textarea
        className="input kb-textarea"
        rows={5}
        value={approvedReply}
        onChange={(e) => setApprovedReply(e.target.value)}
        placeholder="Write the ideal Saathi reply…"
      />
      <button
        type="button"
        className="btn btn-primary"
        disabled={saving || !approvedReply.trim() || !result.message?.trim()}
        onClick={() =>
          onSave({
            triggerMessage: result.message,
            approvedReply: approvedReply.trim(),
            category: top?.category || "",
            slug: top?.slug || "",
            topic: top?.topic || "",
            aiReplyWas: result.reply || ""
          })
        }
      >
        {saving ? "Saving…" : savedId ? "Saved ✓" : "Save to knowledge base"}
      </button>
      {top && (
        <p className="meta">
          Linked topic: {top.topic} ({top.category}/{top.slug})
        </p>
      )}
    </div>
  );
}

function ResultCard({ result, index, onSaveCorrection, savingId, savedIds }) {
  const [showKb, setShowKb] = useState(false);
  const failed = result.expectation && result.expectation.ok === false;
  const cardKey = result.label || result.id || result.message;
  const isSaving = savingId === cardKey;
  const wasSaved = savedIds?.has(cardKey);

  return (
    <article className={`kb-result-card${failed ? " kb-result-fail" : ""}`}>
      <header className="kb-result-head">
        <span className="kb-result-label">
          {index != null ? `#${index + 1} ` : ""}
          {result.label || result.id || "Query"}
        </span>
        {failed && <span className="kb-badge kb-badge-warn">Expected topic missed</span>}
        {wasSaved && <span className="kb-badge kb-badge-ok">Saved to KB</span>}
        {result.warnings?.map((w, i) => (
          <span key={i} className="kb-badge kb-badge-warn">
            {w}
          </span>
        ))}
      </header>
      <p className="kb-user-msg">{result.message}</p>
      {result.threadSummary && (
        <p className="meta kb-thread">Thread: {result.threadSummary}</p>
      )}
      <MatchChips matches={result.matches} />
      {result.knowledgePreview && (
        <div className="kb-kb-block">
          <button
            type="button"
            className="kb-toggle"
            onClick={() => setShowKb((v) => !v)}
          >
            {showKb ? "Hide" : "Show"} KB injection
          </button>
          {showKb && (
            <pre className="kb-pre">{result.knowledgeFull || result.knowledgePreview}</pre>
          )}
        </div>
      )}
      {result.reply && (
        <div className="kb-reply">
          <strong>Saathi reply (AI)</strong>
          <p>{result.reply}</p>
        </div>
      )}
      {onSaveCorrection && (
        <CorrectionEditor
          result={result}
          saving={isSaving}
          savedId={wasSaved}
          onSave={(payload) => onSaveCorrection(cardKey, payload)}
        />
      )}
      {result.expectation?.expected?.length > 0 && (
        <p className="meta">
          Expected: {result.expectation.expected.join(", ")} · Got:{" "}
          {(result.expectation.got || []).join(", ") || "—"}
        </p>
      )}
    </article>
  );
}

export default function KbReviewPanel({ api, adminKey }) {
  const headers = () => ({
    "Content-Type": "application/json",
    "x-admin-key": adminKey
  });

  const [status, setStatus] = useState(null);
  const [testQueries, setTestQueries] = useState([]);
  const [savedCorrections, setSavedCorrections] = useState([]);
  const [tab, setTab] = useState("single");
  const [message, setMessage] = useState("");
  const [threadText, setThreadText] = useState(
    "breakup ho gaya 2 saal baad\nthen kya karun\naur kuch bata"
  );
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [singleResult, setSingleResult] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [threadResults, setThreadResults] = useState(null);
  const [repeatIssues, setRepeatIssues] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [savedIds, setSavedIds] = useState(() => new Set());

  const loadMeta = async () => {
    setError("");
    try {
      const [st, tq, cr] = await Promise.all([
        api("/admin/kb/status", { headers: { "x-admin-key": adminKey } }),
        api("/admin/kb/test-queries", { headers: { "x-admin-key": adminKey } }),
        api("/admin/kb/corrections", { headers: { "x-admin-key": adminKey } })
      ]);
      setStatus(st);
      setTestQueries(tq.queries || []);
      setSavedCorrections(cr.corrections || []);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  const saveCorrection = async (cardKey, payload) => {
    setSavingId(cardKey);
    setError("");
    setSuccess("");
    try {
      await api("/admin/kb/corrections", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(payload)
      });
      setSavedIds((prev) => new Set([...prev, cardKey]));
      setSuccess("Correct response saved — will be used for similar messages.");
      await loadMeta();
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingId(null);
    }
  };

  const removeCorrection = async (id) => {
    if (!confirm("Remove this saved response?")) return;
    setError("");
    try {
      await api(`/admin/kb/corrections/${id}`, {
        method: "DELETE",
        headers: headers()
      });
      await loadMeta();
      setSuccess("Correction removed.");
    } catch (e) {
      setError(e.message);
    }
  };

  const runSingle = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");
    setSingleResult(null);
    try {
      const data = await api("/admin/kb/review", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ message: message.trim(), live, limit: 3 })
      });
      setSingleResult(data.result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const runBatch = async () => {
    setLoading(true);
    setError("");
    setBatchResults(null);
    try {
      const data = await api("/admin/kb/review/batch", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ live })
      });
      setBatchResults(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const runThread = async () => {
    const messages = threadText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!messages.length) return;
    setLoading(true);
    setError("");
    setThreadResults(null);
    setRepeatIssues([]);
    try {
      const data = await api("/admin/kb/review/thread", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ messages, live })
      });
      setThreadResults(data.results);
      setRepeatIssues(data.repeatIssues || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const runPreset = async (preset) => {
    setMessage(preset.message);
    setTab("single");
    setLoading(true);
    setError("");
    setSingleResult(null);
    try {
      const threadSummary = (preset.thread || []).join(". ");
      const data = await api("/admin/kb/review", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          message: preset.message,
          threadSummary,
          live,
          limit: 3
        })
      });
      setSingleResult({ ...data.result, label: preset.id });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveProps = live
    ? {
        onSaveCorrection: saveCorrection,
        savingId,
        savedIds
      }
    : {};

  return (
    <div className="kb-review-panel">
      <section className="admin-section">
        <h2>Knowledge base review</h2>
        <p className="meta">
          Test retrieval and AI replies. Edit wrong responses and save — they go
          into the knowledge base for next time.
        </p>
        {status && (
          <div className="kb-status-row">
            <span className={status.embeddings ? "kb-ok" : "kb-warn"}>
              Embeddings: {status.embeddings ? "loaded" : "missing"}
            </span>
            <span>{status.topicCount} topics</span>
            <span>{status.enrichedCount} enriched ★</span>
            <span>{status.correctionCount || 0} saved replies</span>
          </div>
        )}
      </section>

      <div className="kb-tabs">
        {["single", "thread", "batch", "presets", "saved"].map((t) => (
          <button
            key={t}
            type="button"
            className={`kb-tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "single" && "Single message"}
            {t === "thread" && "Multi-turn"}
            {t === "batch" && "Batch tests"}
            {t === "presets" && "Presets"}
            {t === "saved" && `Saved (${savedCorrections.length})`}
          </button>
        ))}
      </div>

      <label className="kb-live-toggle">
        <input
          type="checkbox"
          checked={live}
          onChange={(e) => setLive(e.target.checked)}
        />
        Live AI reply (required to save corrections)
      </label>

      {tab === "single" && (
        <section className="admin-section">
          <textarea
            className="input kb-textarea"
            rows={3}
            placeholder="Type a user message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading || !message.trim()}
            onClick={runSingle}
          >
            {loading ? "Running…" : live ? "Test + AI reply" : "Test retrieval"}
          </button>
          {singleResult && (
            <ResultCard result={singleResult} {...saveProps} />
          )}
        </section>
      )}

      {tab === "thread" && (
        <section className="admin-section">
          <p className="meta">One message per line.</p>
          <textarea
            className="input kb-textarea"
            rows={5}
            value={threadText}
            onChange={(e) => setThreadText(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading}
            onClick={runThread}
          >
            {loading ? "Running…" : "Run thread test"}
          </button>
          {repeatIssues.length > 0 && (
            <div className="kb-repeat-warn">
              <strong>Repetition warnings</strong>
              <ul>
                {repeatIssues.map((issue, i) => (
                  <li key={i}>
                    <code>{issue.type}</code>
                    {issue.similarity != null && ` (${issue.similarity})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {threadResults?.map((r, i) => (
            <ResultCard
              key={i}
              result={r}
              index={i}
              {...saveProps}
              savingId={savingId}
              savedIds={savedIds}
            />
          ))}
        </section>
      )}

      {tab === "batch" && (
        <section className="admin-section">
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading}
            onClick={runBatch}
          >
            {loading ? "Running…" : `Run batch (${testQueries.length})`}
          </button>
          {batchResults?.results?.map((r, i) => (
            <ResultCard
              key={r.id || i}
              result={r}
              index={i}
              {...saveProps}
            />
          ))}
        </section>
      )}

      {tab === "presets" && (
        <section className="admin-section">
          <div className="kb-preset-list">
            {testQueries.map((q) => (
              <button
                key={q.id}
                type="button"
                className="kb-preset-btn"
                disabled={loading}
                onClick={() => runPreset(q)}
              >
                <span className="kb-preset-id">{q.id}</span>
                <span className="kb-preset-msg">{q.message}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {tab === "saved" && (
        <section className="admin-section">
          <p className="meta">
            These approved replies are used when users send similar messages.
          </p>
          {!savedCorrections.length && (
            <p className="meta">No saved replies yet. Test with live AI and save corrections.</p>
          )}
          {savedCorrections.map((c) => (
            <article key={c.id} className="kb-result-card">
              <header className="kb-result-head">
                <span className="kb-result-label">
                  {c.topic || c.slug} · {new Date(c.createdAt).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  className="kb-delete-btn"
                  onClick={() => removeCorrection(c.id)}
                >
                  Delete
                </button>
              </header>
              <p className="kb-user-msg">User: {c.triggerMessage}</p>
              <div className="kb-reply">
                <strong>Saved reply</strong>
                <p>{c.approvedReply}</p>
              </div>
              {c.aiReplyWas && c.aiReplyWas !== c.approvedReply && (
                <p className="meta">Replaced AI: {c.aiReplyWas.slice(0, 120)}…</p>
              )}
            </article>
          ))}
        </section>
      )}

      {success && <p className="info">{success}</p>}
      {error && <p className="err">{error}</p>}
    </div>
  );
}
