import React from 'react';
import {
  Send,
  MailOpen,
  MousePointerClick,
  MessageSquare,
  Sparkles,
  Flame,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Clock,
  User,
  Calendar,
  Layers,
  ArrowRight,
  Target,
  FileEdit,
  ExternalLink,
} from 'lucide-react';
import { Campaign, CampaignContext, CampaignStep } from '../types';
import { formatDate } from '../utils';

interface OverviewTabProps {
  campaign: Campaign;
  context?: CampaignContext;
  onOpenContextModal: () => void;
  onSelectStep: (stepId: string) => void;
  onSwitchToAIAnalysis: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  campaign,
  context,
  onOpenContextModal,
  onSelectStep,
  onSwitchToAIAnalysis,
}) => {
  const hasContext = Boolean(context?.icp && context?.angle);
  const { aggregateStats, rates } = campaign;

  // Funnel calculations
  const funnelSteps = [
    {
      label: 'Sent',
      count: aggregateStats.sent,
      rateText: '100%',
      icon: <Send className="w-3.5 h-3.5 text-[#64748b]" />,
      barColor: 'bg-[#64748b]',
    },
    {
      label: 'Opened',
      count: aggregateStats.opened,
      rateText: `${rates.openRate}%`,
      subText: `${aggregateStats.opened} of ${aggregateStats.sent} sent`,
      icon: <MailOpen className="w-3.5 h-3.5 text-[#3b82f6]" />,
      barColor: 'bg-[#3b82f6]',
    },
    {
      label: 'Clicked',
      count: aggregateStats.clicked,
      rateText: `${rates.clickRate}%`,
      subText: `${aggregateStats.clicked} of ${aggregateStats.sent} sent`,
      icon: <MousePointerClick className="w-3.5 h-3.5 text-[#6366f1]" />,
      barColor: 'bg-[#6366f1]',
    },
    {
      label: 'Replied',
      count: aggregateStats.replied,
      rateText: `${rates.replyRate}%`,
      subText: `${aggregateStats.replied} total replies`,
      icon: <MessageSquare className="w-3.5 h-3.5 text-[#10b981]" />,
      barColor: 'bg-[#10b981]',
    },
    {
      label: 'Interested / Positive',
      count: aggregateStats.interested,
      rateText: `${rates.interestedRate}%`,
      subText: `${aggregateStats.interested} qualified leads`,
      icon: <Flame className="w-3.5 h-3.5 text-[#f59e0b]" />,
      barColor: 'bg-[#f59e0b]',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Context Awareness Status Banner */}
      {!hasContext ? (
        <div className="rounded-lg bg-[#fffbeb] border border-[#fde68a] p-4 flex items-start justify-between gap-4 text-[#92400e]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#d97706] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm text-[#78350f] flex items-center gap-2">
                <span>Unweighted, Raw Stats — Context Missing</span>
                <span className="px-2 py-0.5 rounded bg-[#fef3c7] text-[#b45309] text-[10px] uppercase font-mono tracking-wider border border-[#fde68a]">
                  Pending ICP
                </span>
              </div>
              <p className="text-xs text-[#92400e] leading-relaxed max-w-2xl">
                These numbers cannot be accurately interpreted or scored until you define the target ICP and sequence angle. What is considered a high-performing open or reply rate varies drastically between early-stage founders and enterprise CFOs.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenContextModal}
            className="shrink-0 px-3.5 py-1.5 bg-[#d97706] hover:bg-[#b45309] text-white font-semibold rounded text-xs transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Set Target ICP & Angle</span>
          </button>
        </div>
      ) : (
        <div className="rounded-lg bg-white border border-[#e2e8f0] p-4 flex items-start justify-between gap-4 text-[#1a1c20] shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center text-[#16a34a] shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#16a34a] uppercase tracking-wider font-mono">
                  Context Configured
                </span>
                <span className="text-[11px] text-[#64748b]">
                  Updated {formatDate(context.updatedAt)}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                <div>
                  <span className="text-[#64748b] font-semibold block text-[10px] uppercase tracking-wider">
                    Target ICP
                  </span>
                  <p className="text-[#0f172a] font-medium mt-0.5 line-clamp-2">{context.icp}</p>
                </div>
                <div>
                  <span className="text-[#64748b] font-semibold block text-[10px] uppercase tracking-wider">
                    Sequence Angle / Hook
                  </span>
                  <p className="text-[#0f172a] font-medium mt-0.5 line-clamp-2">{context.angle}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenContextModal}
              className="px-3 py-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#e2e8f0] text-[#475569] rounded text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Edit Context</span>
            </button>
            <button
              onClick={onSwitchToAIAnalysis}
              className="px-3 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyze with Gemini</span>
            </button>
          </div>
        </div>
      )}

      {/* Campaign Metadata Header KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-white border border-[#e2e8f0] shadow-xs">
          <div className="flex items-center justify-between text-[#64748b] text-[11px] font-semibold uppercase tracking-wider mb-1">
            <span>Status</span>
            <span
              className={`w-2 h-2 rounded-full ${
                campaign.status === 'active' ? 'bg-[#22c55e]' : 'bg-amber-400'
              }`}
            />
          </div>
          <div className="text-xl font-bold text-[#0f172a] uppercase tracking-tight">
            {campaign.status}
          </div>
          <div className="text-[11px] text-[#64748b] mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#94a3b8]" />
            <span>{campaign.daysRunning} days active</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-[#e2e8f0] shadow-xs">
          <div className="text-[#64748b] text-[11px] font-semibold uppercase tracking-wider mb-1">Sequence Steps</div>
          <div className="text-xl font-bold text-[#0f172a] font-mono">
            {campaign.steps.length} Steps
          </div>
          <div className="text-[11px] text-[#64748b] mt-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#94a3b8]" />
            <span>Multi-channel touchpoints</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-[#e2e8f0] shadow-xs">
          <div className="text-[#64748b] text-[11px] font-semibold uppercase tracking-wider mb-1">Total Sent</div>
          <div className="text-xl font-bold text-[#0f172a] font-mono">
            {aggregateStats.sent}
          </div>
          <div className="text-[11px] text-[#64748b] mt-1">
            {aggregateStats.bounced} bounced ({rates.bounceRate}%)
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-[#e2e8f0] shadow-xs">
          <div className="text-[#64748b] text-[11px] font-semibold uppercase tracking-wider mb-1">Campaign Owner</div>
          <div className="text-sm font-bold text-[#0f172a] truncate">
            {campaign.ownerName}
          </div>
          <div className="text-[11px] text-[#64748b] mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#94a3b8]" />
            <span>Created {formatDate(campaign.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="p-5 rounded-lg bg-white border border-[#e2e8f0] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
              <span>Conversion Funnel</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#64748b] font-mono uppercase">
                Aggregate
              </span>
            </h3>
            <p className="text-xs text-[#64748b] mt-0.5">
              Progression from initial dispatch through interest confirmation
            </p>
          </div>
          <div className="text-xs text-[#64748b] flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              Reply: <strong className="text-[#0f172a] font-mono">{rates.replyRate}%</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
              Interest: <strong className="text-[#0f172a] font-mono">{rates.interestedRate}%</strong>
            </span>
          </div>
        </div>

        {/* Funnel Bars */}
        <div className="space-y-3 pt-2">
          {funnelSteps.map((stage) => {
            const maxVal = aggregateStats.sent || 1;
            const widthPct = Math.max(6, (stage.count / maxVal) * 100);

            return (
              <div key={stage.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium text-[#334155]">
                    {stage.icon}
                    <span>{stage.label}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-[#0f172a]">{stage.count}</span>
                    <span className="text-[#64748b] text-[11px]">({stage.rateText})</span>
                  </div>
                </div>

                <div className="h-2.5 w-full bg-[#f1f5f9] rounded-full overflow-hidden p-0.5 border border-[#e2e8f0]">
                  <div
                    className={`h-full rounded-full ${stage.barColor} transition-all duration-500`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step-by-Step Breakdown Table with Step-over-Step Drop-off */}
      <div className="rounded-lg bg-white border border-[#e2e8f0] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0f172a]">Step-by-Step Performance & Retention Grid</h3>
            <p className="text-xs text-[#64748b]">
              Evaluates volume relative to the step before it, highlighting sequence fatigue and leak points
            </p>
          </div>
          <span className="text-xs text-[#64748b] font-mono">
            {campaign.steps.length} sequence steps
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] text-[#475569] uppercase text-[10px] tracking-wider border-b border-[#e2e8f0] font-mono font-semibold">
              <tr>
                <th className="py-3 px-4">Step</th>
                <th className="py-3 px-4">Channel / Delay</th>
                <th className="py-3 px-4">Subject / Hook</th>
                <th className="py-3 px-4 text-right">Sent</th>
                <th className="py-3 px-4 text-right">Retention</th>
                <th className="py-3 px-4 text-right">Drop-off</th>
                <th className="py-3 px-4 text-right">Open Rate</th>
                <th className="py-3 px-4 text-right">Reply Rate</th>
                <th className="py-3 px-4 text-right">Interested</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] font-medium text-[#334155]">
              {campaign.steps.map((step, idx) => {
                const rel = step.relativeStats;
                const isEmail = step.type === 'email';
                const openPct = step.stats.sent > 0 ? ((step.stats.opened / step.stats.sent) * 100).toFixed(1) : '0.0';
                const replyPct = step.stats.sent > 0 ? ((step.stats.replied / step.stats.sent) * 100).toFixed(1) : '0.0';

                return (
                  <tr
                    key={step.id}
                    onClick={() => onSelectStep(step.id)}
                    className="hover:bg-[#f8fafc] cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-bold text-[#0f172a] font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded bg-[#f1f5f9] flex items-center justify-center text-[10px] text-[#0f172a] border border-[#cbd5e1]">
                          0{step.stepNumber}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#0f172a] capitalize">
                        {step.type.replace('_', ' ')}
                      </div>
                      <div className="text-[10px] text-[#64748b] font-mono">
                        {step.delayDays === 0 ? 'Immediate (Day 0)' : `+${step.delayDays}d delay`}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-[200px] truncate">
                      <span className="text-[#475569] font-normal group-hover:text-[#6366f1] transition-colors">
                        {step.subject || (step.body ? step.body.slice(0, 45) + '...' : 'No subject')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#0f172a] font-semibold">
                      {step.stats.sent}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {idx === 0 ? (
                        <span className="text-[#64748b]">100%</span>
                      ) : (
                        <span className={`${(rel?.stepRetentionRate || 0) < 85 ? 'text-[#d97706] font-bold' : 'text-[#16a34a] font-semibold'}`}>
                          {rel?.stepRetentionRate || 100}%
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {idx === 0 ? (
                        <span className="text-[#94a3b8]">—</span>
                      ) : (
                        <span className="text-[#64748b] flex items-center justify-end gap-1">
                          <TrendingDown className="w-3 h-3 text-[#d97706]" />
                          <span>{rel?.dropOffFromPrevSent || 0}%</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#0f172a]">
                      {isEmail ? `${openPct}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#16a34a] font-bold">
                      {replyPct}% ({step.stats.replied})
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#d97706] font-bold">
                      {step.stats.interested}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStep(step.id);
                        }}
                        className="p-1 rounded text-[#64748b] hover:text-[#6366f1] hover:bg-[#f1f5f9] transition-colors"
                        title="Drill into Step Detail"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
