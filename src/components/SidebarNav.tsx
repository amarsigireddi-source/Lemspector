import React, { useState } from 'react';
import {
  Users,
  User,
  Mail,
  Linkedin,
  Phone,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Search,
  Target,
  Sparkles,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { TeamMember, Campaign, CampaignStep, CampaignContext } from '../types';

interface SidebarNavProps {
  teamMembers: TeamMember[];
  campaigns: Campaign[];
  contexts: Record<string, CampaignContext>;
  selectedMemberId?: string;
  selectedCampaignId?: string;
  selectedStepId?: string;
  onSelectTeam: () => void;
  onSelectMember: (memberId: string) => void;
  onSelectCampaign: (campaignId: string) => void;
  onSelectStep: (campaignId: string, stepId: string) => void;
  isLiveMode?: boolean;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  teamMembers,
  isLiveMode = false,
  campaigns,
  contexts,
  selectedMemberId,
  selectedCampaignId,
  selectedStepId,
  onSelectTeam,
  onSelectMember,
  onSelectCampaign,
  onSelectStep,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMembers, setExpandedMembers] = useState<Record<string, boolean>>({
    usr_sara: true,
    usr_marcus: true,
    usr_alex: true,
  });
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({
    cam_berlin_saas: true,
    cam_enterprise_cfo: true,
    cam_revops_pilot: true,
  });

  const toggleMemberExpand = (memberId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedMembers(prev => ({ ...prev, [memberId]: !prev[memberId] }));
  };

  const toggleCampaignExpand = (campaignId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCampaigns(prev => ({ ...prev, [campaignId]: !prev[campaignId] }));
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-3 h-3 text-[#6366f1]" />;
      case 'linkedin_invite':
      case 'linkedin_message':
      case 'linkedin_visit':
        return <Linkedin className="w-3 h-3 text-sky-400" />;
      case 'call':
        return <Phone className="w-3 h-3 text-[#22c55e]" />;
      default:
        return <CheckSquare className="w-3 h-3 text-amber-400" />;
    }
  };

  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-64 bg-[#0f1115] text-[#94a3b8] flex flex-col border-r border-[#1e293b] select-none h-full shrink-0">
      {/* App Branding */}
      <div className="p-5 flex items-center gap-3 border-b border-[#1e293b]">
        <div className="w-8 h-8 bg-[#6366f1] rounded flex items-center justify-center text-white font-bold text-xs italic shadow-sm">
          L
        </div>
        <div>
          <h1 className="text-white font-semibold text-sm tracking-tight">Lemspector</h1>
          <p className="text-[10px] text-[#64748b]">Lemlist Sequence Analyzer</p>
        </div>
      </div>

      {/* Quick Search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#64748b]" />
          <input
            type="text"
            placeholder="Filter sequences..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 bg-[#1e293b] border border-[#334155] rounded text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#6366f1]"
          />
        </div>
      </div>

      {/* Navigation Tree */}
      <nav className="flex-1 py-3 px-3 overflow-y-auto space-y-1 dark-scrollbar">
        {/* Team Overview Root Node */}
        <div
          onClick={onSelectTeam}
          className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-xs font-medium transition-colors ${
            !selectedMemberId && !selectedCampaignId
              ? 'bg-[#1e293b] text-white font-semibold'
              : 'hover:bg-[#1e293b] hover:text-white text-[#94a3b8]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-[#6366f1]" />
            <span>Team Overview</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#334155] text-white font-mono">
            {campaigns.length}
          </span>
        </div>

        <div className="text-[10px] uppercase tracking-widest text-[#475569] font-bold px-3 pt-3 pb-1">
          Team Members
        </div>

        {/* Tree Members */}
        {teamMembers.map(member => {
          const memberCampaigns = filteredCampaigns.filter(c => c.ownerId === member.id || c.ownerEmail === member.email);
          const isMemberSelected = selectedMemberId === member.id && !selectedCampaignId;
          const isExpanded = expandedMembers[member.id] ?? true;
          const initials = `${member.firstName[0] || ''}${member.lastName[0] || ''}`;

          return (
            <div key={member.id} className="space-y-1">
              {/* Member Row */}
              <div
                onClick={() => onSelectMember(member.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
                  isMemberSelected
                    ? 'bg-[#1e293b] text-white font-medium'
                    : 'hover:bg-[#1e293b] hover:text-white text-[#94a3b8]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <button
                    onClick={e => toggleMemberExpand(member.id, e)}
                    className="p-0.5 hover:bg-[#334155] rounded text-[#64748b] hover:text-white"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <div className="w-6 h-6 rounded-full bg-[#334155] border border-[#475569] flex items-center justify-center text-[10px] text-white shrink-0 font-medium">
                    {initials}
                  </div>
                  <span className="text-xs truncate font-medium">{member.firstName} {member.lastName}</span>
                </div>
                <span className="text-[10px] text-[#64748b] font-mono">
                  {memberCampaigns.length}
                </span>
              </div>

              {/* Campaigns Under Member */}
              {isExpanded && (
                <div className="ml-6 space-y-1 border-l border-[#334155] pl-3 py-0.5">
                  {memberCampaigns.length === 0 ? (
                    <div className="text-[10px] text-[#64748b] italic py-1">No campaigns</div>
                  ) : (
                    memberCampaigns.map(campaign => {
                      const isCampaignSelected = selectedCampaignId === campaign.id && !selectedStepId;
                      const isCampExpanded = expandedCampaigns[campaign.id] ?? true;
                      const hasContext = Boolean(contexts[campaign.id]?.icp && contexts[campaign.id]?.angle);

                      return (
                        <div key={campaign.id} className="space-y-0.5">
                          {/* Campaign Item */}
                          <div
                            onClick={() => onSelectCampaign(campaign.id)}
                            className={`group flex items-center justify-between py-1.5 px-2 rounded cursor-pointer text-xs transition-colors ${
                              isCampaignSelected
                                ? 'bg-[#1e293b] text-white font-medium'
                                : selectedCampaignId === campaign.id
                                ? 'text-white'
                                : 'text-[#64748b] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <button
                                onClick={e => toggleCampaignExpand(campaign.id, e)}
                                className="p-0.5 hover:bg-[#334155] rounded text-[#64748b] hover:text-white"
                              >
                                {isCampExpanded ? (
                                  <ChevronDown className="w-2.5 h-2.5" />
                                ) : (
                                  <ChevronRight className="w-2.5 h-2.5" />
                                )}
                              </button>
                              <div
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  campaign.status === 'active' ? 'bg-[#22c55e]' : 'bg-amber-400'
                                }`}
                              />
                              <span className="truncate max-w-[120px]" title={campaign.name}>
                                {campaign.name}
                              </span>
                            </div>

                            {/* Context Status Dot */}
                            {hasContext ? (
                              <span title="ICP Context Set" className="text-[#22c55e] text-[10px]">
                                ✓
                              </span>
                            ) : (
                              <span title="Context Missing" className="text-amber-400 text-[10px] font-bold">
                                !
                              </span>
                            )}
                          </div>

                          {/* Steps Under Campaign */}
                          {isCampExpanded && (
                            <div className="ml-3 space-y-0.5 border-l border-[#334155]/60 pl-2.5 py-0.5">
                              {campaign.steps.map(step => {
                                const isStepSelected = selectedCampaignId === campaign.id && selectedStepId === step.id;

                                return (
                                  <div
                                    key={step.id}
                                    onClick={() => onSelectStep(campaign.id, step.id)}
                                    className={`flex items-center justify-between py-1 px-1.5 rounded text-[11px] cursor-pointer transition-colors ${
                                      isStepSelected
                                        ? 'bg-[#6366f1]/20 text-[#6366f1] font-semibold border border-[#6366f1]/30'
                                        : 'text-[#64748b] hover:text-white'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      {getStepIcon(step.type)}
                                      <span className="truncate">
                                        0{step.stepNumber}: {step.type === 'email' ? 'Email' : step.type.replace('linkedin_', 'LI ')}
                                      </span>
                                    </div>
                                    <span className="text-[9px] text-[#475569] font-mono">
                                      {step.delayDays === 0 ? 'Day 0' : `+${step.delayDays}d`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer API Status */}
      <div className="p-3 border-t border-[#1e293b]">
        <div className="bg-[#1e293b] rounded p-2.5 flex items-center justify-between cursor-default">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-[#22c55e] animate-pulse' : 'bg-[#f59e0b]'}`}></div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
              {isLiveMode ? 'Lemlist API Active' : 'Demo Mode'}
            </span>
          </div>
          <span className="text-[9px] font-mono text-[#64748b]">v2 REST</span>
        </div>
      </div>
    </aside>
  );
};
