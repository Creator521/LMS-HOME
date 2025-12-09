import React, { useState, useEffect, useMemo } from 'react';
import { Upload, Search, Filter, User, Phone, LayoutGrid, List, Bell, CheckCircle, LayoutDashboard, Settings, Calendar, ChevronDown, Menu, X, Download } from 'lucide-react';
import { Lead, Comment, LeadStatus, ServiceType, PropertyType, FilterState } from './types';
import LeadModal from './components/LeadModal';
import LeadStats from './components/LeadStats';
import { LeadService } from './services/leadService';

// --- Types & Utils ---

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'info';
}

const generateMockData = (): Lead[] => {
    return Array.from({ length: 15 }).map((_, i) => ({
        id: `lead-${i}`,
        lead_name: [`Arjun Kumar`, `Priya Singh`, `Rahul Sharma`, `Sneha Patel`, `Vikram Malhotra`][i % 5] + ` ${i + 1}`,
        lead_date: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString().split('T')[0],
        phone_number: `+91${9000000000 + i}`,
        email: `user${i}@example.com`,
        service_type: i % 2 === 0 ? ServiceType.RENT : ServiceType.RESALE,
        property_type: i % 3 === 0 ? PropertyType.APARTMENT : PropertyType.INDEPENDENT_FLOOR,
        status: Object.values(LeadStatus)[i % 6],
        created_at: new Date().toISOString()
    }));
};

// --- Main App Component ---

const App: React.FC = () => {
    // --- State ---
    const [leads, setLeads] = useState<Lead[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        status: '',
        serviceType: '',
        dateStart: '',
        dateEnd: ''
    });
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // --- Effects ---
    useEffect(() => {
        const timer = setInterval(() => setCurrentDate(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const unsubscribeLeads = LeadService.subscribeToLeads((fetchedLeads) => {
            setLeads(fetchedLeads);
        });

        const unsubscribeComments = LeadService.subscribeToComments((fetchedComments) => {
            setComments(fetchedComments);
        });

        return () => {
            unsubscribeLeads();
            unsubscribeComments();
        };
    }, []);

    // --- Helpers ---
    const showToast = (message: string, type: 'success' | 'info' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

            let importedCount = 0;

            for (const line of lines.slice(1)) {
                if (!line.trim()) continue;
                const values = line.split(',');
                const lead: any = {
                    status: LeadStatus.NEW
                };

                values.forEach((val, i) => {
                    const header = headers[i];
                    if (header.includes('name')) lead.lead_name = val.trim();
                    if (header.includes('phone')) lead.phone_number = val.trim();
                    if (header.includes('email')) lead.email = val.trim();
                    if (header.includes('service')) lead.service_type = val.trim() as ServiceType || ServiceType.RENT;
                    if (header.includes('property')) lead.property_type = val.trim() as PropertyType || PropertyType.APARTMENT;
                    if (header.includes('date')) lead.lead_date = val.trim();
                });

                if (lead.lead_name && lead.phone_number) {
                    if (!lead.service_type) lead.service_type = ServiceType.RENT;
                    if (!lead.property_type) lead.property_type = PropertyType.NA;
                    if (!lead.lead_date) lead.lead_date = new Date().toISOString().split('T')[0];

                    await LeadService.addLead(lead as Lead);
                    importedCount++;
                }
            }
            showToast(`Imported ${importedCount} leads successfully!`);
        };
        reader.readAsText(file);
    };

    const handleDownloadTemplate = () => {
        const headers = [
            'Name',
            'Phone Number',
            'Email',
            'Service Type (Rent/Resale)',
            'Property Type',
            'Lead Date',
            'Status'
        ];
        const csvContent = headers.join(',') + '\n' + 'John Doe,9999999999,john@example.com,Rent,Apartment,2024-01-01,New';

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'lead_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const cleanPhone = (phone: string) => {
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) return `91${cleaned}`;
        return cleaned;
    };

    const updateStatus = async (id: string, status: LeadStatus) => {
        await LeadService.updateLeadStatus(id, status);
        if (selectedLead && selectedLead.id === id) {
            setSelectedLead({ ...selectedLead, status });
        }
        showToast(`Status updated to ${status}`);
    };

    const addComment = async (leadId: string, text: string) => {
        await LeadService.addComment(leadId, text);
        showToast('Comment added');
    };

    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const matchesSearch =
                lead.lead_name.toLowerCase().includes(filters.search.toLowerCase()) ||
                lead.phone_number.includes(filters.search) ||
                lead.email.toLowerCase().includes(filters.search.toLowerCase());

            const matchesStatus = filters.status ? lead.status === filters.status : true;
            const matchesService = filters.serviceType ? lead.service_type === filters.serviceType : true;

            let matchesDate = true;
            if (filters.dateStart && filters.dateEnd) {
                matchesDate = lead.lead_date >= filters.dateStart && lead.lead_date <= filters.dateEnd;
            }

            return matchesSearch && matchesStatus && matchesService && matchesDate;
        });
    }, [leads, filters]);

    // --- Render ---
    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 shadow-xl
          md:relative md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center mr-3 text-white font-bold shadow-lg shadow-indigo-500/20">
                            L
                        </div>
                        <span className="text-lg font-bold text-white tracking-tight">LMS Pro</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600/10 text-indigo-400 rounded-xl border border-indigo-600/20 font-medium shadow-sm"
                    >
                        <LayoutDashboard size={20} />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl transition-all duration-200"
                    >
                        <User size={20} />
                        All Leads
                    </button>
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl transition-all duration-200 text-slate-400">
                        <Settings size={20} />
                        System Settings
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">

                {/* Header */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">Overview</h2>
                        <span className="h-4 w-px bg-slate-300 mx-2 hidden sm:block"></span>
                        <div className="hidden sm:flex items-center gap-2 text-slate-500 text-sm font-medium bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            <Calendar size={14} />
                            {currentDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="relative group">
                            <Bell size={20} className="text-slate-500 hover:text-slate-700 cursor-pointer transition-colors" />
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white ring-2 ring-red-100 animate-pulse"></span>
                        </div>
                        <div className="flex items-center gap-3 pl-4 md:pl-6 border-l border-slate-200">
                            <div className="text-right hidden md:block">
                                <div className="text-sm font-bold text-slate-900">Admin User</div>
                                <div className="text-xs text-slate-500">Administrator</div>
                            </div>
                            <div className="w-8 h-8 md:w-9 md:h-9 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-slate-100 cursor-default">
                                AD
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">

                    {/* Stats Section */}
                    <LeadStats leads={leads} />

                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex-1 sm:flex-none justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                            >
                                <List size={16} /> List
                            </button>
                            <button
                                onClick={() => setViewMode('board')}
                                className={`flex-1 sm:flex-none justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'board' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                            >
                                <LayoutGrid size={16} /> Board
                            </button>
                        </div>

                        <div className="flex gap-3 w-full sm:w-auto">
                            <button
                                onClick={handleDownloadTemplate}
                                className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-5 py-2.5 rounded-xl transition-all text-sm font-semibold shadow-sm hover:shadow-md active:scale-95"
                            >
                                <Download size={18} />
                                Template
                            </button>
                            <label className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl cursor-pointer transition-all text-sm font-semibold shadow-md hover:shadow-lg active:scale-95">
                                <Upload size={18} />
                                Import CSV
                                <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                            </label>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-6 transition-all">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                            <div className="lg:col-span-4 relative p-2">
                                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-full pl-10 pr-4 py-2 border-none focus:ring-0 text-sm text-slate-700 placeholder:text-slate-400 bg-transparent"
                                    value={filters.search}
                                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                                />
                            </div>
                            <div className="lg:col-span-2 relative p-2 group">
                                <select
                                    className="w-full px-3 py-2 border-none focus:ring-0 text-sm bg-transparent appearance-none cursor-pointer text-slate-600 font-medium group-hover:text-indigo-600 transition-colors"
                                    value={filters.status}
                                    onChange={e => setFilters({ ...filters, status: e.target.value })}
                                >
                                    <option value="">All Statuses</option>
                                    {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-300 group-hover:text-indigo-400" size={16} />
                            </div>
                            <div className="lg:col-span-2 relative p-2 group">
                                <select
                                    className="w-full px-3 py-2 border-none focus:ring-0 text-sm bg-transparent appearance-none cursor-pointer text-slate-600 font-medium group-hover:text-indigo-600 transition-colors"
                                    value={filters.serviceType}
                                    onChange={e => setFilters({ ...filters, serviceType: e.target.value })}
                                >
                                    <option value="">All Services</option>
                                    {Object.values(ServiceType).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-300 group-hover:text-indigo-400" size={16} />
                            </div>
                            <div className="lg:col-span-4 p-2 flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-2">Date:</span>
                                <input
                                    type="date"
                                    className="w-full px-2 py-1 border-none focus:ring-0 text-sm text-slate-600 bg-transparent"
                                    value={filters.dateStart}
                                    onChange={e => setFilters({ ...filters, dateStart: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* View Content */}
                    {viewMode === 'list' ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px] md:min-w-full">
                                    <thead className="bg-slate-50/50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Details</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Date</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Interest</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredLeads.map((lead) => (
                                            <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm border border-indigo-100">
                                                            {lead.lead_name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-900">{lead.lead_name}</div>
                                                            <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                                                                {lead.phone_number}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-slate-700 font-medium bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 inline-block">
                                                        {lead.lead_date}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="inline-block bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full border border-slate-200 font-medium">
                                                            {lead.service_type}
                                                        </span>
                                                        <div className="text-xs text-slate-500 pl-1">{lead.property_type}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                                                ${lead.status === LeadStatus.NEW ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            lead.status === LeadStatus.CLOSED_WON ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                lead.status === LeadStatus.CLOSED_LOST ? 'bg-red-50 text-red-700 border-red-200' :
                                                                    'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 
                                                    ${lead.status === LeadStatus.NEW ? 'bg-blue-500' :
                                                                lead.status === LeadStatus.CLOSED_WON ? 'bg-emerald-500' :
                                                                    lead.status === LeadStatus.CLOSED_LOST ? 'bg-red-500' :
                                                                        'bg-slate-500'}`}></span>
                                                        {lead.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 md:opacity-60 md:group-hover:opacity-100 transition-opacity">
                                                        <a href={`tel:${cleanPhone(lead.phone_number)}`} className="p-2 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm">
                                                            <Phone size={16} />
                                                        </a>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedLead(lead);
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="px-4 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-indigo-600 transition-all shadow-sm flex items-center gap-1"
                                                        >
                                                            Open
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        // Kanban Board View
                        <div className="flex overflow-x-auto gap-4 md:gap-6 pb-6 items-start h-full snap-x snap-mandatory">
                            {Object.values(LeadStatus).map(status => {
                                const statusLeads = filteredLeads.filter(l => l.status === status);
                                return (
                                    <div key={status} className="min-w-[280px] md:min-w-[320px] bg-slate-100/80 rounded-2xl p-3 md:p-4 border border-slate-200 flex flex-col max-h-[calc(100vh-220px)] backdrop-blur-sm snap-center">
                                        <div className="flex items-center justify-between mb-4 px-2">
                                            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full 
                                            ${status === LeadStatus.NEW ? 'bg-blue-500' :
                                                        status === LeadStatus.CLOSED_WON ? 'bg-emerald-500' :
                                                            'bg-slate-400'}`}></span>
                                                {status}
                                            </h3>
                                            <span className="bg-white px-2.5 py-1 rounded-full text-xs font-bold text-slate-600 border border-slate-200 shadow-sm">{statusLeads.length}</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar pb-2">
                                            {statusLeads.map(lead => (
                                                <div
                                                    key={lead.id}
                                                    onClick={() => {
                                                        setSelectedLead(lead);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 cursor-pointer hover:shadow-md hover:border-indigo-500/30 hover:translate-y-[-2px] transition-all group relative overflow-hidden"
                                                >
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-100 group-hover:bg-indigo-500 transition-colors"></div>
                                                    <div className="pl-2">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-[10px] font-bold tracking-wide text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 uppercase">{lead.service_type}</span>
                                                            <span className="text-[10px] text-slate-400 font-medium">{lead.lead_date}</span>
                                                        </div>
                                                        <h4 className="font-bold text-slate-800 mb-1 group-hover:text-indigo-700 transition-colors">{lead.lead_name}</h4>
                                                        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                                                            {lead.property_type}
                                                        </p>
                                                        <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
                                                                {lead.lead_name.charAt(0)}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-slate-400 text-xs">
                                                                <Phone size={12} />
                                                                <span className="group-hover:text-indigo-600 transition-colors">Contact</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                </main>
            </div>

            {/* Global Modals & Overlays */}
            <LeadModal
                lead={selectedLead}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpdateStatus={updateStatus}
                comments={comments.filter(c => c.leadId === selectedLead?.id).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())}
                onAddComment={addComment}
            />

            {/* Toast Notification */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4 md:px-0">
                {toasts.map(toast => (
                    <div key={toast.id} className="bg-slate-900 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto border border-slate-700">
                        <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle size={14} className="text-green-400" />
                        </div>
                        <span className="text-sm font-medium">{toast.message}</span>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default App;