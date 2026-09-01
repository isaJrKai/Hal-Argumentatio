import React, { useState, useEffect, useRef } from 'react';
import { Forecast, LearningInsight } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  BookOpen, 
  Plus, 
  MessageSquare, 
  Cpu, 
  Send, 
  User, 
  Activity, 
  ArrowRight,
  TrendingUp,
  Terminal,
  HelpCircle,
  Globe,
  ExternalLink,
  Calculator,
  Maximize2,
  Minimize2,
  Trash2,
  Search,
  Calendar,
  X,
  ShieldCheck,
  CheckCircle2,
  BarChart2
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from './ui/Card';
import { useToast } from '../context/ToastContext';
import { useBusinessContext } from '../context/BusinessContext';
import CalculatorsSection from './CalculatorsSection';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend } from 'recharts';

interface IntelligencePanelProps {
  forecasts: Forecast[];
  learningInsights: LearningInsight[];
  token: string;
  onRefresh: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  sources?: Array<{ title: string; uri: string }>;
  createdAt?: string;
  enableGrounding?: boolean;
}

export default function IntelligencePanel({ 
  forecasts, 
  learningInsights, 
  token,
  onRefresh 
}: IntelligencePanelProps) {
  const { toast } = useToast();
  const { activeIndustry, activeNiche, activeCity } = useBusinessContext();
  const [subTab, setSubTab] = useState<'chat' | 'forecasts' | 'calculators' | 'audit'>('chat');
  const [outcomesData, setOutcomesData] = useState<any[]>([]);
  const [outcomesSummary, setOutcomesSummary] = useState<any>(null);
  const [loadingOutcomes, setLoadingOutcomes] = useState(false);

  useEffect(() => {
    const fetchOutcomes = async () => {
      const authToken = token || localStorage.getItem('halbiz_auth_token') || '';
      if (!authToken) return;
      setLoadingOutcomes(true);
      try {
        const res = await fetch('/api/revenue/outcomes', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            setOutcomesData(data.outcomes || []);
            setOutcomesSummary(data.summary || null);
          }
        }
      } catch (err) {
        console.error('Failed to fetch outcomes audit data:', err);
      } finally {
        setLoadingOutcomes(false);
      }
    };
    fetchOutcomes();
  }, [token]);

  const handleMeasureOutcomes = async () => {
    const authToken = token || localStorage.getItem('halbiz_auth_token') || '';
    try {
      const res = await fetch('/api/revenue/outcomes/measure', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setOutcomesData(data.outcomes || []);
          toast({
            variant: 'success',
            title: 'Outcomes Measured Successfully',
            description: `Measured ${data.measuredCount || 0} executed recommendations against observation windows.`
          });
        }
      }
    } catch (err) {
      console.error('Failed to trigger outcome measurement:', err);
    }
  };

  // Grounding state
  const [enableGrounding, setEnableGrounding] = useState(true);
  const [activeAi, setActiveAi] = useState<'gemini' | 'nemotron'>(() => {
    const saved = localStorage.getItem('hal_active_ai');
    return (saved === 'gemini' || saved === 'nemotron') ? saved : 'gemini';
  });
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      text: "I am HAL, your Business Operating Intelligence. I have direct access to your local SQLite parameters, Conquest Mission logs, GCM-encrypted databases, and system configuration matrices. Speak, and I will resolve.",
      timestamp: new Date().toLocaleTimeString().slice(0, 5)
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // New persistent states
  const [isMaximized, setIsMaximized] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'suggestions' | 'history'>('suggestions');
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  const suggestedPrompts = [
    "What is your core Constitution?",
    "Explain the single responsibility of Connectors.",
    "Tell me about dynamic Skills management.",
    "Explain the Talent Arbitrage Scoper model.",
    "What is the Verified Lead List Packager?",
    "How does the Automation Ops Product Scoper work?",
    "Explain the Pricing & Margin Calculator.",
    "How does the Ad Spend Breakeven Optimizer work?"
  ];

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load persistent chat history from database on mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const res = await fetch('/api/intelligence/chat/history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const historyData = await res.json();
          if (historyData && historyData.length > 0) {
            setMessages([
              {
                id: 'init',
                role: 'model',
                text: "I am HAL, your Business Operating Intelligence. I have direct access to your local SQLite parameters, Conquest Mission logs, GCM-encrypted databases, and system configuration matrices. Speak, and I will resolve.",
                timestamp: new Date().toLocaleTimeString().slice(0, 5)
              },
              ...historyData
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };
    fetchChatHistory();
  }, [token]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || sending) return;

    // Optimistically add user query to UI with temporary ID and timestamp
    const tempId = 'usr_opt_' + Date.now();
    const userMsg: ChatMessage = {
      id: tempId,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString().slice(0, 5),
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setSending(true);

    try {
      const res = await fetch('/api/intelligence/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: text,
          enableGrounding,
          activeAi
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to communicate with HAL.");

      // Replace temporary/optimistic query message with database-saved structures
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempId);
        return [
          ...filtered,
          data.userMessage,
          data.modelMessage
        ];
      });
    } catch (err: any) {
      toast({
        variant: 'danger',
        title: 'Communication Failure',
        description: err.message || "Failed to parse API chatbot package."
      });
      // Rollback optimistic message upon failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to permanently clear your chat history?")) return;
    try {
      const res = await fetch('/api/intelligence/chat/history', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setMessages([
          {
            id: 'init',
            role: 'model',
            text: "I am HAL, your Business Operating Intelligence. I have direct access to your local SQLite parameters, Conquest Mission logs, GCM-encrypted databases, and system configuration matrices. Speak, and I will resolve.",
            timestamp: new Date().toLocaleTimeString().slice(0, 5)
          }
        ]);
        toast({
          variant: 'success',
          title: 'History Cleared',
          description: 'Successfully deleted all prior chat exchanges.'
        });
      }
    } catch (err: any) {
      toast({
        variant: 'danger',
        title: 'Operation Failed',
        description: err.message || 'Could not clear chat history.'
      });
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (id === 'init') return;
    try {
      const res = await fetch(`/api/intelligence/chat/message/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== id));
        toast({
          variant: 'success',
          title: 'Message Deleted',
          description: 'The selected message has been permanently deleted.'
        });
      }
    } catch (err: any) {
      toast({
        variant: 'danger',
        title: 'Operation Failed',
        description: err.message || 'Could not delete chat message.'
      });
    }
  };

  // Human date formatting for headers & history grouping
  const formatMessageDate = (isoString?: string) => {
    if (!isoString) return 'System Initialization';
    const date = new Date(isoString);
    const now = new Date();
    
    // Check if today, yesterday
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    
    // Calculate difference in days
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCreateForecast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job: 'auto_forecaster'
        })
      });

      if (res.ok) {
        onRefresh();
        toast({
          variant: 'success',
          title: 'Auto-Forecast Executed',
          description: 'Successfully aggregated 90-day trend lines and compiled forecasts.'
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeForecasts = forecasts.filter(f => !f.evaluated);

  return (
    <div className="space-y-6 animate-fade-in text-text-primary" id="intelligence_panel">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-dim pb-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-widest text-accent uppercase">
            HAL EXECUTIVE INTELLIGENCE
          </span>
          <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-accent" />
            Intelligence Engine
          </h1>
          <p className="text-xs text-text-secondary max-w-xl">
            Ask HAL anything about its core architecture, and monitor active operational hypotheses and closed-loop learnings.
          </p>
        </div>

        {/* Dual navigation sub-tabs */}
        <div className="bg-bg-raised border border-border-dim p-1 rounded-sm flex shrink-0 self-start md:self-auto gap-0.5">
          <button
            onClick={() => setSubTab('chat')}
            className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-sm transition-all flex items-center gap-1.5 ${
              subTab === 'chat'
                ? 'bg-accent text-black font-bold shadow'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Ask HAL Bot
          </button>
          <button
            onClick={() => setSubTab('forecasts')}
            className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-sm transition-all flex items-center gap-1.5 ${
              subTab === 'forecasts'
                ? 'bg-accent text-black font-bold shadow'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Analytics Forecasts
          </button>
          <button
            onClick={() => setSubTab('calculators')}
            className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-sm transition-all flex items-center gap-1.5 ${
              subTab === 'calculators'
                ? 'bg-accent text-black font-bold shadow'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            Operating Calculators
          </button>
          <button
            onClick={() => setSubTab('audit')}
            className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-sm transition-all flex items-center gap-1.5 ${
              subTab === 'audit'
                ? 'bg-accent text-black font-bold shadow'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Intelligence Audit & 6D
          </button>
        </div>
      </div>

      {/* RENDER CHAT SYSTEM */}
      {subTab === 'chat' && (
        <>
          {isMaximized && (
            <div 
              className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] transition-opacity"
              onClick={() => setIsMaximized(false)}
            />
          )}
          <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch transition-all duration-200 ${
            isMaximized 
              ? 'fixed inset-4 md:inset-8 z-[101] bg-bg-dark border border-accent/40 rounded-2xl shadow-2xl overflow-hidden h-[calc(100vh-32px)] md:h-[calc(100vh-64px)]' 
              : 'lg:h-[calc(100vh-220px)] h-auto'
          }`}>
            {/* Main Chat Interface */}
            <div className={`flex flex-col bg-bg-raised border border-border-dim rounded-xl overflow-hidden ${
              isMaximized 
                ? 'lg:col-span-8 h-full bg-bg-overlay/95' 
                : 'lg:col-span-8 h-[450px] lg:h-full'
            }`}>
              
              {/* Header */}
              <div className="px-4 py-3 border-b border-border-dim bg-bg-overlay flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-positive animate-ping" />
                  <span className="text-[10px] font-mono text-text-primary uppercase font-bold tracking-wider">HAL Core Assistant</span>
                  {isMaximized && (
                    <span className="bg-accent/15 text-accent border border-accent/30 text-[9px] font-mono px-2 py-0.5 rounded uppercase tracking-wider">
                      Fullscreen Mode
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {/* Cognitive Engine Switcher */}
                  <div className="flex items-center gap-1 bg-bg-base/60 border border-border-dim rounded-md p-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAi('gemini');
                        localStorage.setItem('hal_active_ai', 'gemini');
                        toast({
                          variant: 'success',
                          title: 'Gemini 3.5 Active',
                          description: 'Switched cognitive engine to Google Gemini 3.5.'
                        });
                      }}
                      className={`px-2 py-1 rounded text-[9px] font-mono font-bold uppercase transition-all ${
                        activeAi === 'gemini'
                          ? 'bg-accent/15 text-accent border border-accent/20'
                          : 'text-text-tertiary hover:text-text-secondary border border-transparent'
                      }`}
                      title="Google Gemini 3.5: Highly detailed context reasoning but slower (18s+)"
                    >
                      🧠 Gemini
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAi('nemotron');
                        localStorage.setItem('hal_active_ai', 'nemotron');
                        toast({
                          variant: 'success',
                          title: 'Nemotron Active',
                          description: 'Switched to NVIDIA Nemotron ultra-low latency (<400ms) engine.'
                        });
                      }}
                      className={`px-2 py-1 rounded text-[9px] font-mono font-bold uppercase transition-all ${
                        activeAi === 'nemotron'
                          ? 'bg-positive/10 text-positive border border-positive/20'
                          : 'text-text-tertiary hover:text-text-secondary border border-transparent'
                      }`}
                      title="NVIDIA Nemotron: Ultra-low latency high-speed reasoning (<400ms!)"
                    >
                      ⚡ Nemotron
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEnableGrounding(!enableGrounding)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border font-mono text-[10px] uppercase tracking-wider transition-all ${
                      enableGrounding 
                        ? 'bg-accent/10 border-accent/45 text-accent font-bold' 
                        : 'bg-transparent border-border-dim text-text-tertiary hover:text-text-secondary hover:border-border-dark'
                    }`}
                    title="Enable Google Search Grounding for real-time web research and knowledge verification."
                  >
                    <Globe className={`w-3.5 h-3.5 ${enableGrounding ? 'animate-pulse text-accent' : 'text-text-tertiary'}`} />
                    <span>Web Search: {enableGrounding ? 'Active' : 'Offline'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-subtle rounded-md border border-border-dim/55 transition-all flex items-center justify-center shrink-0"
                    title={isMaximized ? "Exit Fullscreen" : "Maximize Chat"}
                  >
                    {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>

                  <span className="text-[9px] font-mono text-text-tertiary hidden xl:inline">
                    ENGINE: {activeAi === 'gemini' ? '🧠 GEMINI-3.5-FLASH' : '⚡ NEMOTRON-70B'}
                  </span>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 select-text">
                {messages.map((msg, idx) => {
                  const isModel = msg.role === 'model';
                  const msgDate = formatMessageDate(msg.createdAt);
                  const prevMsgDate = idx > 0 ? formatMessageDate(messages[idx - 1].createdAt) : null;
                  const showDateDivider = msgDate !== prevMsgDate;

                  return (
                    <React.Fragment key={msg.id}>
                      {showDateDivider && (
                        <div className="flex items-center justify-center my-4 select-none">
                          <div className="h-[1px] bg-border-dim flex-1" />
                          <span className="px-3 py-1 bg-bg-base border border-border-dim rounded-full text-[9px] font-mono text-text-secondary uppercase tracking-widest flex items-center gap-1.5 mx-3 shadow-sm">
                            <Calendar className="w-3.5 h-3.5 text-accent" />
                            {msgDate}
                          </span>
                          <div className="h-[1px] bg-border-dim flex-1" />
                        </div>
                      )}
                      <div
                        className={`flex gap-3.5 max-w-[85%] group/msg relative ${isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                      >
                        {/* Avatar Icon */}
                        <div className={`w-8 h-8 rounded-sm border shrink-0 flex items-center justify-center text-xs font-bold uppercase select-none ${
                          isModel 
                            ? 'bg-accent-glow border-accent/35 text-accent' 
                            : 'bg-bg-subtle border-border-dim text-text-primary'
                        }`}>
                          {isModel ? <Cpu className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        </div>

                        {/* Speech bubble */}
                        <div className="space-y-1 relative max-w-full">
                          <div className={`p-3.5 rounded-xl text-xs leading-relaxed relative ${
                            isModel 
                              ? 'bg-bg-base border border-border-dim text-text-primary font-sans' 
                              : 'bg-accent border border-accent/10 text-accent-contrast font-sans shadow-sm'
                          }`}>
                            {/* Individual Delete icon */}
                            {msg.id !== 'init' && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="absolute -top-2.5 -right-2.5 p-1 bg-bg-raised border border-border-dim hover:border-red-500/30 hover:text-red-400 rounded-md text-text-tertiary opacity-0 group-hover/msg:opacity-100 transition-all shadow-sm z-10"
                                title="Delete this message"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}

                            {/* Preserve layout/linebreaks for high quality responses */}
                            <div className="whitespace-pre-wrap">{msg.text}</div>

                            {/* Search Grounding Sources */}
                            {isModel && msg.sources && msg.sources.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border-dim space-y-2">
                                <div className="flex items-center gap-1.5 text-[9px] font-mono text-accent uppercase tracking-wider">
                                  <Globe className="w-3 h-3 text-accent" />
                                  <span>Grounded Sources:</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {msg.sources.map((src, sIdx) => (
                                    <a
                                      key={sIdx}
                                      href={src.uri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-bg-subtle hover:bg-bg-base border border-border-dim rounded text-[9.5px] text-text-secondary hover:text-text-primary transition-all font-sans"
                                    >
                                      <span>{src.title}</span>
                                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <span className={`text-[9px] font-mono text-text-tertiary block ${isModel ? 'text-left' : 'text-right'}`}>
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                
                {sending && (
                  <div className="flex gap-3.5 mr-auto max-w-[85%]">
                    <div className="w-8 h-8 rounded-sm bg-accent-glow border border-accent/35 text-accent shrink-0 flex items-center justify-center animate-pulse text-xs select-none">
                      <Cpu className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className="p-3.5 rounded-sm bg-bg-base border border-border-dim text-xs font-mono text-text-secondary flex items-center gap-2 select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span>Resolving parameters...</span>
                    </div>
                  </div>
                )}
                
                <div ref={chatBottomRef} />
              </div>

              {/* Input Bar */}
              <div className="p-3 bg-bg-overlay border-t border-border-dim shrink-0">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(userInput); }}
                  className="flex items-center gap-2 bg-bg-base border border-border-dim rounded px-3 py-1.5"
                >
                  <input
                    type="text"
                    placeholder="Ask HAL anything..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={sending}
                    className="flex-1 bg-transparent border-none outline-none text-xs text-text-primary placeholder:text-text-tertiary py-1.5"
                  />
                  
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!userInput.trim() || sending}
                    className="px-3 py-1.5 bg-accent text-black uppercase font-mono font-bold text-[10px]"
                  >
                    <Send className="w-3 h-3 fill-current" />
                  </Button>
                </form>
              </div>

            </div>

            {/* Sidebar (RIGHT COLUMN) */}
            <div className={`bg-bg-raised border border-border-dim p-4.5 rounded-xl flex flex-col justify-between overflow-y-auto ${
              isMaximized 
                ? 'lg:col-span-4 h-full bg-bg-overlay/95' 
                : 'lg:col-span-4 h-full min-h-[300px]'
            }`}>
              <div className="space-y-4">
                {/* Sidebar Navigation Tabs */}
                <div className="flex border-b border-border-dim pb-1 gap-2 shrink-0">
                  <button
                    onClick={() => setSidebarTab('suggestions')}
                    className={`pb-2 px-1 text-[10px] font-mono uppercase tracking-wider transition-all border-b-2 ${
                      sidebarTab === 'suggestions'
                        ? 'border-accent text-text-primary font-bold'
                        : 'border-transparent text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    Suggested Audits
                  </button>
                  <button
                    onClick={() => setSidebarTab('history')}
                    className={`pb-2 px-1 text-[10px] font-mono uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${
                      sidebarTab === 'history'
                        ? 'border-accent text-text-primary font-bold'
                        : 'border-transparent text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    History Archive
                    {messages.filter(m => m.role === 'user').length > 0 && (
                      <span className="bg-bg-subtle text-[8.5px] px-1.5 py-0.5 rounded-full border border-border-dim font-mono">
                        {messages.filter(m => m.role === 'user').length}
                      </span>
                    )}
                  </button>
                </div>

                {sidebarTab === 'suggestions' ? (
                  <div className="space-y-4">
                    <p className="text-[11.5px] text-text-secondary leading-relaxed font-sans">
                      Select any predefined command pattern below to audit HAL's internal logic, databases, security paradigms, or Constitution.
                    </p>

                    <div className="space-y-2 pt-2">
                      {suggestedPrompts.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(p)}
                          disabled={sending}
                          className="w-full text-left p-3 bg-bg-overlay border border-border-dim rounded-lg text-xs font-sans text-text-secondary hover:border-accent/40 hover:text-text-primary hover:bg-accent/5 transition-all flex items-center justify-between group"
                        >
                          <span className="line-clamp-2">{p}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-text-tertiary group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 flex flex-col h-full">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11.5px] text-text-secondary leading-relaxed font-sans">
                        Review and re-run your historical queries. Keep track of what you searched.
                      </p>
                      {messages.filter(m => m.role === 'user').length > 0 && (
                        <button
                          onClick={handleClearHistory}
                          className="p-1.5 text-text-tertiary hover:text-red-400 hover:bg-red-500/10 rounded transition-all flex items-center gap-1 text-[9.5px] font-mono uppercase tracking-wider border border-transparent hover:border-red-500/20 shrink-0"
                          title="Clear all chat history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Clear
                        </button>
                      )}
                    </div>

                    {/* History Search Input */}
                    <div className="relative flex items-center bg-bg-overlay border border-border-dim rounded px-2.5 py-1.5 shrink-0">
                      <Search className="w-3.5 h-3.5 text-text-tertiary shrink-0 mr-1.5" />
                      <input
                        type="text"
                        placeholder="Search history..."
                        value={historySearchQuery}
                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs text-text-primary placeholder:text-text-tertiary w-full font-sans"
                      />
                      {historySearchQuery && (
                        <button onClick={() => setHistorySearchQuery('')} className="text-text-tertiary hover:text-text-primary shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Search results list */}
                    <div className="space-y-2 overflow-y-auto pr-1 max-h-[350px]">
                      {(() => {
                        const userQueries = messages.filter(m => m.role === 'user');
                        const filteredQueries = userQueries.filter(q => 
                          q.text.toLowerCase().includes(historySearchQuery.toLowerCase())
                        );

                        if (userQueries.length === 0) {
                          return (
                            <div className="py-8 text-center text-text-tertiary font-mono text-[10px] uppercase tracking-wider">
                              No queries recorded yet.
                            </div>
                          );
                        }

                        if (filteredQueries.length === 0) {
                          return (
                            <div className="py-8 text-center text-text-tertiary font-mono text-[10px] uppercase tracking-wider">
                              No matching search queries.
                            </div>
                          );
                        }

                        return filteredQueries.slice().reverse().map((q) => {
                          const qDate = formatMessageDate(q.createdAt);
                          return (
                            <div
                              key={q.id}
                              className="p-2.5 bg-bg-overlay border border-border-dim rounded-lg hover:border-accent/40 transition-all group/hist flex items-start justify-between gap-2"
                            >
                              <button
                                onClick={() => handleSendMessage(q.text)}
                                disabled={sending}
                                className="text-left flex-1 min-w-0"
                                title="Click to re-ask HAL"
                              >
                                <p className="text-xs text-text-secondary group-hover/hist:text-text-primary transition-colors font-sans truncate pr-1">
                                  {q.text}
                                </p>
                                <span className="text-[9px] font-mono text-text-tertiary block mt-0.5 uppercase tracking-wider">
                                  {qDate} &bull; {q.timestamp}
                                </span>
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(q.id)}
                                className="text-text-tertiary hover:text-red-400 p-1 rounded hover:bg-bg-subtle opacity-0 group-hover/hist:opacity-100 transition-opacity duration-150 shrink-0 self-center"
                                title="Delete query from history"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-bg-overlay border border-border-dim/80 p-3 rounded-lg font-mono text-[9px] text-text-tertiary mt-6 select-none leading-relaxed shrink-0">
                <div className="flex justify-between items-center mb-1 text-text-primary font-bold text-[9.5px]">
                  <span>CORE SPEC VERIFIER</span>
                  <span>v2.0</span>
                </div>
                <div>- Encryption: AES-256-GCM Active</div>
                <div>- Database: SQLite / Encrypted</div>
                <div>- Learning Multipliers: Calibrated</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* RENDER FORECASTS SYSTEM */}
      {subTab === 'forecasts' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Active Predictions List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center bg-bg-raised border border-border-dim p-4 rounded-xl">
                <div>
                  <h3 className="text-xs font-bold font-mono text-text-primary tracking-tight uppercase">Active Hypotheses</h3>
                  <p className="text-[10px] text-text-secondary font-mono mt-0.5 uppercase tracking-wider">HAL Operational Predictions</p>
                </div>
                
                <button
                  onClick={handleCreateForecast}
                  className="bg-accent text-black hover:bg-accent/80 px-3 py-2 rounded-sm font-mono text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-wider transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Trigger Auto-Forecast
                </button>
              </div>

              <div className="space-y-3">
                {activeForecasts.length === 0 ? (
                  <div className="py-12 bg-bg-raised border border-border-dim rounded-xl text-center font-mono text-[11px] text-text-tertiary uppercase tracking-wider font-bold">
                    No active hypotheses. Run Auto-Forecaster in the Scheduler/Knowledge tab to compile predictions.
                  </div>
                ) : (
                  activeForecasts.map(f => (
                    <div key={f.id} className="bg-bg-raised border border-border-dim rounded-xl p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-mono font-bold text-accent bg-accent/10 border border-accent/25 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                            {f.metric.replace('_', ' ')}
                          </span>
                          <h4 className="text-sm font-bold text-text-primary mt-2 leading-normal font-mono">
                            Estimated Weekly Value: <strong className="text-accent font-bold font-mono">{f.predicted}</strong>
                          </h4>
                        </div>
                        <div className="text-right font-mono text-[11px] font-bold">
                          <span className="text-[9px] text-text-tertiary block uppercase">Target Expire</span>
                          <span className="text-text-secondary">{new Date(f.targetDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="bg-bg-overlay p-3.5 rounded-lg border border-border-dim/60 space-y-1">
                        <span className="text-[9px] font-mono text-text-tertiary uppercase tracking-widest block font-bold">Operational Hypothesis Assumptions</span>
                        <p className="text-xs text-text-secondary leading-relaxed font-sans">{f.assumptions}</p>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-mono text-text-tertiary pt-2 border-t border-border-dim/40 font-bold">
                        <span>ALGORITHM: {f.modelVersion.toUpperCase()}</span>
                        <span>CONFIDENCE SCORE: <strong className="text-text-primary font-bold">{Math.round(f.confidenceScore * 100)}%</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Closed-loop Learning Insights */}
            <div className="bg-bg-raised border border-border-dim rounded-xl p-5 h-fit space-y-5">
              <div className="flex items-center gap-2 border-b border-border-dim pb-3">
                <BookOpen className="w-4 h-4 text-accent" />
                <span className="text-xs font-mono uppercase tracking-wider text-text-primary font-bold">HAL Learning Lessons</span>
              </div>

              <p className="text-[11.5px] text-text-secondary leading-relaxed font-sans">
                Lessons harvested by the **3.5 Forecast Evaluator** from checking expired predictions. Whenever a prediction deviates from reality, HAL logs an analytical insight to refine downstream budget allocation weights.
              </p>

              <div className="space-y-3.5">
                {learningInsights.length === 0 ? (
                  <p className="text-xs font-mono text-text-tertiary uppercase tracking-wider font-bold">No learning lessons recorded yet. Trigger "EVALUATE FORECASTS" in the Scheduler/Knowledge tab to close loops.</p>
                ) : (
                  learningInsights.map(l => (
                    <div key={l.id} className="bg-bg-overlay border border-border-dim/60 p-4 rounded-sm space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                        <span className="text-accent uppercase tracking-wider font-bold">
                          {l.category.replace('_deviation_learning', '').replace('_', ' ')}
                        </span>
                        <span className="text-text-tertiary uppercase font-bold">Confidence: {Math.round(l.confidence * 100)}%</span>
                      </div>
                      <p className="text-[11.5px] text-text-secondary font-sans leading-relaxed">{l.insight}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER OPERATING CALCULATORS */}
      {subTab === 'calculators' && (
        <div className="space-y-6 animate-fade-in">
          <CalculatorsSection />
        </div>
      )}

      {/* RENDER INTELLIGENCE AUDIT & 6D OUTCOMES */}
      {subTab === 'audit' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-raised border border-border-dim p-5 rounded-xl">
            <div>
              <h3 className="text-sm font-bold font-mono text-text-primary tracking-tight uppercase flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent" />
                Phase 6D Intelligence Audit & Accuracy Trends
              </h3>
              <p className="text-[11px] text-text-secondary font-mono mt-1 uppercase tracking-wider">
                Deterministic Outcome Tracking, Prediction Accuracy, and Forensic Verification
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={handleMeasureOutcomes} isLoading={loadingOutcomes}>
              TRIGGER OUTCOME MEASUREMENT
            </Button>
          </div>

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-bg-raised border border-border-dim p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-text-tertiary uppercase font-bold">Total Outcomes</span>
              <div className="text-2xl font-bold font-mono text-text-primary">
                {outcomesSummary?.totalOutcomes || outcomesData.length}
              </div>
            </div>
            <div className="bg-bg-raised border border-border-dim p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-text-tertiary uppercase font-bold">Avg Prediction Accuracy</span>
              <div className="text-2xl font-bold font-mono text-accent">
                {Math.round((outcomesSummary?.averagePredictionAccuracy || 0) * 100)}%
              </div>
            </div>
            <div className="bg-bg-raised border border-border-dim p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-text-tertiary uppercase font-bold">Successful Outcomes</span>
              <div className="text-2xl font-bold font-mono text-positive">
                {outcomesSummary?.successfulCount || 0}
              </div>
            </div>
            <div className="bg-bg-raised border border-border-dim p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-text-tertiary uppercase font-bold">Insufficient Data / Pending</span>
              <div className="text-2xl font-bold font-mono text-[#f59e0b]">
                {outcomesSummary?.insufficientDataCount || 0}
              </div>
            </div>
          </div>

          {/* Recharts Prediction Accuracy Trends */}
          <div className="bg-bg-raised border border-border-dim p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-dim pb-3">
              <h4 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-accent" />
                Prediction Accuracy Trends Over Time
              </h4>
              <span className="text-[10px] font-mono text-text-tertiary">Deterministic Historical Evaluation</span>
            </div>
            <div className="h-64 w-full pt-4">
              {outcomesData.length === 0 ? (
                <div className="h-full flex items-center justify-center font-mono text-xs text-text-tertiary uppercase">
                  No outcome records found. Click "Trigger Outcome Measurement" above.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={outcomesData.map((o, idx) => ({
                    name: `Outcome #${idx + 1}`,
                    accuracy: Number((Number(o.predictionAccuracy || 0) * 100).toFixed(1)),
                    status: o.outcomeStatus,
                    classification: o.outcomeClassification || 'pending'
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" />
                    <XAxis dataKey="name" stroke="#8b949e" fontSize={10} fontFamily="monospace" />
                    <YAxis stroke="#8b949e" fontSize={10} fontFamily="monospace" domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace' }}
                      formatter={(val: any) => [`${val}%`, 'Prediction Accuracy']}
                    />
                    <Line type="monotone" dataKey="accuracy" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#60a5fa', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Forensic Audit Section: Exact Formulas & Threshold Logic */}
          <div className="bg-bg-raised border border-border-dim p-6 rounded-xl space-y-4">
            <h4 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border-dim pb-3">
              <Terminal className="w-4 h-4 text-accent" />
              Forensic Intelligence Audit & Mathematical Specifications
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="bg-bg-overlay p-4 rounded-lg border border-border-dim/60 space-y-2">
                <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider block">
                  Prediction Accuracy Formula (Auditable Code)
                </span>
                <div className="p-3 bg-bg-base border border-border-dim rounded font-mono text-[11px] text-accent">
                  1 - abs(expected - actual) / abs(expected)
                </div>
                <p className="text-text-secondary text-[11px] font-sans leading-relaxed">
                  Protected against division by zero. Bounded strictly between 0.0 (0%) and 1.0 (100%).
                </p>
              </div>

              <div className="bg-bg-overlay p-4 rounded-lg border border-border-dim/60 space-y-2">
                <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider block">
                  Observation Window Rule
                </span>
                <div className="p-3 bg-bg-base border border-border-dim rounded font-mono text-[11px] text-text-primary">
                  observation_start → observation_end (7 Days)
                </div>
                <p className="text-text-secondary text-[11px] font-sans leading-relaxed">
                  Outcomes remain in 'pending_observation' or 'observing' status until the observation window elapses.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider block mb-2">
                Deterministic Outcome Classification Thresholds
              </span>
              <div className="border border-border-dim rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-bg-overlay text-text-tertiary text-[10px] uppercase border-b border-border-dim">
                    <tr>
                      <th className="p-3">Classification</th>
                      <th className="p-3">Accuracy Threshold</th>
                      <th className="p-3">Revenue Condition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dim/50 text-text-secondary">
                    <tr>
                      <td className="p-3 font-bold text-positive">successful</td>
                      <td className="p-3">≥ 85% (0.85)</td>
                      <td className="p-3">Actual Revenue ≥ 90% of Expected</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-sky-400">partially_successful</td>
                      <td className="p-3">60% – 84.9%</td>
                      <td className="p-3">Directional alignment with variance</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-yellow-400">neutral</td>
                      <td className="p-3">40% – 59.9%</td>
                      <td className="p-3">Moderate divergence</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-danger">failed</td>
                      <td className="p-3">&lt; 40% (0.40)</td>
                      <td className="p-3">Severe divergence from forecast</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-text-tertiary">insufficient_data</td>
                      <td className="p-3">N/A</td>
                      <td className="p-3">Active observation window / missing metrics</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
