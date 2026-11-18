import React from 'react';
import {
  Sparkles,
  GitCompare,
  Key,
  RefreshCw,
  Target,
  Users,
  ChevronRight,
  Database,
  Layers,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Campaign, CampaignContext, TeamMember, CampaignStep } from '../types';
import { CampaignLinkChecker } from './CampaignLinkChecker';

interface HeaderBarProps {
  currentMember?: TeamMember;
  currentCampaign?: Campaign;
  currentStep?: CampaignStep;
  context?: CampaignContext;
  isDemoMode: boolean;
  isLoading: boolean;
  hasApiKey: boolean;
  onOpenContextModal: () => void;
  onOpenCompareModal: () => void;
  onOpenSettingsModal: () => void;
  onRefreshData: () => void;
  onNavigateToTeam: () => void;
  onNavigateToMember: (memberId: string) => void;
  onNavigateToCampaign: (campaignId: string) => void;
  onCheckCampaign: (urlOrId: string) => Promise<{ success: boolean; message?: string; campaign?: Campaign }>;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentMember,
  currentCampaign,
  currentStep,
  context,
  isDemoMode,
  isLoading,
  hasApiKey,
  onOpenContextModal,
  onOpenCompareModal,
  onOpenSettingsModal,
  onRefreshData,
  onNavigateToTeam,
  onNavigateToMember,
  onNavigateToCampaign,
  onCheckCampaign,
}) => {
  const hasContext = Boolean(context?.icp && context?.angle);

  return (
    <header className="min-h-16 bg-white border-b border-[#e2e8f0] px-4 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 text-[#1a1c20]">
      {/* Left: Breadcrumb Path Navigation */}
      <div className="flex items-center space-x-2 text-sm text-[#64748b] flex-wrap font-medium shrink-0">
        <button
          onClick={onNavigateToTeam}
          className="hover:text-[#0f172a] transition-colors cursor-pointer"
          title="Team Overview"
        >
          Outbound Team
        </button>

        {currentMember && (
          <>
            <span className="text-[#cbd5e1]">/</span>
            <button
              onClick={() => onNavigateToMember(currentMember.id)}
              className="hover:text-[#0f172a] transition-colors cursor-pointer"
            >
              {currentMember.firstName} {currentMember.lastName}
            </button>
          </>
        )}

        {currentCampaign && (
          <>
            <span className="text-[#cbd5e1]">/</span>
            <button
              onClick={() => onNavigateToCampaign(currentCampaign.id)}
              className="font-semibold text-[#0f172a] max-w-[200px] lg:max-w-[260px] truncate hover:text-[#6366f1] transition-colors cursor-pointer"
              title={currentCampaign.name}
            >
              {currentCampaign.name}
            </button>
          </>
        )}

        {currentStep && (
          <>
            <span className="text-[#cbd5e1]">/</span>
            <span className="font-semibold text-[#6366f1] bg-[#eef2ff] border border-[#c7d2fe] px-2 py-0.5 rounded text-xs">
              Step 0{currentStep.stepNumber} ({currentStep.type.replace('_', ' ')})
            </span>
          </>
        )}
      </div>

      {/* Center: Physical Campaign Link Checker Text Box */}
      <div className="flex-1 min-w-[260px] max-w-xl mx-1 order-3 md:order-2">
        <CampaignLinkChecker
          onCheckCampaign={onCheckCampaign}
          isLoading={isLoading}
          placeholder="Paste campaign link to check (e.g. https://app.lemlist.com/campaigns/cam_...)"
        />
      </div>

      {/* Right: Context Badge & Action Controls */}
      <div className="flex items-center gap-2 flex-wrap shrink-0 order-2 md:order-3">
        {/* Campaign Context Indicator */}
        {currentCampaign && (
          <button
            onClick={onOpenContextModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all border cursor-pointer ${
              hasContext
                ? 'bg-[#f0fdf4] text-[#166534] border-[#bbf7d0] hover:bg-[#dcfce7]'
                : 'bg-[#fffbeb] text-[#92400e] border-[#fde68a] hover:bg-[#fef3c7]'
            }`}
            title={hasContext ? 'Context defined — click to edit' : 'Context missing — click to define target ICP & angle'}
          >
            <Target className="w-3.5 h-3.5" />
            {hasContext ? (
              <span>ICP Context Set</span>
            ) : (
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-[#d97706]" />
                <span>Context Required</span>
              </span>
            )}
          </button>
        )}

        {/* Compare Campaigns Action */}
        <button
          onClick={onOpenCompareModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f1f5f9] text-[#475569] rounded text-xs font-semibold border border-[#e2e8f0] hover:bg-[#e2e8f0] transition-colors cursor-pointer"
        >
          <GitCompare className="w-3.5 h-3.5 text-[#6366f1]" />
          <span>Compare</span>
        </button>

        {/* Refresh from Lemlist */}
        {hasApiKey && (
        <button
          onClick={onRefreshData}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f1f5f9] text-[#475569] rounded text-xs font-semibold border border-[#e2e8f0] hover:bg-[#e2e8f0] disabled:opacity-50 transition-colors cursor-pointer"
          title="Refresh cached sequences and stats from Lemlist"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#6366f1]' : 'text-[#64748b]'}`} />
          <span>{isLoading ? 'Syncing...' : 'Refresh'}</span>
        </button>
        )}

        {/* Mode / API Settings Button */}
        <button
          onClick={onOpenSettingsModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors border cursor-pointer ${
            hasApiKey
              ? 'bg-[#f8fafc] border-[#cbd5e1] text-[#334155] hover:bg-[#f1f5f9]'
              : 'bg-[#6366f1] border-[#6366f1] text-white hover:bg-[#4f46e5]'
          }`}
          title="Connect your Lemlist workspace"
        >
          <Key className="w-3.5 h-3.5" />
          <span>{hasApiKey ? 'Lemlist Connected' : 'Connect Lemlist'}</span>
        </button>
      </div>
    </header>
  );
};
