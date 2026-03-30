'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/use-supabase';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { Bot, Send, Plus, Sparkles, User, Loader2, MessageSquare, X } from 'lucide-react';

const QUICK_PROMPTS = [
  "What's my VAT liability?",
  "Show my top expenses",
  "Am I profitable?",
  "Which clients owe me money?",
  "How much did I spend on staff?",
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatPage() {
  const supabase = useSupabase();
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const profile = useWorkspaceStore((s) => s.profile);
  const queryClient = useQueryClient();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showMobileSessions, setShowMobileSessions] = useState(false);

  // Fetch sessions
  const { data: sessions } = useQuery({
    queryKey: ['chat-sessions', workspace?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('workspace_id', workspace!.id)
        .order('updated_at', { ascending: false })
        .limit(30);
      return data || [];
    },
    enabled: !!workspace?.id,
  });

  // Load session messages
  const loadSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    setMessages((data || []).map((m: any) => ({ id: m.id, role: m.role, content: m.content })));
  };

  // Create new session
  const createSession = async () => {
    const { data } = await supabase
      .from('chat_sessions')
      .insert({
        workspace_id: workspace!.id,
        user_id: profile!.id,
        title: 'New Conversation',
      })
      .select()
      .single();
    if (data) {
      setCurrentSessionId(data.id);
      setMessages([]);
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    }
    return data;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || streaming) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      const session = await createSession();
      if (!session) return;
      sessionId = session.id;
    }

    setInput('');
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: messageText };
    setMessages(prev => [...prev, userMsg]);

    const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMsg]);
    setStreaming(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          sessionId,
          workspaceId: workspace!.id,
        }),
      });

      if (!res.ok) throw new Error('Failed');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                fullText += data.text;
                setMessages(prev =>
                  prev.map(m => m.id === assistantMsg.id ? { ...m, content: fullText } : m)
                );
              } catch {}
            }
          }
        }
      }

      // Update session title if first message
      if (messages.length === 0) {
        const title = messageText.substring(0, 50);
        await supabase.from('chat_sessions').update({ title }).eq('id', sessionId);
        queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      }
    } catch (error) {
      setMessages(prev =>
        prev.map(m => m.id === assistantMsg.id ? { ...m, content: 'Sorry, I encountered an error. Please try again.' } : m)
      );
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100dvh-64px)] -m-4 sm:-m-6 overflow-hidden">
      {/* Mobile sessions overlay */}
      {showMobileSessions && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setShowMobileSessions(false)} />
      )}

      {/* Sessions Panel */}
      <div className={`fixed lg:static top-0 left-0 h-full w-[260px] border-r border-[rgba(108,63,232,0.08)] bg-white z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
        showMobileSessions ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } hidden lg:flex ${showMobileSessions ? '!flex' : ''}`}>
        <div className="p-4 flex items-center gap-2">
          <button onClick={() => { createSession(); setShowMobileSessions(false); }} className="btn-primary flex-1 py-2.5 text-sm">
            <Plus size={14} className="mr-1.5" /> New Conversation
          </button>
          <button onClick={() => setShowMobileSessions(false)} className="lg:hidden p-2 text-text-muted hover:text-text-primary">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {(sessions || []).map((session: any) => (
            <button
              key={session.id}
              onClick={() => { loadSession(session.id); setShowMobileSessions(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                currentSessionId === session.id
                  ? 'bg-brand-1/8 text-brand-1 font-medium'
                  : 'text-text-secondary hover:bg-brand-1/5'
              }`}
            >
              <p className="truncate">{session.title}</p>
              <p className="text-[10px] text-text-muted mt-0.5">
                {new Date(session.updated_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 border-b border-[rgba(108,63,232,0.08)] flex items-center gap-3">
          <button onClick={() => setShowMobileSessions(true)} className="lg:hidden text-text-secondary hover:text-text-primary">
            <MessageSquare size={18} />
          </button>
          <Bot size={18} className="text-brand-1" />
          <span className="text-sm font-medium">Emiday AI</span>
          <span className="badge-info text-[10px] hidden sm:inline">Grok</span>
          <span className="text-xs text-text-muted ml-auto hidden sm:inline">{workspace?.name}</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-white" />
              </div>
              <h2 className="font-instrument-serif italic text-xl mb-2">Ask anything about your finances</h2>
              <p className="text-sm text-text-muted max-w-md mb-6">
                I can answer questions about your revenue, expenses, VAT liability, profitability, and more — using your real financial data.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="px-4 py-2 rounded-full bg-brand-1/5 border border-brand-1/15 text-xs font-medium text-brand-1 hover:bg-brand-1/10 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-1/10 border border-brand-1/15 ml-auto'
                    : 'bg-white border border-[rgba(108,63,232,0.08)] shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.role === 'assistant' && !msg.content && streaming && (
                  <Loader2 size={14} className="animate-spin text-brand-1" />
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-brand-3/20 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-brand-1" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-[rgba(108,63,232,0.08)]">
          <div className="flex items-end gap-2 sm:gap-3 glass-card p-2 sm:p-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything — 'What's my VAT this month?' or 'Am I profitable?'"
              rows={1}
              className="flex-1 bg-transparent border-none outline-none text-sm resize-none max-h-[80px] placeholder:text-text-muted"
              style={{ minHeight: '24px' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || streaming}
              className="btn-primary p-2.5 rounded-xl disabled:opacity-40"
              aria-label="Send message"
            >
              {streaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
