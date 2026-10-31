import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

export const CampusAICopilot = ({ isOpen, onClose, initialQuery = '' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${user?.email?.split('@')[0] || 'there'}! I am **Veritas AI Copilot**, your intelligent academic advisor. Ask me anything about course registration, your attendance risk, college circulars, or let me draft announcements for you!`,
      highlights: [
        { label: 'Role', value: user?.role || 'STUDENT', tone: 'info' },
        { label: 'Semester', value: 'Fall 2025', tone: 'positive' },
      ],
      actions: [
        { label: 'Am I at attendance risk?', query: 'What is my attendance status and risk?' },
        { label: 'Which courses are open?', query: 'What courses can I enroll in?' },
        { label: 'Draft a notice', query: 'Draft an announcement for midterm project submission' },
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSend(initialQuery);
    }
  }, [initialQuery, isOpen]);

  const handleSend = async (queryText = prompt) => {
    const textToSend = typeof queryText === 'string' ? queryText.trim() : prompt.trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await axiosClient.post('/ai/query', { prompt: textToSend });
      if (res.success) {
        const aiMsg = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: res.response,
          intent: res.intent,
          highlights: res.highlights || [],
          suggestedActions: res.suggestedActions || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(res.message || 'AI query failed');
      }
    } catch (err) {
      const errorMsg = {
        id: `err_${Date.now()}`,
        sender: 'ai',
        text: `⚠️ **Unable to complete inquiry**: ${err.message || 'Server error'}. Please verify your connection or try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const executeAction = (action) => {
    if (action.path) {
      onClose();
      navigate(action.path);
    } else if (action.query) {
      handleSend(action.query);
    } else if (action.action === 'OPEN_SIMULATOR') {
      onClose();
      navigate('/attendance?tab=simulator');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-0 sm:p-4 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md md:max-w-lg h-full sm:h-[90vh] bg-white sm:rounded-2xl shadow-2xl flex flex-col border border-[#cbd5e1] overflow-hidden"
        role="dialog"
        aria-label="Veritas Campus AI Copilot"
      >
        {/* Header */}
        <div className="p-4 bg-linear-to-r from-[#0b1c30] via-[#122844] to-[#1e3a5f] text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white leading-tight">CampusAI Copilot</h3>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live DB Sync
                </span>
              </div>
              <p className="text-[11px] text-sky-200">Veritas University Academic Intelligence</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close Assistant"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Quick Prompts Bar */}
        <div className="bg-[#f8f9ff] px-3 py-2 border-b border-[#e2e8f0] flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[11px] font-semibold text-[#515f74] shrink-0 pl-1">Prompts:</span>
          <button
            onClick={() => handleSend('What is my attendance status and risk?')}
            className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-[#cbd5e1] text-[#0b1c30] hover:border-sky-500 hover:text-sky-600 transition-colors text-[11px] font-medium shadow-2xs"
          >
            📊 Attendance Risk
          </button>
          <button
            onClick={() => handleSend('What courses can I enroll in?')}
            className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-[#cbd5e1] text-[#0b1c30] hover:border-sky-500 hover:text-sky-600 transition-colors text-[11px] font-medium shadow-2xs"
          >
            📚 Open Courses
          </button>
          <button
            onClick={() => handleSend('What are the latest circulars?')}
            className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-[#cbd5e1] text-[#0b1c30] hover:border-sky-500 hover:text-sky-600 transition-colors text-[11px] font-medium shadow-2xs"
          >
            📢 Recent Notices
          </button>
          <button
            onClick={() => handleSend('Draft an announcement about midterm project submission')}
            className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-[#cbd5e1] text-[#0b1c30] hover:border-sky-500 hover:text-sky-600 transition-colors text-[11px] font-medium shadow-2xs"
          >
            ✍️ Draft Notice
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isAi ? 'items-start' : 'items-end flex-row-reverse'}`}
              >
                {isAi && (
                  <div className="w-7 h-7 rounded-lg bg-[#0b1c30] text-sky-400 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-xs ${
                    isAi
                      ? 'bg-white text-[#0b1c30] border border-[#e2e8f0]'
                      : 'bg-[#0f172a] text-white rounded-br-xs'
                  }`}
                >
                  {/* Highlights Cards (if present) */}
                  {msg.highlights && msg.highlights.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                      {msg.highlights.map((h, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-[#f8f9ff] border border-[#e2e8f0] flex flex-col"
                        >
                          <span className="text-[10px] text-[#515f74] font-medium">{h.label}</span>
                          <span
                            className={`text-xs font-bold ${
                              h.tone === 'positive'
                                ? 'text-emerald-600'
                                : h.tone === 'warning'
                                ? 'text-amber-600'
                                : h.tone === 'info'
                                ? 'text-sky-600'
                                : 'text-[#0b1c30]'
                            }`}
                          >
                            {h.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Body Text */}
                  <div className="leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.text.split('\n').map((line, i) => {
                      if (line.startsWith('### ')) {
                        return <h4 key={i} className="font-bold text-sm text-[#0b1c30] mt-1 mb-1">{line.replace('### ', '')}</h4>;
                      }
                      if (line.startsWith('• ')) {
                        return <div key={i} className="flex items-start gap-1.5 my-1"><span className="text-sky-500">•</span><span>{line.replace('• ', '')}</span></div>;
                      }
                      if (line.startsWith('> ')) {
                        return <blockquote key={i} className="border-l-2 border-indigo-500 pl-2.5 py-1 my-1.5 bg-indigo-50/50 rounded-r text-[#1e293b] italic">{line.replace('> ', '')}</blockquote>;
                      }
                      return <p key={i} className={line === '' ? 'h-1.5' : 'my-0.5'}>{line}</p>;
                    })}
                  </div>

                  {/* Suggested Action Pills */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-[#e2e8f0] flex flex-wrap gap-1.5">
                      {msg.suggestedActions.map((act, actIdx) => (
                        <button
                          key={actIdx}
                          onClick={() => executeAction(act)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-[11px] border border-indigo-200 transition-colors cursor-pointer"
                        >
                          <span>{act.label}</span>
                          <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Initial action choices */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-[#e2e8f0] flex flex-col gap-1.5">
                      {msg.actions.map((act, actIdx) => (
                        <button
                          key={actIdx}
                          onClick={() => executeAction(act)}
                          className="text-left px-2.5 py-1.5 rounded-lg bg-sky-50/60 hover:bg-sky-100/70 text-sky-800 text-[11px] font-medium border border-sky-200/80 transition-colors"
                        >
                          💡 {act.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={`mt-1.5 text-[9px] ${isAi ? 'text-[#94a3b8]' : 'text-slate-400 text-right'}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-start animate-pulse">
              <div className="w-7 h-7 rounded-lg bg-[#0b1c30] text-sky-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
              </div>
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-3.5 shadow-xs flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]"></div>
                <span className="text-[11px] text-[#515f74] ml-1">Analyzing database records...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-3 bg-white border-t border-[#e2e8f0] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about attendance, courses, circulars, or draft..."
                disabled={loading}
                className="w-full pl-3 pr-8 py-2.5 bg-[#f8f9ff] border border-[#cbd5e1] rounded-xl text-xs text-[#0b1c30] placeholder-[#94a3b8] focus:outline-none focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-50"
              />
              {prompt && (
                <button
                  type="button"
                  onClick={() => setPrompt('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="px-3.5 py-2.5 bg-linear-to-r from-[#0f172a] to-[#1e3a5f] hover:from-[#1e293b] hover:to-[#2b5282] text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Ask</span>
              <span className="material-symbols-outlined text-[16px]">send</span>
            </button>
          </form>
          <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-[#515f74]">
            <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-100 border text-slate-700 font-mono">Enter</kbd> to submit</span>
            <span>Shortcut: <kbd className="px-1 py-0.5 rounded bg-slate-100 border text-slate-700 font-mono">Ctrl + J</kbd></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusAICopilot;
