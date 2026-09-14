import React, { useState } from 'react';
import { Link2, Search, ArrowRight, Loader2, CheckCircle2, AlertCircle, Clipboard, X } from 'lucide-react';
import { Campaign } from '../types';

interface CampaignLinkCheckerProps {
  onCheckCampaign: (urlOrId: string) => Promise<{ success: boolean; message?: string; campaign?: Campaign }>;
  isLoading?: boolean;
  className?: string;
  placeholder?: string;
}

export const CampaignLinkChecker: React.FC<CampaignLinkCheckerProps> = ({
  onCheckCampaign,
  isLoading = false,
  className = '',
  placeholder = 'Paste Lemlist campaign link or ID (e.g. https://app.lemlist.com/campaigns/cam_... or cam_...)',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const extractCampaignId = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return '';
    // Look for cam_ pattern first
    const camMatch = trimmed.match(/cam_[a-zA-Z0-9_-]+/);
    if (camMatch) return camMatch[0];

    // Check if it's a URL and extract the last path segment
    if (trimmed.includes('lemlist.com')) {
      const parts = trimmed.split('?')[0].split('#')[0].split('/');
      const lastPart = parts.reverse().find(p => p && p !== 'sequences' && p !== 'reports' && p !== 'leads');
      if (lastPart) return lastPart;
    }

    return trimmed;
  };

  const handleCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawInput = inputValue.trim();
    if (!rawInput) {
      setStatusMessage({ type: 'error', text: 'Please paste a Lemlist campaign URL or campaign ID.' });
      return;
    }

    const campaignId = extractCampaignId(rawInput);
    if (!campaignId) {
      setStatusMessage({ type: 'error', text: 'Could not detect a valid campaign ID in the pasted link.' });
      return;
    }

    setIsChecking(true);
    setStatusMessage(null);

    try {
      const result = await onCheckCampaign(campaignId);
      if (result.success) {
        setStatusMessage({
          type: 'success',
          text: result.message || `Loaded campaign: ${result.campaign?.name || campaignId}`,
        });
        // Auto dismiss success after 4 seconds
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message || `Could not find campaign "${campaignId}". Check API key or link.`,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to fetch campaign. Please verify your connection.',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputValue(text);
          const detectedId = extractCampaignId(text);
          if (detectedId) {
            // Auto trigger check if valid ID or Lemlist URL detected
            setTimeout(() => {
              const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
              handleCheck(syntheticEvent);
            }, 50);
          }
        }
      }
    } catch {
      // Clipboard permission denied or unsupported
    }
  };

  const handleClear = () => {
    setInputValue('');
    setStatusMessage(null);
  };

  const isBusy = isLoading || isChecking;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <form onSubmit={handleCheck} className="relative flex items-center w-full">
        {/* Link Icon Indicator */}
        <div className="absolute left-3.5 flex items-center pointer-events-none text-[#6366f1]">
          <Link2 className="w-4 h-4" />
        </div>

        {/* The Campaign Link Physical Input Box */}
        <input
          id="campaign-link-input-box"
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (statusMessage) setStatusMessage(null);
          }}
          placeholder={placeholder}
          disabled={isBusy}
          className="w-full h-10 pl-10 pr-28 bg-[#f8fafc] border border-[#cbd5e1] hover:border-[#94a3b8] focus:border-[#6366f1] focus:bg-white focus:ring-2 focus:ring-[#6366f1]/20 rounded-lg text-xs md:text-sm text-[#0f172a] placeholder-[#94a3b8] transition-all outline-none disabled:opacity-60"
        />

        {/* Clear Button */}
        {inputValue && !isBusy && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-20 text-[#94a3b8] hover:text-[#475569] p-1 rounded transition-colors"
            title="Clear text"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Action Buttons inside Input */}
        <div className="absolute right-1.5 flex items-center gap-1">
          {/* Quick Paste from Clipboard if empty */}
          {!inputValue && !isBusy && (
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="hidden sm:flex items-center gap-1 px-2 py-1 bg-white hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#0f172a] text-[11px] font-medium rounded border border-[#e2e8f0] transition-colors shadow-2xs"
              title="Paste campaign link from clipboard"
            >
              <Clipboard className="w-3 h-3" />
              <span>Paste</span>
            </button>
          )}

          {/* Check Button */}
          <button
            type="submit"
            disabled={isBusy || !inputValue.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] disabled:bg-[#cbd5e1] text-white disabled:text-[#94a3b8] text-xs font-semibold rounded-md transition-all shadow-xs disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
            title="Check and inspect campaign"
          >
            {isBusy ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Checking...</span>
              </>
            ) : (
              <>
                <span>Check</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Inline Feedback Banner */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs border animate-fadeIn transition-all ${
            statusMessage.type === 'success'
              ? 'bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]'
              : 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#22c55e]" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#ef4444]" />
          )}
          <span className="font-medium truncate flex-1">{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-[#94a3b8] hover:text-[#475569] text-xs font-bold"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
