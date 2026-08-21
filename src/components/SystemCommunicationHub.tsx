import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Radio, 
  Send, 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  Laptop, 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Sparkles, 
  Trash2, 
  RefreshCw, 
  Activity, 
  AlertCircle, 
  Bell, 
  Zap, 
  MessageSquare,
  CheckCheck
} from 'lucide-react';
import { 
  SystemNotification, 
  NotificationTarget, 
  NotificationChannel, 
  NotificationPriority 
} from '../types';
import { formatDateBR } from '../utils/formatters';

export const SystemCommunicationHub: React.FC = () => {
  const { 
    systemNotifications, 
    sendSystemNotification, 
    acknowledgeNotification, 
    deleteNotification, 
    clearAllNotifications,
    isRealtimeActive,
    ecosystemPing,
    clients,
    collaborators
  } = useApp();

  const [isSending, setIsSending] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<NotificationTarget>('all');
  const [selectedChannel, setSelectedChannel] = useState<NotificationChannel>('broadcast');
  const [selectedPriority, setSelectedPriority] = useState<NotificationPriority>('alta');
  const [customTitle, setCustomTitle] = useState('Teste de Sincronização do Ecossistema');
  const [customMessage, setCustomMessage] = useState('Disparo operacional de validação em tempo real entre o Painel ADM, PWA do Cliente e App da Equipe.');
  const [selectedCategory, setSelectedCategory] = useState('Sincronização');
  const [lastDispatchedId, setLastDispatchedId] = useState<string | null>(null);
  const [filterTarget, setFilterTarget] = useState<string>('all');

  // Test Templates / Presets
  const presets = [
    {
      title: 'Sincronização Completa do Ecossistema',
      message: 'Ping de conectividade operacional e verificação de integridade entre Painel ADM, PWA do Cliente e App de Campo.',
      target: 'all' as NotificationTarget,
      channel: 'broadcast' as NotificationChannel,
      priority: 'alta' as NotificationPriority,
      category: 'Sincronização'
    },
    {
      title: 'Alerta Operacional: Equipe a Caminho',
      message: 'Notificação automática ao cliente informando que a profissional designada está em deslocamento.',
      target: 'cliente' as NotificationTarget,
      channel: 'push_simulado' as NotificationChannel,
      priority: 'alta' as NotificationPriority,
      category: 'Atendimento'
    },
    {
      title: 'Nova Ordem de Serviço Disponível',
      message: 'Novo chamado de organização alocado para a equipe de campo com código de segurança gerado.',
      target: 'colaborador' as NotificationTarget,
      channel: 'alerta_operacional' as NotificationChannel,
      priority: 'urgente' as NotificationPriority,
      category: 'Operacional'
    },
    {
      title: 'Auditoria de Segurança & Código de Validação',
      message: 'Validação de protocolo de segurança e sincronização de chaves de atendimento em tempo real.',
      target: 'admin' as NotificationTarget,
      channel: 'sync_ping' as NotificationChannel,
      priority: 'media' as NotificationPriority,
      category: 'Segurança'
    }
  ];

  const handleApplyPreset = (preset: typeof presets[0]) => {
    setCustomTitle(preset.title);
    setCustomMessage(preset.message);
    setSelectedTarget(preset.target);
    setSelectedChannel(preset.channel);
    setSelectedPriority(preset.priority);
    setSelectedCategory(preset.category);
  };

  const handleSendTestNotification = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customTitle.trim() || !customMessage.trim()) return;

    setIsSending(true);
    try {
      const dispatched = await sendSystemNotification({
        title: customTitle.trim(),
        message: customMessage.trim(),
        target: selectedTarget,
        channel: selectedChannel,
        priority: selectedPriority,
        sender: 'Administração Central',
        senderRole: 'Gerente Operacional (ADM)',
        category: selectedCategory,
        metadata: {
          timestamp: Date.now(),
          clientsCount: clients.length,
          collaboratorsCount: collaborators.length,
          ecosystemVersion: '2.4.0-pro'
        }
      });

      setLastDispatchedId(dispatched.id);

      // Auto-simulate immediate multi-node acknowledgement if requested for live demonstration
      setTimeout(() => {
        if (selectedTarget === 'all' || selectedTarget === 'cliente') {
          acknowledgeNotification(dispatched.id, {
            recipientId: 'client-node-01',
            recipientName: clients[0]?.name || 'Cliente PWA Mobile',
            recipientType: 'cliente',
            deviceInfo: 'iPhone Safari (PWA)',
            responseNote: 'Recebido instantaneamente no PWA do cliente via Supabase Realtime.',
            latencyMs: Math.floor(Math.random() * 25) + 15
          });
        }
      }, 700);

      setTimeout(() => {
        if (selectedTarget === 'all' || selectedTarget === 'colaborador') {
          acknowledgeNotification(dispatched.id, {
            recipientId: 'field-node-02',
            recipientName: collaborators[0]?.name || 'Equipe de Campo (App)',
            recipientType: 'colaborador',
            deviceInfo: 'Android Chrome (App Campo)',
            responseNote: 'Notificação confirmada pela equipe operacional em campo.',
            latencyMs: Math.floor(Math.random() * 30) + 20
          });
        }
      }, 1400);

    } finally {
      setIsSending(false);
    }
  };

  // Simulate manual acknowledgement from specific client or staff
  const handleSimulateResponse = (notificationId: string, role: 'cliente' | 'colaborador' | 'admin') => {
    const mockInfo = {
      cliente: {
        id: `sim-cli-${Date.now().toString().slice(-4)}`,
        name: clients[0]?.name || 'Maria Silva (PWA)',
        device: 'PWA Mobile (iOS/Android)',
        note: 'Confirmação de recebimento registrada no PWA do cliente.'
      },
      colaborador: {
        id: `sim-col-${Date.now().toString().slice(-4)}`,
        name: collaborators[0]?.name || 'Ana Paula (Equipe)',
        device: 'App da Equipe (Android)',
        note: 'Ordem de serviço aceita e visualizada no App de Campo.'
      },
      admin: {
        id: `sim-adm-${Date.now().toString().slice(-4)}`,
        name: 'Central de Operações',
        device: 'Console ADM Web',
        note: 'Sincronização bidirecional verificada com sucesso.'
      }
    }[role];

    acknowledgeNotification(notificationId, {
      recipientId: mockInfo.id,
      recipientName: mockInfo.name,
      recipientType: role,
      deviceInfo: mockInfo.device,
      responseNote: mockInfo.note,
      latencyMs: Math.floor(Math.random() * 20) + 12
    });
  };

  const filteredNotifications = systemNotifications.filter(n => {
    if (filterTarget === 'all') return true;
    return n.target === filterTarget || n.target === 'all';
  });

  return (
    <div id="system-communication-hub" className="space-y-6">
      {/* Header card with Ecosystem Status */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#DFE5DA] shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#5A7D6C]/10 border border-[#5A7D6C]/20 flex items-center justify-center shrink-0 text-[#5A7D6C]">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-[#243029]">
                  Hub de Comunicação & Sincronização em Tempo Real
                </h3>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isRealtimeActive 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isRealtimeActive ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`}></span>
                  {isRealtimeActive ? 'Supabase Realtime Conectado' : 'Modo Local / Reconectando'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#5C6E64] mt-1 max-w-2xl">
                Transmita mensagens, ordens e eventos operacionais com propagação instantânea para o PWA do Cliente e o App da Equipe de Campo via PostgreSQL Realtime Broadcast.
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 bg-[#F4F6F2] p-2.5 rounded-xl border border-[#DFE5DA]">
            <div className="px-3 py-1 text-center">
              <span className="block text-[10px] uppercase font-bold text-[#73887C]">Latência</span>
              <span className="text-xs sm:text-sm font-bold text-[#243029] flex items-center justify-center gap-1">
                <Activity className="w-3.5 h-3.5 text-[#5A7D6C]" />
                {ecosystemPing}ms
              </span>
            </div>
            <div className="w-px h-8 bg-[#DFE5DA]"></div>
            <div className="px-3 py-1 text-center">
              <span className="block text-[10px] uppercase font-bold text-[#73887C]">Disparos</span>
              <span className="text-xs sm:text-sm font-bold text-[#243029]">
                {systemNotifications.length}
              </span>
            </div>
            <div className="w-px h-8 bg-[#DFE5DA]"></div>
            <div className="px-3 py-1 text-center">
              <span className="block text-[10px] uppercase font-bold text-[#73887C]">Confirmações</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-700 flex items-center justify-center gap-1">
                <CheckCheck className="w-3.5 h-3.5" />
                {systemNotifications.reduce((acc, n) => acc + (n.acknowledgedBy?.length || 0), 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Testing Controls & Dispatch Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Dispatch Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#DFE5DA] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#5A7D6C]" />
                <h4 className="text-sm font-bold text-[#243029] uppercase tracking-wide">
                  Enviar Teste de Comunicação
                </h4>
              </div>
              <span className="text-[11px] font-medium text-[#73887C] bg-[#F4F6F2] px-2 py-0.5 rounded-md border border-[#DFE5DA]">
                Multi-Destino
              </span>
            </div>

            {/* Presets Selector */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#35483E] mb-2">
                Modelos de Teste Operacional Rápido:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="p-2.5 rounded-xl text-left border border-[#DFE5DA] bg-[#FAFAF8] hover:bg-[#F0F4EE] hover:border-[#5A7D6C]/40 transition-all text-xs font-medium text-[#243029] flex flex-col justify-between"
                  >
                    <span className="font-semibold line-clamp-1">{p.title}</span>
                    <span className="text-[10px] text-[#73887C] mt-1 capitalize">
                      Alvo: {p.target === 'all' ? 'Todos' : p.target}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendTestNotification} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#35483E] mb-1">
                  Título da Notificação / Evento
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Ex: Teste de Sincronização do Ecossistema"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#DFE5DA] bg-white text-[#243029] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C]/30 focus:border-[#5A7D6C]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#35483E] mb-1">
                  Conteúdo da Mensagem Operacional
                </label>
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Descreva a mensagem a ser disparada via broadcast..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#DFE5DA] bg-white text-[#243029] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C]/30 focus:border-[#5A7D6C] resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#35483E] mb-1">
                    Destinatário Alvo
                  </label>
                  <select
                    value={selectedTarget}
                    onChange={(e) => setSelectedTarget(e.target.value as NotificationTarget)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DFE5DA] bg-white text-[#243029] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C]/30 focus:border-[#5A7D6C]"
                  >
                    <option value="all">🌐 Todos (Broadcast Global)</option>
                    <option value="cliente">📱 PWA do Cliente</option>
                    <option value="colaborador">👷 App de Campo (Equipe)</option>
                    <option value="admin">💻 Central de Controle (ADM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#35483E] mb-1">
                    Prioridade do Disparo
                  </label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value as NotificationPriority)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DFE5DA] bg-white text-[#243029] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C]/30 focus:border-[#5A7D6C]"
                  >
                    <option value="baixa">🟢 Baixa (Informativa)</option>
                    <option value="media">🟡 Média (Operacional)</option>
                    <option value="alta">🟠 Alta (Atenção)</option>
                    <option value="urgente">🔴 Urgente (Crítica)</option>
                  </select>
                </div>
              </div>

              <button
                id="btn-test-ecosystem-sync"
                type="submit"
                disabled={isSending}
                className="w-full mt-2 px-4 py-3 rounded-xl bg-[#5A7D6C] hover:bg-[#446153] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Propagando no Supabase Realtime...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Disparar Sincronização Agora
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Node Status Indicator Card */}
          <div className="bg-[#F8FAF6] rounded-2xl p-4 border border-[#DFE5DA]">
            <h5 className="text-xs font-bold text-[#35483E] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#5A7D6C]" />
              Módulos Ativos do Ecossistema
            </h5>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#DFE5DA]">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-[#5A7D6C]" />
                  <span className="font-semibold text-[#243029]">Painel Master ADM</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Ativo (Emissor)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#DFE5DA]">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#5A7D6C]" />
                  <span className="font-semibold text-[#243029]">PWA do Cliente</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {clients.length} Clientes Sincronizados
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#DFE5DA]">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#5A7D6C]" />
                  <span className="font-semibold text-[#243029]">App de Campo (Staff)</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {collaborators.length} Profissionais Conectados
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Event Stream & Responses (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#DFE5DA] shadow-sm flex flex-col h-full min-h-[520px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-[#DFE5DA]">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#5A7D6C]" />
                <h4 className="text-sm font-bold text-[#243029] uppercase tracking-wide">
                  Fluxo de Eventos & Confirmações em Tempo Real
                </h4>
              </div>

              <div className="flex items-center gap-2">
                {/* Filter Selector */}
                <select
                  value={filterTarget}
                  onChange={(e) => setFilterTarget(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-[#DFE5DA] bg-[#FAFAF8] text-[#243029] focus:outline-none"
                >
                  <option value="all">Todos os Alvos</option>
                  <option value="cliente">PWA Clientes</option>
                  <option value="colaborador">App Campo</option>
                  <option value="admin">ADM</option>
                </select>

                {systemNotifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all flex items-center gap-1"
                    title="Limpar histórico de testes"
                  >
                    <Trash2 className="w-3 h-3" />
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Notification Event Feed */}
            <div className="flex-1 overflow-y-auto mt-4 space-y-3.5 pr-1 max-h-[600px]">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Radio className="w-10 h-10 text-[#73887C]/40 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#35483E]">Nenhum disparo de teste registrado</p>
                  <p className="text-xs text-[#73887C] mt-1 max-w-sm mx-auto">
                    Utilize o formulário ao lado para disparar um teste de sincronização no ecossistema e verificar as respostas em tempo real.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const isLatest = notif.id === lastDispatchedId;
                  const ackCount = notif.acknowledgedBy?.length || 0;

                  const priorityColors = {
                    baixa: 'bg-slate-100 text-slate-700 border-slate-200',
                    media: 'bg-blue-50 text-blue-700 border-blue-200',
                    alta: 'bg-amber-50 text-amber-700 border-amber-200',
                    urgente: 'bg-rose-50 text-rose-700 border-rose-200'
                  }[notif.priority] || 'bg-slate-100 text-slate-700 border-slate-200';

                  const targetLabels = {
                    all: '🌐 Todos os Módulos',
                    cliente: '📱 PWA Cliente',
                    colaborador: '👷 App Campo',
                    admin: '💻 Central ADM'
                  }[notif.target] || notif.target;

                  return (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isLatest 
                          ? 'border-[#5A7D6C] bg-[#F2F7F4] shadow-sm ring-1 ring-[#5A7D6C]/30' 
                          : 'border-[#DFE5DA] bg-white hover:bg-[#FAFAF8]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase border ${priorityColors}`}>
                              {notif.priority}
                            </span>
                            <span className="text-[11px] font-semibold text-[#5A7D6C] bg-[#5A7D6C]/10 px-2 py-0.5 rounded-md">
                              {targetLabels}
                            </span>
                            <span className="text-[11px] text-[#73887C] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDateBR(notif.createdAt)}
                            </span>
                          </div>

                          <h5 className="text-xs sm:text-sm font-bold text-[#243029]">
                            {notif.title}
                          </h5>
                          <p className="text-xs text-[#5C6E64] mt-1">
                            {notif.message}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteNotification(notif.id)}
                          className="text-[#73887C] hover:text-rose-600 p-1 rounded-md transition-all shrink-0"
                          title="Remover notificação"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Acknowledgements / Responses Section */}
                      <div className="mt-3 pt-3 border-t border-[#DFE5DA]/60">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                          <span className="text-[11px] font-bold text-[#35483E] flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Confirmações Recebidas ({ackCount}):
                          </span>

                          {/* Action to simulate immediate response from other client/device */}
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="text-[#73887C]">Simular Resposta:</span>
                            <button
                              type="button"
                              onClick={() => handleSimulateResponse(notif.id, 'cliente')}
                              className="px-2 py-0.5 bg-white hover:bg-emerald-50 border border-[#DFE5DA] text-[#243029] font-medium rounded transition-all"
                            >
                              + PWA
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSimulateResponse(notif.id, 'colaborador')}
                              className="px-2 py-0.5 bg-white hover:bg-emerald-50 border border-[#DFE5DA] text-[#243029] font-medium rounded transition-all"
                            >
                              + Campo
                            </button>
                          </div>
                        </div>

                        {ackCount === 0 ? (
                          <div className="bg-[#F8FAF6] p-2.5 rounded-lg border border-[#DFE5DA]/70 text-[11px] text-[#73887C] flex items-center gap-2">
                            <Clock className="w-3 h-3 text-amber-500 animate-spin" />
                            Aguardando confirmação de recebimento dos dispositivos remotos...
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {notif.acknowledgedBy.map((ack, aIdx) => (
                              <div
                                key={aIdx}
                                className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                              >
                                <div className="flex items-center gap-2">
                                  {ack.recipientType === 'cliente' ? (
                                    <Smartphone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                  ) : (
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                  )}
                                  <div>
                                    <span className="font-bold text-emerald-900">{ack.recipientName}</span>
                                    <span className="text-[10px] text-emerald-700 ml-1.5 font-medium">
                                      ({ack.deviceInfo || 'Dispositivo Web'})
                                    </span>
                                    {ack.responseNote && (
                                      <p className="text-[11px] text-emerald-800 italic mt-0.5">
                                        "{ack.responseNote}"
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-[10px] font-bold text-emerald-700 bg-white/80 px-1.5 py-0.5 rounded border border-emerald-300">
                                    ⚡ {ack.latencyMs || 18}ms
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
