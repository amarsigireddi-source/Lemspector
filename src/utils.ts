import { Campaign, CampaignStep, CampaignContext, CampaignNote, AIDiagnosis } from './types';
import { SAMPLE_CAMPAIGNS, SAMPLE_TEAM_MEMBERS, INITIAL_CONTEXTS, INITIAL_NOTES } from './sampleData';

const STORAGE_KEYS = {
  LEMLIST_API_KEY: 'lemlist_analyst_api_key',
  CONTEXTS: 'lemlist_analyst_contexts',
  NOTES: 'lemlist_analyst_notes',
  AI_VERDICTS: 'lemlist_analyst_ai_verdicts',
  CUSTOM_CAMPAIGNS: 'lemlist_analyst_custom_campaigns',
};

// Storage Helpers
export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  // No key stored means the app runs in demo mode with sample data.
  return localStorage.getItem(STORAGE_KEYS.LEMLIST_API_KEY) || '';
}

export function setStoredApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (key.trim()) {
    localStorage.setItem(STORAGE_KEYS.LEMLIST_API_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.LEMLIST_API_KEY);
  }
}

export function getStoredContexts(): Record<string, CampaignContext> {
  if (typeof window === 'undefined') return INITIAL_CONTEXTS;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CONTEXTS);
    if (!saved) {
      localStorage.setItem(STORAGE_KEYS.CONTEXTS, JSON.stringify(INITIAL_CONTEXTS));
      return INITIAL_CONTEXTS;
    }
    return JSON.parse(saved);
  } catch {
    return INITIAL_CONTEXTS;
  }
}

export function saveStoredContext(context: CampaignContext): Record<string, CampaignContext> {
  const current = getStoredContexts();
  const updated = { ...current, [context.campaignId]: context };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CONTEXTS, JSON.stringify(updated));
  }
  return updated;
}

export function getStoredNotes(): CampaignNote[] {
  if (typeof window === 'undefined') return INITIAL_NOTES;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (!saved) {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(INITIAL_NOTES));
      return INITIAL_NOTES;
    }
    return JSON.parse(saved);
  } catch {
    return INITIAL_NOTES;
  }
}

export function addStoredNote(note: Omit<CampaignNote, 'id' | 'timestamp'>): CampaignNote[] {
  const current = getStoredNotes();
  const newNote: CampaignNote = {
    ...note,
    id: `not_${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  const updated = [newNote, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updated));
  }
  return updated;
}

export function getStoredAIVerdicts(): Record<string, AIDiagnosis[]> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.AI_VERDICTS);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveAIVerdict(diagnosis: AIDiagnosis): Record<string, AIDiagnosis[]> {
  const current = getStoredAIVerdicts();
  const list = current[diagnosis.campaignId] || [];
  const updatedList = [diagnosis, ...list].slice(0, 10); // Keep last 10
  const updated = { ...current, [diagnosis.campaignId]: updatedList };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.AI_VERDICTS, JSON.stringify(updated));
  }
  return updated;
}

// Compute Step Relative Drop-off Rates
export function enrichCampaignStepsWithRelativeStats(steps: CampaignStep[]): CampaignStep[] {
  return steps.map((step, idx) => {
    if (idx === 0) {
      return {
        ...step,
        relativeStats: {
          dropOffFromPrevSent: 0,
          stepRetentionRate: 100,
          openRate: step.stats.sent > 0 ? (step.stats.opened / step.stats.sent) * 100 : 0,
          replyRate: step.stats.sent > 0 ? (step.stats.replied / step.stats.sent) * 100 : 0,
          interestedRate: step.stats.sent > 0 ? (step.stats.interested / step.stats.sent) * 100 : 0,
        },
      };
    }

    const prevStep = steps[idx - 1];
    const prevSent = prevStep.stats.sent;
    const currentSent = step.stats.sent;

    const dropOffCount = Math.max(0, prevSent - currentSent);
    const dropOffPercent = prevSent > 0 ? (dropOffCount / prevSent) * 100 : 0;
    const retentionRate = prevSent > 0 ? (currentSent / prevSent) * 100 : 0;

    return {
      ...step,
      relativeStats: {
        dropOffFromPrevSent: Number(dropOffPercent.toFixed(1)),
        stepRetentionRate: Number(retentionRate.toFixed(1)),
        openRate: currentSent > 0 ? Number(((step.stats.opened / currentSent) * 100).toFixed(1)) : 0,
        replyRate: currentSent > 0 ? Number(((step.stats.replied / currentSent) * 100).toFixed(1)) : 0,
        interestedRate: currentSent > 0 ? Number(((step.stats.interested / currentSent) * 100).toFixed(1)) : 0,
      },
    };
  });
}

// Format relative date / time
export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
