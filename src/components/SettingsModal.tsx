import React, { useState } from 'react';
import { Key, X, Check, Database, AlertTriangle, ShieldCheck, RefreshCw, ExternalLink, HelpCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  apiKey: string;
  onClose: () => void;
  onSaveApiKey: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  apiKey,
  onClose,
  onSaveApiKey,
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!inputKey.trim()) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/lemlist/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lemlist-api-key': inputKey.trim(),
        },
        body: JSON.stringify({ apiKey: inputKey.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: 'Connected to Lemlist API successfully via HTTP Basic Auth.',
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to authenticate with Lemlist API.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection error.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(inputKey.trim());
    onClose();
  };

  const handleClearKey = () => {
    setInputKey('');
    onSaveApiKey('');
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#e2e8f0] rounded-lg w-full max-w-xl overflow-hidden shadow-2xl text-[#0f172a] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#eef2ff] border border-[#c7d2fe] flex items-center justify-center text-[#6366f1]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0f172a]">Lemlist API Key & Settings</h2>
              <p className="text-xs text-[#64748b]">Manage Lemlist REST API authentication and caching</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="p-4 rounded bg-[#f8fafc] border border-[#e2e8f0] space-y-2 text-xs text-[#334155]">
            <div className="flex items-center gap-2 font-semibold text-[#0f172a]">
              <ShieldCheck className="w-4 h-4 text-[#16a34a]" />
              <span>Authentication & Security Standard</span>
            </div>
            <p className="text-[#64748b] leading-relaxed">
              Your Lemlist API Key is stored securely in your browser's local application state. All requests utilize standard HTTP Basic Auth (<code className="text-[#4f46e5] font-semibold">:apiKey</code>) routed through our rate-limit aware backend proxy against <code className="text-[#0f172a] font-semibold">api.lemlist.com/api</code>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-1.5">
              Lemlist API Key
            </label>
            <input
              type="password"
              placeholder="Paste your Lemlist API key (e.g. lem_...)"
              value={inputKey}
              onChange={e => setInputKey(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#cbd5e1] rounded text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#6366f1] font-mono"
            />
            <p className="text-[11px] text-[#64748b] mt-1.5 flex items-center gap-1">
              <span>Find this in Lemlist Settings ➔ Integrations ➔ API Key.</span>
            </p>
          </div>

          {/* Test connection results */}
          {testResult && (
            <div
              className={`p-3.5 rounded border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.success ? (
                <Check className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-[#e11d48] shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{testResult.message}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#e2e8f0] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={!inputKey.trim() || isTesting}
                className="px-3.5 py-2 bg-[#f1f5f9] hover:bg-[#e2e8f0] disabled:opacity-40 text-[#334155] rounded text-xs font-medium transition-colors flex items-center gap-1.5 border border-[#cbd5e1]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
              </button>

              {inputKey && (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="px-3 py-2 text-[#e11d48] hover:bg-rose-50 rounded text-xs font-medium transition-colors"
                >
                  Switch to Demo Sandbox
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-[#cbd5e1] hover:bg-[#f8fafc] text-[#334155] rounded text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold rounded text-xs shadow-xs transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Key</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
