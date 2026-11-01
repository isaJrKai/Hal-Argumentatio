import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Archive, Bot, ChevronLeft, ChevronRight, Copy, FolderPlus, Globe, MessageSquare, MoreHorizontal, Plus, RefreshCw, Send, Sparkles, Trash2, X } from 'lucide-react';
import { useBusinessContext } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';

interface ChatMessage {
  id: string; role: 'user' | 'model'; text: string;
  enableGrounding?: boolean; sources?: Array<{ title: string; uri: string }>; createdAt?: string;
}
interface ChatProject { id: string; name: string; description?: string | null; archivedAt?: string | null; }
interface ChatConversation { id: string; projectId?: string | null; title: string; archivedAt?: string | null; updatedAt: string; }
interface Props { token: string | null; }

const renderMessageText = (text: string) => text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\x60[^\x60]+\x60)/g).map((part, index) => {
  if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
  if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
  if (part.startsWith('`') && part.endsWith('`')) return <code key={index} className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono">{part.slice(1, -1)}</code>;
  return part;
});

export const ChatBotPanel: React.FC<Props> = ({ token }) => {
  const { regionalProfile, activeNiche } = useBusinessContext();
  const { showToast } = useToast();
  const authToken = token || localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token') || '';
  const [projects, setProjects] = useState<ChatProject[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [grounding, setGrounding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const api = useCallback(async (url: string, init: RequestInit = {}) => {
    const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${authToken}`, ...(init.headers || {}) } });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Request failed (${response.status})`);
    }
    return response.status === 204 ? null : response.json();
  }, [authToken]);

  const refreshWorkspace = useCallback(async () => {
    const [projectRows, conversationRows] = await Promise.all([
      api('/api/intelligence/chat/projects'),
      api('/api/intelligence/chat/conversations')
    ]);
    setProjects(Array.isArray(projectRows) ? projectRows : []);
    const rows = Array.isArray(conversationRows) ? conversationRows : [];
    setConversations(rows);
    return rows as ChatConversation[];
  }, [api]);

  useEffect(() => {
    if (!authToken) return;
    refreshWorkspace().then(rows => {
      if (!activeConversationId && rows.length) setActiveConversationId(rows.find(c => !c.archivedAt)?.id || rows[0].id);
    }).catch(error => showToast({ title: 'Chat workspace unavailable', message: error.message, type: 'error' }));
  }, [authToken, refreshWorkspace]);

  const loadConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
    try {
      const rows = await api(`/api/intelligence/chat/history?conversationId=${encodeURIComponent(id)}`);
      setMessages(Array.isArray(rows) ? rows : []);
    } catch (error: any) {
      setMessages([]);
      showToast({ title: 'Could not open conversation', message: error.message, type: 'error' });
    }
  }, [api, showToast]);

  useEffect(() => {
    if (activeConversationId) loadConversation(activeConversationId);
    else setMessages([]);
  }, [activeConversationId, loadConversation]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;
  const visibleConversations = useMemo(() => conversations.filter(c => showArchived ? !!c.archivedAt : !c.archivedAt)
    .filter(c => !activeProjectId || c.projectId === activeProjectId), [conversations, showArchived, activeProjectId]);

  const createConversation = async (projectId: string | null = activeProjectId) => {
    try {
      const created = await api('/api/intelligence/chat/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, title: 'New chat' }) });
      await refreshWorkspace();
      setActiveProjectId(projectId);
      setActiveConversationId(created.id);
      setMessages([]);
    } catch (error: any) { showToast({ title: 'Could not create chat', message: error.message, type: 'error' }); }
  };

  const createProject = async () => {
    const name = window.prompt('Name this project (for example, Edmonton — Custom Home Builders):');
    if (!name?.trim()) return;
    try {
      const project = await api('/api/intelligence/chat/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() }) });
      await refreshWorkspace();
      setActiveProjectId(project.id);
      await createConversation(project.id);
    } catch (error: any) { showToast({ title: 'Could not create project', message: error.message, type: 'error' }); }
  };

  const archiveConversation = async (conversation: ChatConversation) => {
    try {
      await api(`/api/intelligence/chat/conversations/${conversation.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: !conversation.archivedAt }) });
      await refreshWorkspace();
      if (!conversation.archivedAt && activeConversationId === conversation.id) {
        const next = conversations.find(c => c.id !== conversation.id && !c.archivedAt);
        setActiveConversationId(next?.id || null);
      }
    } catch (error: any) { showToast({ title: 'Could not update chat', message: error.message, type: 'error' }); }
  };

  const deleteConversation = async (conversation: ChatConversation) => {
    if (!window.confirm(`Permanently delete “${conversation.title}” and its messages?`)) return;
    try {
      await api(`/api/intelligence/chat/conversations/${conversation.id}`, { method: 'DELETE' });
      const remaining = conversations.filter(c => c.id !== conversation.id);
      setConversations(remaining);
      if (activeConversationId === conversation.id) setActiveConversationId(remaining.find(c => !c.archivedAt)?.id || null);
      showToast({ title: 'Conversation deleted', message: 'The server confirmed permanent deletion.', type: 'success' });
    } catch (error: any) { showToast({ title: 'Delete failed', message: error.message, type: 'error' }); }
  };

  const sendMessage = async (value?: string) => {
    const message = (value || inputText).trim();
    if (!message || loading) return;
    let conversationId = activeConversationId;
    if (!conversationId) {
      try {
        const created = await api('/api/intelligence/chat/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: activeProjectId, title: 'New chat' }) });
        conversationId = created.id;
        setActiveConversationId(conversationId);
        await refreshWorkspace();
      } catch (error: any) { showToast({ title: 'Could not start chat', message: error.message, type: 'error' }); return; }
    }
    setInputText('');
    setLoading(true);
    const tempId = 'pending-' + Date.now();
    setMessages(prev => [...prev, { id: tempId, role: 'user', text: message, createdAt: new Date().toISOString() }]);
    try {
      await api('/api/intelligence/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, enableGrounding: grounding, activeAi: 'dual', conversationId }) });
      const rows = await api(`/api/intelligence/chat/history?conversationId=${encodeURIComponent(conversationId)}`);
      setMessages(Array.isArray(rows) ? rows : []);
      await refreshWorkspace();
    } catch (error: any) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      showToast({ title: 'HAL could not respond', message: error.message, type: 'error' });
    } finally { setLoading(false); }
  };

  const copyMessage = async (message: ChatMessage) => {
    await navigator.clipboard.writeText(message.text);
    setCopiedId(message.id);
    showToast({ title: 'Copied', message: 'Message copied to clipboard.', type: 'success' });
    window.setTimeout(() => setCopiedId(null), 1800);
  };

  const projectName = projects.find(p => p.id === activeProjectId)?.name || 'All chats';

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-bg-base text-text-primary">
      {sidebarOpen && <aside className="w-64 shrink-0 border-r border-border-dim bg-bg-raised flex flex-col min-h-0">
        <div className="p-3 flex items-center gap-2">
          <button onClick={() => createConversation(activeProjectId)} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-2 text-xs font-semibold"><Plus className="w-4 h-4"/> New chat</button>
          <button onClick={() => setSidebarOpen(false)} title="Collapse sidebar" className="p-2 rounded-lg hover:bg-bg-subtle text-text-secondary"><ChevronLeft className="w-4 h-4"/></button>
        </div>
        <div className="px-3 pb-2 flex items-center justify-between"><span className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary">Projects</span><button onClick={createProject} title="Create project" className="p-1.5 rounded hover:bg-bg-subtle"><FolderPlus className="w-4 h-4"/></button></div>
        <div className="px-2 space-y-1 overflow-y-auto max-h-[38%]">
          <button onClick={() => setActiveProjectId(null)} className={`w-full text-left px-2.5 py-2 rounded-lg text-xs ${!activeProjectId ? 'bg-bg-subtle text-text-primary' : 'text-text-secondary hover:bg-bg-subtle'}`}>All chats</button>
          {projects.filter(p => !p.archivedAt).map(project => <button key={project.id} onClick={() => setActiveProjectId(project.id)} className={`w-full text-left px-2.5 py-2 rounded-lg text-xs truncate ${activeProjectId === project.id ? 'bg-cyan-500/10 text-cyan-500' : 'text-text-secondary hover:bg-bg-subtle'}`}><span className="mr-2 text-cyan-500">▦</span>{project.name}</button>)}
        </div>
        <div className="mt-4 px-3 pb-2 flex items-center justify-between"><span className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary">{showArchived ? 'Archived chats' : 'Recent chats'}</span><button onClick={() => setShowArchived(!showArchived)} className="text-[10px] text-cyan-500 hover:underline">{showArchived ? 'Recent' : 'Archived'}</button></div>
        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3 space-y-1">
          {visibleConversations.map(conversation => <div key={conversation.id} className={`group flex items-center gap-1 rounded-lg ${activeConversationId === conversation.id ? 'bg-bg-subtle' : 'hover:bg-bg-subtle'}`}>
            <button onClick={() => loadConversation(conversation.id)} className="flex-1 min-w-0 text-left px-2.5 py-2 text-xs truncate text-text-secondary"><MessageSquare className="w-3 h-3 inline mr-2 opacity-60"/>{conversation.title}</button>
            <button onClick={() => archiveConversation(conversation)} title={conversation.archivedAt ? 'Restore chat' : 'Archive chat'} className="p-1.5 opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-cyan-500"><Archive className="w-3 h-3"/></button>
            <button onClick={() => deleteConversation(conversation)} title="Delete chat" className="p-1.5 mr-1 opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-rose-500"><Trash2 className="w-3 h-3"/></button>
          </div>)}
          {!visibleConversations.length && <p className="px-3 py-4 text-[11px] text-text-tertiary">No chats here yet.</p>}
        </div>
      </aside>}
      <main className="flex-1 min-w-0 flex flex-col min-h-0">
        <header className="h-14 shrink-0 border-b border-border-dim bg-bg-raised/80 flex items-center justify-between px-4 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} title="Open sidebar" className="p-2 rounded-lg hover:bg-bg-subtle"><ChevronRight className="w-4 h-4"/></button>}
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-500"><Bot className="w-4 h-4"/></div>
            <div className="min-w-0"><div className="text-xs font-semibold truncate">{activeConversation?.title || 'HAL AI'}</div><div className="text-[10px] text-text-tertiary truncate">{projectName} · Project-aware conversations</div></div>
          </div>
          <button onClick={() => setGrounding(!grounding)} className={`shrink-0 px-2.5 py-1.5 rounded-lg border text-[10px] flex items-center gap-1.5 ${grounding ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-500' : 'border-border-dim text-text-tertiary'}`}><Globe className="w-3.5 h-3.5"/> Search grounding</button>
        </header>
        <section className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {!messages.length && <div className="min-h-[55vh] flex flex-col justify-center items-center text-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500"><Sparkles className="w-6 h-6"/></div>
              <div><h2 className="text-xl font-semibold">What are we working on?</h2><p className="text-sm text-text-secondary mt-2">Start a conversation in {projectName === 'All chats' ? 'HAL' : projectName}. Chats stay saved in their project.</p></div>
              <div className="grid sm:grid-cols-2 gap-2 w-full max-w-xl text-left">
                {[`Analyze ${regionalProfile.city} ${activeNiche} conversion bottlenecks`,'Build a prospect research plan','Review this project’s commercial strategy','Draft an evidence-based outreach sequence'].map(prompt => <button key={prompt} onClick={() => sendMessage(prompt)} className="p-3 rounded-xl border border-border-dim hover:bg-bg-raised text-xs text-text-secondary">{prompt}</button>)}
              </div>
            </div>}
            {messages.map(message => <article key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'model' && <div className="w-7 h-7 shrink-0 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center"><Bot className="w-4 h-4"/></div>}
              <div className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-7 ${message.role === 'user' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-bg-raised border border-border-dim text-text-primary rounded-bl-md'}`}>
                <div className="whitespace-pre-wrap">{renderMessageText(message.text)}</div>
                {message.sources?.length ? <div className="mt-3 pt-2 border-t border-border-dim text-xs space-y-1"><div className="font-semibold text-text-tertiary">Sources</div>{message.sources.map((source, index) => <a key={index} href={source.uri} target="_blank" rel="noreferrer" className="block text-cyan-500 hover:underline truncate">{source.title || source.uri}</a>)}</div> : null}
                {message.role === 'model' && <div className="flex justify-end mt-2"><button onClick={() => copyMessage(message)} title="Copy response" className="text-text-tertiary hover:text-cyan-500">{copiedId === message.id ? 'Copied' : <Copy className="w-3.5 h-3.5"/>}</button></div>}
              </div>
              {message.role === 'user' && <div className="w-7 h-7 shrink-0 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-semibold">You</div>}
            </article>)}
            {loading && <div className="flex items-center gap-2 text-xs text-text-tertiary"><span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"/>HAL is thinking…</div>}
            <div ref={endRef}/>
          </div>
        </section>
        <footer className="shrink-0 border-t border-border-dim bg-bg-raised/70 p-3 sm:p-4">
          <form onSubmit={event => { event.preventDefault(); sendMessage(); }} className="max-w-3xl mx-auto flex items-end gap-2">
            <textarea value={inputText} onChange={event => setInputText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder="Message HAL… (Enter to send, Shift+Enter for a new line)" rows={2} className="flex-1 resize-none rounded-2xl border border-border-dim bg-bg-base px-4 py-3 text-sm outline-none focus:border-cyan-500 text-text-primary" disabled={loading}/>
            <button type="submit" disabled={!inputText.trim() || loading} className="p-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white"><Send className="w-4 h-4"/></button>
          </form>
          <p className="text-center text-[10px] text-text-tertiary mt-2">HAL can make mistakes. Verify important business decisions against source data.</p>
        </footer>
      </main>
    </div>
  );
};
