import {
  AI_NAME_PRESETS,
  GENDER_OPTIONS,
  LANGUAGE_OPTIONS
} from "../constants/preferences.js";
import { Button, Chip, ChipRow, Modal } from "./ui/index.js";

export default function OnboardingModal({
  aiNameDraft,
  customAiName,
  userGender,
  userLanguage,
  onAiNameDraftChange,
  onCustomAiNameChange,
  onGenderChange,
  onLanguageChange,
  onSave,
  onSkip
}) {
  return (
    <Modal
      title="Let's set up your Saathi"
      className="ai-name-card"
      actions={
        <>
          <Button variant="primary" size="compact" onClick={onSave}>
            Save &amp; start
          </Button>
          <Button variant="ghost" size="compact" onClick={onSkip}>
            Skip for now
          </Button>
        </>
      }
    >
      <p>
        A few quick choices so we can talk to you the right way. You can change
        these anytime from the menu.
      </p>

      <div className="pref-block">
        <span className="pref-label">Name your AI friend</span>
        <ChipRow>
          {AI_NAME_PRESETS.map(name => (
            <Chip
              key={name}
              active={aiNameDraft === name}
              onClick={() => {
                onAiNameDraftChange(name);
                onCustomAiNameChange("");
              }}
            >
              {name}
            </Chip>
          ))}
        </ChipRow>
        <div className="ai-name-custom-row">
          <input
            placeholder="Or type your own (8 chars max)"
            maxLength={8}
            value={customAiName}
            onChange={e => {
              onCustomAiNameChange(e.target.value);
              onAiNameDraftChange("");
            }}
          />
        </div>
      </div>

      <div className="pref-block">
        <span className="pref-label">You are</span>
        <ChipRow>
          {GENDER_OPTIONS.map(opt => (
            <Chip
              key={opt.value}
              active={userGender === opt.value}
              onClick={() => onGenderChange(opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
        </ChipRow>
        <span className="pref-hint">
          Helps us phrase things correctly (e.g. karti / karta).
        </span>
      </div>

      <div className="pref-block">
        <span className="pref-label">Reply language</span>
        <ChipRow>
          {LANGUAGE_OPTIONS.map(opt => (
            <Chip
              key={opt.value}
              active={userLanguage === opt.value}
              onClick={() => onLanguageChange(opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
        </ChipRow>
      </div>
    </Modal>
  );
}
