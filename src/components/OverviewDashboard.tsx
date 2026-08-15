import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ClipboardList, 
  Users, 
  Timer, 
  Star, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  Layers, 
  MapPin,
  TrendingUp,
  ShieldAlert,
  Play
} from 'lucide-react';
import { formatCurrency, formatSecondsToTimer } from '../utils/formatters';

interface OverviewDashboardProps {
  onOpenNewRequestModal: () => void;
  onOpenNewCollaboratorModal: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onOpenNewRequestModal,
  onOpenNewCollaboratorModal,
}) => {
  const { requests, collaborators, feedbacks, setActiveTab } = useApp();

  // Metrics
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'pendente');
  const runningRequests = requests.filter(r => r.status === 'em_execucao');
  const completedRequests = requests.filter(r => r.status === 'concluido');
  
  const activeCollabs = collaborators.filter(c => c.status === 'ativo');
  const inServiceCollabs = collaborators.filter(c => c.status === 'em_servico');
  
  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
    : '5.0';

  const openComplaints = feedbacks.filter(f => f.type === 'reclamacao' && f.status !== 'resolvido');

  // Distribution
  const cleaningCount = requests.filter(r => r.serviceType === 'limpeza').length;
  const organizationCount = requests.filter(r => r.serviceType === 'organizacao').length;
  const bothCount = requests.filter(r => r.serviceType === 'ambos').length;

  const customOrgCount = requests.filter(r => r.organizationFormat === 'personalizada').length;
  const standardOrgCount = requests.filter(r => r.organizationFormat === 'padrao_empresa').length;

  return (
    <div id="overview-dashboard-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-[#243029] via-[#35483E] to-[#243029] rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-[#DFE5DA]/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#A6C0B2]">
                Painel de Controle Central
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#8FB89E]"></span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Operações de Limpeza & Organização
            </h2>
            <p className="text-[#D3DED7] text-xs sm:text-sm mt-1 max-w-xl">
              Monitore a equipe operacional, acompanhe o cronômetro das solicitações em tempo real e gerencie os atendimentos com alto padrão de qualidade.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              id="btn-quick-new-request"
              type="button"
              onClick={onOpenNewRequestModal}
              className="px-4 py-2.5 rounded-xl bg-[#5A7D6C] hover:bg-[#446153] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Nova Solicitação
            </button>
            <button
              id="btn-quick-new-collab"
              type="button"
              onClick={onOpenNewCollaboratorModal}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Cadastrar Colaborador
            </button>
          </div>
        </div>

        {/* Decorative subtle gradient circle */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-[#5A7D6C]/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Solicitações Registradas */}
        <div 
          onClick={() => setActiveTab('solicitacoes')}
          className="bg-white rounded-xl p-5 border border-[#DFE5DA] shadow-2xs hover:border-[#5A7D6C]/60 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64736B]">Solicitações Registradas</span>
            <div className="w-9 h-9 rounded-lg bg-[#EBF1ED] flex items-center justify-center text-[#5A7D6C] group-hover:scale-105 transition-transform">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#243029]">{totalRequests}</span>
            <span className="text-xs text-[#64736B]">pedidos</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-md bg-[#FAF1E8] text-[#9A5222] font-medium border border-[#ECD9C5]">
              {pendingRequests.length} pendentes
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#EBF1ED] text-[#446153] font-medium border border-[#DFE5DA]">
              {completedRequests.length} concluídos
            </span>
          </div>
        </div>

        {/* Card 2: Em Execução ao Vivo */}
        <div 
          onClick={() => setActiveTab('alocacao')}
          className="bg-white rounded-xl p-5 border border-[#DFE5DA] shadow-2xs hover:border-[#C88346]/60 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64736B]">Em Execução ao Vivo</span>
            <div className="w-9 h-9 rounded-lg bg-[#FAF1E8] flex items-center justify-center text-[#C88346] group-hover:scale-105 transition-transform">
              <Timer className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#243029]">{runningRequests.length}</span>
            <span className="text-xs text-[#64736B]">equipes em campo</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#9A5222] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#C88346] animate-ping" />
            <span>Cronômetros ativos sincronizados</span>
          </div>
        </div>

        {/* Card 3: Equipe Operacional */}
        <div 
          onClick={() => setActiveTab('colaboradores')}
          className="bg-white rounded-xl p-5 border border-[#DFE5DA] shadow-2xs hover:border-[#5A7D6C]/60 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64736B]">Equipe Operacional</span>
            <div className="w-9 h-9 rounded-lg bg-[#EBF1ED] flex items-center justify-center text-[#5A7D6C] group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#243029]">{collaborators.length}</span>
            <span className="text-xs text-[#64736B]">profissionais</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-[#446153] font-medium">
              {activeCollabs.length} disponíveis
            </span>
            <span className="text-[#86958E]">•</span>
            <span className="text-[#5A7D6C] font-medium">
              {inServiceCollabs.length} em serviço
            </span>
          </div>
        </div>

        {/* Card 4: CSAT e Qualidade */}
        <div 
          onClick={() => setActiveTab('feedbacks')}
          className="bg-white rounded-xl p-5 border border-[#DFE5DA] shadow-2xs hover:border-[#5A7D6C]/60 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64736B]">Média de Satisfação</span>
            <div className="w-9 h-9 rounded-lg bg-[#FAF1E8] flex items-center justify-center text-[#C88346] group-hover:scale-105 transition-transform">
              <Star className="w-5 h-5 fill-[#C88346]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#243029]">{avgRating}</span>
            <span className="text-xs text-[#64736B]">/ 5.0 estrelas</span>
          </div>
          <div className="mt-2 text-xs">
            {openComplaints.length > 0 ? (
              <span className="text-rose-700 font-medium flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                {openComplaints.length} reclamação(ões) pendente(s)
              </span>
            ) : (
              <span className="text-[#446153] font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Nenhuma reclamação em aberto
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Split: Live Monitoring & Requests Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Live Execution Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Execution Ticker Card */}
          <div className="bg-white rounded-xl border border-[#DFE5DA] shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#F0F3EC] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FAF1E8] flex items-center justify-center text-[#C88346]">
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#243029]">
                    Acompanhamento de Execuções em Andamento
                  </h3>
                  <p className="text-xs text-[#64736B]">
                    Serviços ativos no momento com cronômetro em tempo real
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('alocacao')}
                className="text-xs font-semibold text-[#5A7D6C] hover:text-[#446153] flex items-center gap-1"
              >
                Ver Central de Alocação
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#F0F3EC]">
              {runningRequests.length > 0 ? (
                runningRequests.map((req) => {
                  const elapsed = req.executionTracking?.elapsedSeconds || 0;
                  const estimatedSecs = req.estimatedDurationHours * 3600;
                  const progressPct = Math.min(100, Math.round((elapsed / estimatedSecs) * 100));
                  const isOvertime = elapsed > estimatedSecs;

                  return (
                    <div key={req.id} className="p-4 sm:p-5 hover:bg-[#F9FAF7] transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold text-[#446153] bg-[#EBF1ED] px-2 py-0.5 rounded border border-[#DFE5DA]">
                              {req.code}
                            </span>
                            <span className="text-xs font-semibold text-[#243029]">
                              {req.clientName}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              req.serviceType === 'ambos'
                                ? 'bg-[#EBF1ED] text-[#446153] border border-[#DFE5DA]'
                                : req.serviceType === 'organizacao'
                                ? 'bg-[#F2F6F3] text-[#496758] border border-[#D5E0DA]'
                                : 'bg-[#EAF3EC] text-[#345B45] border border-[#CADDCF]'
                            }`}>
                              {req.serviceType === 'ambos' ? 'Limpeza + Organização' : req.serviceType.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#64736B]">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#86958E]" />
                              {req.address.neighborhood} - {req.address.city}
                            </span>
                            <span>•</span>
                            <span className="text-[#5A7D6C] font-medium">
                              Colaborador(a): {req.assignedStaffName}
                            </span>
                          </div>
                        </div>

                        {/* Live Timer Clock Display */}
                        <div className="flex items-center gap-3 self-start sm:self-auto">
                          <div className={`text-right px-3 py-1.5 rounded-lg border font-mono ${
                            isOvertime 
                              ? 'bg-rose-50 border-rose-200 text-rose-700' 
                              : 'bg-[#243029] border-[#1C2621] text-[#9FD1B3]'
                          }`}>
                            <div className="text-[10px] uppercase font-sans tracking-wider text-[#A6B7AD]">
                              {isOvertime ? 'Tempo Excedido' : 'Tempo Decorrido'}
                            </div>
                            <div className="text-base font-bold">
                              {formatSecondsToTimer(elapsed)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar & Checklist Status */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-[#64736B] font-medium">
                          <span>Progresso Estimado ({req.estimatedDurationHours}h totais)</span>
                          <span>{progressPct}% ({formatSecondsToTimer(elapsed)} / {req.estimatedDurationHours}h)</span>
                        </div>
                        <div className="w-full bg-[#EAEFE6] rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isOvertime ? 'bg-rose-500' : 'bg-[#5A7D6C]'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Format Badge */}
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#F0F3EC] text-xs">
                        <div className="flex items-center gap-1.5 text-[#64736B]">
                          <Layers className="w-3.5 h-3.5 text-[#86958E]" />
                          <span>Formato de Organização:</span>
                          <strong className="text-[#243029]">
                            {req.organizationFormat === 'personalizada' ? 'Personalizada (Cliente)' : 'Padrão da Empresa (5S)'}
                          </strong>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveTab('alocacao')}
                          className="text-xs font-medium text-[#5A7D6C] hover:text-[#446153]"
                        >
                          Gerenciar Execução →
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-[#64736B]">
                  <Timer className="w-8 h-8 mx-auto text-[#86958E] mb-2" />
                  <p className="text-xs">Nenhum serviço em execução no momento.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('solicitacoes')}
                    className="mt-2 text-xs font-semibold text-[#5A7D6C] hover:underline"
                  >
                    Alocar solicitações pendentes
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Pending Requests Quick Actions */}
          <div className="bg-white rounded-xl border border-[#DFE5DA] shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#5A7D6C]" />
                <h3 className="text-sm font-bold text-[#243029]">
                  Solicitações Aguardando Alocação ({pendingRequests.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('solicitacoes')}
                className="text-xs font-semibold text-[#5A7D6C] hover:text-[#446153]"
              >
                Ver Todas ({requests.length})
              </button>
            </div>

            {pendingRequests.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pendingRequests.slice(0, 4).map((req) => (
                  <div key={req.id} className="p-3.5 rounded-lg border border-[#DFE5DA] bg-[#F7F9F5] hover:bg-white hover:border-[#5A7D6C]/50 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[11px] font-bold text-[#446153] bg-[#EBF1ED] px-1.5 py-0.5 rounded border border-[#DFE5DA]">{req.code}</span>
                        <span className="text-[11px] font-bold text-[#243029]">{formatCurrency(req.price)}</span>
                      </div>
                      <h4 className="text-xs font-bold text-[#243029]">{req.clientName}</h4>
                      <p className="text-[11px] text-[#64736B] mt-0.5 line-clamp-1">
                        {req.address.neighborhood}, {req.address.city}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="text-[10px] bg-[#EAEFE6] text-[#243029] px-1.5 py-0.5 rounded font-medium">
                          {req.serviceType.toUpperCase()}
                        </span>
                        <span className="text-[10px] bg-[#EBF1ED] text-[#446153] px-1.5 py-0.5 rounded font-medium border border-[#DFE5DA]">
                          {req.organizationFormat === 'personalizada' ? 'Org. Personalizada' : 'Padrão 5S'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('solicitacoes')}
                      className="mt-3 w-full py-1.5 bg-[#5A7D6C] hover:bg-[#446153] text-white rounded-md text-xs font-medium transition-colors"
                    >
                      Alocar Colaborador
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#64736B]">
                Todas as solicitações registradas estão devidamente alocadas ou concluídas!
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3): Metrics Distribution & Available Staff */}
        <div className="space-y-6">
          {/* Services & Format Distribution */}
          <div className="bg-white rounded-xl border border-[#DFE5DA] shadow-2xs p-5">
            <h3 className="text-sm font-bold text-[#243029] mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#5A7D6C]" />
              Distribuição dos Serviços
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-[#243029] block mb-1.5">
                  Por Tipo de Atendimento:
                </span>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-[#64736B] mb-1">
                      <span>Limpeza & Higienização</span>
                      <span className="font-semibold text-[#243029]">{cleaningCount}</span>
                    </div>
                    <div className="w-full bg-[#EAEFE6] h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#5A7D6C] h-full rounded-full" 
                        style={{ width: `${totalRequests ? (cleaningCount / totalRequests) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-[#64736B] mb-1">
                      <span>Organização Doméstica</span>
                      <span className="font-semibold text-[#243029]">{organizationCount}</span>
                    </div>
                    <div className="w-full bg-[#EAEFE6] h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#446153] h-full rounded-full" 
                        style={{ width: `${totalRequests ? (organizationCount / totalRequests) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-[#64736B] mb-1">
                      <span>Ambos (Limpeza + Organização)</span>
                      <span className="font-semibold text-[#243029]">{bothCount}</span>
                    </div>
                    <div className="w-full bg-[#EAEFE6] h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#C88346] h-full rounded-full" 
                        style={{ width: `${totalRequests ? (bothCount / totalRequests) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0F3EC]">
                <span className="text-xs font-semibold text-[#243029] block mb-2">
                  Formato de Organização:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-[#EBF1ED] border border-[#DFE5DA]">
                    <span className="text-[11px] text-[#446153] font-medium block">Personalizada</span>
                    <strong className="text-base text-[#243029]">{customOrgCount} pedidos</strong>
                    <span className="text-[10px] text-[#64736B] block mt-0.5">Adaptada aos hábitos</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F7F9F5] border border-[#DFE5DA]">
                    <span className="text-[11px] text-[#243029] font-medium block">Padrão da Empresa</span>
                    <strong className="text-base text-[#243029]">{standardOrgCount} pedidos</strong>
                    <span className="text-[10px] text-[#64736B] block mt-0.5">Metodologia 5S</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Staff Availability Widget */}
          <div className="bg-white rounded-xl border border-[#DFE5DA] shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#243029] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#5A7D6C]" />
                Equipe Operacional
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('colaboradores')}
                className="text-xs text-[#5A7D6C] font-semibold hover:underline"
              >
                Gerenciar
              </button>
            </div>

            <div className="space-y-3">
              {collaborators.slice(0, 4).map((collab) => {
                const statusColors = {
                  ativo: 'bg-[#EBF1ED] text-[#446153] border-[#DFE5DA]',
                  em_servico: 'bg-[#FAF1E8] text-[#9A5222] border-[#ECD9C5]',
                  ferias: 'bg-[#F0F3EC] text-[#64736B] border-[#DFE5DA]',
                  inativo: 'bg-[#F0F3EC] text-[#86958E] border-[#DFE5DA]',
                };
                const statusLabels = {
                  ativo: 'Disponível',
                  em_servico: 'Em Atendimento',
                  ferias: 'Férias',
                  inativo: 'Inativo',
                };

                return (
                  <div key={collab.id} className="flex items-center justify-between p-2.5 rounded-lg border border-[#DFE5DA] hover:bg-[#F7F9F5] transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={collab.photoUrl}
                        alt={collab.name}
                        className="w-9 h-9 rounded-lg object-cover ring-1 ring-[#DFE5DA] shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-[#243029] truncate">{collab.name}</h4>
                        <span className="text-[11px] text-[#64736B] truncate block">{collab.role}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${statusColors[collab.status]}`}>
                      {statusLabels[collab.status]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
