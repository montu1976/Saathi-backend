import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  LogOut,
  MessageCircle,
  User,
  X,
  Clock
} from "lucide-react";
import { getApiBase } from "./apiBase.js";
import AdminPanel from "./AdminPanel.jsx";
import { formatChatStamp, formatChatTime } from "./formatStamp.js";
import "./App.css";

const TOKEN_KEY = "saathi_pro_token";
const ADMIN_KEY_STORAGE = "saathi_admin_key";
const TOPIC_LABELS = { lawyers: "Lawyer", tarot: "Tarot", astro: "Astro" };

function App() {
  const API_BASE = getApiBase();
  const VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(null);
  const [professionalTopics, setProfessionalTopics] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStage, setOtpStage] = useState("request");
  const [authError, setAuthError] = useState("");
  const [authInfo, setAuthInfo] = useState("");

  const [tab, setTab] = useState("chats");
  const [history, setHistory] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [toast, setToast] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [loginMode, setLoginMode] = useState("pro");
  const [adminKey, setAdminKey] = useState(
    () => sessionStorage.getItem(ADMIN_KEY_STORAGE) || ""
  );
  const [adminActive, setAdminActive] = useState(
    () => Boolean(sessionStorage.getItem(ADMIN_KEY_STORAGE))
  );
  const [proOnline, setProOnline] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [templateDraft, setTemplateDraft] = useState("");

  const knownWaiting = useRef(new Set());
  const chatEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollChatToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = messagesContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, []);

  const headers = useCallback(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const api = useCallback(
    async (path, options = {}) => {
      const res = await fetch(`${API_BASE}${path}`, options);
      const isJson = (res.headers.get("content-type") || "").includes("json");
      const data = isJson ? await res.json() : null;
      if (!res.ok) throw new Error(data?.error || "Request failed");
      return data;
    },
    [API_BASE]
  );

  const finishLogin = async (data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    const me = await api("/auth/me", {
      headers: { Authorization: `Bearer ${data.token}` }
    });
    if (!me.professionalTopics?.length) {
      throw new Error(
        "This number is not registered as a Saathi professional. Ask admin to add it."
      );
    }
    setUser(me.user);
    setProfessionalTopics(me.professionalTopics || []);
    setDisplayName(me.user.displayName || "");
    setBio(me.user.bio || "");
    setProfilePhoto(me.user.profilePhoto || "");
    setOtp("");
    setOtpStage("request");
  };

  useEffect(() => {
    if (adminActive) {
      setAuthLoading(false);
      return;
    }
    if (!token) {
      setAuthLoading(false);
      return;
    }
    (async () => {
      try {
        const me = await api("/auth/me", { headers: headers() });
        if (!me.professionalTopics?.length) {
          throw new Error("Not a registered professional.");
        }
        setUser(me.user);
        setProfessionalTopics(me.professionalTopics || []);
        setDisplayName(me.user.displayName || "");
        setBio(me.user.bio || "");
        setProfilePhoto(me.user.profilePhoto || "");
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, [token, api, headers]);

  const subscribePush = useCallback(async () => {
    if (!token || !VAPID || !("serviceWorker" in navigator)) return;
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const padding = "=".repeat((4 - (VAPID.length % 4)) % 4);
        const raw = atob((VAPID + padding).replace(/-/g, "+").replace(/_/g, "/"));
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: Uint8Array.from(raw, c => c.charCodeAt(0))
        });
      }
      await api("/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({ subscription: sub })
      });
    } catch {
      // optional
    }
  }, [token, VAPID, api, headers]);

  useEffect(() => {
    if (user && token) subscribePush();
  }, [user, token, subscribePush]);

  const setProStatus = useCallback(
    async online => {
      if (!token) return;
      try {
        const data = await api("/pro/status", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers() },
          body: JSON.stringify({ status: online ? "online" : "away" })
        });
        setProOnline(data.status === "online");
      } catch {
        // optional
      }
    },
    [token, api, headers]
  );

  const loadTemplates = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api("/pro/templates", { headers: headers() });
      setTemplates(data.templates || []);
    } catch {
      setTemplates([]);
    }
  }, [token, api, headers]);

  useEffect(() => {
    if (user && token) {
      setProStatus(true);
      loadTemplates();
    }
  }, [user, token, setProStatus, loadTemplates]);

  const saveTemplates = async () => {
    try {
      const data = await api("/pro/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({ templates })
      });
      setTemplates(data.templates || []);
      setProfileMsg("Templates saved.");
    } catch (e) {
      setProfileMsg(e.message);
    }
  };

  const addTemplate = () => {
    const text = templateDraft.trim();
    if (!text) return;
    setTemplates(prev => [...prev, text].slice(0, 20));
    setTemplateDraft("");
  };

  const adminLogin = () => {
    if (!adminKey.trim()) {
      setAuthError("Enter admin key.");
      return;
    }
    sessionStorage.setItem(ADMIN_KEY_STORAGE, adminKey.trim());
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
    setAdminActive(true);
    setAuthError("");
  };

  const adminLogout = () => {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    setAdminKey("");
    setAdminActive(false);
  };

  const loadHistory = useCallback(async () => {
    if (!token) return;
    const data = await api("/support/pro/history", { headers: headers() });
    setHistory(data.requests || []);
    const waiting = (data.requests || []).filter(r => r.status === "waiting");
    for (const r of waiting) {
      if (!knownWaiting.current.has(r.id)) {
        knownWaiting.current.add(r.id);
        if (knownWaiting.current.size > 1) {
          setToast(
            `New ${TOPIC_LABELS[r.topic] || r.topic} request · ${formatChatStamp(r.createdAt)}`
          );
          setTimeout(() => setToast(""), 4000);
        }
      }
    }
  }, [token, api, headers]);

  useEffect(() => {
    if (!user || !token) return undefined;
    loadHistory();
    const id = setInterval(loadHistory, 3000);
    return () => clearInterval(id);
  }, [user, token, loadHistory]);

  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (deepLinkHandled.current || !token || history.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const requestId = params.get("requestId");
    if (!requestId) return;
    const found = history.find(r => r.id === requestId);
    if (!found) return;
    deepLinkHandled.current = true;
    (async () => {
      if (params.get("action") === "accept" && found.status === "waiting") {
        try {
          const data = await api(`/support/request/${found.id}/accept`, {
            method: "POST",
            headers: headers()
          });
          setActiveChat(data.request);
          setTab("chats");
        } catch {
          setActiveChat(found);
        }
      } else {
        setActiveChat(found);
      }
      window.history.replaceState({}, "", window.location.pathname);
    })();
  }, [history, token, api, headers]);

  useEffect(() => {
    scrollChatToBottom();
  }, [activeChat?.messages?.length, activeChat?.status, scrollChatToBottom]);

  useEffect(() => {
    if (!activeChat?.id || !token) return undefined;
    const poll = setInterval(async () => {
      try {
        const data = await api(`/support/request/${activeChat.id}`, {
          headers: headers()
        });
    setActiveChat(data.request);
    loadHistory();
    scrollChatToBottom();
      } catch {
        // ignore
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [activeChat?.id, token, api, headers, loadHistory]);

  const requestOtp = async () => {
    setAuthError("");
    if (!phone.trim()) {
      setAuthError("Enter your phone number.");
      return;
    }
    try {
      const data = await api("/auth/whatsapp/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      setOtpStage("verify");
      setAuthInfo(data.message || "OTP sent on WhatsApp.");
    } catch (e) {
      setAuthError(e.message);
    }
  };

  const verifyOtp = async () => {
    setAuthError("");
    try {
      const data = await api("/auth/whatsapp/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp })
      });
      await finishLogin(data);
    } catch (e) {
      setAuthError(e.message);
    }
  };

  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST", headers: headers() });
    } catch {
      // no-op
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
    setActiveChat(null);
    knownWaiting.current.clear();
  };

  const acceptRequest = async (id) => {
    const data = await api(`/support/request/${id}/accept`, {
      method: "POST",
      headers: headers()
    });
    setActiveChat(data.request);
    setTab("chats");
    loadHistory();
  };

  const declineRequest = async (id) => {
    await api(`/support/request/${id}/decline`, {
      method: "POST",
      headers: headers()
    });
    if (activeChat?.id === id) setActiveChat(null);
    loadHistory();
  };

  const closeChat = async () => {
    if (!activeChat) return;
    await api(`/support/request/${activeChat.id}/close`, {
      method: "POST",
      headers: headers()
    });
    setActiveChat(null);
    loadHistory();
  };

  const sendMessage = async () => {
    if (!activeChat?.id || !chatInput.trim()) return;
    const text = chatInput;
    setChatInput("");
    const data = await api(`/support/request/${activeChat.id}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers() },
      body: JSON.stringify({ text })
    });
    setActiveChat(data.request);
  };

  const saveProfile = async () => {
    setProfileMsg("");
    try {
      const data = await api("/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({ displayName, bio, profilePhoto })
      });
      setUser(data.user);
      setProfileMsg("Profile saved.");
    } catch (e) {
      setProfileMsg(e.message);
    }
  };

  const onPhotoPick = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 250000) {
      setProfileMsg("Photo must be under 250KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfilePhoto(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const waiting = history.filter(r => r.status === "waiting");
  const activeChats = history
    .filter(r => r.status === "active")
    .sort((a, b) => {
      const order = { lawyers: 0, tarot: 1, astro: 2 };
      return (order[a.topic] ?? 9) - (order[b.topic] ?? 9);
    });
  const past = history.filter(r =>
    ["declined", "closed"].includes(r.status)
  );

  const getClientPreview = (item) =>
    item.messages?.filter(m => m.senderType === "user").at(-1)?.text ||
    item.requesterDisplay ||
    "Client chat";

  const avatar = user?.profilePhoto ? (
    <img src={user.profilePhoto} alt="" className="avatar-img" />
  ) : (
    <span>{(displayName || user?.phone || "P")[0].toUpperCase()}</span>
  );

  if (authLoading && !adminActive) {
    return <div className="pro-shell center">Loading…</div>;
  }

  if (adminActive) {
    return (
      <AdminPanel
        api={api}
        adminKey={sessionStorage.getItem(ADMIN_KEY_STORAGE) || adminKey}
        onLogout={adminLogout}
      />
    );
  }

  if (!user) {
    return (
      <div className="pro-shell login">
        <div className="pro-brand">
          <h1>Saathi Partner</h1>
          <p>For lawyers, tarot readers, astrologers &amp; admins</p>
        </div>
        <div className="login-tabs">
          <button
            type="button"
            className={loginMode === "pro" ? "active" : ""}
            onClick={() => setLoginMode("pro")}
          >
            Professional
          </button>
          <button
            type="button"
            className={loginMode === "admin" ? "active" : ""}
            onClick={() => setLoginMode("admin")}
          >
            Admin
          </button>
        </div>
        <div className="login-card">
          {loginMode === "pro" ? (
            <>
              <input
                className="input"
                type="tel"
                placeholder="10-digit mobile"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
              {otpStage === "verify" && (
                <input
                  className="input input-otp"
                  placeholder="OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                />
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={otpStage === "request" ? requestOtp : verifyOtp}
              >
                {otpStage === "request" ? "Send OTP" : "Verify & Login"}
              </button>
            </>
          ) : (
            <>
              <input
                className="input"
                type="password"
                placeholder="Admin key"
                value={adminKey}
                onChange={e => setAdminKey(e.target.value)}
              />
              <button type="button" className="btn btn-primary" onClick={adminLogin}>
                Admin login
              </button>
            </>
          )}
          {authError && <p className="err">{authError}</p>}
          {authInfo && <p className="info">{authInfo}</p>}
          {loginMode === "pro" && (
            <button
              type="button"
              className="btn btn-ghost admin-entry-btn"
              onClick={() => setLoginMode("admin")}
            >
              Admin login →
            </button>
          )}
        </div>
      </div>
    );
  }

  if (activeChat) {
    return (
      <div className="pro-shell chat-view">
        <header className="top-bar">
          <button type="button" className="icon-btn" onClick={() => setActiveChat(null)}>
            ← Back
          </button>
          <span className="chat-title">
            {TOPIC_LABELS[activeChat.topic] || activeChat.topic} · {activeChat.status}
          </span>
          {activeChat.status === "active" && (
            <button type="button" className="icon-btn" onClick={closeChat}>
              End
            </button>
          )}
        </header>
        <div className="messages" ref={messagesContainerRef}>
          {(activeChat.messages || []).map(m => (
            <div
              key={m.id}
              className={`bubble ${m.senderType === "professional" ? "mine" : "theirs"}`}
            >
              <span className="sender">
                {m.senderType === "professional"
                  ? "You"
                  : m.senderType === "system"
                    ? "System"
                    : "Client"}
              </span>
              {m.text}
              {m.createdAt && (
                <span className="msg-time">{formatChatTime(m.createdAt)}</span>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        {activeChat.status === "active" && (
          <>
            {templates.length > 0 && (
              <div className="template-row">
                {templates.map((tpl, i) => (
                  <button
                    key={`${tpl}-${i}`}
                    type="button"
                    className="template-chip"
                    onClick={() => setChatInput(tpl)}
                  >
                    {tpl.length > 28 ? `${tpl.slice(0, 25)}…` : tpl}
                  </button>
                ))}
              </div>
            )}
          <div className="composer">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Reply to client…"
            />
            <button type="button" className="btn btn-primary" onClick={sendMessage}>
              Send
            </button>
          </div>
          </>
        )}
      </div>
    );
  }

  if (profileOpen) {
    return (
      <div className="pro-shell profile-view">
        <header className="top-bar">
          <button type="button" className="icon-btn" onClick={() => setProfileOpen(false)}>
            ← Back
          </button>
          <span>Profile</span>
          <button type="button" className="icon-btn" onClick={logout}>
            <LogOut size={18} />
          </button>
        </header>
        <div className="profile-body">
          <label className="avatar-upload">
            {profilePhoto ? (
              <img src={profilePhoto} alt="" className="avatar-lg" />
            ) : (
              <div className="avatar-lg placeholder">{avatar}</div>
            )}
            <input type="file" accept="image/*" hidden onChange={onPhotoPick} />
            <span>Change photo</span>
          </label>
          <input
            className="input"
            placeholder="Display name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Short bio (optional)"
            value={bio}
            onChange={e => setBio(e.target.value)}
          />
          <p className="meta">
            Topics: {professionalTopics.join(", ")}
          </p>
          <p className="meta">Phone: {user.phone}</p>
          <div className="template-editor">
            <div className="footer-menu-title">Quick reply templates</div>
            {templates.map((tpl, i) => (
              <div key={`${tpl}-${i}`} className="template-edit-row">
                <span>{tpl}</span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() =>
                    setTemplates(prev => prev.filter((_, idx) => idx !== i))
                  }
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <div className="add-phone-row">
              <input
                className="input"
                placeholder="New template…"
                value={templateDraft}
                onChange={e => setTemplateDraft(e.target.value)}
              />
              <button type="button" className="btn btn-ghost" onClick={addTemplate}>
                Add
              </button>
            </div>
            <button type="button" className="btn btn-ghost" onClick={saveTemplates}>
              Save templates
            </button>
          </div>
          <button type="button" className="btn btn-primary" onClick={saveProfile}>
            Save profile
          </button>
          {profileMsg && <p className="info">{profileMsg}</p>}
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  const list =
    tab === "chats" ? activeChats : tab === "new" ? waiting : past;

  return (
    <div className="pro-shell">
      {toast && (
        <div className="toast">
          <Bell size={16} /> {toast}
        </div>
      )}
      <header className="top-bar main-header">
        <div className="user-chip" onClick={() => setProfileOpen(true)}>
          <div className="avatar-sm">{avatar}</div>
          <div>
            <div className="name">{displayName || "Professional"}</div>
            <div className="sub">
              {professionalTopics.map(t => TOPIC_LABELS[t]).join(" · ")}
            </div>
          </div>
        </div>
        <button
          type="button"
          className={`status-toggle ${proOnline ? "on" : "off"}`}
          onClick={() => setProStatus(!proOnline)}
        >
          {proOnline ? "Online" : "Away"}
        </button>
        <button
          type="button"
          className="icon-btn admin-header-btn"
          onClick={() => {
            const key = sessionStorage.getItem(ADMIN_KEY_STORAGE);
            if (key) {
              setAdminKey(key);
              setAdminActive(true);
              return;
            }
            localStorage.removeItem(TOKEN_KEY);
            setToken("");
            setUser(null);
            setLoginMode("admin");
          }}
          title="Admin"
        >
          Admin
        </button>
        <button type="button" className="icon-btn" onClick={() => setProfileOpen(true)}>
          <User size={20} />
        </button>
      </header>

      <nav className="tabs">
        <button
          type="button"
          className={tab === "chats" ? "active" : ""}
          onClick={() => setTab("chats")}
        >
          <MessageCircle size={14} /> Chats
          {activeChats.length > 0 && (
            <span className="badge">{activeChats.length}</span>
          )}
        </button>
        <button
          type="button"
          className={tab === "new" ? "active" : ""}
          onClick={() => setTab("new")}
        >
          New {waiting.length > 0 && <span className="badge">{waiting.length}</span>}
        </button>
        <button
          type="button"
          className={tab === "history" ? "active" : ""}
          onClick={() => setTab("history")}
        >
          <Clock size={14} /> History
        </button>
      </nav>

      <div className="request-list">
        {tab === "chats" && (
          <p className="meta chats-hint">
            Open up to one active chat per profession (Lawyer, Tarot, Astro).
          </p>
        )}
        {list.length === 0 && (
          <p className="empty">
            {tab === "chats"
              ? "No active client chats. Accept a request from the New tab."
              : tab === "new"
                ? "No pending requests. You'll get a notification when someone needs you."
                : "No past chats in the last 30 days."}
          </p>
        )}
        {tab === "chats" &&
          list.map(item => (
            <button
              key={item.id}
              type="button"
              className="wa-chat-row"
              onClick={() => setActiveChat(item)}
            >
              <div className="wa-chat-avatar">
                {(TOPIC_LABELS[item.topic] || item.topic)[0]}
              </div>
              <div className="wa-chat-body">
                <div className="wa-chat-top">
                  <strong>{TOPIC_LABELS[item.topic] || item.topic}</strong>
                  <span className="wa-chat-time">
                    {formatChatTime(
                      item.messages?.at(-1)?.createdAt || item.createdAt
                    )}
                  </span>
                </div>
                <div className="wa-chat-preview">{getClientPreview(item)}</div>
                <div className="wa-chat-stamp">{formatChatStamp(item.createdAt)}</div>
              </div>
            </button>
          ))}
        {tab !== "chats" &&
        list.map(item => (
          <div key={item.id} className="request-card">
            <div className="request-head">
              <strong>{TOPIC_LABELS[item.topic] || item.topic}</strong>
              <span className={`status status-${item.status}`}>{item.status}</span>
            </div>
            <p className="request-stamp">{formatChatStamp(item.createdAt)}</p>
            <p className="preview">
              {item.messages?.filter(m => m.senderType === "user").at(-1)?.text ||
                item.requesterDisplay ||
                "New request"}
            </p>
            <div className="request-actions">
              {item.status === "waiting" && (
                <>
                  <button
                    type="button"
                    className="btn btn-accept"
                    onClick={() => acceptRequest(item.id)}
                  >
                    <Check size={16} /> Accept
                  </button>
                  <button
                    type="button"
                    className="btn btn-decline"
                    onClick={() => declineRequest(item.id)}
                  >
                    <X size={16} /> Decline
                  </button>
                </>
              )}
              {item.status === "active" && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveChat(item)}
                >
                  <MessageCircle size={16} /> Open chat
                </button>
              )}
              {["declined", "closed"].includes(item.status) && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setActiveChat(item)}
                >
                  View transcript
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
