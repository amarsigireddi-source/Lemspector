import React from 'react';
import {
  Users,
  User,
  Layers,
  Send,
  MailOpen,
  MessageSquare,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Target,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { TeamMember, Campaign, CampaignContext } from '../types';
import { formatDate } from '../utils';
import { CampaignLinkChecker } from './CampaignLinkChecker';

interface TeamOverviewProps {
  teamMembers: TeamMember[];
  campaigns: Campaign[];
  contexts: Record<string, CampaignContext>;
  selectedMemberId?: string;
  onSelectMember: (memberId: string) => void;
  onSelectCampaign: (campaignId: string) => void;
  onOpenContextForCampaign: (campaign: Campaign) => void;
  onCheckCampaign?: (urlOrId: string) => Promise<{ success: boolean; message?: string; campaign?: Campaign }>;
}

export const TeamOverview: React.FC<TeamOverviewProps> = ({
  teamMembers,
  campaigns,
  contexts,
  selectedMemberId,
  onSelectMember,
  onSelectCampaign,
  onOpenContextForCampaign,
  onCheckCampaign,
}) => {
  const [viewFilter, setViewFilter] = React.useState<'all' | 'latest100' | 'running' | 'archived'>('all');
  const [sortOption, setSortOption] = React.useState<'newest' | 'oldest' | 'sent' | 'replies'>('newest');
  const [filterQuery, setFilterQuery] = React.useState('');

  const currentMember = teamMembers.find(m => m.id === selectedMemberId);
  const baseCampaigns = selectedMemberId
    ? campaigns.filter(c => c.ownerId === selectedMemberId || c.ownerEmail === currentMember?.email)
    : campaigns;

  // Apply search
  let processedCampaigns = baseCampaigns.filter(c =>
    c.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.ownerName.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(filterQuery.toLowerCase())
  );

  // Apply view filter
  if (viewFilter === 'running') {
    processedCampaigns = processedCampaigns.filter(c => c.status === 'running' || c.status === 'active');
  } else if (viewFilter === 'archived') {
    processedCampaigns = processedCampaigns.filter(c => c.status === 'archived');
  } else if (viewFilter === 'latest100') {
    processedCampaigns = processedCampaigns.slice(0, 100);
  }

  // Apply sorting
  processedCampaigns = [...processedCampaigns].sort((a, b) => {
    if (sortOption === 'newest') {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    if (sortOption === 'oldest') {
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    }
    if (sortOption === 'sent') {
      return b.aggregateStats.sent - a.aggregateStats.sent;
    }
    if (sortOption === 'replies') {
      return b.rates.replyRate - a.rates.replyRate;
    }
    return 0;
  });

  const totalSent = baseCampaigns.reduce((acc, c) => acc + c.aggregateStats.sent, 0);
  const totalReplies = baseCampaigns.reduce((acc, c) => acc + c.aggregateStats.replied, 0);
  const totalInterested = baseCampaigns.reduce((acc, c) => acc + c.aggregateStats.interested, 0);

  const contextConfiguredCount = baseCampaigns.filter(
    c => contexts[c.id]?.icp && contexts[c.id]?.angle
  ).length;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
            <Users className="w-4 h-4" />
            <span>{currentMember ? `${currentMember.firstName} ${currentMember.lastName}'s Portfolio` : 'Outbound Team Workspace'}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            {currentMember ? `${currentMember.role || 'Outreach Specialist'}` : 'Outbound Campaigns & Sequence Inventory'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {contextConfiguredCount} of {baseCampaigns.length} campaigns have ICP context defined for AI interpretation.
          </p>
        </div>

        {/* Quick Aggregates */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-950 rounded-xl border border-slate-800 text-right">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Total Volume</div>
            <div className="text-sm font-bold text-slate-100 font-mono">{totalSent} sent</div>
          </div>
          <div className="px-4 py-2 bg-slate-950 rounded-xl border border-slate-800 text-right">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Total Replies</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">{totalReplies} replies</div>
          </div>
          <div className="px-4 py-2 bg-slate-950 rounded-xl border border-slate-800 text-right">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Interested</div>
            <div className="text-sm font-bold text-amber-400 font-mono">{totalInterested} leads</div>
          </div>
        </div>
      </div>

      {/* Direct Campaign Link Check Box */}
      {onCheckCampaign && (
        <div className="p-4 rounded-xl bg-white border border-[#e2e8f0] shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="shrink-0">
            <div className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#6366f1]" />
              <span>Direct Lemlist Campaign Link Check</span>
            </div>
            <p className="text-[11px] text-[#64748b] mt-0.5">
              Paste any campaign URL or ID directly to inspect its sequence copy, step retention, and context diagnosis.
            </p>
          </div>
          <div className="w-full md:w-[460px] shrink-0">
            <CampaignLinkChecker
              onCheckCampaign={onCheckCampaign}
              placeholder="Paste Lemlist campaign link or cam_... ID to check"
            />
          </div>
        </div>
      )}

      {/* Team Member Cards (if in all-team view) */}
      {!selectedMemberId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {teamMembers.map(member => {
            const memberCamps = campaigns.filter(c => c.ownerId === member.id || c.ownerEmail === member.email);
            const mSent = memberCamps.reduce((acc, c) => acc + c.aggregateStats.sent, 0);
            const mReplies = memberCamps.reduce((acc, c) => acc + c.aggregateStats.replied, 0);

            return (
              <div
                key={member.id}
                onClick={() => onSelectMember(member.id)}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-700/60 cursor-pointer transition-all space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-emerald-400 border border-slate-700">
                      {member.firstName[0]}
                      {member.lastName[0]}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-xs text-slate-400">{member.role}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>{memberCamps.length} campaigns</span>
                  <span>{mSent} sent • {mReplies} replies</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Campaigns Matrix List */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-sm font-bold text-slate-100">
              Campaigns & Headline Performance
            </h3>

            {/* View Filter Badges */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setViewFilter('all')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  viewFilter === 'all'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Uncapped ({baseCampaigns.length})
              </button>
              <button
                onClick={() => setViewFilter('latest100')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  viewFilter === 'latest100'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                100 Latest
              </button>
              <button
                onClick={() => setViewFilter('running')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  viewFilter === 'running'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Running / Active
              </button>
              <button
                onClick={() => setViewFilter('archived')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  viewFilter === 'archived'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Archived
              </button>
            </div>
          </div>

          {/* Search and Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search campaigns or owner..."
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48"
            />

            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value as any)}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="newest">Sort: Latest / Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="sent">Sort: Highest Volume (Sent)</option>
              <option value="replies">Sort: Highest Reply Rate</option>
            </select>

            <span className="text-xs text-slate-400 font-mono pl-1">
              Showing {processedCampaigns.length}
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-800">
          {processedCampaigns.map(campaign => {
            const hasCtx = Boolean(contexts[campaign.id]?.icp && contexts[campaign.id]?.angle);

            return (
              <div
                key={campaign.id}
                onClick={() => onSelectCampaign(campaign.id)}
                className="p-5 hover:bg-slate-850/50 cursor-pointer transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                {/* Left metadata */}
                <div className="space-y-1.5 max-w-md">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors">
                      {campaign.name}
                    </h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-semibold ${
                        campaign.status === 'active' || campaign.status === 'running'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : campaign.status === 'archived'
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    <span>Owner: <strong className="text-slate-300">{campaign.ownerName}</strong></span>
                    <span>•</span>
                    <span>{campaign.steps.length} sequence steps</span>
                    <span>•</span>
                    <span>{campaign.daysRunning} days active</span>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-slate-500">{campaign.id}</span>
                  </div>

                  {/* Context State */}
                  <div className="pt-1">
                    {hasCtx ? (
                      <div className="text-[11px] text-slate-300 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-emerald-300">ICP: </strong>
                          <span className="text-slate-300 line-clamp-1">{contexts[campaign.id].icp}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-amber-300 bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-700/60 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Unweighted / Raw Stats — Context Missing</span>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenContextForCampaign(campaign);
                          }}
                          className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[10px] transition-colors"
                        >
                          Add Context
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right stats row */}
                <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                  <div className="text-right">
                    <div className="text-slate-400 text-[10px] uppercase">Sent</div>
                    <div className="font-bold text-slate-100 text-sm">{campaign.aggregateStats.sent}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400 text-[10px] uppercase">Open %</div>
                    <div className="font-bold text-sky-400 text-sm">{campaign.rates.openRate}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400 text-[10px] uppercase">Reply %</div>
                    <div className="font-bold text-emerald-400 text-sm">{campaign.rates.replyRate}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400 text-[10px] uppercase">Interested</div>
                    <div className="font-bold text-amber-400 text-sm">{campaign.aggregateStats.interested}</div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCampaign(campaign.id);
                    }}
                    className="p-2 rounded-xl bg-slate-800 group-hover:bg-emerald-600 text-slate-300 group-hover:text-white transition-all ml-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
