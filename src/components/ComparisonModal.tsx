import React, { useState } from 'react';
import {
  GitCompare,
  Sparkles,
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Target,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Layers,
  ShieldAlert,
  Lightbulb,
} from 'lucide-react';
import { Campaign, CampaignContext, CampaignNote, CampaignComparisonResult } from '../types';

interface ComparisonModalProps {
  isOpen: boolean;
  campaigns: Campaign[];
  contexts: Record<string, CampaignContext>;
  notes: CampaignNote[];
  onClose: () => void;
  onOpenContextForCampaign: (campaign: Campaign) => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  campaigns,
  contexts,
  notes,
  onClose,
  onOpenContextForCampaign,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    campaigns.slice(0, 2).map(c => c.id)
  );
  const [showRawStats, setShowRawStats] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<CampaignComparisonResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 2) return prev; // keep at least 2
        return prev.filter(x => x !== id);
      } else {
        if (prev.length >= 4) return prev; // max 4
        return [...prev, id];
      }
    });
  };

  const selectedCampaigns = campaigns.filter(c => selectedIds.includes(c.id));
  const missingContextCampaigns = selectedCampaigns.filter(
    c => !contexts[c.id] || !contexts[c.id].icp || !contexts[c.id].angle
  );
  const hasMissingContext = missingContextCampaigns.length > 0;

  const handleRunComparison = async () => {
    if (hasMissingContext) return;
    setIsComparing(true);
    setErrorMsg(null);

    try {
      const payload = selectedCampaigns.map(c => ({
        campaign: c,
        context: contexts[c.id],
        notes: notes.filter(n => n.campaignId === c.id),
      }));

      const res = await fetch('/api/analyze/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaigns: payload }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to compare campaigns');
      }

      const data: CampaignComparisonResult = await res.json();
      setComparisonResult(data);
    } catch (err: any) {
      console.error('Comparison error:', err);
      setErrorMsg(err.message);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#e2e8f0] rounded-lg w-full max-w-4xl overflow-hidden shadow-2xl text-[#0f172a] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#eef2ff] border border-[#c7d2fe] flex items-center justify-center text-[#6366f1]">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0f172a]">
                Context-Aware Multi-Campaign Comparator
              </h2>
              <p className="text-xs text-[#64748b]">
                Qualitative relative performance & transferable insights (No standardized score ranking)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Campaign Selection Row */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748b]">
              Select 2 to 4 Campaigns to Compare
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {campaigns.map(camp => {
                const isSelected = selectedIds.includes(camp.id);
                const hasCtx = Boolean(contexts[camp.id]?.icp && contexts[camp.id]?.angle);

                return (
                  <div
                    key={camp.id}
                    onClick={() => handleToggleSelect(camp.id)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#f8fafc] border-[#6366f1] shadow-xs ring-1 ring-[#6366f1]'
                        : 'bg-white border-[#e2e8f0] hover:border-[#cbd5e1] text-[#64748b]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-[#0f172a] line-clamp-1">{camp.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#6366f1] shrink-0" />}
                      </div>
                      <div className="text-[11px] text-[#64748b] line-clamp-1">
                        Owner: {camp.ownerName} ({camp.steps.length} steps)
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#e2e8f0] flex items-center justify-between text-[10px]">
                      {hasCtx ? (
                        <span className="text-[#16a34a] font-semibold flex items-center gap-1 font-mono">
                          <Target className="w-3 h-3" /> Context Set
                        </span>
                      ) : (
                        <span className="text-[#d97706] font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Missing Context
                        </span>
                      )}
                      <span className="font-mono text-[#64748b]">
                        {camp.aggregateStats.sent} sent
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Context Guard Warning (The Core Requirement) */}
          {hasMissingContext && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-2.5 text-xs text-amber-900 shadow-xs">
              <div className="flex items-center gap-2 text-amber-800 font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Comparison Refused: Missing Context on Selected Campaigns</span>
              </div>
              <p className="leading-relaxed text-amber-800">
                You cannot compare campaigns without capturing their respective Target Profile / ICP and Sequence Angle. The following campaigns must have context set before running:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {missingContextCampaigns.map(mc => (
                  <button
                    key={mc.id}
                    onClick={() => onOpenContextForCampaign(mc)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Target className="w-3 h-3" />
                    <span>Set Context for {mc.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Control Bar: Run Button + Raw Stats Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
            {/* Raw stats vs AI Narrative toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowRawStats(!showRawStats)}
                className="flex items-center gap-2 text-xs font-semibold text-[#334155] hover:text-[#0f172a]"
              >
                {showRawStats ? (
                  <ToggleRight className="w-6 h-6 text-[#6366f1]" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-[#94a3b8]" />
                )}
                <span>Show Raw Stats Side-by-Side</span>
              </button>
              <span className="text-[11px] text-[#64748b] hidden sm:inline">
                (Kept explicitly separate from AI qualitative verdict)
              </span>
            </div>

            <button
              onClick={handleRunComparison}
              disabled={hasMissingContext || isComparing}
              className="px-5 py-2 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-40 text-white font-semibold rounded text-xs shadow-xs transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isComparing ? 'Generating Qualitative Narrative...' : 'Run Qualitative Comparison'}</span>
            </button>
          </div>

          {/* Optional Raw Stats Side-by-Side Table */}
          {showRawStats && (
            <div className="p-4 rounded-lg bg-white border border-[#e2e8f0] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider font-mono">
                  Raw Metric Matrix (Unweighted)
                </h4>
                <span className="text-[10px] text-[#d97706] font-semibold">
                  ⚠️ Note: Not normalized for audience friction
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#334155]">
                  <thead className="bg-[#f8fafc] text-[#64748b] uppercase text-[10px] tracking-wider font-mono border-b border-[#e2e8f0]">
                    <tr>
                      <th className="py-2.5 px-3">Metric</th>
                      {selectedCampaigns.map(c => (
                        <th key={c.id} className="py-2.5 px-3">
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0] font-mono">
                    <tr>
                      <td className="py-2 px-3 text-[#64748b] font-sans">Stated ICP</td>
                      {selectedCampaigns.map(c => (
                        <td key={c.id} className="py-2 px-3 text-[11px] font-sans text-[#0f172a]">
                          {contexts[c.id]?.icp || 'None'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#64748b] font-sans">Stated Angle</td>
                      {selectedCampaigns.map(c => (
                        <td key={c.id} className="py-2 px-3 text-[11px] font-sans text-[#0f172a]">
                          {contexts[c.id]?.angle || 'None'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#64748b] font-sans">Sent</td>
                      {selectedCampaigns.map(c => (
                        <td key={c.id} className="py-2 px-3 font-bold text-[#0f172a]">
                          {c.aggregateStats.sent}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#64748b] font-sans">Open Rate</td>
                      {selectedCampaigns.map(c => (
                        <td key={c.id} className="py-2 px-3 text-[#3b82f6] font-bold">
                          {c.rates.openRate}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#64748b] font-sans">Reply Rate</td>
                      {selectedCampaigns.map(c => (
                        <td key={c.id} className="py-2 px-3 text-[#16a34a] font-bold">
                          {c.rates.replyRate}% ({c.aggregateStats.replied})
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-[#64748b] font-sans">Interested Rate</td>
                      {selectedCampaigns.map(c => (
                        <td key={c.id} className="py-2 px-3 text-[#d97706] font-bold">
                          {c.rates.interestedRate}% ({c.aggregateStats.interested})
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Comparison Narrative & Transferable Insights Results */}
          {comparisonResult && (
            <div className="space-y-6">
              {/* Qualitative Narrative */}
              <div className="p-5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#4f46e5] uppercase tracking-wider font-mono">
                  <Sparkles className="w-4 h-4" />
                  <span>Gemini Qualitative Comparative Narrative</span>
                </div>
                <p className="text-sm text-[#0f172a] leading-relaxed font-medium">
                  {comparisonResult.comparativeNarrative}
                </p>
              </div>

              {/* Per-Campaign Goal Alignment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comparisonResult.campaignAssessments.map(ass => (
                  <div
                    key={ass.campaignId}
                    className="p-5 rounded-lg bg-white border border-[#e2e8f0] shadow-xs space-y-3"
                  >
                    <div className="font-bold text-xs text-[#0f172a] border-b border-[#e2e8f0] pb-2">
                      {ass.campaignName}
                    </div>
                    <div className="text-xs space-y-2 text-[#334155]">
                      <div>
                        <strong className="text-[#64748b] block text-[10px] uppercase font-mono">
                          Performance vs. Stated Goal:
                        </strong>
                        <p className="mt-0.5 leading-relaxed">{ass.goalAlignmentAnalysis}</p>
                      </div>
                      <div>
                        <strong className="text-[#64748b] block text-[10px] uppercase font-mono">
                          Audience Specific Nuance:
                        </strong>
                        <p className="mt-0.5 leading-relaxed text-[#64748b]">{ass.audienceSpecificNuance}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Transferable Insights Matrix */}
              <div className="p-5 rounded-lg bg-white border border-[#e2e8f0] shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#d97706] uppercase tracking-wider font-mono">
                  <Lightbulb className="w-4 h-4" />
                  <span>Genuinely Transferable Strategy & Logic</span>
                </div>
                <p className="text-xs text-[#64748b]">
                  Techniques, delay cadence, or hook structures that can cross audience boundaries without assuming identical reply benchmarks.
                </p>

                <div className="space-y-3 pt-1">
                  {comparisonResult.transferableInsights.map((ins, iIdx) => (
                    <div
                      key={iIdx}
                      className="p-4 rounded bg-[#f8fafc] border border-[#e2e8f0] text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between font-bold text-[#0f172a]">
                        <span>{ins.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#eef2ff] text-[#4f46e5] font-mono border border-[#c7d2fe]">
                          {ins.fromCampaign} ➔ {ins.toCampaign}
                        </span>
                      </div>
                      <p className="text-[#334155] leading-relaxed">{ins.insight}</p>
                      <div className="text-[11px] text-[#64748b] italic">
                        <strong className="not-italic text-[#475569]">Why it transfers: </strong>
                        {ins.whyItTransfers}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Caution Banner */}
              <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#64748b] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#94a3b8] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#0f172a] block mb-0.5">Why Direct Stat Comparison is Misleading:</strong>
                  <span>{comparisonResult.cautionsAgainstDirectComparison}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
