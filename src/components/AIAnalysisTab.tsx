import React, { useState } from 'react';
import {
  Sparkles,
  Target,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Copy,
  Check,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Campaign, CampaignContext, CampaignNote, AIDiagnosis, StepDiagnosis } from '../types';
import { formatDate } from '../utils';

interface AIAnalysisTabProps {
  campaign: Campaign;
  context?: CampaignContext;
  notes: CampaignNote[];
  pastDiagnoses: AIDiagnosis[];
  isAnalyzing: boolean;
  activeDiagnosis: AIDiagnosis | null;
  onOpenContextModal: () => void;
  onRunAnalysis: () => void;
}

export const AIAnalysisTab: React.FC<AIAnalysisTabProps> = ({
  campaign,
  context,
  notes,
  pastDiagnoses,
  isAnalyzing,
  activeDiagnosis,
  onOpenContextModal,
  onRunAnalysis,
}) => {
  const hasContext = Boolean(context?.icp && context?.angle);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [expandedRewrites, setExpandedRewrites] = useState<Record<number, boolean>>({ 0: true, 1: true });

  const handleCopyRewrite = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleRewriteExpand = (stepNum: number) => {
    setExpandedRewrites(prev => ({ ...prev, [stepNum]: !prev[stepNum] }));
  };

  const getPerformanceBadge = (label: string) => {
    switch (label.toLowerCase()) {
      case 'overperforming':
        return (
          <span className="px-2 py-0.5 rounded bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] font-mono text-[11px] font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[#10b981]" />
            <span>Overperforming</span>
          </span>
        );
      case 'underperforming':
        return (
          <span className="px-2 py-0.5 rounded bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca] font-mono text-[11px] font-semibold flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-[#ef4444]" />
            <span>Underperforming</span>
          </span>
        );
      case 'expected':
        return (
          <span className="px-2 py-0.5 rounded bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] font-mono text-[11px] font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#3b82f6]" />
            <span>On Target</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0] font-mono text-[11px]">
            {label}
          </span>
        );
    }
  };

  // If Context is missing, block analysis and show prompt
  if (!hasContext) {
    return (
      <div className="p-8 rounded-lg bg-white border border-[#e2e8f0] shadow-xs text-center space-y-5 max-w-2xl mx-auto my-6">
        <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-bold text-[#0f172a]">
            Target Context Required Before AI Interpretation
          </h3>
          <p className="text-xs text-[#475569] leading-relaxed">
            Gemini cannot diagnose this sequence because a cold outbound campaign to Series A founders and a multi-touch compliance sequence to enterprise CFOs should never be evaluated on the same generic curve.
          </p>
        </div>

        <div className="p-4 rounded bg-[#f8fafc] border border-[#e2e8f0] text-left text-xs text-[#64748b] space-y-1.5 font-mono">
          <div className="text-[#0f172a] font-sans font-semibold">Missing parameters:</div>
          <div className="text-[#d97706]">• Sample target profile or ICP description</div>
          <div className="text-[#d97706]">• Sequence angle and core hook/offer</div>
        </div>

        <button
          onClick={onOpenContextModal}
          className="px-5 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold rounded text-xs shadow-xs transition-all inline-flex items-center gap-2"
        >
          <Target className="w-4 h-4" />
          <span>Define ICP & Angle Context Now</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="p-4 rounded-lg bg-white border border-[#e2e8f0] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[#eef2ff] border border-[#c7d2fe] flex items-center justify-center text-[#6366f1]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0f172a]">
              Gemini Context-First Sequence Analysis
            </h3>
            <p className="text-xs text-[#64748b]">
              Reasoning strictly from: <span className="text-[#0f172a] font-medium">{context?.icp.slice(0, 60)}...</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenContextModal}
            className="px-3 py-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#e2e8f0] text-[#475569] rounded text-xs font-semibold transition-colors"
          >
            Edit ICP & Angle
          </button>

          <button
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className="px-4 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white font-semibold rounded text-xs shadow-xs transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing Sequence with Gemini...' : activeDiagnosis ? 'Re-run AI Analysis' : 'Run Sequence Diagnosis'}</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isAnalyzing && (
        <div className="p-12 rounded-lg bg-white border border-[#e2e8f0] shadow-xs text-center space-y-4 animate-pulse">
          <div className="w-10 h-10 rounded-full border-2 border-[#6366f1] border-t-transparent animate-spin mx-auto" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#0f172a]">
              Gemini 3.7 Flash is analyzing copy, cadence & ICP resonance...
            </h4>
            <p className="text-xs text-[#64748b]">
              Evaluating step drop-offs against stated audience friction and drafting calibrated rewrites.
            </p>
          </div>
        </div>
      )}

      {/* Diagnosis Results */}
      {!isAnalyzing && activeDiagnosis && (
        <div className="space-y-6">
          {/* Sample Size Caveat Flag */}
          {activeDiagnosis.confidenceFlag.isLowSample && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900 shadow-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold uppercase tracking-wider text-amber-800 font-mono block mb-0.5">
                  Low Sample Size Caveat ({activeDiagnosis.confidenceFlag.sampleCount} Sent)
                </span>
                <p className="text-amber-800 leading-relaxed">
                  {activeDiagnosis.confidenceFlag.message}
                </p>
              </div>
            </div>
          )}

          {/* Sequence-Level Verdict & Funnel Leak Spotlight */}
          <div className="p-5 rounded-lg bg-white border border-[#e2e8f0] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#4f46e5] uppercase tracking-wider font-mono">
                  Sequence-Level Verdict
                </span>
              </div>
              <span className="text-[11px] text-[#64748b] font-mono">
                Evaluated: {formatDate(activeDiagnosis.timestamp)}
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-[#0f172a] leading-relaxed">
                {activeDiagnosis.sequenceVerdict.summary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded bg-[#f8fafc] border border-[#e2e8f0]">
                  <div className="text-[10px] uppercase font-bold text-[#dc2626] tracking-wider flex items-center gap-1.5 mb-1">
                    <TrendingDown className="w-3 h-3" />
                    <span>Funnel Leak Point: {activeDiagnosis.sequenceVerdict.leakStage}</span>
                  </div>
                  <p className="text-xs text-[#334155] leading-relaxed">
                    {activeDiagnosis.sequenceVerdict.leakExplanation}
                  </p>
                </div>

                <div className="p-3.5 rounded bg-[#f8fafc] border border-[#e2e8f0]">
                  <div className="text-[10px] uppercase font-bold text-[#16a34a] tracking-wider flex items-center gap-1.5 mb-1">
                    <Target className="w-3 h-3" />
                    <span>Angle & ICP Alignment Verdict</span>
                  </div>
                  <p className="text-xs text-[#334155] leading-relaxed">
                    {activeDiagnosis.sequenceVerdict.angleAlignmentScoreText}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Per-Step Diagnoses Cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
              <span>Per-Step Diagnosis & Rewrite Suggestions</span>
              <span className="text-xs text-[#64748b] font-normal font-mono">
                ({activeDiagnosis.stepDiagnoses.length} steps analyzed)
              </span>
            </h3>

            <div className="space-y-4">
              {activeDiagnosis.stepDiagnoses.map((stepDiag, idx) => {
                const stepObj = campaign.steps.find(s => s.stepNumber === stepDiag.stepNumber);
                const isExpanded = expandedRewrites[idx] ?? true;

                return (
                  <div
                    key={stepDiag.stepId || idx}
                    className="p-5 rounded-lg bg-white border border-[#e2e8f0] shadow-xs space-y-4"
                  >
                    {/* Step Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2e8f0] pb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded bg-[#f1f5f9] text-[#4f46e5] font-mono text-xs font-bold flex items-center justify-center border border-[#e2e8f0]">
                          {stepDiag.stepNumber}
                        </span>
                        <div>
                          <div className="font-bold text-xs text-[#0f172a] flex items-center gap-2">
                            <span>Step 0{stepDiag.stepNumber}: {stepObj?.subject || stepObj?.type.replace('_', ' ')}</span>
                          </div>
                          <div className="text-[11px] text-[#64748b] font-mono">
                            Delay: {stepObj?.delayDays === 0 ? 'Day 0' : `+${stepObj?.delayDays} days`} • Sent: {stepObj?.stats.sent}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getPerformanceBadge(stepDiag.performanceLabel)}
                        <span className="px-2 py-0.5 rounded bg-[#f1f5f9] text-[#475569] text-[11px] font-mono border border-[#e2e8f0]">
                          Factor: {stepDiag.primaryFactor}
                        </span>
                      </div>
                    </div>

                    {/* Step Diagnosis Text */}
                    <div className="space-y-2 text-xs">
                      <div className="text-[#334155] leading-relaxed font-sans">
                        {stepDiag.diagnosis}
                      </div>
                      <div className="p-3 bg-[#f8fafc] rounded border border-[#e2e8f0] text-[#64748b]">
                        <strong className="text-[#0f172a] block mb-0.5">Retention / Drop-off Context:</strong>
                        <span>{stepDiag.retentionAnalysis}</span>
                      </div>
                    </div>

                    {/* Rewrites (if present) */}
                    {stepDiag.rewrites && stepDiag.rewrites.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <button
                          type="button"
                          onClick={() => toggleRewriteExpand(idx)}
                          className="flex items-center justify-between w-full text-xs font-bold text-[#4f46e5] hover:text-[#4338ca]"
                        >
                          <div className="flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                            <span>AI Calibrated Copy Rewrites ({stepDiag.rewrites.length})</span>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {isExpanded && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {stepDiag.rewrites.map((rw, rwIdx) => {
                              const copyId = `rw_${idx}_${rwIdx}`;
                              const isCopied = copiedIndex === copyId;
                              const fullCopy = rw.subject ? `Subject: ${rw.subject}\n\n${rw.body}` : rw.body;

                              return (
                                <div
                                  key={rwIdx}
                                  className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] space-y-2.5 flex flex-col justify-between"
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-xs text-[#0f172a]">
                                        {rw.title}
                                      </span>
                                      <button
                                        onClick={() => handleCopyRewrite(fullCopy, copyId)}
                                        className="p-1 rounded text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] transition-colors text-[11px] flex items-center gap-1"
                                        title="Copy rewrite to clipboard"
                                      >
                                        {isCopied ? (
                                          <Check className="w-3 h-3 text-[#16a34a]" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                                      </button>
                                    </div>

                                    {rw.subject && (
                                      <div className="text-xs text-[#4338ca] font-semibold bg-[#eef2ff] p-2 rounded border border-[#c7d2fe]">
                                        <span className="text-[10px] text-[#6366f1] uppercase font-mono block">
                                          Suggested Subject:
                                        </span>
                                        {rw.subject}
                                      </div>
                                    )}

                                    <div className="text-xs text-[#334155] whitespace-pre-wrap leading-relaxed bg-white p-2.5 rounded border border-[#e2e8f0] font-sans">
                                      {rw.body}
                                    </div>
                                  </div>

                                  <div className="text-[11px] text-[#64748b] pt-2 border-t border-[#e2e8f0] italic">
                                    <strong className="not-italic text-[#475569]">Why this works for ICP: </strong>
                                    {rw.rationale}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actionable Next Steps */}
          <div className="p-5 rounded-lg bg-white border border-[#e2e8f0] shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
              <span>Recommended Action Plan</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {activeDiagnosis.actionableNextSteps.map((stepText, sIdx) => (
                <div
                  key={sIdx}
                  className="p-3 rounded bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#334155] flex items-start gap-2.5"
                >
                  <span className="w-4 h-4 rounded bg-[#eef2ff] text-[#4f46e5] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-[#c7d2fe]">
                    {sIdx + 1}
                  </span>
                  <span className="leading-relaxed">{stepText}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Industry Sanity Check Accordion */}
          <div className="p-4 rounded-lg bg-white border border-[#e2e8f0] shadow-xs text-xs space-y-2">
            <div className="flex items-center gap-2 text-[#64748b] font-bold uppercase tracking-wider text-[10px]">
              <HelpCircle className="w-3.5 h-3.5 text-[#94a3b8]" />
              <span>Secondary Industry Sanity Check</span>
              <span className="px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#64748b] font-mono font-normal">
                {activeDiagnosis.industrySanityCheck.disclaimer}
              </span>
            </div>
            <p className="text-[#64748b] leading-relaxed">
              {activeDiagnosis.industrySanityCheck.generalBenchmarkComparison}
            </p>
          </div>
        </div>
      )}

      {/* Fallback empty state if no diagnosis yet */}
      {!isAnalyzing && !activeDiagnosis && (
        <div className="p-12 rounded-lg bg-white border border-[#e2e8f0] shadow-xs text-center space-y-4">
          <div className="w-10 h-10 rounded-lg bg-[#eef2ff] border border-[#c7d2fe] flex items-center justify-center text-[#6366f1] mx-auto">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#0f172a]">
              Ready to evaluate sequence performance
            </h4>
            <p className="text-xs text-[#64748b] max-w-md mx-auto">
              Context is locked in. Click below to launch Gemini 3.7 Flash analysis for step diagnosis and rewrite suggestions.
            </p>
          </div>
          <button
            onClick={onRunAnalysis}
            className="px-5 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold rounded text-xs shadow-xs transition-all inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Run Gemini Sequence Analysis</span>
          </button>
        </div>
      )}
    </div>
  );
};
