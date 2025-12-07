import React, { useState, useEffect, useRef } from 'react';
import { Lead, Comment, LeadStatus } from '../types';
import { MessageSquare, Send, X, Sparkles, FileText, Clock, User, Phone, Mail, Calendar } from 'lucide-react';
import { draftMessage, analyzeLead } from '../services/geminiService';

interface LeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  comments: Comment[];
  onAddComment: (leadId: string, text: string) => void;
}

const LeadModal: React.FC<LeadModalProps> = ({
  lead,
  isOpen,
  onClose,
  onUpdateStatus,
  comments,
  onAddComment
}) => {
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'ai'>('details');
  const [aiDraft, setAiDraft] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNewComment('');
      setAiDraft('');
      setAiAnalysis('');
      setActiveTab('details');
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === 'comments' && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeTab, comments]);

  if (!isOpen || !lead) return null;

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(lead.id, newComment);
      setNewComment('');
    }
  };

  const handleGenerateDraft = async (tone: 'formal' | 'casual' | 'persuasive') => {
    setLoadingAi(true);
    const text = await draftMessage(lead, tone);
    setAiDraft(text);
    setLoadingAi(false);
  };

  const handleAnalyze = async () => {
    setLoadingAi(true);
    const commentTexts = comments.map(c => c.comment_text);
    const text = await analyzeLead(lead, commentTexts);
    setAiAnalysis(text);
    setLoadingAi(false);
  }

  const cleanPhone = (phone: string) => phone.replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 md:p-4 transition-opacity duration-300">
      <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-[95%] md:w-full max-w-2xl h-[90vh] md:h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-start bg-white shrink-0">
          <div className="flex items-start gap-3 md:gap-4 overflow-hidden">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg md:text-xl shrink-0">
              {lead.lead_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 truncate">{lead.lead_name}</h2>
              <div className="flex items-center gap-2 md:gap-3 mt-1 flex-wrap">
                 <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium border whitespace-nowrap ${
                    lead.status === LeadStatus.NEW ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    lead.status === LeadStatus.CLOSED_WON ? 'bg-green-50 text-green-700 border-green-200' :
                    'bg-slate-50 text-slate-700 border-slate-200'
                 }`}>
                    {lead.status}
                 </span>
                 <span className="text-[10px] md:text-xs text-slate-400 flex items-center gap-1 whitespace-nowrap">
                    <Clock size={12} /> {lead.created_at.split('T')[0]}
                 </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-4 md:px-6 bg-white overflow-x-auto scrollbar-hide shrink-0">
          {[
            { id: 'details', label: 'Details', icon: FileText },
            { id: 'comments', label: 'Activity', icon: MessageSquare, count: comments.length },
            { id: 'ai', label: 'AI Assist', icon: Sparkles }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 md:py-4 text-sm font-medium transition-all relative whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'text-indigo-600' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative bg-slate-50">
            <div className="h-full overflow-y-auto p-4 md:p-6 pb-24 md:pb-6" ref={scrollRef}>
          
            {/* DETAILS TAB */}
            {activeTab === 'details' && (
                <div className="space-y-6 max-w-lg mx-auto">
                
                {/* Status Card */}
                <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Lead Status</label>
                    <select
                        value={lead.status}
                        onChange={(e) => onUpdateStatus(lead.id, e.target.value as LeadStatus)}
                        className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 text-sm"
                    >
                        {Object.values(LeadStatus).map((s) => (
                        <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">Contact Information</h3>
                        
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                <Phone size={16} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs text-slate-500">Phone Number</p>
                                <p className="text-sm font-medium text-slate-900 truncate">{lead.phone_number}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                <Mail size={16} />
                            </div>
                            <div className="overflow-hidden w-full">
                                <p className="text-xs text-slate-500">Email Address</p>
                                <p className="text-sm font-medium text-slate-900 truncate">{lead.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                         <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">Property Interest</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500">Service</p>
                                <p className="text-sm font-medium text-slate-900 mt-1">{lead.service_type}</p>
                            </div>
                             <div>
                                <p className="text-xs text-slate-500">Property</p>
                                <p className="text-sm font-medium text-slate-900 mt-1">{lead.property_type}</p>
                            </div>
                             <div>
                                <p className="text-xs text-slate-500">Lead Date</p>
                                <p className="text-sm font-medium text-slate-900 mt-1">{lead.lead_date}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <a 
                    href={`tel:${cleanPhone(lead.phone_number)}`}
                    className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-medium transition-all"
                    >
                    <Phone size={18} /> Call
                    </a>
                    <a 
                    href={`https://wa.me/${cleanPhone(lead.phone_number)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5C] text-white py-3 rounded-xl font-medium transition-all"
                    >
                     <MessageSquare size={18} /> WhatsApp
                    </a>
                </div>
                </div>
            )}

            {/* COMMENTS TAB */}
            {activeTab === 'comments' && (
                <div className="flex flex-col min-h-full">
                {comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 py-10 md:py-20 text-slate-400">
                        <MessageSquare size={48} className="mb-4 text-slate-300" />
                        <p>No activity recorded yet.</p>
                        <p className="text-xs">Start tracking conversations!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0 mt-1 border-2 border-white shadow-sm">
                            {comment.user.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col items-start max-w-[85%]">
                             <div className="flex items-baseline gap-2 mb-1 ml-1">
                                <span className="text-xs font-bold text-slate-700">{comment.user}</span>
                                <span className="text-[10px] text-slate-400">
                                    {new Date(comment.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                             </div>
                            <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm text-slate-700 text-sm leading-relaxed break-words">
                                {comment.comment_text}
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
                </div>
            )}

            {/* AI TAB */}
            {activeTab === 'ai' && (
                <div className="space-y-6 max-w-lg mx-auto">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={20} className="text-yellow-300" />
                        <h3 className="font-bold text-lg">Smart Analysis</h3>
                    </div>
                    
                    {loadingAi && !aiAnalysis ? (
                        <div className="animate-pulse flex space-x-4">
                            <div className="flex-1 space-y-2 py-1">
                                <div className="h-2 bg-white/20 rounded"></div>
                                <div className="h-2 bg-white/20 rounded w-3/4"></div>
                            </div>
                        </div>
                    ) : aiAnalysis ? (
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-sm leading-relaxed border border-white/10">
                            {aiAnalysis}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-indigo-100 text-sm mb-4">Analyze this lead's potential and get actionable next steps.</p>
                            <button 
                            onClick={handleAnalyze}
                            className="bg-white text-indigo-600 px-6 py-2 rounded-full text-sm font-semibold hover:bg-indigo-50 transition-colors shadow-md"
                            >
                                Analyze Lead
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <h3 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
                        <MessageSquare size={18} className="text-indigo-500" />
                        Draft Message
                    </h3>
                    
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                        {['Formal', 'Casual', 'Persuasive'].map((tone) => (
                            <button 
                                key={tone}
                                onClick={() => handleGenerateDraft(tone.toLowerCase() as any)} 
                                className="px-4 py-1.5 text-xs font-medium bg-slate-50 text-slate-600 rounded-full hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 transition-colors whitespace-nowrap"
                            >
                                {tone}
                            </button>
                        ))}
                    </div>

                    <div className="relative group">
                        <textarea
                            readOnly
                            value={loadingAi && !aiDraft ? "Generating best draft..." : aiDraft}
                            placeholder="Select a tone above to generate a message..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 min-h-[150px] focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                        {aiDraft && (
                            <button 
                            onClick={() => {
                                navigator.clipboard.writeText(aiDraft);
                                alert("Copied to clipboard!");
                            }}
                            className="absolute top-3 right-3 text-xs bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-md text-slate-600 hover:text-indigo-600 font-medium opacity-100 transition-opacity"
                            >
                                Copy
                            </button>
                        )}
                    </div>
                </div>
                </div>
            )}
            </div>

            {/* Comment Input (Sticky) */}
            {activeTab === 'comments' && (
                 <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <form onSubmit={handleSubmitComment} className="relative max-w-2xl mx-auto">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Type a note..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-full pl-5 pr-12 py-3.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all outline-none text-sm"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 transition-all shadow-md"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LeadModal;