import { useState } from "react";
import KbReviewPanel from "./KbReviewPanel.jsx";

const TOPICS = ["lawyers", "tarot", "astro"];

export default function AdminPanel({ api, adminKey, onLogout }) {
  const [adminTab, setAdminTab] = useState("dashboard");
  const [professionals, setProfessionals] = useState({
    lawyers: [],
    tarot: [],
    astro: []
  });
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [newPhones, setNewPhones] = useState({
    lawyers: "",
    tarot: "",
    astro: ""
  });

  const headers = () => ({ "x-admin-key": adminKey });

  const load = async () => {
    setError("");
    try {
      const data = await api("/admin/data", { headers: headers() });
      setDashboard(data);
      setProfessionals({
        lawyers: data.professionals?.lawyers || [],
        tarot: data.professionals?.tarot || [],
        astro: data.professionals?.astro || []
      });
    } catch (e) {
      setError(e.message);
    }
  };

  const save = async () => {
    setMsg("");
    setError("");
    try {
      await api("/admin/professionals", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify(professionals)
      });
      setMsg("Professional numbers saved.");
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const addPhone = topic => {
    const phone = newPhones[topic]?.trim();
    if (!phone) return;
    setProfessionals(prev => ({
      ...prev,
      [topic]: [...new Set([...(prev[topic] || []), phone])]
    }));
    setNewPhones(prev => ({ ...prev, [topic]: "" }));
  };

  const removePhone = (topic, phone) => {
    setProfessionals(prev => ({
      ...prev,
      [topic]: (prev[topic] || []).filter(p => p !== phone)
    }));
  };

  if (!dashboard) {
    return (
      <div className="admin-shell">
        <header className="top-bar">
          <span>Saathi Admin</span>
          <button type="button" className="icon-btn" onClick={onLogout}>Logout</button>
        </header>
        <nav className="admin-nav">
          <button type="button" className="admin-nav-btn" onClick={load}>
            Load dashboard
          </button>
          <button
            type="button"
            className={`admin-nav-btn${adminTab === "kb" ? " active" : ""}`}
            onClick={() => setAdminTab("kb")}
          >
            KB Review
          </button>
        </nav>
        <div className="admin-body">
          {adminTab === "kb" ? (
            <KbReviewPanel api={api} adminKey={adminKey} />
          ) : (
            <>
              <button type="button" className="btn btn-primary" onClick={load}>
                Load dashboard
              </button>
              <p className="meta" style={{ marginTop: "1rem" }}>
                Or open KB Review to test knowledge retrieval without loading the full dashboard.
              </p>
            </>
          )}
          {error && <p className="err">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <header className="top-bar">
        <span>Saathi Admin</span>
        <button type="button" className="icon-btn" onClick={onLogout}>Logout</button>
      </header>
      <nav className="admin-nav">
        <button
          type="button"
          className={`admin-nav-btn${adminTab === "dashboard" ? " active" : ""}`}
          onClick={() => setAdminTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          type="button"
          className={`admin-nav-btn${adminTab === "kb" ? " active" : ""}`}
          onClick={() => setAdminTab("kb")}
        >
          KB Review
        </button>
      </nav>
      <div className="admin-body">
        {adminTab === "kb" ? (
          <KbReviewPanel api={api} adminKey={adminKey} />
        ) : (
          <>
        <section className="admin-section">
          <h2>Professional numbers</h2>
          <p className="meta">Add multiple phones per category. Clients are connected randomly to an online pro.</p>
          {TOPICS.map(topic => (
            <div key={topic} className="admin-topic-block">
              <strong>{topic}</strong>
              <div className="phone-chips">
                {(professionals[topic] || []).map(phone => (
                  <span key={phone} className="phone-chip">
                    {phone}
                    <button type="button" onClick={() => removePhone(topic, phone)}>×</button>
                  </span>
                ))}
              </div>
              <div className="add-phone-row">
                <input
                  className="input"
                  placeholder="10-digit phone"
                  value={newPhones[topic]}
                  onChange={e =>
                    setNewPhones(prev => ({ ...prev, [topic]: e.target.value }))
                  }
                />
                <button type="button" className="btn btn-ghost" onClick={() => addPhone(topic)}>
                  Add
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-primary" onClick={save}>Save all</button>
          {msg && <p className="info">{msg}</p>}
          {error && <p className="err">{error}</p>}
        </section>

        <section className="admin-section">
          <h2>Online now</h2>
          <p className="meta">
            Peers matchable: {(dashboard.onlinePeers || []).filter(p => p.contactOk).length} ·
            Total presence: {(dashboard.onlinePeers || []).length}
          </p>
          <div className="admin-list">
            {(dashboard.onlinePeers || []).map(entry => (
              <div key={entry.key} className="admin-list-item">
                <span>{entry.type}:{entry.id.slice(0, 8)}…</span>
                <span>{entry.contactOk ? "matchable" : "private"}</span>
                <span>{entry.anonymous ? "anon" : entry.display}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-section">
          <h2>Pro availability</h2>
          <div className="admin-list">
            {(dashboard.onlinePros || []).map((row, i) => (
              <div key={`${row.phone}-${i}`} className="admin-list-item">
                <span>{row.topic}</span>
                <span>{row.phone}</span>
                <span className={`status status-${row.status}`}>{row.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-section">
          <h2>Peer chats ({(dashboard.peerSessions || []).length})</h2>
          <div className="admin-list">
            {(dashboard.peerSessions || []).slice(0, 30).map(session => (
              <div key={session.id} className="admin-list-item">
                <span>{session.status}</span>
                <span>
                  {session.participantA?.display} ↔ {session.participantB?.display}
                </span>
                <span>{(session.matchedKeywords || []).join(", ")}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-section">
          <h2>Support requests ({(dashboard.supportRequests || []).length})</h2>
          <div className="admin-list">
            {(dashboard.supportRequests || []).slice(0, 20).map(req => (
              <div key={req.id} className="admin-list-item">
                <span>{req.topic}</span>
                <span>{req.status}</span>
                <span>{req.assignedPhone}</span>
              </div>
            ))}
          </div>
        </section>
          </>
        )}
      </div>
    </div>
  );
}
