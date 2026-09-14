import React, { useState } from 'react';
import {
  Mail,
  Linkedin,
  Phone,
  CheckSquare,
  Clock,
  Send,
  MailOpen,
  MousePointerClick,
  MessageSquare,
  Flame,
  AlertCircle,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Plus,
  StickyNote,
} from 'lucide-react';
import { Campaign, CampaignStep, CampaignNote } from '../types';
import { formatDate } from '../utils';

interface StepSequenceTabProps {
  campaign: Campaign;
  selectedStepId?: string;
  notes: CampaignNote[];
  onSelectStep: (stepId: string) => void;
  onAddNote: (note: { campaignId: string; stepId?: string; author: string; content: string }) => void;
}

export const StepSequenceTab: React.FC<StepSequenceTabProps> = ({
  campaign,
  selectedStepId,
  notes,
  onSelectStep,
  onAddNote,
}) => {
  const steps = campaign.steps;
  const currentStep = steps.find(s => s.id === selectedStepId) || steps[0];
  const currentIndex = steps.findIndex(s => s.id === currentStep?.id);
  const prevStep = currentIndex > 0 ? steps[currentIndex - 1] : null;
  const nextStep = currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;

  const [copied, setCopied] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [authorName, setAuthorName] = useState('Outreach Analyst');

  const stepNotes = notes.filter(n => n.campaignId === campaign.id && n.stepId === currentStep?.id);

  const handleCopyBody = () => {
    if (currentStep?.body) {
      navigator.clipboard.writeText(currentStep.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !currentStep) return;
    onAddNote({
      campaignId: campaign.id,
      stepId: currentStep.id,
      author: authorName,
      content: newNoteText.trim(),
    });
    setNewNoteText('');
  };

  const highlightVariables = (text: string) => {
    const parts = text.split(/({{[^}]+}})/g);
    return parts.map((part, i) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        return (
          <span
            key={i}
            className="px-1.5 py-0.5 rounded bg-[#eef2ff] text-[#4f46e5] border border-[#c7d2fe] font-mono text-[11px] font-semibold inline-block mx-0.5"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4 text-[#6366f1]" />;
      case 'linkedin_invite':
      case 'linkedin_message':
      case 'linkedin_visit':
        return <Linkedin className="w-4 h-4 text-[#0284c7]" />;
      case 'call':
        return <Phone className="w-4 h-4 text-[#16a34a]" />;
      default:
        return <CheckSquare className="w-4 h-4 text-amber-500" />;
    }
  };

  if (!currentStep) {
    return <div className="p-8 text-center text-[#64748b]">No steps in this campaign.</div>;
  }

  const rel = currentStep.relativeStats;
  const openRate = currentStep.stats.sent > 0 ? ((currentStep.stats.opened / currentStep.stats.sent) * 100).toFixed(1) : '0';
  const replyRate = currentStep.stats.sent > 0 ? ((currentStep.stats.replied / currentStep.stats.sent) * 100).toFixed(1) : '0';
  const interestedRate = currentStep.stats.sent > 0 ? ((currentStep.stats.interested / currentStep.stats.sent) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Sequence Stepper Navigation Pill Bar */}
      <div className="p-2 rounded-lg bg-white border border-[#e2e8f0] flex items-center justify-between gap-2 overflow-x-auto shadow-xs">
        <div className="flex items-center gap-1.5">
          {steps.map((step) => {
            const isSelected = step.id === currentStep.id;
            return (
              <button
                key={step.id}
                onClick={() => onSelectStep(step.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#6366f1] text-white shadow-xs'
                    : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-mono ${
                    isSelected ? 'bg-white text-[#6366f1] font-bold' : 'bg-[#e2e8f0] text-[#475569]'
                  }`}
                >
                  {step.stepNumber}
                </span>
                <span className="capitalize">{step.type.replace('_', ' ')}</span>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-indigo-100' : 'text-[#94a3b8]'}`}>
                  {step.delayDays === 0 ? 'Day 0' : `+${step.delayDays}d`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Prev / Next Buttons */}
        <div className="flex items-center gap-1 shrink-0 pr-1">
          <button
            disabled={!prevStep}
            onClick={() => prevStep && onSelectStep(prevStep.id)}
            className="p-1.5 rounded bg-[#f1f5f9] hover:bg-[#e2e8f0] disabled:opacity-30 text-[#475569] transition-colors"
            title="Previous Step"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={!nextStep}
            onClick={() => nextStep && onSelectStep(nextStep.id)}
            className="p-1.5 rounded bg-[#f1f5f9] hover:bg-[#e2e8f0] disabled:opacity-30 text-[#475569] transition-colors"
            title="Next Step"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Step Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Step Copy & Header */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 rounded-lg bg-white border border-[#e2e8f0] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center">
                  {getStepIcon(currentStep.type)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                    <span>Step 0{currentStep.stepNumber}: {currentStep.type.replace('_', ' ').toUpperCase()}</span>
                  </h3>
                  <p className="text-xs text-[#64748b] flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-[#94a3b8]" />
                    <span>
                      {currentStep.delayDays === 0
                        ? 'Triggered immediately on lead launch'
                        : `Scheduled ${currentStep.delayDays} days after previous step`}
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyBody}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] rounded text-xs font-semibold border border-[#e2e8f0] transition-colors"
                title="Copy template copy"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#16a34a]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>

            {/* Subject Line (if email) */}
            {currentStep.subject && (
              <div className="p-3 bg-[#f8fafc] rounded border border-[#e2e8f0]">
                <div className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider mb-1">
                  Subject Line
                </div>
                <div className="text-xs font-semibold text-[#0f172a] font-sans">
                  {highlightVariables(currentStep.subject)}
                </div>
              </div>
            )}

            {/* Body Copy */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider">
                Step Body Content & Variables
              </div>
              <div className="p-4 bg-[#f8fafc] rounded border border-[#e2e8f0] text-xs text-[#334155] whitespace-pre-wrap leading-relaxed font-sans">
                {highlightVariables(currentStep.body)}
              </div>
            </div>
          </div>

          {/* Step Specific Notes Log */}
          <div className="p-5 rounded-lg bg-white border border-[#e2e8f0] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
                  Step 0{currentStep.stepNumber} Experiment Notes ({stepNotes.length})
                </h4>
              </div>
            </div>

            {/* Notes list */}
            {stepNotes.length > 0 ? (
              <div className="space-y-2">
                {stepNotes.map(note => (
                  <div key={note.id} className="p-3 rounded bg-[#f8fafc] border border-[#e2e8f0] text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#64748b]">
                      <span className="font-semibold text-[#0f172a]">{note.author}</span>
                      <span className="font-mono">{formatDate(note.timestamp)}</span>
                    </div>
                    <p className="text-[#334155]">{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#64748b] italic">No notes logged for Step 0{currentStep.stepNumber} yet.</p>
            )}

            {/* Add note form */}
            <form onSubmit={handleSaveNote} className="pt-2 border-t border-[#e2e8f0] space-y-2">
              <input
                type="text"
                placeholder="Log a change (e.g. 'Shortened CTA', 'Updated angle to cost focus')"
                value={newNoteText}
                onChange={e => setNewNoteText(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#6366f1]"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newNoteText.trim()}
                  className="px-3.5 py-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] disabled:opacity-40 text-[#475569] border border-[#e2e8f0] rounded text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Step Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (5 cols): Individual Stats + Drop-off Relative to Prior Step */}
        <div className="lg:col-span-5 space-y-5">
          {/* Relative Retention & Drop-off Spotlight */}
          <div className="p-5 rounded-lg bg-white border border-[#e2e8f0] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
                Step-over-Step Retention
              </h4>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#64748b] font-mono">
                Relative to Step {prevStep ? prevStep.stepNumber : 1}
              </span>
            </div>

            {prevStep ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#f8fafc] rounded border border-[#e2e8f0]">
                  <div className="text-[11px] text-[#64748b]">Step Retention</div>
                  <div className="text-2xl font-bold font-mono text-[#16a34a] mt-1">
                    {rel?.stepRetentionRate}%
                  </div>
                  <div className="text-[10px] text-[#64748b] mt-0.5">
                    {currentStep.stats.sent} of {prevStep.stats.sent} leads
                  </div>
                </div>

                <div className="p-3 bg-[#f8fafc] rounded border border-[#e2e8f0]">
                  <div className="text-[11px] text-[#64748b]">Drop-off from Step {prevStep.stepNumber}</div>
                  <div className="text-2xl font-bold font-mono text-[#d97706] mt-1 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    <span>{rel?.dropOffFromPrevSent}%</span>
                  </div>
                  <div className="text-[10px] text-[#64748b] mt-0.5">
                    {Math.max(0, prevStep.stats.sent - currentStep.stats.sent)} leads dropped
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#f8fafc] rounded border border-[#e2e8f0] text-xs text-[#64748b]">
                This is Step 1 — establishes the initial baseline volume ({currentStep.stats.sent} total leads contacted).
              </div>
            )}
          </div>

          {/* Individual Step Raw Stats */}
          <div className="p-5 rounded-lg bg-white border border-[#e2e8f0] shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
              Step 0{currentStep.stepNumber} Metrics Breakdown
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded bg-[#f8fafc] border border-[#e2e8f0]">
                <div className="flex items-center gap-2 text-[#475569]">
                  <Send className="w-3.5 h-3.5 text-[#64748b]" />
                  <span>Sent</span>
                </div>
                <span className="font-mono font-bold text-[#0f172a]">{currentStep.stats.sent}</span>
              </div>

              {currentStep.type === 'email' && (
                <div className="flex items-center justify-between p-2.5 rounded bg-[#f8fafc] border border-[#e2e8f0]">
                  <div className="flex items-center gap-2 text-[#475569]">
                    <MailOpen className="w-3.5 h-3.5 text-[#3b82f6]" />
                    <span>Opened</span>
                  </div>
                  <div className="font-mono flex items-center gap-2">
                    <span className="font-bold text-[#0f172a]">{currentStep.stats.opened}</span>
                    <span className="text-[#64748b] text-[11px]">({openRate}%)</span>
                  </div>
                </div>
              )}

              {currentStep.type === 'email' && (
                <div className="flex items-center justify-between p-2.5 rounded bg-[#f8fafc] border border-[#e2e8f0]">
                  <div className="flex items-center gap-2 text-[#475569]">
                    <MousePointerClick className="w-3.5 h-3.5 text-[#6366f1]" />
                    <span>Clicked</span>
                  </div>
                  <span className="font-mono font-bold text-[#0f172a]">{currentStep.stats.clicked}</span>
                </div>
              )}

              <div className="flex items-center justify-between p-2.5 rounded bg-[#f8fafc] border border-[#e2e8f0]">
                <div className="flex items-center gap-2 text-[#475569]">
                  <MessageSquare className="w-3.5 h-3.5 text-[#16a34a]" />
                  <span>Replied</span>
                </div>
                <div className="font-mono flex items-center gap-2">
                  <span className="font-bold text-[#16a34a]">{currentStep.stats.replied}</span>
                  <span className="text-[#64748b] text-[11px]">({replyRate}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-[#f8fafc] border border-[#e2e8f0]">
                <div className="flex items-center gap-2 text-[#475569]">
                  <Flame className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>Interested / Positive</span>
                </div>
                <div className="font-mono flex items-center gap-2">
                  <span className="font-bold text-[#d97706]">{currentStep.stats.interested}</span>
                  <span className="text-[#64748b] text-[11px]">({interestedRate}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-[#f8fafc] border border-[#e2e8f0] text-[#64748b]">
                <span>Bounced / Unsubscribed</span>
                <span className="font-mono">{currentStep.stats.bounced} / {currentStep.stats.unsubscribed}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
