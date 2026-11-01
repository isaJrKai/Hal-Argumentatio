import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  Trash2, 
  Bot, 
  User, 
  Globe, 
  ArrowRight, 
  Copy, 
  Check, 
  Search,
  RefreshCw,
  Terminal,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useBusinessContext } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  enableGrounding?: boolean;
  sources?: Array<{ title: string; uri: string }>;
  createdAt?: string;
}



// Render the common inline Markdown HAL emits (bold, italic and inline code)
// as React elements instead of exposing literal Markdown markers to operators.
function renderInlineMarkdown(value: string): React.ReactNode[] {
  return value.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

interface ChatBotPanelProps {
  token: string | null;
}

export const ChatBotPanel: React.FC<ChatBotPanelProps> = ({ token }) => {
  const { workspaceConfig, regionalProfile, activeNiche } = useBusinessContext();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [enableGrounding, setEnableGrounding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const authToken = token || localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token') || '';

  const quickPrompts = [
    `Analyze ${regionalProfile.city} ${activeNiche} conversion bottlenecks`,
    `How should we price our emergency dispatch retainer?`,
    `What are our Core Web Vitals speed benchmarks?`,
    `Draft a 3-touch follow-up pitch for a cold lead`
  ];

  const fetchHistory = async () => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/intelligence/chat/history', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      }
    } catch (e: any) {
      console.warn('Chat history unavailable temporarily:', e?.message || e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [authToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const tempUserMsg: ChatMessage = {
      id: 'temp_' + Date.now(),
      role: 'user',
      text: query,
      enableGrounding,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/intelligence/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          message: query,
          enableGrounding,
          activeAi: 'dual'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const modelText = data.modelMessage?.text || data.reply || data.text || 'Response received from HAL Core.';
        setMessages(prev => [
          ...prev.filter(m => m.id !== tempUserMsg.id),
          data.userMessage || tempUserMsg,
          data.modelMessage || {
            id: 'mod_' + Date.now(),
            role: 'model',
            text: modelText,
            sources: data.sources,
            createdAt: new Date().toISOString()
          }
        ]);
      } else {
        throw new Error('Chat API returned error');
      }
    } catch (err: any) {
      console.error(err);
      // Contextual local synthesis fallback
      const qLower = query.toLowerCase();
      let fallbackText = `I am here to guide your operations in ${regionalProfile.city} (${activeNiche}).`;
      
      if (qLower.includes('step by step') || qLower.includes('what to do') || qLower.includes('dont know') || qLower.includes("don't know") || qLower.includes('start')) {
        fallbackText = `Here is your exact step-by-step operating roadmap to win contractor clients:

1. **Select Territory & Niche**: Navigate to **Territory Radar** or **Mission Control** to set your focus (e.g. Sump Pump / Waterproofing or Custom Home Builders in ${regionalProfile.city}).
2. **Harvest Real Leads**: Open the **Leads** tab and run a harvest. HAL checks website load speeds, SSL, and Google reviews.
3. **Filter High-Deficit Prospects**: Look for businesses with speed scores under 40 or missing mobile click-to-call buttons. They're burning ad spend on bouncing visitors.
4. **Deploy Speed Deficit Pitch**: In **Outreach Studio** or **Document Studio**, create a personalized deficit report showing how many calls they are losing.
5. **Close on an Emergency Intake Pipeline**: Offer your sub-second intake landing page and instant SMS dispatch system for a setup fee + monthly retainer.

What niche or city would you like to inspect first?`;
      } else {
        fallbackText = `HAL Intelligence: For "${query}", your active workspace is configured for ${regionalProfile.city} (${activeNiche}). You can audit contractor websites, package verified lead lists, or launch outreach campaigns from the navigation menu.`;
      }

      const fallbackReply: ChatMessage = {
        id: 'fallback_' + Date.now(),
        role: 'model',
        text: fallbackText,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Permanently delete all saved chat messages in this workspace?')) return;
    try {
      const res = await fetch('/api/intelligence/chat/history', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error(`Unable to clear chat history (HTTP ${res.status})`);
      setMessages([]);
      showToast({ title: 'Chat history deleted', message: 'Saved messages were removed from this workspace.', type: 'info' });
    } catch (e: any) {
      console.error(e);
      showToast({ title: 'Could not delete chat history', message: e?.message || 'Please try again.', type: 'error' });
    }
  };

  const handleDeleteMessage = async (message: ChatMessage) => {
    if (!message.id || message.id.startsWith('temp_') || message.id.startsWith('fallback_')) {
      showToast({ title: 'Message not saved', message: 'This temporary message is not stored in chat history.', type: 'info' });
      return;
    }
    if (!window.confirm('Delete this message from saved chat history?')) return;
    try {
      const res = await fetch(`/api/intelligence/chat/message/${encodeURIComponent(message.id)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error(`Unable to delete message (HTTP ${res.status})`);
      setMessages(previous => previous.filter(item => item.id !== message.id));
      showToast({ title: 'Message deleted', message: 'The saved message was removed.', type: 'success' });
    } catch (e: any) {
      console.error(e);
      showToast({ title: 'Could not delete message', message: e?.message || 'Please try again.', type: 'error' });
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast({ title: 'Copied', message: 'Message copied to clipboard', type: 'success' });
  };

  return (
    <div className="flex flex-col h-full w-full bg-bg-base text-text-primary overflow-hidden">
      {/* TOP HEADER */}
      <div className="px-5 py-3.5 border-b border-border-dim bg-bg-raised flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-text-primary font-display">HAL AI Copilot</h2>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold uppercase">
                Active
              </span>
            </div>
            <p className="text-[11px] text-text-secondary">
              Executive business operating intelligence & real-time decision copilot
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Grounding Toggle */}
          <button
            onClick={() => setEnableGrounding(!enableGrounding)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              enableGrounding 
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400 font-bold' 
                : 'bg-bg-subtle border-border-dim text-text-tertiary hover:text-text-primary'
            }`}
            title="Enable Google Search Grounding for live live web intelligence"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search Grounding</span>
          </button>

          {/* Refresh History */}
          <button
            onClick={fetchHistory}
            className="p-1.5 rounded-lg border border-border-dim bg-bg-subtle hover:bg-bg-raised text-text-secondary hover:text-text-primary transition-all cursor-pointer"
            title="Refresh memory stream"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Clear History */}
          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg border border-border-dim bg-bg-subtle hover:bg-rose-500/15 hover:border-rose-500/30 text-text-secondary hover:text-rose-400 transition-all cursor-pointer"
            title="Clear chat history"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* CHAT MESSAGES BODY */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto p-6 space-y-5">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-text-primary font-display">
                How can HAL assist your business operations today?
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                HAL reasons across your territory data, verified leads, ad performance, contracts, and Core Web Vitals to deliver actionable, high-intent decisions.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="p-3 text-left rounded-lg border border-border-dim bg-bg-raised hover:bg-bg-subtle hover:border-cyan-500/40 text-xs text-text-secondary hover:text-text-primary transition-all cursor-pointer group flex items-start justify-between gap-2"
                >
                  <span className="leading-snug">{prompt}</span>
                  <ArrowRight className="w-3 h-3 text-text-tertiary group-hover:text-cyan-400 shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                  isUser 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400'
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`space-y-1.5 max-w-[85%] sm:max-w-xl rounded-xl p-3.5 text-xs leading-relaxed border ${
                  isUser
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-bg-raised text-text-primary border-border-dim shadow-xs font-sans'
                }`}>
                  <div className="flex items-center justify-between gap-2 pb-1 border-b border-black/10 dark:border-white/10 text-[10px] opacity-75 font-mono">
                    <span>{isUser ? 'Operator' : 'HAL Intelligence Core'}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="hover:opacity-100 transition-opacity cursor-pointer p-0.5"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg)}
                        className="hover:opacity-100 transition-opacity cursor-pointer p-0.5 hover:text-rose-400"
                        title="Delete saved message"
                        aria-label="Delete saved message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap font-sans text-xs">
                    {msg.text.split('\n').map((line, lineIndex) => (
                      <div key={lineIndex} className="min-h-[1em]">{renderInlineMarkdown(line)}</div>
                    ))}
                  </div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-border-dim space-y-1">
                      <span className="text-[10px] font-mono font-bold text-text-tertiary block uppercase">
                        Verified Sources
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-cyan-400 hover:underline bg-bg-base px-2 py-0.5 rounded border border-border-dim truncate max-w-[200px]"
                          >
                            {src.title || src.uri}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-bg-raised border border-border-dim rounded-xl p-3 text-xs text-text-secondary flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>HAL is reasoning with memory and models...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT BAR */}
      <div className="p-3.5 sm:p-4 border-t border-border-dim bg-bg-raised/70">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="max-w-4xl mx-auto flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask HAL anything about operations, leads, speed audits, or strategy..."
            className="flex-1 bg-bg-base border border-border-dim focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-text-primary outline-hidden placeholder:text-text-tertiary shadow-inner"
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold font-sans flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-600/25 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
