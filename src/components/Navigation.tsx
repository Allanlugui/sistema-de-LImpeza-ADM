import React from 'react';
import { useApp, TabType } from '../context/AppContext';
import { 
  LayoutDashboard, 
  ClipboardList, 
  UserCheck,
  Users, 
  Timer, 
  MessageSquareHeart, 
  Settings
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, requests, clients, collaborators, feedbacks } = useApp();

  const pendingRequests = requests.filter(r => r.status === 'pendente').length;
  const runningServices = requests.filter(r => r.status === 'em_execucao' && r.executionTracking?.isRunning).length;
  const pendingFeedbacks = feedbacks.filter(f => f.status === 'pendente' || (f.type === 'reclamacao' && f.status === 'em_analise')).length;

  const navItems: {
    id: TabType;
    label: string;
    icon: React.ElementType;
    badge: { count: number; color: string } | null;
    highlight?: boolean;
  }[] = [
    {
      id: 'dashboard',
      label: 'Visão Geral',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'solicitacoes',
      label: 'Central de Solicitações',
      icon: ClipboardList,
      badge: pendingRequests > 0 ? { count: pendingRequests, color: 'bg-[#5A7D6C] text-white' } : null,
    },
    {
      id: 'clientes',
      label: 'Gestão de Clientes',
      icon: UserCheck,
      badge: { count: clients.length, color: 'bg-[#EBF1ED] text-[#446153]' },
    },
    {
      id: 'colaboradores',
      label: 'Gestão de Colaboradores',
      icon: Users,
      badge: { count: collaborators.length, color: 'bg-[#EBF1ED] text-[#446153]' },
    },
    {
      id: 'alocacao',
      label: 'Alocação & Timer ao Vivo',
      icon: Timer,
      badge: runningServices > 0 ? { count: runningServices, color: 'bg-[#C88346] text-white animate-pulse' } : null,
      highlight: runningServices > 0,
    },
    {
      id: 'feedbacks',
      label: 'Central de SAC & Feedbacks',
      icon: MessageSquareHeart,
      badge: pendingFeedbacks > 0 ? { count: pendingFeedbacks, color: 'bg-rose-600 text-white' } : null,
    },
    {
      id: 'configuracoes',
      label: 'Configurações & Auditoria',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <nav id="main-navigation-bar" className="bg-white border-b border-[#DFE5DA] shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-nav-${item.id}`}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#5A7D6C] text-white shadow-xs shadow-[#5A7D6C]/25 font-semibold'
                    : 'text-[#64736B] hover:text-[#243029] hover:bg-[#F4F6F1]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#86958E]'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${item.badge.color}`}>
                    {item.badge.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

