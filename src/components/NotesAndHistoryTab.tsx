import React, { useState } from 'react';
import {
  StickyNote,
  History,
  Plus,
  Calendar,
  User,
  Sparkles,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Clock,
  Layers,
} from 'lucide-react';
import { Campaign, CampaignNote, AIDiagnosis } from '../types';
import { formatDate } from '../utils';

interface NotesAndHistoryTabProps {
  campaign: Campaign;
  notes: CampaignNote[];
  pastDiagnoses: AIDiagnosis[];
  onAddNote: (note: { campaignId: string; stepId?: string; author: string; content: string }) => void;
  onSelectHistoricalDiagnosis: (diag: AIDiagnosis) => void;
}

export const NotesAndHistoryTab: React.FC<NotesAndHistoryTabProps> = ({
  campaign,
  notes,
  pastDiagnoses,
  onAddNote,
  onSelectHistoricalDiagnosis,
}) => {
  const [content, setContent] = useState('');
  const [selectedStepId, setSelectedStepId] = useState<string>('');
  const [author, setAuthor] = useState('Outreach Lead');

  const campaignNotes = notes.filter(n => n.campaignId === campaign.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onAddNote({
      campaignId: campaign.id,
      stepId: selectedStepId || undefined,
      author: author.trim() || 'Team Member',
      content: content.trim(),
    });

    setContent('');
  };

  return (
    <div className="space-y-6">
      {/* Team Notes / Experiment Memory Log */}
      <div className="p-5 rounded-lg bg-white border border-[#e2e8f0] shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-amber-500" />
              <span>Experiment Memory & Change Log</span>
            </h3>
            <p className="text-xs text-[#64748b] mt-0.5">
              Document subject line iterations, hook tweaks, or list changes so Gemini can trace cause-and-effect over time.
            </p>
          </div>
          <span className="text-xs text-[#64748b] font-mono">
            {campaignNotes.length} recorded notes
          </span>
        </div>

        {/* Add Note Input Form */}
        <form onSubmit={handleSubmit} className="p-4 bg-[#f8fafc] rounded border border-[#e2e8f0] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#64748b] uppercase tracking-wider mb-1">
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder="Your Name / Role"
                className="w-full px-3 py-1.5 bg-white border border-[#cbd5e1] rounded text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#6366f1]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#64748b] uppercase tracking-wider mb-1">
                Associated Step (Optional)
              </label>
              <select
                value={selectedStepId}
                onChange={e => setSelectedStepId(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#6366f1]"
              >
                <option value="">Campaign-Wide Note</option>
                {campaign.steps.map(step => (
                  <option key={step.id} value={step.id}>
                    Step 0{step.stepNumber}: {step.subject || step.type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#64748b] uppercase tracking-wider mb-1">
              Note / Experiment Description
            </label>
            <textarea
              required
              rows={2}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="e.g., 'Changed Step 1 subject line on June 20 to focus on hybrid office space. Also tightened ICP to series A funding announcements.'"
              className="w-full px-3.5 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#6366f1] leading-relaxed"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!content.trim()}
              className="px-4 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-40 text-white font-semibold rounded text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Experiment Note</span>
            </button>
          </div>
        </form>

        {/* Existing Notes Feed */}
        <div className="space-y-3 pt-2">
          {campaignNotes.length > 0 ? (
            campaignNotes.map(note => {
              const stepObj = campaign.steps.find(s => s.id === note.stepId);

              return (
                <div
                  key={note.id}
                  className="p-4 rounded bg-[#f8fafc] border border-[#e2e8f0] text-xs space-y-2"
                >
                  <div className="flex items-center justify-between text-[#64748b] text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#0f172a]">{note.author}</span>
                      {stepObj && (
                        <span className="px-2 py-0.5 rounded bg-[#eef2ff] text-[#4f46e5] border border-[#c7d2fe] font-mono text-[10px]">
                          Step 0{stepObj.stepNumber} ({stepObj.type.replace('_', ' ')})
                        </span>
                      )}
                    </div>
                    <span className="font-mono">{formatDate(note.timestamp)}</span>
                  </div>
                  <p className="text-[#334155] leading-relaxed">{note.content}</p>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-[#64748b] text-xs italic">
              No notes logged for this campaign yet. Add your first note above!
            </div>
          )}
        </div>
      </div>

      {/* Historical AI Verdicts Timeline */}
      <div className="p-5 rounded-lg bg-white border border-[#e2e8f0] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#3b82f6]" />
            <h3 className="text-sm font-bold text-[#0f172a]">Past AI Verdicts & Performance History</h3>
          </div>
          <span className="text-xs text-[#64748b] font-mono">
            {pastDiagnoses.length} past runs
          </span>
        </div>

        {pastDiagnoses.length > 0 ? (
          <div className="space-y-3">
            {pastDiagnoses.map((diag, index) => (
              <div
                key={diag.id || index}
                onClick={() => onSelectHistoricalDiagnosis(diag)}
                className="p-4 rounded bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#cbd5e1] hover:bg-white cursor-pointer transition-all space-y-2 group shadow-xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#0f172a] group-hover:text-[#6366f1] transition-colors">
                      Diagnosis from {formatDate(diag.timestamp)}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e2e8f0] text-[#475569] font-mono">
                      Leak: {diag.sequenceVerdict.leakStage}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94a3b8] group-hover:text-[#6366f1] transition-colors" />
                </div>
                <p className="text-xs text-[#334155] line-clamp-2 leading-relaxed">
                  {diag.sequenceVerdict.summary}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-[#64748b] text-xs italic">
            Run an AI sequence analysis to build your historical verdict record.
          </div>
        )}
      </div>
    </div>
  );
};
