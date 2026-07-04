import { MessageCircleHeart, Briefcase, UsersRound } from "lucide-react";

const TABS = [
  { id: "ai", label: "Saathi AI", icon: MessageCircleHeart },
  { id: "professional", label: "Professional", icon: Briefcase },
  { id: "community", label: "Community", icon: UsersRound }
];

export default function AppMainTabs({
  appTab,
  supportCount,
  activePeerCount,
  onAiTab,
  onProfessionalTab,
  onCommunityTab
}) {
  const handlers = {
    ai: onAiTab,
    professional: onProfessionalTab,
    community: onCommunityTab
  };

  const badges = {
    professional: supportCount,
    community: activePeerCount
  };

  return (
    <nav className="app-main-tabs" aria-label="Main sections">
      {TABS.map(tab => {
        const Icon = tab.icon;
        const active = appTab === tab.id;
        const badge = badges[tab.id] || 0;

        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={active}
            className={active ? "active" : ""}
            onClick={handlers[tab.id]}
          >
            <Icon size={17} strokeWidth={2.25} aria-hidden="true" />
            <span>{tab.label}</span>
            {badge > 0 && <span className="tab-badge">{badge}</span>}
          </button>
        );
      })}
    </nav>
  );
}
