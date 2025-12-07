import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Lead, LeadStatus } from '../types';
import { Users, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

interface LeadStatsProps {
  leads: Lead[];
}

const COLORS = ['#6366f1', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#94a3b8'];

const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      <p className="text-xs text-slate-400 mt-1">{subtext}</p>
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
  </div>
);

const LeadStats: React.FC<LeadStatsProps> = ({ leads }) => {
  
  const statusData = Object.values(LeadStatus).map(status => ({
    name: status,
    value: leads.filter(l => l.status === status).length
  })).filter(d => d.value > 0);

  const serviceData = [
    { name: 'Rent', value: leads.filter(l => l.service_type === 'Rent').length },
    { name: 'Resale', value: leads.filter(l => l.service_type === 'Resale').length },
  ].filter(d => d.value > 0);

  // Metrics Calculation
  const totalLeads = leads.length;
  const closedWon = leads.filter(l => l.status === LeadStatus.CLOSED_WON).length;
  const closedLost = leads.filter(l => l.status === LeadStatus.CLOSED_LOST).length;
  const totalClosed = closedWon + closedLost;
  const conversionRate = totalClosed > 0 ? Math.round((closedWon / totalClosed) * 100) : 0;
  const activeLeads = leads.filter(l => [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.INTERESTED].includes(l.status)).length;

  return (
    <div className="space-y-6 mb-8">
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Total Leads" 
            value={totalLeads} 
            icon={Users} 
            color="bg-indigo-500"
            subtext="All time leads" 
        />
        <StatCard 
            title="Active Pipeline" 
            value={activeLeads} 
            icon={AlertCircle} 
            color="bg-amber-500"
            subtext="Needs attention" 
        />
        <StatCard 
            title="Conversion Rate" 
            value={`${conversionRate}%`} 
            icon={TrendingUp} 
            color="bg-blue-500"
            subtext="Won vs Lost" 
        />
        <StatCard 
            title="Closed Won" 
            value={closedWon} 
            icon={CheckCircle} 
            color="bg-green-500"
            subtext="Successful deals" 
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Pipeline Status</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
              {statusData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-xs font-medium text-slate-600">{entry.name} ({entry.value})</span>
                  </div>
              ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Service Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={60} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={32}>
                    {serviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#8b5cf6'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadStats;