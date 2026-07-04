export default function AppMainTabs({
  appTab,
  supportCount,
  activePeerCount,
  onAiTab,
  onProfessionalTab,
  onCommunityTab
}) {
  return (
    <nav className="app-main-tabs">
      <button
        type="button"
        aria-pressed={appTab === "ai"}
        className={appTab === "ai" ? "active" : ""}
        onClick={onAiTab}
      >
        Saathi AI
      </button>
      <button
        type="button"
        aria-pressed={appTab === "professional"}
        className={appTab === "professional" ? "active" : ""}
        onClick={onProfessionalTab}
      >
        Professional
        {supportCount > 0 && <span className="tab-badge">{supportCount}</span>}
      </button>
      <button
        type="button"
        aria-pressed={appTab === "community"}
        className={appTab === "community" ? "active" : ""}
        onClick={onCommunityTab}
      >
        Community
        {activePeerCount > 0 && (
          <span className="tab-badge">{activePeerCount}</span>
        )}
      </button>
    </nav>
  );
}
