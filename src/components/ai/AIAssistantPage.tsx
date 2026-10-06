import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  BookOpen, 
  Scale, 
  AlertTriangle, 
  Copy, 
  Check, 
  Bookmark, 
  User,
  ArrowRight
} from 'lucide-react';
import type { AIChatMessage } from '../../types';

interface AIAssistantPageProps {
  initialQuery?: string;
  onNavigateTab: (tab: string) => void;
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  initialQuery,
  onNavigateTab
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnalyzing]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: query
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/ai/chat', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: query }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The assistant could not answer.');
      const assistantMsg: AIChatMessage = { id: `ai-${Date.now()}`, sender: 'assistant', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: result.answer };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (reason) {
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, sender: 'assistant', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: reason instanceof Error ? reason.message : 'The assistant could not answer. Please try again.' }]);
    } finally { setIsAnalyzing(false); }
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="ai-assistant-page">
      {/* Disclaimer Top Banner */}
      <div className="disclaimer-banner">
        <AlertTriangle size={20} className="disclaimer-icon" />
        <div className="disclaimer-text">
          <strong>Legal information only:</strong> AI responses can be incomplete or incorrect and may not reflect current law. 
          They are <strong>not legal advice</strong> and do not establish an attorney-client relationship. Verify any answer with a qualified advocate before acting.
        </div>
      </div>

      {/* Main Chat Layout */}
      <div className="chat-container card">
        <div className="chat-header">
          <div className="assistant-brand">
            <div className="bot-avatar">
              <Bot size={22} color="#FFFFFF" />
            </div>
            <div>
              <h3>JurisAI Legal Assistant</h3>
              <span className="bot-status">
                <span className="dot-active" /> Groq-powered legal information assistant
              </span>
            </div>
          </div>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setMessages([])}
          >
            Reset Chat
          </button>
        </div>

        {/* Messages Stream */}
        <div className="chat-messages-stream">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`chat-bubble-wrapper ${msg.sender === 'user' ? 'user-bubble' : 'ai-bubble'}`}
            >
              <div className="avatar-mini">
                {msg.sender === 'user' ? (
                  <User size={16} />
                ) : (
                  <Bot size={16} color="#FFFFFF" />
                )}
              </div>

              <div className="bubble-content">
                <div className="bubble-meta">
                  <span className="sender-name">{msg.sender === 'user' ? 'Ananya Sharma' : 'JurisAI Assistant'}</span>
                  <span className="msg-time">{msg.timestamp}</span>
                </div>

                <div className="bubble-text">
                  {msg.text.split('\n\n').map((para, i) => (
                    <p key={i} className="mb-2">{para}</p>
                  ))}
                </div>

                {/* Statutory Sections Card */}
                {msg.legalSections && msg.legalSections.length > 0 && (
                  <div className="legal-sections-card">
                    <div className="card-section-header">
                      <BookOpen size={16} color="#2563EB" />
                      <span>Relevant Legal Provisions & Sections</span>
                    </div>

                    <div className="sections-list">
                      {msg.legalSections.map((sec, idx) => (
                        <div key={idx} className="sec-item">
                          <div className="sec-title-badge">
                            <span className="act-name">{sec.actName}</span>
                            <span className="sec-no">{sec.section}</span>
                          </div>
                          <div className="sec-heading">{sec.title}</div>
                          <div className="sec-desc">{sec.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Precedent Citations Card */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="citations-card">
                    <div className="card-section-header">
                      <Scale size={16} color="#7C3AED" />
                      <span>Relevant Supreme Court / High Court Precedents</span>
                    </div>

                    <div className="citations-list">
                      {msg.citations.map((cit, idx) => (
                        <div key={idx} className="citation-item">
                          <div className="cit-title"><strong>{cit.caseTitle}</strong> ({cit.citation})</div>
                          <div className="cit-rel">Relevance: {cit.relevance}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Chips */}
                {msg.suggestedActions && (
                  <div className="suggested-actions-row">
                    {msg.suggestedActions.map((act, idx) => (
                      <button 
                        key={idx}
                        className="action-chip-btn"
                        onClick={() => onNavigateTab('cases')}
                      >
                        {act} <ArrowRight size={12} />
                      </button>
                    ))}
                  </div>
                )}

                {/* Action Bar */}
                {msg.sender === 'assistant' && (
                  <div className="bubble-actions">
                    <button 
                      className="action-btn"
                      onClick={() => copyText(msg.id, msg.text)}
                    >
                      {copiedId === msg.id ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy Response'}</span>
                    </button>
                    <button className="action-btn" onClick={() => alert('Saved to Case Notes!')}>
                      <Bookmark size={14} />
                      <span>Save to Notes</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isAnalyzing && (
            <div className="chat-bubble-wrapper ai-bubble">
              <div className="avatar-mini">
                <Bot size={16} color="#FFFFFF" />
              </div>
              <div className="bubble-content">
                <div className="typing-indicator">
                  <Sparkles size={16} className="sparkle-spin" />
                  <span>Searching statutory acts, IPC/BNS provisions, and High Court judgments...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Preset Prompt Chips */}
        <div className="preset-prompts-bar">
          <span className="preset-label">Suggested Questions:</span>
          {[
            'What is the procedure for property partition?',
            'Explain Lis Pendens under Sec 52',
            'How to enforce Order 39 stay order?',
            'What happens if defendant fails to file reply?'
          ].map((prompt, idx) => (
            <button 
              key={idx}
              className="prompt-pill"
              onClick={() => handleSendMessage(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="chat-input-form"
        >
          <input 
            type="text"
            className="chat-input-field"
            placeholder="Ask a legal question about your case or statutory rights..."
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
          />
          <button 
            type="submit"
            className="btn btn-primary"
            disabled={!inputQuery.trim() || isAnalyzing}
          >
            <Send size={16} /> Send Query
          </button>
        </form>
      </div>

      <style>{`
        .ai-assistant-page {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .disclaimer-banner {
          background-color: rgba(217, 119, 6, 0.1);
          border: 1px solid rgba(217, 119, 6, 0.3);
          border-radius: var(--radius-md);
          padding: 0.875rem 1.25rem;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          color: var(--text-primary);
        }

        .disclaimer-icon {
          color: var(--accent-amber);
          flex-shrink: 0;
          margin-top: 0.15rem;
        }

        .disclaimer-text {
          font-size: 0.8125rem;
          line-height: 1.4;
        }

        .chat-container {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 200px);
          min-height: 550px;
          padding: 0 !important;
          overflow: hidden;
        }

        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
          background-color: var(--bg-surface);
        }

        .assistant-brand {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }

        .bot-avatar {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, #7C3AED, #EC4899);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bot-status {
          font-size: 0.75rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .dot-active {
          width: 8px;
          height: 8px;
          border-radius: var(--radius-full);
          background-color: var(--accent-emerald);
        }

        .chat-messages-stream {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          background-color: var(--bg-app);
        }

        .chat-bubble-wrapper {
          display: flex;
          gap: 1rem;
          max-width: 85%;
        }

        .chat-bubble-wrapper.user-bubble {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .chat-bubble-wrapper.ai-bubble {
          align-self: flex-start;
        }

        .avatar-mini {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .user-bubble .avatar-mini {
          background-color: var(--primary-600);
          color: #FFFFFF;
        }

        .ai-bubble .avatar-mini {
          background: linear-gradient(135deg, #7C3AED, #EC4899);
        }

        .bubble-content {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          box-shadow: var(--shadow-sm);
        }

        .user-bubble .bubble-content {
          background-color: var(--primary-600);
          color: #FFFFFF;
          border-color: var(--primary-600);
        }

        .user-bubble .bubble-content p {
          color: #FFFFFF;
        }

        .bubble-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.75rem;
        }

        .sender-name {
          font-weight: 700;
        }

        .user-bubble .sender-name, .user-bubble .msg-time {
          color: rgba(255, 255, 255, 0.8);
        }

        .msg-time {
          color: var(--text-muted);
        }

        .bubble-text {
          font-size: 0.9375rem;
          line-height: 1.5;
        }

        .legal-sections-card, .citations-card {
          margin-top: 1rem;
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1rem;
        }

        .card-section-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
        }

        .sections-list, .citations-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .sec-item {
          background-color: var(--bg-surface);
          border-left: 3px solid var(--primary-500);
          padding: 0.75rem;
          border-radius: var(--radius-sm);
        }

        .sec-title-badge {
          display: flex;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary-600);
        }

        .sec-heading {
          font-weight: 600;
          font-size: 0.875rem;
          margin-top: 0.2rem;
        }

        .sec-desc {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 0.15rem;
        }

        .citation-item {
          background-color: var(--bg-surface);
          border-left: 3px solid var(--accent-purple);
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.8125rem;
        }

        .cit-rel {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 0.15rem;
        }

        .suggested-actions-row {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-top: 1rem;
        }

        .action-chip-btn {
          background-color: rgba(37, 99, 235, 0.1);
          border: 1px solid rgba(37, 99, 235, 0.2);
          color: var(--primary-600);
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.35rem 0.65rem;
          border-radius: var(--radius-full);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .action-chip-btn:hover {
          background-color: var(--primary-600);
          color: #FFFFFF;
        }

        .bubble-actions {
          display: flex;
          gap: 1rem;
          margin-top: 0.875rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-subtle);
        }

        .action-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .action-btn:hover {
          color: var(--primary-600);
        }

        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          color: var(--text-muted);
        }

        .sparkle-spin {
          animation: pulseGlow 1.5s infinite;
        }

        .preset-prompts-bar {
          padding: 0.75rem 1.5rem;
          background-color: var(--bg-surface);
          border-top: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          overflow-x: auto;
        }

        .preset-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
          white-space: nowrap;
        }

        .prompt-pill {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 0.75rem;
          padding: 0.3rem 0.75rem;
          border-radius: var(--radius-full);
          cursor: pointer;
          white-space: nowrap;
          transition: all var(--transition-fast);
        }

        .prompt-pill:hover {
          border-color: var(--primary-500);
          color: var(--primary-600);
        }

        .chat-input-form {
          display: flex;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background-color: var(--bg-surface);
          border-top: 1px solid var(--border-color);
        }

        .chat-input-field {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background-color: var(--bg-app);
          color: var(--text-primary);
          font-size: 0.875rem;
          font-family: inherit;
          outline: none;
        }

        .chat-input-field:focus {
          border-color: var(--primary-500);
        }
      `}</style>
    </div>
  );
};
