import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  GitCompare,
  Key,
  Target,
  LayoutDashboard,
  Layers,
  StickyNote,
  AlertTriangle,
  Users,
  RefreshCw,
} from 'lucide-react';
import { TeamMember, Campaign, CampaignContext, CampaignNote, AIDiagnosis, CampaignStep } from './types';
import {
  SAMPLE_TEAM_MEMBERS,
  SAMPLE_CAMPAIGNS,
  INITIAL_CONTEXTS,
  INITIAL_NOTES,
} from './sampleData';
import {
  getStoredApiKey,
  setStoredApiKey,
  getStoredContexts,
  saveStoredContext,
  getStoredNotes,
  addStoredNote,
  getStoredAIVerdicts,
  saveAIVerdict,
  enrichCampaignStepsWithRelativeStats,
} from './utils';
import { HeaderBar } from './components/HeaderBar';
import { SidebarNav } from './components/SidebarNav';
import { OverviewTab } from './components/OverviewTab';
import { StepSequenceTab } from './components/StepSequenceTab';
import { AIAnalysisTab } from './components/AIAnalysisTab';
import { NotesAndHistoryTab } from './components/NotesAndHistoryTab';
import { TeamOverview } from './components/TeamOverview';
import { ContextModal } from './components/ContextModal';
import { ComparisonModal } from './components/ComparisonModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  // App Data State
  const [apiKey, setApiKey] = useState<string>(getStoredApiKey());
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(SAMPLE_TEAM_MEMBERS);
  const [campaigns, setCampaigns] = useState<Campaign[]>(() =>
    SAMPLE_CAMPAIGNS.map(c => ({
      ...c,
      steps: enrichCampaignStepsWithRelativeStats(c.steps),
    }))
  );
  const [contexts, setContexts] = useState<Record<string, CampaignContext>>(getStoredContexts());
  const [notes, setNotes] = useState<CampaignNote[]>(getStoredNotes());
  const [aiVerdicts, setAiVerdicts] = useState<Record<string, AIDiagnosis[]>>(getStoredAIVerdicts());

  // Navigation State
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>('usr_sara');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>('cam_berlin_saas');
  const [selectedStepId, setSelectedStepId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'overview' | 'steps' | 'analysis' | 'notes'>('overview');

  // AI & Async State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modals
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [contextModalCampaign, setContextModalCampaign] = useState<Campaign | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  // Campaign link pasted before a key was connected; opened automatically after connecting.
  const [pendingCampaignId, setPendingCampaignId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const activeCampaign = useMemo(
    () => campaigns.find(c => c.id === selectedCampaignId) || campaigns[0],
    [campaigns, selectedCampaignId]
  );

  const activeMember = useMemo(
    () => teamMembers.find(m => m.id === selectedMemberId || m.id === activeCampaign?.ownerId),
    [teamMembers, selectedMemberId, activeCampaign]
  );

  const activeStep = useMemo(
    () => activeCampaign?.steps.find(s => s.id === selectedStepId),
    [activeCampaign, selectedStepId]
  );

  const activeContext = activeCampaign ? contexts[activeCampaign.id] : undefined;
  const activeVerdictsList = activeCampaign ? aiVerdicts[activeCampaign.id] || [] : [];
  const latestDiagnosis = activeVerdictsList[0] || null;

  // Lemlist API Sync Function
  const fetchLemlistData = async (keyToUse: string) => {
    if (!keyToUse.trim()) return;
    setIsLoading(true);
    setSyncError(null);

    try {
      // 1. Fetch Campaigns first to get real campaigns, steps, and sender rosters
      const campRes = await fetch('/api/lemlist/campaigns', {
        headers: { 'x-lemlist-api-key': keyToUse },
      });

      let discoveredMembers: Record<string, TeamMember> = {};

      if (!campRes.ok) {
        const errData = await campRes.json().catch(() => ({}));
        setSyncError(errData.error || `Could not load campaigns from Lemlist (HTTP ${campRes.status}).`);
        return;
      }

      {
        const campList = await campRes.json();
        if (Array.isArray(campList) && campList.length === 0) {
          // Connected workspace with no campaigns: don't keep showing demo data.
          setCampaigns([]);
          setTeamMembers([]);
          setSelectedCampaignId(undefined);
          setSelectedMemberId(undefined);
          setSyncError('Connected, but this Lemlist workspace has no campaigns yet. Paste a campaign link to inspect one.');
        }
        if (Array.isArray(campList) && campList.length > 0) {
          const mappedCampaigns: Campaign[] = campList.map((c: any) => {
            const rawSteps = c.enrichedSteps || c.sequences?.[0]?.steps || c.steps || [];
            const steps: CampaignStep[] = rawSteps.map((s: any, idx: number) => ({
              id: s._id || s.id || `stp_${idx + 1}`,
              stepNumber: s.stepNumber || idx + 1,
              type: s.type || 'email',
              subject: s.subject || s.template?.subject || `Step ${idx + 1}`,
              body: s.body || s.template?.body || 'No copy provided',
              delayDays: s.delayDays !== undefined ? s.delayDays : (s.delay || (idx === 0 ? 0 : 3)),
              stats: {
                sent: s.stats?.sent || s.sent || 0,
                opened: s.stats?.opened || s.opened || 0,
                clicked: s.stats?.clicked || s.clicked || 0,
                replied: s.stats?.replied || s.replied || 0,
                interested: s.stats?.interested || s.interested || 0,
                bounced: s.stats?.bounced || s.bounced || 0,
                unsubscribed: s.stats?.unsubscribed || s.unsubscribed || 0,
              },
            }));

            const calc = c.calculatedStats || {};
            const sent = calc.sent || c.stats?.sent || c.nbLeadsReached || (steps[0]?.stats.sent || 0);
            const opened = calc.opened || c.stats?.opened || c.nbLeadsOpened || (steps[0]?.stats.opened || 0);
            const replied = calc.replied || c.stats?.replied || c.nbLeadsAnswered || (steps[0]?.stats.replied || 0);
            const interested = calc.interested || c.stats?.interested || c.nbLeadsInterested || (steps[0]?.stats.interested || 0);
            const clicked = calc.clicked || c.stats?.clicked || 0;
            const bounced = calc.bounced || c.stats?.bounced || 0;
            const unsubscribed = calc.unsubscribed || c.stats?.unsubscribed || 0;

            const ownerId = c.createdBy || c.creator?.userId || c.userId || 'usr_default';
            const ownerEmail = c.creator?.userEmail || c.userEmail;
            
            // Derive a friendly member name
            let ownerName = 'Team Lead';
            if (ownerEmail) {
              const prefix = ownerEmail.split('@')[0].replace('.', ' ');
              ownerName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
            }

            if (!discoveredMembers[ownerId]) {
              const nameParts = ownerName.split(' ');
              discoveredMembers[ownerId] = {
                id: ownerId,
                email: ownerEmail || '',
                firstName: nameParts[0] || ownerName,
                lastName: nameParts.slice(1).join(' ') || '',
                role: 'Outbound Specialist',
              };
            }

            return {
              id: c._id || c.id,
              name: c.name || 'Unnamed Campaign',
              status: (c.status as any) || 'active',
              ownerId,
              ownerName,
              ownerEmail,
              createdAt: c.createdAt || new Date().toISOString(),
              daysRunning: c.createdAt
                ? Math.max(1, Math.floor((Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
                : 30,
              aggregateStats: { sent, opened, clicked, replied, interested, bounced, unsubscribed },
              rates: {
                openRate: sent > 0 ? Number(((opened / sent) * 100).toFixed(1)) : 0,
                replyRate: sent > 0 ? Number(((replied / sent) * 100).toFixed(1)) : 0,
                interestedRate: sent > 0 ? Number(((interested / sent) * 100).toFixed(1)) : 0,
                clickRate: sent > 0 ? Number(((clicked / sent) * 100).toFixed(1)) : 0,
                bounceRate: sent > 0 ? Number(((bounced / sent) * 100).toFixed(1)) : 0,
                unsubRate: sent > 0 ? Number(((unsubscribed / sent) * 100).toFixed(1)) : 0,
              },
              steps: enrichCampaignStepsWithRelativeStats(steps),
            };
          });

          setCampaigns(mappedCampaigns);

          // Update team members from discovered owners
          const membersList = Object.values(discoveredMembers);
          if (membersList.length > 0) {
            setTeamMembers(membersList);
          }

          // Select first running or active campaign
          const runningCamp = mappedCampaigns.find(c => c.status === 'running') || mappedCampaigns[0];
          if (runningCamp) {
            setSelectedCampaignId(runningCamp.id);
            setSelectedMemberId(runningCamp.ownerId);
          }
        }
      }

      // 2. Fetch Team Metadata
      const teamRes = await fetch('/api/lemlist/team', {
        headers: { 'x-lemlist-api-key': keyToUse },
      });
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        if (teamData.name && teamData.invitedUsers) {
          // Additional team enrichment if available
        }
      }
    } catch (err) {
      console.warn('Live Lemlist fetch failed; staying in sandbox mode', err);
      setSyncError('Could not reach the server to sync with Lemlist. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      fetchLemlistData(apiKey);
    }
  }, []);

  const handleSaveApiKey = async (key: string) => {
    setApiKey(key);
    setStoredApiKey(key);
    if (key.trim()) {
      await fetchLemlistData(key.trim());
      if (pendingCampaignId) {
        const pending = pendingCampaignId;
        setPendingCampaignId(null);
        const result = await handleCheckCampaignByUrlOrId(pending, key.trim());
        if (!result.success && result.message) setSyncError(result.message);
      }
    } else {
      setSyncError(null);
      setPendingCampaignId(null);
      // Revert to rich sandbox demo data
      setTeamMembers(SAMPLE_TEAM_MEMBERS);
      setCampaigns(
        SAMPLE_CAMPAIGNS.map(c => ({
          ...c,
          steps: enrichCampaignStepsWithRelativeStats(c.steps),
        }))
      );
    }
  };

  const handleSaveContext = (context: CampaignContext) => {
    const updated = saveStoredContext(context);
    setContexts(updated);
  };

  const handleAddNote = (noteData: {
    campaignId: string;
    stepId?: string;
    author: string;
    content: string;
  }) => {
    const updated = addStoredNote(noteData);
    setNotes(updated);
  };

  const handleRunAIAnalysis = async () => {
    if (!activeCampaign) return;
    const context = contexts[activeCampaign.id];
    if (!context || !context.icp || !context.angle) {
      setContextModalCampaign(activeCampaign);
      setIsContextModalOpen(true);
      return;
    }

    setIsAnalyzing(true);
    try {
      const campaignNotes = notes.filter(n => n.campaignId === activeCampaign.id);
      const pastVerdicts = aiVerdicts[activeCampaign.id] || [];

      const res = await fetch('/api/analyze/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign: activeCampaign,
          context,
          notes: campaignNotes,
          pastVerdicts,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'AI analysis request failed');
      }

      const newDiagnosis: AIDiagnosis = await res.json();
      const updatedDict = saveAIVerdict(newDiagnosis);
      setAiVerdicts(updatedDict);
      setActiveTab('analysis');
    } catch (err: any) {
      console.error('Failed to run AI analysis:', err);
      alert(`AI Analysis Error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCheckCampaignByUrlOrId = async (
    urlOrId: string,
    keyOverride?: string
  ): Promise<{ success: boolean; message?: string; campaign?: Campaign }> => {
    if (!urlOrId.trim()) {
      return { success: false, message: 'Please provide a campaign link or ID.' };
    }

    // Extract ID (e.g. cam_R37xdG67TEoXdvDkA)
    let cleanId = urlOrId.trim();
    const camMatch = cleanId.match(/cam_[a-zA-Z0-9_-]+/);
    if (camMatch) {
      cleanId = camMatch[0];
    } else if (cleanId.includes('/')) {
      const parts = cleanId.split('?')[0].split('#')[0].split('/');
      const last = parts.reverse().find(p => p && p !== 'sequences' && p !== 'reports' && p !== 'leads');
      if (last) cleanId = last;
    }

    // 1. Check if it's already in our campaigns state
    const existing = campaigns.find(
      c => c.id === cleanId || c.id.toLowerCase() === cleanId.toLowerCase()
    );
    if (existing) {
      setSelectedCampaignId(existing.id);
      setSelectedMemberId(existing.ownerId);
      setSelectedStepId(undefined);
      setActiveTab('overview');
      return {
        success: true,
        message: `Found campaign in workspace: "${existing.name}"`,
        campaign: existing,
      };
    }

    // 2. Fetch directly from Lemlist via proxy /api/lemlist/campaigns/:id
    const keyToUse = keyOverride ?? apiKey;
    if (!keyToUse) {
      // Public visitor without a key: ask them to connect, then open this campaign.
      setPendingCampaignId(cleanId);
      setIsSettingsModalOpen(true);
      return {
        success: false,
        message: 'Connect your Lemlist API key to open this campaign. It will load right after.',
      };
    }
    try {
      setIsLoading(true);
      const res = await fetch(`/api/lemlist/campaigns/${encodeURIComponent(cleanId)}`, {
        headers: keyToUse ? { 'x-lemlist-api-key': keyToUse } : {},
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return {
          success: false,
          message: errData.error || `Campaign "${cleanId}" not found in Lemlist account.`,
        };
      }

      const c = await res.json();
      if (!c || (!c._id && !c.id)) {
        return { success: false, message: `Invalid campaign data returned for "${cleanId}".` };
      }

      // Map raw response to Campaign model
      const rawSteps = c.enrichedSteps || c.sequences?.[0]?.steps || c.steps || [];
      const steps: CampaignStep[] = rawSteps.map((s: any, idx: number) => ({
        id: s._id || s.id || `stp_${idx + 1}`,
        stepNumber: s.stepNumber || idx + 1,
        type: s.type || 'email',
        subject: s.subject || s.template?.subject || `Step ${idx + 1}`,
        body: s.body || s.template?.body || 'No copy provided',
        delayDays: s.delayDays !== undefined ? s.delayDays : (s.delay || (idx === 0 ? 0 : 3)),
        stats: {
          sent: s.stats?.sent || s.sent || 0,
          opened: s.stats?.opened || s.opened || 0,
          clicked: s.stats?.clicked || s.clicked || 0,
          replied: s.stats?.replied || s.replied || 0,
          interested: s.stats?.interested || s.interested || 0,
          bounced: s.stats?.bounced || s.bounced || 0,
          unsubscribed: s.stats?.unsubscribed || s.unsubscribed || 0,
        },
      }));

      const calc = c.calculatedStats || {};
      const sent = calc.sent || c.stats?.sent || c.nbLeadsReached || (steps[0]?.stats.sent || 0);
      const opened = calc.opened || c.stats?.opened || c.nbLeadsOpened || (steps[0]?.stats.opened || 0);
      const replied = calc.replied || c.stats?.replied || c.nbLeadsAnswered || (steps[0]?.stats.replied || 0);
      const interested = calc.interested || c.stats?.interested || c.nbLeadsInterested || (steps[0]?.stats.interested || 0);
      const clicked = calc.clicked || c.stats?.clicked || 0;
      const bounced = calc.bounced || c.stats?.bounced || 0;
      const unsubscribed = calc.unsubscribed || c.stats?.unsubscribed || 0;

      const ownerId = c.createdBy || c.creator?.userId || c.userId || 'usr_fetched';
      const ownerEmail = c.creator?.userEmail || c.userEmail;
      let ownerName = 'Team Lead';
      if (ownerEmail) {
        const prefix = ownerEmail.split('@')[0].replace('.', ' ');
        ownerName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
      } else if (c.name) {
        ownerName = c.name.split(' ')[0] || 'Team Lead';
      }

      const newCampaign: Campaign = {
        id: c._id || c.id,
        name: c.name || `Campaign ${cleanId}`,
        status: (c.status as any) || 'active',
        ownerId,
        ownerName,
        ownerEmail,
        createdAt: c.createdAt || new Date().toISOString(),
        daysRunning: c.createdAt
          ? Math.max(1, Math.floor((Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
          : 14,
        aggregateStats: { sent, opened, clicked, replied, interested, bounced, unsubscribed },
        rates: {
          openRate: sent > 0 ? Number(((opened / sent) * 100).toFixed(1)) : 0,
          replyRate: sent > 0 ? Number(((replied / sent) * 100).toFixed(1)) : 0,
          interestedRate: sent > 0 ? Number(((interested / sent) * 100).toFixed(1)) : 0,
          clickRate: sent > 0 ? Number(((clicked / sent) * 100).toFixed(1)) : 0,
          bounceRate: sent > 0 ? Number(((bounced / sent) * 100).toFixed(1)) : 0,
          unsubRate: sent > 0 ? Number(((unsubscribed / sent) * 100).toFixed(1)) : 0,
        },
        steps: enrichCampaignStepsWithRelativeStats(steps),
      };

      // Add to campaigns state if not present
      setCampaigns(prev => [newCampaign, ...prev.filter(x => x.id !== newCampaign.id)]);

      // Also ensure member exists in team roster
      setTeamMembers(prev => {
        if (prev.some(m => m.id === ownerId)) return prev;
        return [
          ...prev,
          {
            id: ownerId,
            email: ownerEmail || '',
            firstName: ownerName.split(' ')[0] || ownerName,
            lastName: ownerName.split(' ').slice(1).join(' ') || '',
            role: 'Outbound Specialist',
          },
        ];
      });

      setSelectedCampaignId(newCampaign.id);
      setSelectedMemberId(ownerId);
      setSelectedStepId(undefined);
      setActiveTab('overview');

      return {
        success: true,
        message: `Successfully fetched and loaded campaign: "${newCampaign.name}"`,
        campaign: newCampaign,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || `Network error fetching campaign ${cleanId}`,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const openContextModalFor = (camp: Campaign) => {
    setContextModalCampaign(camp);
    setIsContextModalOpen(true);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f4f4f7] font-sans text-[#1a1c20] antialiased">
      {/* Left Sidebar Navigation Tree */}
      <SidebarNav
        isLiveMode={Boolean(apiKey)}
        teamMembers={teamMembers}
        campaigns={campaigns}
        contexts={contexts}
        selectedMemberId={selectedMemberId}
        selectedCampaignId={selectedCampaignId}
        selectedStepId={selectedStepId}
        onSelectTeam={() => {
          setSelectedMemberId(undefined);
          setSelectedCampaignId(undefined);
          setSelectedStepId(undefined);
        }}
        onSelectMember={(mId) => {
          setSelectedMemberId(mId);
          const firstCamp = campaigns.find(c => c.ownerId === mId);
          setSelectedCampaignId(firstCamp?.id);
          setSelectedStepId(undefined);
        }}
        onSelectCampaign={(cId) => {
          setSelectedCampaignId(cId);
          setSelectedStepId(undefined);
          const camp = campaigns.find(c => c.id === cId);
          if (camp) setSelectedMemberId(camp.ownerId);
        }}
        onSelectStep={(cId, sId) => {
          setSelectedCampaignId(cId);
          setSelectedStepId(sId);
          setActiveTab('steps');
          const camp = campaigns.find(c => c.id === cId);
          if (camp) setSelectedMemberId(camp.ownerId);
        }}
      />

      {/* Main Right Workspace Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f4f4f7]">
        {/* Top Header & Breadcrumbs */}
        <HeaderBar
          currentMember={activeMember}
          currentCampaign={selectedCampaignId ? activeCampaign : undefined}
          currentStep={activeStep}
          context={activeContext}
          isDemoMode={!apiKey}
          isLoading={isLoading}
          hasApiKey={Boolean(apiKey)}
          onOpenContextModal={() => {
            if (activeCampaign) openContextModalFor(activeCampaign);
          }}
          onOpenCompareModal={() => setIsCompareModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onRefreshData={() => apiKey ? fetchLemlistData(apiKey) : null}
          onCheckCampaign={handleCheckCampaignByUrlOrId}
          onNavigateToTeam={() => {
            setSelectedMemberId(undefined);
            setSelectedCampaignId(undefined);
            setSelectedStepId(undefined);
          }}
          onNavigateToMember={(mId) => {
            setSelectedMemberId(mId);
            setSelectedCampaignId(undefined);
            setSelectedStepId(undefined);
          }}
          onNavigateToCampaign={(cId) => {
            setSelectedCampaignId(cId);
            setSelectedStepId(undefined);
          }}
        />

        {/* View Content Container */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
          {!apiKey && (
            <div className="max-w-7xl mx-auto mb-6 p-4 rounded-lg border border-[#c7d2fe] bg-gradient-to-r from-[#eef2ff] to-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#6366f1] shrink-0 mt-0.5" />
                <div className="text-xs text-[#334155] leading-relaxed">
                  <p className="font-semibold text-[#0f172a] text-sm">You're viewing sample campaigns</p>
                  <p>
                    Connect your Lemlist API key to analyze your own sequences, or paste any of your campaign links in the search bar above.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Key className="w-3.5 h-3.5" />
                Connect Lemlist
              </button>
            </div>
          )}
          {syncError && (
            <div className="max-w-7xl mx-auto mb-6 p-3.5 rounded-lg border border-amber-200 bg-amber-50 flex items-center justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{syncError}</span>
              </div>
              <button onClick={() => setSyncError(null)} className="font-semibold hover:underline shrink-0">
                Dismiss
              </button>
            </div>
          )}
          {/* If no campaign selected, show Team/Member Portfolio Overview */}
          {!selectedCampaignId ? (
            <TeamOverview
              teamMembers={teamMembers}
              campaigns={campaigns}
              contexts={contexts}
              selectedMemberId={selectedMemberId}
              onSelectMember={(mId) => {
                setSelectedMemberId(mId);
              }}
              onSelectCampaign={(cId) => {
                setSelectedCampaignId(cId);
                setSelectedStepId(undefined);
              }}
              onOpenContextForCampaign={openContextModalFor}
              onCheckCampaign={handleCheckCampaignByUrlOrId}
            />
          ) : (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Campaign Detail Workspace Header & Tab Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2e8f0] pb-3">
                <div className="flex items-center gap-1.5 p-1 bg-[#e2e8f0]/60 rounded-lg border border-[#e2e8f0]">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs transition-all ${
                      activeTab === 'overview'
                        ? 'bg-white text-[#0f172a] shadow-xs font-semibold'
                        : 'text-[#64748b] hover:text-[#0f172a] hover:bg-white/50 font-medium'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Funnel & Matrix Overview</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('steps')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs transition-all ${
                      activeTab === 'steps'
                        ? 'bg-white text-[#0f172a] shadow-xs font-semibold'
                        : 'text-[#64748b] hover:text-[#0f172a] hover:bg-white/50 font-medium'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Step Sequence & Retention</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('analysis')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs transition-all ${
                      activeTab === 'analysis'
                        ? 'bg-white text-[#6366f1] shadow-xs font-semibold'
                        : 'text-[#64748b] hover:text-[#0f172a] hover:bg-white/50 font-medium'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#6366f1]" />
                    <span>Gemini Sequence Analysis</span>
                    {latestDiagnosis && (
                      <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs transition-all ${
                      activeTab === 'notes'
                        ? 'bg-white text-[#0f172a] shadow-xs font-semibold'
                        : 'text-[#64748b] hover:text-[#0f172a] hover:bg-white/50 font-medium'
                    }`}
                  >
                    <StickyNote className="w-3.5 h-3.5 text-amber-500" />
                    <span>Memory & Notes ({notes.filter(n => n.campaignId === activeCampaign.id).length})</span>
                  </button>
                </div>

                {/* Quick context status callout */}
                <div className="text-xs text-[#64748b] flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748b]">Status:</span>
                  <span className="font-semibold text-[#0f172a]">{activeCampaign.status.toUpperCase()}</span>
                  <span className="text-[#cbd5e1]">•</span>
                  <span className="font-mono text-[#0f172a] font-medium">{activeCampaign.steps.length} Steps</span>
                </div>
              </div>

              {/* Tab Views */}
              {activeTab === 'overview' && (
                <OverviewTab
                  campaign={activeCampaign}
                  context={activeContext}
                  onOpenContextModal={() => openContextModalFor(activeCampaign)}
                  onSelectStep={(sId) => {
                    setSelectedStepId(sId);
                    setActiveTab('steps');
                  }}
                  onSwitchToAIAnalysis={() => {
                    setActiveTab('analysis');
                    if (!latestDiagnosis) {
                      handleRunAIAnalysis();
                    }
                  }}
                />
              )}

              {activeTab === 'steps' && (
                <StepSequenceTab
                  campaign={activeCampaign}
                  selectedStepId={selectedStepId}
                  notes={notes}
                  onSelectStep={(sId) => setSelectedStepId(sId)}
                  onAddNote={handleAddNote}
                />
              )}

              {activeTab === 'analysis' && (
                <AIAnalysisTab
                  campaign={activeCampaign}
                  context={activeContext}
                  notes={notes.filter(n => n.campaignId === activeCampaign.id)}
                  pastDiagnoses={activeVerdictsList}
                  isAnalyzing={isAnalyzing}
                  activeDiagnosis={latestDiagnosis}
                  onOpenContextModal={() => openContextModalFor(activeCampaign)}
                  onRunAnalysis={handleRunAIAnalysis}
                />
              )}

              {activeTab === 'notes' && (
                <NotesAndHistoryTab
                  campaign={activeCampaign}
                  notes={notes}
                  pastDiagnoses={activeVerdictsList}
                  onAddNote={handleAddNote}
                  onSelectHistoricalDiagnosis={(diag) => {
                    setActiveTab('analysis');
                  }}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Context Capture Modal (The Core Differentiator) */}
      <ContextModal
        isOpen={isContextModalOpen}
        campaign={contextModalCampaign || activeCampaign}
        currentContext={contextModalCampaign ? contexts[contextModalCampaign.id] : activeContext}
        onClose={() => {
          setIsContextModalOpen(false);
          setContextModalCampaign(null);
        }}
        onSaveContext={handleSaveContext}
      />

      {/* Comparison Modal (Qualitative Narrative, No Single Normalized Score) */}
      <ComparisonModal
        isOpen={isCompareModalOpen}
        campaigns={campaigns}
        contexts={contexts}
        notes={notes}
        onClose={() => setIsCompareModalOpen(false)}
        onOpenContextForCampaign={openContextModalFor}
      />

      {/* Settings Modal (API Key & Auth Verification) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        apiKey={apiKey}
        onClose={() => {
          setIsSettingsModalOpen(false);
          setPendingCampaignId(null);
        }}
        onSaveApiKey={handleSaveApiKey}
        pendingCampaignId={pendingCampaignId}
      />
    </div>
  );
}
