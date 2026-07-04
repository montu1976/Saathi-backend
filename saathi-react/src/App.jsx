import { useEffect, useRef, useState } from "react";
import { Moon, Sun, Compass, DoorOpen } from "lucide-react";
import { getApiBase } from "./apiBase.js";
import PrivacyPolicy from "./PrivacyPolicy.jsx";
import { formatChatStamp, formatChatTime } from "./formatStamp.js";
import AiChatPanel from "./components/AiChatPanel.jsx";
import AppMainTabs from "./components/AppMainTabs.jsx";
import AuthCard from "./components/AuthCard.jsx";
import OnboardingModal from "./components/OnboardingModal.jsx";
import ProfileMenu from "./components/ProfileMenu.jsx";
import "./App.css";

function App() {
  const API_BASE = getApiBase();
  const VAPID_PUBLIC_KEY =
    import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authProvider, setAuthProvider] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStage, setOtpStage] = useState("request");
  const [token, setToken] = useState(localStorage.getItem("saathi_token") || "");
  const [user, setUser] = useState(null);
  const [professionalTopics, setProfessionalTopics] = useState([]);
  const [whatsappConfigured, setWhatsappConfigured] = useState(false);
  const [authInfo, setAuthInfo] = useState("");
  const [isGuest, setIsGuest] = useState(false);

  const [darkMode, setDarkMode] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const chatBoxRef = useRef(null);
  const supportChatEndRef = useRef(null);
  const peerChatEndRef = useRef(null);

  const [supportError, setSupportError] = useState("");
  const [supportRequest, setSupportRequest] = useState(null);
  const [supportChats, setSupportChats] = useState([]);
  const [appTab, setAppTab] = useState("ai");
  const [proListView, setProListView] = useState(true);
  const [supportInput, setSupportInput] = useState("");
  const [supportLoading, setSupportLoading] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);
  const [appUrlInfo, setAppUrlInfo] = useState(null);
  const [supportLinkHint, setSupportLinkHint] = useState("");

  const [guideStatus, setGuideStatus] = useState(null);
  const [peersOnline, setPeersOnline] = useState({ total: 0, matchable: 0 });
  const [peerSettings, setPeerSettings] = useState({
    contactOk: false,
    anonymous: false
  });
  const [showPeerConsent, setShowPeerConsent] = useState(false);
  const [peerConsentDraft, setPeerConsentDraft] = useState({
    contactOk: false,
    anonymous: true
  });
  const [peerSession, setPeerSession] = useState(null);
  const [peerChats, setPeerChats] = useState([]);
  const [onlinePeople, setOnlinePeople] = useState([]);
  const [peerListView, setPeerListView] = useState(true);
  const [peerInput, setPeerInput] = useState("");
  const [peerError, setPeerError] = useState("");

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const profileMenuRef = useRef(null);

  const guestIdKey = "saathi_guest_id";
  const guestNameKey = "saathi_guest_name";
  const guestCityKey = "saathi_guest_city";
  const aiNameKey = "saathi_ai_companion_name";
  const aiNameAskedKey = "saathi_ai_name_asked";
  const genderKey = "saathi_user_gender";
  const languageKey = "saathi_user_language";
  const prefsAskedKey = "saathi_prefs_asked";
  const supportSessionKey = "saathi_support_request_id";
  const guestId = localStorage.getItem(guestIdKey) || crypto.randomUUID();
  if (!localStorage.getItem(guestIdKey)) {
    localStorage.setItem(guestIdKey, guestId);
  }

  const [profileName, setProfileName] = useState(
    () => localStorage.getItem(guestNameKey) || ""
  );
  const [profileCity, setProfileCity] = useState(
    () => localStorage.getItem(guestCityKey) || ""
  );
  const [profileMsg, setProfileMsg] = useState("");
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [aiCompanionName, setAiCompanionName] = useState(
    () => localStorage.getItem(aiNameKey) || ""
  );
  const [showAiNamePrompt, setShowAiNamePrompt] = useState(false);
  const [aiNameDraft, setAiNameDraft] = useState("");
  const [customAiName, setCustomAiName] = useState("");
  const [userGender, setUserGender] = useState(
    () => localStorage.getItem(genderKey) || ""
  );
  const [userLanguage, setUserLanguage] = useState(
    () => localStorage.getItem(languageKey) || ""
  );

  const getAiDisplayName = () => aiCompanionName.trim() || "Saathi";

  const saveAiCompanionName = async (name) => {
    const trimmed = String(name || "").trim().slice(0, 8);
    setAiCompanionName(trimmed);
    if (trimmed) {
      localStorage.setItem(aiNameKey, trimmed);
    } else {
      localStorage.removeItem(aiNameKey);
    }
    localStorage.setItem(aiNameAskedKey, "1");
    localStorage.setItem(prefsAskedKey, "1");
    setShowAiNamePrompt(false);
    setAiNameDraft("");
    setCustomAiName("");
    const g = userGender;
    const l = userLanguage;
    if (g) localStorage.setItem(genderKey, g);
    if (l) localStorage.setItem(languageKey, l);
    try {
      if (user && token) {
        await apiRequest("/auth/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders()
          },
          body: JSON.stringify({ aiName: trimmed, gender: g, language: l })
        });
      } else if (isGuest) {
        await apiRequest("/guest/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestId, aiName: trimmed, gender: g, language: l })
        });
      }
    } catch {
      // keep local name even if sync fails
    }
  };

  const saveUserPrefs = async ({ gender, language }) => {
    const g = gender !== undefined ? gender : userGender;
    const l = language !== undefined ? language : userLanguage;
    if (gender !== undefined) {
      setUserGender(g);
      if (g) localStorage.setItem(genderKey, g);
      else localStorage.removeItem(genderKey);
    }
    if (language !== undefined) {
      setUserLanguage(l);
      if (l) localStorage.setItem(languageKey, l);
      else localStorage.removeItem(languageKey);
    }
    try {
      if (user && token) {
        await apiRequest("/auth/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders()
          },
          body: JSON.stringify({ gender: g, language: l })
        });
      } else if (isGuest) {
        await apiRequest("/guest/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestId, gender: g, language: l })
        });
      }
    } catch {
      // keep local prefs even if sync fails
    }
  };

  const maybeShowAiNamePrompt = () => {
    if (localStorage.getItem(prefsAskedKey)) return;
    setShowAiNamePrompt(true);
  };

  const handleGuideSelect = async (topic) => {
    if (!topic) return;
    setGuideOpen(false);
    await startSupportChat(topic);
  };

  useEffect(() => {
    const el = chatBoxRef.current;
    if (!el) return undefined;
    const onScroll = () => {
      const collapsed = el.scrollTop > 40;
      setToolbarCollapsed(collapsed);
      if (!collapsed) setGuideOpen(false);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [supportRequest, messages.length, user, isGuest]);

  useEffect(() => {
    const el = chatBoxRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages, loading]);

  const scrollToEnd = ref => {
    requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  };

  useEffect(() => {
    scrollToEnd(supportChatEndRef);
  }, [supportRequest?.messages?.length, supportRequest?.status]);

  useEffect(() => {
    scrollToEnd(peerChatEndRef);
  }, [peerSession?.messages?.length]);

  const renderGuideDropdown = (idSuffix = "") => (
    <select
      id={`guide-select${idSuffix}`}
      className="guide-select"
      defaultValue=""
      disabled={supportLoading}
      onChange={e => {
        const topic = e.target.value;
        e.target.value = "";
        handleGuideSelect(topic);
      }}
    >
      <option value="" disabled>Choose a guide…</option>
      <option value="lawyers">
        Lawyers
        {guideStatus?.topics?.lawyers
          ? ` (${guideStatus.topics.lawyers.online}/${guideStatus.topics.lawyers.total} online)`
          : ""}
      </option>
      <option value="tarot">
        Tarot Reader
        {guideStatus?.topics?.tarot
          ? ` (${guideStatus.topics.tarot.online}/${guideStatus.topics.tarot.total} online)`
          : ""}
      </option>
      <option value="astro">
        Astro / Kundli
        {guideStatus?.topics?.astro
          ? ` (${guideStatus.topics.astro.online}/${guideStatus.topics.astro.total} online)`
          : ""}
      </option>
    </select>
  );

  const peerActorQuery = () =>
    !token && isGuest ? `?guestId=${encodeURIComponent(guestId)}` : "";

  const loadGuideStatus = async () => {
    try {
      const data = await apiRequest("/guide/status");
      setGuideStatus(data);
      setPeersOnline({
        total: data.peersTotal || 0,
        matchable: data.peersOnline || 0
      });
    } catch {
      // optional
    }
  };

  const sendPresenceHeartbeat = async () => {
    if (!user && !isGuest) return;
    try {
      const data = await apiRequest("/presence/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          guestId: !user ? guestId : undefined,
          contactOk: peerSettings.contactOk,
          anonymous: peerSettings.anonymous,
          display: profileName.trim() || user?.displayName || undefined
        })
      });
      if (data.settings) setPeerSettings(data.settings);
      if (data.peersOnline) {
        setPeersOnline({
          total: data.peersOnline.total || 0,
          matchable: data.peersOnline.matchable || 0
        });
      }
    } catch {
      // optional
    }
  };

  const loadPeerSettings = async () => {
    if (!user && !isGuest) return;
    try {
      const data = await apiRequest(`/peer/settings${peerActorQuery()}`, {
        headers: getAuthHeaders()
      });
      if (data.settings) {
        setPeerSettings(data.settings);
        const asked = localStorage.getItem("saathi_peer_consent_asked");
        if (!asked && !data.settings.contactOk) {
          setPeerConsentDraft({
            contactOk: false,
            anonymous: true
          });
          setShowPeerConsent(true);
        }
      }
    } catch {
      // optional
    }
  };

  const savePeerConsent = async () => {
    try {
      const data = await apiRequest("/peer/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          guestId: !user ? guestId : undefined,
          contactOk: peerConsentDraft.contactOk,
          anonymous: peerConsentDraft.anonymous
        })
      });
      setPeerSettings(data.settings);
      localStorage.setItem("saathi_peer_consent_asked", "1");
      setShowPeerConsent(false);
      sendPresenceHeartbeat();
    } catch (error) {
      setPeerError(error.message);
    }
  };

  const loadPeerChats = async () => {
    if (!user && !isGuest) return [];
    try {
      const data = await apiRequest(`/peer/my-chats${peerActorQuery()}`, {
        headers: getAuthHeaders()
      });
      const sessions = data.sessions || [];
      setPeerChats(sessions);
      return sessions;
    } catch {
      setPeerChats([]);
      return [];
    }
  };

  const loadOnlinePeople = async () => {
    if (!user && !isGuest) return;
    try {
      const data = await apiRequest(`/peer/online${peerActorQuery()}`, {
        headers: getAuthHeaders()
      });
      setOnlinePeople(data.people || []);
      setPeersOnline({
        total: data.total || 0,
        matchable: data.matchable || 0
      });
    } catch {
      setOnlinePeople([]);
    }
  };

  const openPeerChat = async (sessionId) => {
    await loadPeerSessionById(sessionId);
    setAppTab("community");
    setPeerListView(false);
  };

  const leavePeerChatList = () => {
    setPeerListView(true);
    setPeerSession(null);
    setPeerInput("");
    loadPeerChats();
  };

  const getPeerPreview = (chat) => chat.preview || "Peer chat";

  const loadPeerSession = async () => {
    if (!user && !isGuest) return;
    try {
      const data = await apiRequest(`/peer/my-active${peerActorQuery()}`, {
        headers: getAuthHeaders()
      });
      setPeerSession(data.session || null);
    } catch {
      setPeerSession(null);
    }
  };

  const loadPeerSessionById = async (sessionId) => {
    const data = await apiRequest(
      `/peer/session/${sessionId}${peerActorQuery()}`,
      { headers: getAuthHeaders() }
    );
    setPeerSession(data.session);
    return data.session;
  };

  const sendPeerMessage = async () => {
    if (!peerSession?.id || !peerInput.trim()) return;
    const text = peerInput;
    setPeerInput("");
    try {
      const data = await apiRequest(`/peer/session/${peerSession.id}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({ text, guestId: !user ? guestId : undefined })
      });
      setPeerSession(data.session);
    } catch (error) {
      setPeerError(error.message);
      setPeerInput(text);
    }
  };

  const leavePeerChat = async () => {
    if (!peerSession?.id) return;
    try {
      await apiRequest(`/peer/session/${peerSession.id}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({ guestId: !user ? guestId : undefined })
      });
    } catch {
      // no-op
    }
    setPeerSession(null);
    setPeerInput("");
    setPeerListView(true);
    loadPeerChats();
  };

  const isOwnPeerMessage = (msg) => {
    if (!peerSession) return false;
    const isA =
      (user && peerSession.participantA.type === "user" && peerSession.participantA.id === user.id) ||
      (!user && peerSession.participantA.type === "guest" && peerSession.participantA.id === guestId);
    return (isA && msg.senderType === "a") || (!isA && msg.senderType === "b");
  };

  const loadSupportChats = async () => {
    if (!user && !isGuest) return [];
    try {
      const data = await apiRequest(`/support/my-chats${peerActorQuery()}`, {
        headers: getAuthHeaders()
      });
      const chats = data.requests || [];
      setSupportChats(chats);
      if (supportRequest?.id) {
        const updated = chats.find(c => c.id === supportRequest.id);
        if (updated) setSupportRequest(updated);
      }
      return chats;
    } catch {
      setSupportChats([]);
      return [];
    }
  };

  const openSupportChat = async (requestId) => {
    await loadSupportRequestById(requestId);
    setAppTab("professional");
    setProListView(false);
    sessionStorage.setItem(supportSessionKey, requestId);
  };

  const leaveProChatList = () => {
    setProListView(true);
    setSupportRequest(null);
    setSupportInput("");
    sessionStorage.removeItem(supportSessionKey);
  };

  const getSupportPreview = (chat) => {
    const last = chat.messages?.filter(m => m.senderType !== "system").at(-1);
    return last?.text || chat.requesterDisplay || "Professional chat";
  };

  const TOPIC_LABELS = { lawyers: "Lawyer", tarot: "Tarot", astro: "Astro" };

  const hasProfessionalDeepLink = () => {
    const fromUrl = getDeepLinkFromUrl();
    if (fromUrl?.action === "accept") return true;
    try {
      const raw = sessionStorage.getItem("saathi_pending_deeplink");
      if (!raw) return false;
      return JSON.parse(raw).action === "accept";
    } catch {
      return false;
    }
  };

  const phoneLast10 = (value) =>
    String(value || "").replace(/\D/g, "").slice(-10);

  const isPhoneMatch = (a, b) =>
    Boolean(phoneLast10(a) && phoneLast10(a) === phoneLast10(b));

  const isLocalAppUrl = (url) =>
    /localhost|127\.0\.0\.1/i.test(String(url || ""));

  const getAuthHeaders = (overrideToken = "") => {
    const activeToken =
      overrideToken || token || localStorage.getItem("saathi_token") || "";
    return activeToken ? { Authorization: `Bearer ${activeToken}` } : {};
  };

  const authHeaders = () => getAuthHeaders();

  const getSessionLabel = () => {
    if (isGuest) return "Guest";
    if (user?.email) return "Email";
    if (user?.phone) return "WhatsApp";
    return "User";
  };

  const getDisplayName = () => {
    if (user?.displayName) return user.displayName;
    if (isGuest && profileName) return profileName;
    if (isGuest) return "Guest";
    if (user?.email) return user.email;
    if (user?.phone) return user.phone;
    return "User";
  };

  const getAvatarInitial = () => {
    const name = user?.displayName || profileName;
    if (name) return name[0].toUpperCase();
    if (isGuest) return "G";
    if (user?.email) return user.email[0].toUpperCase();
    if (user?.phone) return "W";
    return "?";
  };

  const handleSaveProfile = async () => {
    setProfileMsg("");
    setPasswordError("");
    try {
      if (user && token) {
        const data = await apiRequest("/auth/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders()
          },
          body: JSON.stringify({
            displayName: profileName.trim(),
            city: profileCity.trim()
          })
        });
        setUser(data.user);
        setProfileMsg("Profile saved.");
      } else if (isGuest) {
        localStorage.setItem(guestNameKey, profileName.trim());
        localStorage.setItem(guestCityKey, profileCity.trim());
        await apiRequest("/guest/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestId,
            displayName: profileName.trim(),
            city: profileCity.trim()
          })
        });
        setProfileMsg("Profile saved.");
      }
    } catch (error) {
      setPasswordError(error.message);
    }
  };

  const loadChatSessions = async () => {
    const activeToken = token || localStorage.getItem("saathi_token") || "";
    if (!activeToken) return;
    try {
      const data = await apiRequest("/chat/sessions", {
        headers: getAuthHeaders(activeToken)
      });
      setChatSessions(data.sessions || []);
    } catch {
      setChatSessions([]);
    }
  };

  const loadChatSession = async (chatId) => {
    if (!user || !token) return;
    try {
      const data = await apiRequest(`/chat/sessions/${chatId}`, {
        headers: authHeaders()
      });
      setActiveChatId(data.session.id);
      setMessages(data.session.messages || []);
      setProfileMenuOpen(false);
    } catch (error) {
      setPasswordError(error.message);
    }
  };

  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setProfileMenuOpen(false);
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordMsg("");
    if (!currentPassword || !newPassword) {
      setPasswordError("Enter current and new password.");
      return;
    }
    try {
      await apiRequest("/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      setPasswordMsg("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setShowPasswordForm(false);
    } catch (error) {
      setPasswordError(error.message);
    }
  };

  const apiRequest = async (path, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, options);
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (isJson) {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Request failed.");
      }
      return data;
    }

    const text = await response.text();
    if (!response.ok) {
      throw new Error(
        `Server error (${response.status}): ${text.slice(0, 120)}`
      );
    }
    throw new Error("Expected JSON response from server.");
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
  };

  const getDeepLinkFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("open") !== "support") return null;
    const requestId = params.get("requestId");
    if (!requestId) return null;
    return {
      requestId,
      action: params.get("action") || "",
      guestId: params.get("guestId") || ""
    };
  };

  const clearDeepLinkFromUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("open");
    url.searchParams.delete("requestId");
    url.searchParams.delete("action");
    url.searchParams.delete("guestId");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", next);
  };

  const loadSupportRequestById = async (
    requestId,
    linkGuestId = "",
    authToken = ""
  ) => {
    const activeGuestId = linkGuestId || guestId;
    const activeToken = authToken || token || localStorage.getItem("saathi_token") || "";
    const query = !activeToken ? `?guestId=${encodeURIComponent(activeGuestId)}` : "";
    const data = await apiRequest(`/support/request/${requestId}${query}`, {
      headers: getAuthHeaders(activeToken)
    });
    setSupportRequest(data.request);
    sessionStorage.setItem(supportSessionKey, data.request.id);
    return data.request;
  };

  const processSupportDeepLink = async (
    link,
    { loggedInUser = user, authToken = "" } = {}
  ) => {
    if (!link?.requestId) return false;

    if (!loggedInUser && link.action === "accept") {
      sessionStorage.setItem("saathi_pending_deeplink", JSON.stringify(link));
      setAuthProvider("whatsapp");
      setAuthInfo(
        "Professional link: log in with your assigned WhatsApp number. Do not use Guest."
      );
      return false;
    }

    if (!loggedInUser && !isGuest) {
      sessionStorage.setItem("saathi_pending_deeplink", JSON.stringify(link));
      setAuthInfo(
        link.guestId
          ? "Tap Continue as Guest to open your support chat."
          : "Please log in to open this chat."
      );
      return false;
    }

    if (!loggedInUser && isGuest && link.guestId && link.guestId !== guestId) {
      localStorage.setItem(guestIdKey, link.guestId);
      window.location.reload();
      return false;
    }

    sessionStorage.removeItem("saathi_pending_deeplink");

    let request = await loadSupportRequestById(
      link.requestId,
      link.guestId,
      authToken
    );

    const isProForRequest = Boolean(
      loggedInUser?.phone &&
      isPhoneMatch(loggedInUser.phone, request.assignedPhone)
    );

    if (isProForRequest) {
      const proUrl = new URL("/pro/", window.location.origin);
      proUrl.searchParams.set("open", "support");
      proUrl.searchParams.set("requestId", link.requestId);
      if (request.status === "waiting" && link.action === "accept") {
        proUrl.searchParams.set("action", "accept");
      }
      window.location.href = proUrl.toString();
      return true;
    }

    setSupportError("");
    clearDeepLinkFromUrl();
    setAuthInfo(
      "Your support chat is open."
    );
    return true;
  };

  useEffect(() => {
    const loadWhatsAppStatus = async () => {
      try {
        const data = await apiRequest("/whatsapp/status");
        setWhatsappConfigured(Boolean(data.configured));
        if (data.configured) {
          setAuthProvider("whatsapp");
        }
      } catch {
        setWhatsappConfigured(false);
      }
    };
    const loadHealth = async () => {
      try {
        const data = await apiRequest("/health");
        const isLocalFix =
          data.version === "2026-05-26-support-v3" ||
          data.version === "2026-05-26-support-v2";
        setServerInfo(
          isLocalFix
            ? data
            : { ...data, version: "OLD-REMOTE-SERVER", ok: false }
        );
      } catch {
        setServerInfo({ version: "wrong-server", ok: false });
      }
    };
    const loadAppUrl = async () => {
      try {
        const data = await apiRequest("/config/app-url");
        setAppUrlInfo(data);
      } catch {
        setAppUrlInfo(null);
      }
    };
    loadWhatsAppStatus();
    loadHealth();
    loadAppUrl();
    loadGuideStatus();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user && !isGuest) return undefined;
    loadPeerSettings();
    loadPeerSession();
    loadSupportChats();
    loadPeerChats();
    loadOnlinePeople();
    sendPresenceHeartbeat();
    const guideInterval = setInterval(loadGuideStatus, 15000);
    const heartbeat = setInterval(sendPresenceHeartbeat, 25000);
    const supportInterval = setInterval(loadSupportChats, 4000);
    const communityInterval = setInterval(() => {
      loadPeerChats();
      loadOnlinePeople();
    }, 5000);
    return () => {
      clearInterval(guideInterval);
      clearInterval(heartbeat);
      clearInterval(supportInterval);
      clearInterval(communityInterval);
    };
  }, [authLoading, user, isGuest, token]);

  useEffect(() => {
    if (authLoading) return;
    if (!user && !isGuest) return;
    maybeShowAiNamePrompt();
  }, [authLoading, user, isGuest]);

  useEffect(() => {
    if (!peerSession?.id) return undefined;
    const poll = setInterval(async () => {
      try {
        await loadPeerSessionById(peerSession.id);
      } catch {
        // ignore
      }
    }, 2500);
    return () => clearInterval(poll);
  }, [peerSession?.id]);

  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const data = await apiRequest("/auth/me", {
          headers: authHeaders()
        });
        setUser(data.user);
        setProfessionalTopics(data.professionalTopics || []);
        setWhatsappConfigured(Boolean(data.whatsappConfigured));
        setHasPassword(Boolean(data.hasPassword));
        setProfileName(data.user.displayName || "");
        setProfileCity(data.user.city || "");
        if (data.user.aiName) {
          setAiCompanionName(data.user.aiName);
          localStorage.setItem(aiNameKey, data.user.aiName);
        }
        if (data.user.gender) {
          setUserGender(data.user.gender);
          localStorage.setItem(genderKey, data.user.gender);
        }
        if (data.user.language) {
          setUserLanguage(data.user.language);
          localStorage.setItem(languageKey, data.user.language);
        }
      } catch {
        localStorage.removeItem("saathi_token");
        setToken("");
        setUser(null);
        setIsGuest(false);
      } finally {
        setAuthLoading(false);
      }
    };
    restoreSession();
  }, [token]);

  useEffect(() => {
    if (!user || !token) {
      setChatSessions([]);
      setActiveChatId(null);
      return;
    }
    loadChatSessions();
  }, [user?.id, token]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener("mousedown", onDocClick);
    }
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [profileMenuOpen]);

  useEffect(() => {
    if (!supportRequest?.id) return undefined;
    const interval = setInterval(async () => {
      try {
        const activeToken =
          token || localStorage.getItem("saathi_token") || "";
        const query =
          !activeToken ? `?guestId=${encodeURIComponent(guestId)}` : "";
        const data = await apiRequest(
          `/support/request/${supportRequest.id}${query}`,
          { headers: getAuthHeaders(activeToken) }
        );
        setSupportRequest(data.request);
      } catch {
        // ignore polling errors
      }
    }, supportRequest?.status === "waiting" ? 1500 : 3000);
    return () => clearInterval(interval);
  }, [supportRequest?.id, supportRequest?.status, token, guestId]);

  useEffect(() => {
    const subscribeToPush = async () => {
      if (!user || !token || !VAPID_PUBLIC_KEY) return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          });
        }

        await apiRequest("/push/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders()
          },
          body: JSON.stringify({ subscription })
        });
      } catch {
        // keep app working even if push setup fails
      }
    };

    subscribeToPush();
  }, [user, token, VAPID_PUBLIC_KEY]);

  useEffect(() => {
    const handleDeepLink = async () => {
      if (authLoading) return;

      const fromUrl = getDeepLinkFromUrl();
      let pending = null;
      try {
        const pendingRaw = sessionStorage.getItem("saathi_pending_deeplink");
        pending = pendingRaw ? JSON.parse(pendingRaw) : null;
      } catch {
        sessionStorage.removeItem("saathi_pending_deeplink");
      }
      const link = fromUrl || pending;
      if (!link?.requestId) return;

      try {
        await processSupportDeepLink(link);
      } catch {
        clearDeepLinkFromUrl();
        setSupportError(
          "Could not open this chat link. Professionals: log in with your assigned WhatsApp number (not Guest)."
        );
      }
    };

    handleDeepLink();
  }, [authLoading, user, isGuest, token, professionalTopics]);

  useEffect(() => {
    if (authLoading) return;
    if (!user && !isGuest) return;
    if (supportRequest?.id) return;
    if (getDeepLinkFromUrl()?.requestId) return;

    (async () => {
      try {
        const activeToken =
          token || localStorage.getItem("saathi_token") || "";
        const query =
          !activeToken && isGuest
            ? `?guestId=${encodeURIComponent(guestId)}`
            : "";
        const data = await apiRequest(`/support/my-chats${query}`, {
          headers: getAuthHeaders(activeToken)
        });
        const chats = data.requests || [];
        setSupportChats(chats);
        if (chats.length > 0) {
          const pick = chats[0];
          setSupportRequest(pick);
          sessionStorage.setItem(supportSessionKey, pick.id);
          return;
        }
      } catch {
        // fall through to saved id
      }

      const savedId = sessionStorage.getItem(supportSessionKey);
      if (!savedId) return;
      try {
        await loadSupportRequestById(savedId);
      } catch {
        sessionStorage.removeItem(supportSessionKey);
      }
    })();
  }, [authLoading, user, isGuest, token, guestId]);

  const handleAuth = async () => {
    if (authProvider !== "email") return;
    if (!email.trim() || !password.trim()) {
      setAuthError("Please enter email and password.");
      return;
    }
    setAuthError("");
    setAuthLoading(true);
    try {
      const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
      const data = await apiRequest(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem("saathi_token", data.token);
      setToken(data.token);
      setUser(data.user);
      setProfessionalTopics([]);
      setIsGuest(false);
      setHasPassword(true);
      setMessages([]);
      setActiveChatId(null);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const requestWhatsAppOtp = async () => {
    if (!phone.trim()) {
      setAuthError("Please enter your phone number.");
      return;
    }
    setAuthError("");
    setAuthInfo("");
    setAuthLoading(true);
    try {
      const data = await apiRequest("/auth/whatsapp/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      setOtpStage("verify");
      setAuthInfo(
        data.message ||
          (data.dev
            ? "OTP is in your backend terminal window (look for [DEV])."
            : "If OTP is not on WhatsApp: you must JOIN Twilio sandbox first (send join code to Twilio number from your phone). Also check backend terminal for [DEV FALLBACK] code.")
      );
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const finishPhoneLogin = async (data) => {
    localStorage.setItem("saathi_token", data.token);
    setToken(data.token);
    const me = await apiRequest("/auth/me", {
      headers: { Authorization: `Bearer ${data.token}` }
    });
    setUser(me.user);
    setProfessionalTopics(me.professionalTopics || []);
    setWhatsappConfigured(Boolean(me.whatsappConfigured));
    setHasPassword(Boolean(me.hasPassword));
    setProfileName(me.user.displayName || "");
    setProfileCity(me.user.city || "");
    setIsGuest(false);
    setMessages([]);
    setActiveChatId(null);
    setOtpStage("request");
    setOtp("");

    let pending = null;
    try {
      const pendingRaw = sessionStorage.getItem("saathi_pending_deeplink");
      pending = pendingRaw ? JSON.parse(pendingRaw) : null;
    } catch {
      sessionStorage.removeItem("saathi_pending_deeplink");
    }
    if (pending?.requestId) {
      await processSupportDeepLink(pending, {
        loggedInUser: me.user,
        authToken: data.token
      });
    } else {
      setAuthInfo("Logged in successfully.");
    }
    await refreshInbox();
  };

  const verifyWhatsAppOtp = async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const data = await apiRequest("/auth/whatsapp/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp })
      });
      await finishPhoneLogin(data);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await apiRequest("/auth/logout", {
          method: "POST",
          headers: authHeaders()
        });
      }
    } catch {
      // no-op
    }
    localStorage.removeItem("saathi_token");
    setToken("");
    setUser(null);
    setProfessionalTopics([]);
    setIsGuest(false);
    setMessages([]);
    setActiveChatId(null);
    setChatSessions([]);
    setSupportRequest(null);
    setProfileMenuOpen(false);
  };

  const continueAsGuest = () => {
    if (hasProfessionalDeepLink()) {
      setAuthError(
        "This link is for a professional. Log in with WhatsApp using your assigned number."
      );
      return;
    }
    setAuthError("");
    setToken("");
    setUser(null);
    setIsGuest(true);
    setMessages([]);
    setActiveChatId(null);
    maybeShowAiNamePrompt();
  };

  const exitToMainScreen = async () => {
    setProfileMenuOpen(false);
    setSupportRequest(null);
    setMessages([]);
    setActiveChatId(null);
    sessionStorage.removeItem(supportSessionKey);
    if (user && token) {
      await handleLogout();
    } else {
      setIsGuest(false);
    }
  };

  const sendMessage = async (overrideText) => {
    const currentInput = String(overrideText ?? input).trim();
    if (!currentInput) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: currentInput }]);
    setLoading(true);
    try {
      const data = await apiRequest("/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          message: currentInput,
          chatId: activeChatId || undefined,
          guestId: !user ? guestId : undefined,
          guestName: profileName.trim() || user?.displayName || undefined,
          guestCity: profileCity.trim() || user?.city || undefined,
          aiName: aiCompanionName || undefined,
          gender: userGender || undefined,
          language: userLanguage || undefined
        })
      });
      if (data.chatId) {
        setActiveChatId(data.chatId);
      }
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      if (data.peerMatch?.sessionId) {
        await loadPeerSessionById(data.peerMatch.sessionId);
        setAppTab("community");
        setPeerListView(false);
        await loadPeerChats();
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: `Someone online may relate (${(data.peerMatch.matchedTopics || []).join(", ") || "similar topic"}). Open the Community tab to say hi — be kind and respectful.`
          }
        ]);
      }
      if (user) {
        loadChatSessions();
      }
    } catch (error) {
      const hint =
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("NetworkError")
          ? " Is backend running? Open PowerShell → cd Saathi → node server.js"
          : "";
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ ${error.message || "Connection error"}${hint}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startSupportChat = async (topic) => {
    if (user?.phone && professionalTopics.includes(topic)) {
      setSupportError(
        "You are registered as a Saathi professional. Open Saathi Partner at /pro to accept client requests."
      );
      return;
    }
    setSupportError("");
    setSupportLoading(true);
    try {
      const data = await apiRequest("/support/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({ topic, guestId })
      });
      setSupportRequest(data.request);
      sessionStorage.setItem(supportSessionKey, data.request.id);
      setAppTab("professional");
      setProListView(false);
      await loadSupportChats();
      if (data.links?.appBase) {
        setSupportLinkHint(
          data.request.status === "waiting"
            ? `Stay on this page. Professional will reply here. Phone link base: ${data.links.appBase}`
            : ""
        );
      }
      clearDeepLinkFromUrl();
    } catch (error) {
      setSupportError(error.message);
    } finally {
      setSupportLoading(false);
    }
  };

  const getOpenInSaathiLink = () => {
    if (!supportRequest?.id) return "";
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("open", "support");
    url.searchParams.set("requestId", supportRequest.id);
    if (!token) {
      url.searchParams.set("guestId", guestId);
    }
    if (
      user?.phone &&
      professionalTopics.includes(supportRequest.topic) &&
      supportRequest.status === "waiting"
    ) {
      url.searchParams.set("action", "accept");
    }
    return url.toString();
  };

  const sendSupportMessage = async () => {
    if (!supportRequest?.id || !supportInput.trim()) return;
    if (supportRequest.status === "declined" || supportRequest.status === "closed") {
      return;
    }
    const text = supportInput;
    setSupportInput("");
    try {
      const data = await apiRequest(`/support/request/${supportRequest.id}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({ text, guestId })
      });
      if (data.request) {
        setSupportRequest(data.request);
      } else {
        await loadSupportRequestById(supportRequest.id);
      }
    } catch (error) {
      setSupportError(error.message);
      setSupportInput(text);
    }
  };

  const isAssignedProfessional = Boolean(
    user?.phone &&
    supportRequest &&
    isPhoneMatch(user.phone, supportRequest.assignedPhone)
  );

  const getSupportMessageLabel = (msg) => {
    if (msg.senderType === "system") return "System";
    if (isAssignedProfessional) {
      if (msg.senderType === "professional") return "You";
      return "Client";
    }
    if (msg.senderType === "professional") return "Professional";
    return "You";
  };

  const isOwnSupportMessage = (msg) =>
    isAssignedProfessional
      ? msg.senderType === "professional"
      : msg.senderType === "user";

  const closeSupportChat = () => {
    setSupportRequest(null);
    setSupportInput("");
    setSupportError("");
    setProListView(true);
    sessionStorage.removeItem(supportSessionKey);
    loadSupportChats();
  };

  const supportChatEnded =
    supportRequest?.status === "declined" || supportRequest?.status === "closed";

  return (
    <div className={darkMode ? "dark app" : "app"}>
      <div
        className={`chat-container ${!authLoading && !user && !isGuest ? "login-screen" : ""}`}
      >
        <header className={`app-header ${!user && !isGuest ? "app-header-compact" : ""}`}>
          {(user || isGuest) && (
            <div className="profile-menu-wrap" ref={profileMenuRef}>
              <button
                type="button"
                className="session-label session-menu-trigger"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                aria-expanded={profileMenuOpen}
              >
                {getSessionLabel()}
              </button>
              {profileMenuOpen && (
                <ProfileMenu
                  user={user}
                  isGuest={isGuest}
                  guestId={guestId}
                  getDisplayName={getDisplayName}
                  getSessionLabel={getSessionLabel}
                  getAvatarInitial={getAvatarInitial}
                  getAiDisplayName={getAiDisplayName}
                  professionalTopics={professionalTopics}
                  profileName={profileName}
                  profileCity={profileCity}
                  profileMsg={profileMsg}
                  aiCompanionName={aiCompanionName}
                  customAiName={customAiName}
                  userGender={userGender}
                  userLanguage={userLanguage}
                  peerSettings={peerSettings}
                  peerError={peerError}
                  hasPassword={hasPassword}
                  showPasswordForm={showPasswordForm}
                  currentPassword={currentPassword}
                  newPassword={newPassword}
                  passwordError={passwordError}
                  passwordMsg={passwordMsg}
                  chatSessions={chatSessions}
                  activeChatId={activeChatId}
                  onProfileNameChange={setProfileName}
                  onProfileCityChange={setProfileCity}
                  onSaveProfile={handleSaveProfile}
                  onSaveAiName={saveAiCompanionName}
                  onResetAiName={() => saveAiCompanionName("")}
                  onCustomAiNameChange={setCustomAiName}
                  onSaveUserPrefs={saveUserPrefs}
                  onPeerSettingsUpdate={setPeerSettings}
                  onPeerError={setPeerError}
                  onShowPasswordForm={() => {
                    setShowPasswordForm(true);
                    setPasswordError("");
                    setPasswordMsg("");
                  }}
                  onHidePasswordForm={() => setShowPasswordForm(false)}
                  onCurrentPasswordChange={setCurrentPassword}
                  onNewPasswordChange={setNewPassword}
                  onChangePassword={handleChangePassword}
                  onStartNewChat={startNewChat}
                  onLoadChatSession={loadChatSession}
                  onLogin={() => {
                    setIsGuest(false);
                    setProfileMenuOpen(false);
                  }}
                  onLogout={handleLogout}
                  apiRequest={apiRequest}
                  getAuthHeaders={getAuthHeaders}
                />
              )}
            </div>
          )}
          <div className="header-actions">
            {(user || isGuest) && (
              <button
                type="button"
                className="exit-toggle"
                onClick={exitToMainScreen}
                aria-label="Exit to main screen"
                title="Exit"
              >
                <DoorOpen size={16} />
              </button>
            )}
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          <div className="logo-wrap">
            <img src="/saathi-logo.svg" alt="" className="app-logo" width={72} height={72} />
            <div className="title-row">
              <h1>Saathi</h1>
            </div>
            <p className="subtitle">Your Friend, Your Guide</p>
          </div>
        </header>

        <div className="app-body">
          {authLoading && (
            <div className="loading-pulse">Loading your space…</div>
          )}

          {!authLoading && !user && !isGuest && (
            showPrivacy ? (
              <PrivacyPolicy onBack={() => setShowPrivacy(false)} />
            ) : (
            <AuthCard
              authProvider={authProvider}
              authMode={authMode}
              email={email}
              password={password}
              phone={phone}
              otp={otp}
              otpStage={otpStage}
              whatsappConfigured={whatsappConfigured}
              authError={authError}
              authInfo={authInfo}
              hasProfessionalDeepLink={hasProfessionalDeepLink()}
              onProviderChange={setAuthProvider}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onPhoneChange={setPhone}
              onOtpChange={setOtp}
              onAuth={handleAuth}
              onToggleAuthMode={() =>
                setAuthMode(authMode === "login" ? "register" : "login")
              }
              onRequestOtp={requestWhatsAppOtp}
              onVerifyOtp={verifyWhatsAppOtp}
              onGuest={continueAsGuest}
              onPrivacy={() => setShowPrivacy(true)}
            />
            )
          )}

          {!authLoading && (user || isGuest) && (
            <div
              className={`chat-layout ${toolbarCollapsed ? "scrolled" : ""} ${guideOpen ? "guide-open" : ""}`}
            >
              {showAiNamePrompt && (
                <OnboardingModal
                  aiNameDraft={aiNameDraft}
                  customAiName={customAiName}
                  userGender={userGender}
                  userLanguage={userLanguage}
                  onAiNameDraftChange={setAiNameDraft}
                  onCustomAiNameChange={setCustomAiName}
                  onGenderChange={setUserGender}
                  onLanguageChange={setUserLanguage}
                  onSave={() => saveAiCompanionName(aiNameDraft || customAiName)}
                  onSkip={() => saveAiCompanionName("")}
                />
              )}

              {showPeerConsent && (
                <div className="peer-consent-overlay">
                  <div className="peer-consent-card">
                    <h3>Connect with others?</h3>
                    <p>
                      Saathi can match you with other online users who may be going
                      through something similar (e.g. job stress, relationships).
                      You can change this anytime in your profile menu.
                    </p>
                    <label className="peer-check">
                      <input
                        type="checkbox"
                        checked={peerConsentDraft.contactOk}
                        onChange={e =>
                          setPeerConsentDraft(prev => ({
                            ...prev,
                            contactOk: e.target.checked
                          }))
                        }
                      />
                      I&apos;m OK being contacted by other users
                    </label>
                    <label className="peer-check">
                      <input
                        type="checkbox"
                        checked={peerConsentDraft.anonymous}
                        onChange={e =>
                          setPeerConsentDraft(prev => ({
                            ...prev,
                            anonymous: e.target.checked
                          }))
                        }
                      />
                      Stay anonymous (no real name shown)
                    </label>
                    <div className="peer-consent-actions">
                      <button type="button" className="btn-primary btn-compact" onClick={savePeerConsent}>
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn-ghost btn-compact"
                        onClick={() => {
                          localStorage.setItem("saathi_peer_consent_asked", "1");
                          setShowPeerConsent(false);
                        }}
                      >
                        Not now
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <AppMainTabs
                appTab={appTab}
                supportCount={supportChats.length}
                activePeerCount={peerChats.filter(c => c.status === "active").length}
                onAiTab={() => setAppTab("ai")}
                onProfessionalTab={() => {
                  setAppTab("professional");
                  loadSupportChats();
                }}
                onCommunityTab={() => {
                  setAppTab("community");
                  loadPeerChats();
                  loadOnlinePeople();
                }}
              />

              {appTab === "ai" && (
                <AiChatPanel
                  messages={messages}
                  loading={loading}
                  input={input}
                  onInputChange={e => setInput(e.target.value)}
                  onSend={() => sendMessage()}
                  onStarterSelect={starter => sendMessage(starter)}
                  aiDisplayName={getAiDisplayName()}
                  chatBoxRef={chatBoxRef}
                />
              )}

              {appTab === "professional" && (
                <div className="pro-tab-panel">
                  {user?.phone && professionalTopics.length > 0 && (
                    <div className="support-box pro-inbox-wrap">
                      <p className="mode-info">
                        You are a professional — use{" "}
                        <a href="/pro/" className="pro-link">Saathi Partner</a> for client chats.
                      </p>
                    </div>
                  )}

                  {proListView ? (
                    <>
                      <div className="guide-dropdown-wrap pro-guide-row">
                        <Compass size={18} aria-hidden />
                        <span className="guide-label">Start new</span>
                        {renderGuideDropdown("-pro")}
                      </div>
                      {supportError && <div className="auth-error">{supportError}</div>}
                      <div className="wa-chat-list">
                        {supportChats.length === 0 && (
                          <p className="mode-info wa-empty">
                            No professional chats yet. Use Guide above to connect with a Lawyer, Tarot reader, or Astrologer.
                          </p>
                        )}
                        {supportChats.map(chat => (
                          <button
                            key={chat.id}
                            type="button"
                            className="wa-chat-row"
                            onClick={() => openSupportChat(chat.id)}
                          >
                            <div className="wa-chat-avatar">
                              {(TOPIC_LABELS[chat.topic] || chat.topic)[0]}
                            </div>
                            <div className="wa-chat-body">
                              <div className="wa-chat-top">
                                <strong>{TOPIC_LABELS[chat.topic] || chat.topic}</strong>
                                <span className="wa-chat-time">
                                  {formatChatTime(
                                    chat.messages?.at(-1)?.createdAt || chat.createdAt
                                  )}
                                </span>
                              </div>
                              <div className="wa-chat-preview">
                                <span className={`wa-status wa-status-${chat.status}`}>
                                  {chat.status}
                                </span>
                                {getSupportPreview(chat)}
                              </div>
                              <div className="wa-chat-stamp">
                                {formatChatStamp(chat.createdAt)}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : supportRequest ? (
                    <div className="support-box">
                      <div className="support-active-banner">
                        {supportRequest.status === "waiting"
                          ? "Waiting for a professional to join…"
                          : supportRequest.status === "declined"
                            ? "The professional is busy at the moment. Please connect later."
                            : supportRequest.status === "closed"
                              ? "This professional chat has ended."
                              : "Connected to your professional."}
                      </div>
                      <div className="support-title">
                        <button type="button" className="btn-ghost btn-compact" onClick={leaveProChatList}>
                          ← Chats
                        </button>
                        {TOPIC_LABELS[supportRequest.topic] || supportRequest.topic}{" "}
                        ({supportRequest.status})
                      </div>
                      <p className="mode-info chat-stamp-line">
                        Requested {formatChatStamp(supportRequest.createdAt)}
                      </p>
                      {supportError && <div className="auth-error">{supportError}</div>}
                      <div className="chat-box chat-box-scroll">
                        {(supportRequest.messages || []).map(msg => (
                          <div
                            key={msg.id}
                            className={`msg-row ${isOwnSupportMessage(msg) ? "msg-row-user" : "msg-row-ai"}`}
                          >
                            <div className="msg-bubble">
                              <span className="msg-sender">{getSupportMessageLabel(msg)}</span>
                              <span className="msg-text">{msg.text}</span>
                              {msg.createdAt && (
                                <span className="msg-time">{formatChatTime(msg.createdAt)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                        <div ref={supportChatEndRef} />
                      </div>
                      <div className="input-area">
                        {!supportChatEnded && (
                          <>
                            <input
                              value={supportInput}
                              onChange={e => setSupportInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter") sendSupportMessage();
                              }}
                              placeholder="Message the professional…"
                            />
                            <button type="button" className="btn-send" onClick={sendSupportMessage} aria-label="Send">
                              <SendHorizonal size={20} />
                            </button>
                          </>
                        )}
                      </div>
                      <button type="button" className="btn-ghost" onClick={closeSupportChat}>
                        End chat
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

              {appTab === "community" && (
                <div className="pro-tab-panel community-tab">
                  {peerListView ? (
                    <>
                      <div className="community-online-panel">
                        <div className="community-online-head">
                          <strong>Online now</strong>
                          <span className="online-badge">
                            {peersOnline.matchable} open to chat · {peersOnline.total} total
                          </span>
                        </div>
                        {!peerSettings.contactOk && (
                          <p className="mode-info">
                            Turn on &quot;OK to be contacted&quot; in your profile menu to get matched with others.
                          </p>
                        )}
                        <div className="online-people-list">
                          {onlinePeople.length === 0 && (
                            <p className="mode-info wa-empty">No one else online right now.</p>
                          )}
                          {onlinePeople.map((person, i) => (
                            <div key={`${person.label}-${i}`} className="online-person-row">
                              <div className="wa-chat-avatar community-avatar">
                                {person.label.replace(/[^A-Za-z0-9#]/g, "").slice(-1) || "?"}
                              </div>
                              <div className="wa-chat-body">
                                <div className="wa-chat-top">
                                  <strong>{person.label}</strong>
                                  <span
                                    className={`online-pill ${person.openToChat ? "open" : "private"}`}
                                  >
                                    {person.openToChat ? "Open" : "Private"}
                                  </span>
                                </div>
                                {person.topics?.length > 0 && (
                                  <div className="online-topics">
                                    {person.topics.join(" · ")}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="community-chats-head">
                        <strong>Your chats</strong>
                      </div>
                      {peerError && <div className="auth-error">{peerError}</div>}
                      <div className="wa-chat-list">
                        {peerChats.length === 0 && (
                          <p className="mode-info wa-empty">
                            No peer chats yet. Chat with Saathi AI about what you&apos;re going through — we may match you with someone similar when you&apos;re online.
                          </p>
                        )}
                        {peerChats.map(chat => (
                          <button
                            key={chat.id}
                            type="button"
                            className="wa-chat-row"
                            onClick={() => openPeerChat(chat.id)}
                          >
                            <div className="wa-chat-avatar community-avatar">
                              {(chat.partnerDisplay || "S")[0]}
                            </div>
                            <div className="wa-chat-body">
                              <div className="wa-chat-top">
                                <strong>{chat.partnerDisplay}</strong>
                                <span className="wa-chat-time">
                                  {formatChatTime(chat.lastAt || chat.createdAt)}
                                </span>
                              </div>
                              <div className="wa-chat-preview">
                                <span className={`wa-status wa-status-${chat.status}`}>
                                  {chat.status}
                                </span>
                                {getPeerPreview(chat)}
                              </div>
                              {(chat.matchedKeywords || []).length > 0 && (
                                <div className="online-topics">
                                  {chat.matchedKeywords.join(" · ")}
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : peerSession ? (
                    <div className="support-box peer-box">
                      <div className="support-active-banner">
                        Chat with {peerSession.partnerDisplay || "someone online"} — be kind.
                        Saathi is not responsible for user-to-user messages.
                      </div>
                      <div className="support-title">
                        <button type="button" className="btn-ghost btn-compact" onClick={leavePeerChatList}>
                          ← Chats
                        </button>
                        {peerSession.partnerDisplay}
                      </div>
                      {peerError && <div className="auth-error">{peerError}</div>}
                      <div className="chat-box chat-box-scroll">
                        {(peerSession.messages || []).map(msg => (
                          <div
                            key={msg.id}
                            className={`msg-row ${
                              msg.senderType === "system"
                                ? "msg-row-system"
                                : isOwnPeerMessage(msg)
                                  ? "msg-row-user"
                                  : "msg-row-ai"
                            }`}
                          >
                            <div className="msg-bubble">
                              <span className="msg-sender">
                                {msg.senderType === "system"
                                  ? "System"
                                  : isOwnPeerMessage(msg)
                                    ? "You"
                                    : peerSession.partnerDisplay}
                              </span>
                              <span className="msg-text">{msg.text}</span>
                              {msg.createdAt && (
                                <span className="msg-time">{formatChatTime(msg.createdAt)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                        <div ref={peerChatEndRef} />
                      </div>
                      {peerSession.status === "active" && (
                        <div className="input-area">
                          <input
                            value={peerInput}
                            onChange={e => setPeerInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") sendPeerMessage();
                            }}
                            placeholder="Message your peer…"
                          />
                          <button type="button" className="btn-send" onClick={sendPeerMessage} aria-label="Send">
                            <SendHorizonal size={20} />
                          </button>
                        </div>
                      )}
                      {peerSession.status === "active" && (
                        <button type="button" className="btn-ghost" onClick={leavePeerChat}>
                          Leave chat
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;