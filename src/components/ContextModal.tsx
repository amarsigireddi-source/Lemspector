import React, { useState, useEffect } from 'react';
import { Target, Sparkles, X, Check, HelpCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { Campaign, CampaignContext } from '../types';

interface ContextModalProps {
  isOpen: boolean;
  campaign: Campaign | null;
  currentContext?: CampaignContext;
  onClose: () => void;
  onSaveContext: (context: CampaignContext) => void;
}

export const ContextModal: React.FC<ContextModalProps> = ({
  isOpen,
  campaign,
  currentContext,
  onClose,
  onSaveContext,
}) => {
  const [icp, setIcp] = useState('');
  const [angle, setAngle] = useState('');
  const [expectedReplyBenchmark, setExpectedReplyBenchmark] = useState<string>('');
  const [expectedInterestedBenchmark, setExpectedInterestedBenchmark] = useState<string>('');
  const [showHelperExamples, setShowHelperExamples] = useState(false);

  useEffect(() => {
    if (currentContext) {
      setIcp(currentContext.icp || '');
      setAngle(currentContext.angle || '');
      setExpectedReplyBenchmark(
        currentContext.expectedReplyBenchmark !== undefined ? String(currentContext.expectedReplyBenchmark) : ''
      );
      setExpectedInterestedBenchmark(
        currentContext.expectedInterestedBenchmark !== undefined
          ? String(currentContext.expectedInterestedBenchmark)
          : ''
      );
    } else {
      setIcp('');
      setAngle('');
      setExpectedReplyBenchmark('');
      setExpectedInterestedBenchmark('');
    }
  }, [currentContext, campaign]);

  if (!isOpen || !campaign) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!icp.trim() || !angle.trim()) return;

    const newContext: CampaignContext = {
      campaignId: campaign.id,
      icp: icp.trim(),
      angle: angle.trim(),
      expectedReplyBenchmark: expectedReplyBenchmark ? parseFloat(expectedReplyBenchmark) : undefined,
      expectedInterestedBenchmark: expectedInterestedBenchmark
        ? parseFloat(expectedInterestedBenchmark)
        : undefined,
      updatedAt: new Date().toISOString(),
    };

    onSaveContext(newContext);
    onClose();
  };

  const applyExample = (exIcp: string, exAngle: string, exReply: string, exInt: string) => {
    setIcp(exIcp);
    setAngle(exAngle);
    setExpectedReplyBenchmark(exReply);
    setExpectedInterestedBenchmark(exInt);
  };

  const isValid = Boolean(icp.trim() && angle.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#e2e8f0] rounded-lg w-full max-w-2xl overflow-hidden shadow-2xl text-[#0f172a] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#eef2ff] border border-[#c7d2fe] flex items-center justify-center text-[#6366f1]">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0f172a]">
                Campaign ICP & Angle Context
              </h2>
              <p className="text-xs text-[#64748b]">
                Targeting context for: <span className="font-semibold text-[#6366f1]">{campaign.name}</span>
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Rationale Notice */}
          <div className="rounded-lg bg-[#f8fafc] border border-[#e2e8f0] p-4 text-xs text-[#334155] flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-[#6366f1] mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold text-[#0f172a]">
                Why context is required before Gemini interprets this sequence:
              </p>
              <p className="text-[#64748b] leading-relaxed">
                A cold outreach sequence to Series A founders and a multi-touch compliance nurture to Enterprise CFOs cannot be judged on the same generic benchmark curve. Capturing the intended audience and hook allows Gemini to give precision diagnoses.
              </p>
            </div>
          </div>

          {/* Quick Fill Templates Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
              1. Target Profile / ICP Description <span className="text-[#6366f1]">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowHelperExamples(!showHelperExamples)}
              className="text-xs text-[#6366f1] hover:text-[#4f46e5] flex items-center gap-1 font-semibold"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showHelperExamples ? 'Hide Templates' : 'Use Sample Context'}</span>
            </button>
          </div>

          {/* Helper Example presets */}
          {showHelperExamples && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-[#f8fafc] rounded border border-[#e2e8f0] text-xs">
              <button
                type="button"
                onClick={() =>
                  applyExample(
                    'Early-stage technical founders & CTOs at seed/Series A AI startups (5-20 engineers, San Francisco / Remote)',
                    'Complimentary sandbox access to low-latency GPU cluster with zero upfront contract',
                    '8',
                    '3'
                  )
                }
                className="text-left p-2.5 rounded bg-white hover:bg-[#f8fafc] hover:border-[#6366f1] border border-[#e2e8f0] transition-all group"
              >
                <div className="font-semibold text-[#0f172a] group-hover:text-[#6366f1]">
                  Seed/Series A Technical Founders
                </div>
                <div className="text-[11px] text-[#64748b] mt-1 line-clamp-2">
                  Hook: Complimentary GPU cluster sandbox without long commitments.
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyExample(
                    'Enterprise Chief Financial Officers and VP Controllers at Fortune 1000 manufacturing & logistics companies ($250M+ ARR)',
                    'ASC 842 lease modification automated audit memo & risk reduction before Q3 audit sign-off',
                    '3.5',
                    '1.2'
                  )
                }
                className="text-left p-2.5 rounded bg-white hover:bg-[#f8fafc] hover:border-[#6366f1] border border-[#e2e8f0] transition-all group"
              >
                <div className="font-semibold text-[#0f172a] group-hover:text-[#6366f1]">
                  Fortune 1000 Enterprise CFO
                </div>
                <div className="text-[11px] text-[#64748b] mt-1 line-clamp-2">
                  Hook: ASC 842 audit memo & compliance risk reduction.
                </div>
              </button>
            </div>
          )}

          {/* Field 1: ICP */}
          <div>
            <textarea
              required
              rows={3}
              placeholder="Paste a sample target profile, LinkedIn bio summary, or describe the ICP (e.g. 'Series A SaaS founders, 10-30 employees, Berlin, recently raised capital')"
              value={icp}
              onChange={e => setIcp(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#cbd5e1] rounded text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#6366f1] leading-relaxed"
            />
            <p className="text-[11px] text-[#64748b] mt-1">
              Be as specific as possible (geography, company size, seniority level, pain trigger).
            </p>
          </div>

          {/* Field 2: Angle/Hook */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-1.5">
              2. What's the Angle or Hook of this Sequence? <span className="text-[#6366f1]">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe the offer or angle (e.g. 'Free 3D office design visualizer,' 'Custom benchmarking audit,' 'Cost-saving consolidation pitch')"
              value={angle}
              onChange={e => setAngle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#cbd5e1] rounded text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#6366f1] leading-relaxed"
            />
            <p className="text-[11px] text-[#64748b] mt-1">
              Gemini will test every step’s copy and delay against whether it genuinely delivers this angle.
            </p>
          </div>

          {/* Optional Benchmarks / Anchors */}
          <div className="pt-2 border-t border-[#e2e8f0]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0f172a] mb-2">
              <span>3. Optional Human Anchors & Expected Benchmarks</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]">Optional</span>
            </div>
            <p className="text-[11px] text-[#64748b] mb-3">
              If your team has past experience with this niche, set expected reply/interest baselines so the AI has a human anchor.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#64748b] mb-1 font-medium">
                  Expected Reply Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g. 8.0"
                    value={expectedReplyBenchmark}
                    onChange={e => setExpectedReplyBenchmark(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#cbd5e1] rounded text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#6366f1]"
                  />
                  <span className="absolute right-3 top-1.5 text-xs text-[#94a3b8]">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#64748b] mb-1 font-medium">
                  Expected Interested / Positive Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g. 3.0"
                    value={expectedInterestedBenchmark}
                    onChange={e => setExpectedInterestedBenchmark(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#cbd5e1] rounded text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#6366f1]"
                  />
                  <span className="absolute right-3 top-1.5 text-xs text-[#94a3b8]">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#e2e8f0] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#cbd5e1] hover:bg-[#f8fafc] text-[#334155] rounded text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="flex items-center gap-2 px-5 py-2 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Save Campaign Context</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
