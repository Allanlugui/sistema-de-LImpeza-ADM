import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CustomerRequest, RequestStatus } from '../types';
import { 
  Timer, 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  UserCheck, 
  MapPin, 
  Layers, 
  MessageCircle, 
  Phone, 
  Sparkles, 
  Plus, 
  Check, 
  X, 
  Camera, 
  CheckSquare, 
  ListChecks,
  UserX,
  FileCheck2,
  ShieldCheck,
  Smartphone,
  HardHat,
  Lock,
  RotateCcw
} from 'lucide-react';
import { SecurityCodeValidationModal } from './SecurityCodeValidationModal';
import { CustomerAppModal } from './CustomerAppModal';
import { StaffAppModal } from './StaffAppModal';
import { 
  formatSecondsToTimer, 
  formatCurrency, 
  getWhatsAppLink, 
  formatDateBR 
} from '../utils/formatters';

export const AllocationLiveTrackingView: React.FC = () => {
  const { 
    requests, 
    collaborators, 
    startExecutionTimer, 
    pauseExecutionTimer, 
    completeExecution, 
    toggleChecklistItem, 
    addChecklistItem, 
    updateExecutionNotes,
    allocateStaff,
    updateRequestStatus,
    regenerateSecurityCode,
    addToast
  } = useApp();

  const [newTaskInput, setNewTaskInput] = useState<{ [requestId: string]: string }>({});
  const [activeTabFilter, setActiveTabFilter] = useState<'ativos' | 'todos' | 'pendentes' | 'concluidos'>('ativos');

  // Security Validation & App Simulators Modals
  const [validatingRequest, setValidatingRequest] = useState<CustomerRequest | null>(null);
  const [customerAppReqId, setCustomerAppReqId] = useState<string | null>(null);
  const [staffAppStaffId, setStaffAppStaffId] = useState<string | null>(null);

  // Finish confirmation modal
  const [finishingRequest, setFinishingRequest] = useState<CustomerRequest | null>(null);
  const [completionNotes, setCompletionNotes] = useState('Serviço inspecionado e finalizado com sucesso. Ambientes higienizados e organizados.');

  // Reallocate modal
  const [reallocatingRequest, setReallocatingRequest] = useState<CustomerRequest | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  const handleFinishConfirm = () => {
    if (!finishingRequest) return;
    completeExecution(finishingRequest.id, completionNotes);
    setFinishingRequest(null);
    setCompletionNotes('');
  };

  const handleReallocate = () => {
    if (!reallocatingRequest || !selectedStaffId) return;
    allocateStaff(reallocatingRequest.id, selectedStaffId);
    setReallocatingRequest(null);
    setSelectedStaffId('');
  };

  const handleAddNewTask = (requestId: string, category: 'limpeza' | 'organizacao' | 'geral' = 'geral') => {
    const text = newTaskInput[requestId]?.trim();
    if (!text) return;
    addChecklistItem(requestId, text, category);
    setNewTaskInput(prev => ({ ...prev, [requestId]: '' }));
  };

  // Filter requests
  const filteredRequests = requests.filter(r => {
    if (activeTabFilter === 'ativos') {
      return r.status === 'em_execucao' || r.status === 'alocado' || r.status === 'pausado' || r.status === 'a_caminho';
    }
    if (activeTabFilter === 'pendentes') {
      return r.status === 'pendente';
    }
    if (activeTabFilter === 'concluidos') {
      return r.status === 'concluido';
    }
    return true;
  });

  const runningCount = requests.filter(r => r.status === 'em_execucao' && r.executionTracking?.isRunning).length;
  const unassignedCount = requests.filter(r => r.status === 'pendente').length;

  return (
    <div id="allocation-live-tracking-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#243029] tracking-tight">
              Alocação & Acompanhamento em Tempo Real
            </h2>
            {runningCount > 0 && (
              <span className="bg-[#D4A373] text-white text-xs font-semibold px-2.5 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                {runningCount} ao vivo
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#6B7B70] mt-1">
            Designação de equipe, controle de status e cronômetro de execução sincronizado segundo a segundo.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#DFE5DA] shadow-2xs text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTabFilter('ativos')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTabFilter === 'ativos'
                ? 'bg-[#5A7D6C] text-white font-semibold shadow-xs'
                : 'text-[#6B7B70] hover:bg-[#EEF3ED] hover:text-[#243029]'
            }`}
          >
            Em Andamento ({requests.filter(r => ['em_execucao', 'alocado', 'pausado', 'a_caminho'].includes(r.status)).length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTabFilter('pendentes')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTabFilter === 'pendentes'
                ? 'bg-[#5A7D6C] text-white font-semibold shadow-xs'
                : 'text-[#6B7B70] hover:bg-[#EEF3ED] hover:text-[#243029]'
            }`}
          >
            Pendentes ({unassignedCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTabFilter('concluidos')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTabFilter === 'concluidos'
                ? 'bg-[#5A7D6C] text-white font-semibold shadow-xs'
                : 'text-[#6B7B70] hover:bg-[#EEF3ED] hover:text-[#243029]'
            }`}
          >
            Concluídos ({requests.filter(r => r.status === 'concluido').length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTabFilter('todos')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTabFilter === 'todos'
                ? 'bg-[#5A7D6C] text-white font-semibold shadow-xs'
                : 'text-[#6B7B70] hover:bg-[#EEF3ED] hover:text-[#243029]'
            }`}
          >
            Todos ({requests.length})
          </button>
        </div>
      </div>

      {/* Main Execution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRequests.map((req) => {
          const isRunning = req.status === 'em_execucao' && req.executionTracking?.isRunning;
          const elapsed = req.executionTracking?.elapsedSeconds || 0;
          const estimatedSecs = req.estimatedDurationHours * 3600;
          const isOvertime = elapsed > estimatedSecs;
          const progressPct = Math.min(100, Math.round((elapsed / estimatedSecs) * 100));

          const checklist = req.executionTracking?.checklist || [];
          const completedTasksCount = checklist.filter(t => t.completed).length;
          const totalTasksCount = checklist.length;

          // Assigned staff details
          const assignedStaff = collaborators.find(c => c.id === req.assignedStaffId);

          return (
            <div 
              key={req.id}
              className={`bg-white rounded-2xl border transition-all shadow-2xs overflow-hidden flex flex-col justify-between ${
                isRunning 
                  ? 'border-[#5A7D6C] ring-2 ring-[#5A7D6C]/20' 
                  : req.status === 'concluido'
                  ? 'border-[#C3E6CC] bg-[#EBF6EE]/30'
                  : 'border-[#DFE5DA]'
              }`}
            >
              {/* Card Header */}
              <div className="p-5 border-b border-[#EEF3ED] bg-[#F7F8F4]">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-[#3D564A] bg-[#EEF3ED] px-2.5 py-0.5 rounded border border-[#D4E0D1]">
                        {req.code}
                      </span>
                      <h3 className="text-base font-bold text-[#243029]">{req.clientName}</h3>
                    </div>
                    <p className="text-xs text-[#6B7B70] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#8FA395]" />
                      {req.address.street}, {req.address.number} - {req.address.neighborhood} ({req.address.city})
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="text-right">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border inline-block ${
                      req.status === 'em_execucao'
                        ? 'bg-[#FEF6E9] text-[#925C18] border-[#FCE2B6] animate-pulse'
                        : req.status === 'pausado'
                        ? 'bg-[#F0F2ED] text-[#55635B] border-[#DFE5DA]'
                        : req.status === 'concluido'
                        ? 'bg-[#EBF6EE] text-[#236838] border-[#C3E6CC]'
                        : 'bg-[#EEF3ED] text-[#3D564A] border-[#D4E0D1]'
                    }`}>
                      {req.status === 'em_execucao'
                        ? '⚡ Execução ao Vivo'
                        : req.status === 'pausado'
                        ? '⏸️ Pausado'
                        : req.status === 'concluido'
                        ? '✅ Concluído'
                        : '📋 Alocado'}
                    </span>
                    <span className="block text-[10px] text-[#8FA395] mt-1">
                      Agendado: {formatDateBR(req.scheduleDate)} às {req.scheduleTime}
                    </span>
                  </div>
                </div>

                {/* Service Specs Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    req.serviceType === 'ambos'
                      ? 'bg-[#F2EBF9] text-[#6B3BA7] border-[#DFC9F4]'
                      : req.serviceType === 'organizacao'
                      ? 'bg-[#EBF3FA] text-[#2C6288] border-[#CCE0F4]'
                      : 'bg-[#EEF3ED] text-[#3D564A] border-[#D4E0D1]'
                  }`}>
                    {req.serviceType === 'ambos' ? 'Limpeza + Organização' : req.serviceType.toUpperCase()}
                  </span>

                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                    req.organizationFormat === 'personalizada'
                      ? 'bg-[#F5F8F4] text-[#3D564A] border-[#D4E0D1]'
                      : 'bg-[#F0F2ED] text-[#55635B] border-[#DFE5DA]'
                  }`}>
                    {req.organizationFormat === 'personalizada' ? 'Org. Personalizada' : 'Padrão da Empresa (5S)'}
                  </span>

                  <span className="text-[11px] text-[#6B7B70] font-medium ml-auto">
                    Total: <strong className="text-[#243029]">{formatCurrency(req.price)}</strong>
                  </span>
                </div>
              </div>

              {/* Execution Timer Panel */}
              <div className="p-5 space-y-4">
                {/* Timer Display Block */}
                <div className="p-4 rounded-xl bg-[#243029] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#A2B3A6] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#D4A373]" />
                      Cronômetro de Execução Operacional
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className={`text-3xl sm:text-4xl font-mono font-bold tracking-tight ${
                        isOvertime ? 'text-[#F4A8A0] animate-pulse' : 'text-[#A8E6CF]'
                      }`}>
                        {formatSecondsToTimer(elapsed)}
                      </span>
                      <span className="text-xs text-[#A2B3A6]">
                        / meta: {req.estimatedDurationHours}h:00m
                      </span>
                    </div>

                    {isOvertime && (
                      <div className="text-[11px] text-[#F4A8A0] flex items-center gap-1 mt-1 font-medium">
                        <AlertTriangle className="w-3 h-3 text-[#F4A8A0]" />
                        Tempo estimado ultrapassado!
                      </div>
                    )}
                  </div>

                  {/* Timer Controls */}
                  <div className="flex items-center gap-2">
                    {req.status === 'em_execucao' ? (
                      <button
                        type="button"
                        onClick={() => pauseExecutionTimer(req.id)}
                        className="px-3.5 py-2 bg-[#D4A373] hover:bg-[#c29263] text-[#243029] font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Pause className="w-4 h-4" />
                        Pausar
                      </button>
                    ) : req.status === 'pausado' ? (
                      <button
                        type="button"
                        onClick={() => startExecutionTimer(req.id)}
                        className="px-3.5 py-2 bg-[#5A7D6C] hover:bg-[#4a695b] text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Play className="w-4 h-4" />
                        Retomar
                      </button>
                    ) : req.status === 'alocado' ? (
                      <button
                        type="button"
                        onClick={() => setValidatingRequest(req)}
                        className="px-3.5 py-2 bg-[#4E7A62] hover:bg-[#3f6551] text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="Validar Código de Segurança de 4 dígitos fornecido pelo cliente para iniciar"
                      >
                        <Lock className="w-4 h-4" />
                        Validar Código & Iniciar
                      </button>
                    ) : null}

                    {req.status !== 'concluido' && (
                      <button
                        type="button"
                        onClick={() => setFinishingRequest(req)}
                        className="px-3.5 py-2 bg-[#2E5A44] hover:bg-[#234735] text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Concluir
                      </button>
                    )}
                  </div>
                </div>

                {/* Security Confirmation Code Highlight Strip */}
                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#ECD9C5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#5A7D6C] text-white flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#243029]">
                          Código de Confirmação de Identidade:
                        </span>
                        <span className="font-mono text-sm font-extrabold px-2 py-0.5 bg-white text-[#243029] rounded border border-[#DFE5DA] tracking-wider">
                          {req.confirmationCode || '4829'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7B70]">
                        {req.codeValidatedAt ? (
                          <span className="text-[#236838] font-semibold">
                            ✓ Validado no local em {req.codeValidatedAt} ({req.assignedStaffName || 'Equipe'})
                          </span>
                        ) : (
                          <span className="text-[#9A5222] font-medium">
                            🔒 O cliente apresenta este código à equipe no local para destravar o início
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCustomerAppReqId(req.id)}
                      className="px-2.5 py-1.5 bg-white hover:bg-[#EEF3ED] text-[#2C473A] rounded-lg border border-[#DFE5DA] font-semibold text-[11px] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      title="Abrir PWA do Cliente para ver o código de segurança e status do atendimento"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-[#5A7D6C]" />
                      <span>Ver no PWA do Cliente</span>
                    </button>

                    {assignedStaff && (
                      <button
                        type="button"
                        onClick={() => setStaffAppStaffId(assignedStaff.id)}
                        className="px-2.5 py-1.5 bg-white hover:bg-[#EEF3ED] text-[#2C473A] rounded-lg border border-[#DFE5DA] font-semibold text-[11px] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        title="Abrir App Operacional da Equipe para validar o código e registrar execução"
                      >
                        <HardHat className="w-3.5 h-3.5 text-[#C88346]" />
                        <span>Abrir no App da Equipe</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-[#6B7B70] font-medium">
                    <span>Evolução do Tempo Estimado</span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="w-full bg-[#EEF3ED] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOvertime ? 'bg-[#D9534F]' : 'bg-[#5A7D6C]'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Assigned Staff Info Block */}
                <div className="p-3 bg-[#F7F8F4] rounded-xl border border-[#DFE5DA] flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    {assignedStaff ? (
                      <>
                        <img
                          src={assignedStaff.photoUrl}
                          alt={assignedStaff.name}
                          className="w-10 h-10 rounded-lg object-cover ring-1 ring-[#DFE5DA]"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-[#243029]">{assignedStaff.name}</h4>
                            <span className="text-[10px] text-[#925C18] font-bold">★ {assignedStaff.rating.toFixed(1)}</span>
                          </div>
                          <p className="text-[11px] text-[#6B7B70]">{assignedStaff.role}</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-[#925C18]">
                        <AlertTriangle className="w-4 h-4 text-[#925C18]" />
                        <span className="font-semibold">Nenhum profissional designado ainda</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {assignedStaff && (
                      <a
                        href={getWhatsAppLink(assignedStaff.phone, `Olá ${assignedStaff.name}, tudo bem? Sobre a execução do serviço ${req.code}:`)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-[#EEF3ED] text-[#3D564A] hover:bg-[#DFE5DA] rounded-lg font-medium text-xs flex items-center gap-1 transition-colors"
                        title="Falar com Colaborador no WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Equipe</span>
                      </a>
                    )}

                    <a
                      href={getWhatsAppLink(req.clientWhatsapp, `Olá ${req.clientName}, tudo bem? Acompanhamento da sua ordem ${req.code}:`)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-[#EEF3ED] text-[#3D564A] hover:bg-[#DFE5DA] rounded-lg font-medium text-xs flex items-center gap-1 transition-colors"
                      title="Falar com Cliente no WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Cliente</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setReallocatingRequest(req);
                        setSelectedStaffId(req.assignedStaffId || '');
                      }}
                      className="p-1.5 bg-white border border-[#DFE5DA] hover:bg-[#EEF3ED] rounded-lg text-[#3D4C42] text-xs font-medium cursor-pointer"
                      title="Trocar / Designar Colaborador"
                    >
                      Trocar
                    </button>
                  </div>
                </div>

                {/* Real-time Checklist */}
                <div className="p-3.5 bg-white rounded-xl border border-[#DFE5DA] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ListChecks className="w-4 h-4 text-[#5A7D6C]" />
                      <h4 className="text-xs font-bold text-[#243029]">
                        Checklist Operacional em Tempo Real ({completedTasksCount}/{totalTasksCount})
                      </h4>
                    </div>

                    <span className="text-[10px] text-[#6B7B70] font-medium">
                      {totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0}% concluído
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {checklist.map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          item.completed
                            ? 'bg-[#F7F8F4] border-[#DFE5DA] text-[#8FA395] line-through'
                            : 'bg-white border-[#DFE5DA] text-[#243029] hover:bg-[#F7F8F4]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleChecklistItem(req.id, item.id)}
                          className="w-4 h-4 text-[#5A7D6C] rounded border-[#DFE5DA] focus:ring-[#5A7D6C] mt-0.5"
                        />
                        <span className="flex-1 leading-snug">{item.task}</span>
                        <span className="text-[9px] uppercase font-semibold px-1.5 py-0.2 rounded bg-[#EEF3ED] text-[#55635B] shrink-0">
                          {item.category}
                        </span>
                      </label>
                    ))}

                    {checklist.length === 0 && (
                      <p className="text-xs text-[#8FA395] italic py-2 text-center">
                        Nenhuma tarefa no checklist ainda.
                      </p>
                    )}
                  </div>

                  {/* Add Quick Checklist Task */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Adicionar tarefa operacional ao vivo..."
                      value={newTaskInput[req.id] || ''}
                      onChange={(e) => setNewTaskInput({ ...newTaskInput, [req.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewTask(req.id, req.serviceType === 'organizacao' ? 'organizacao' : 'limpeza');
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddNewTask(req.id, req.serviceType === 'organizacao' ? 'organizacao' : 'limpeza')}
                      className="p-1.5 bg-[#EEF3ED] hover:bg-[#DFE5DA] text-[#243029] rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Organization Format Preferences Note */}
                {req.orgDetails?.customNotes && (
                  <div className="text-xs p-2.5 rounded-lg bg-[#EEF3ED] border border-[#D4E0D1] text-[#3D564A]">
                    <strong className="font-semibold block mb-0.5">Orientações do Formato de Organização:</strong>
                    {req.orgDetails.customNotes}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredRequests.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-[#DFE5DA] p-8">
            <Timer className="w-10 h-10 text-[#A2B3A6] mx-auto mb-2" />
            <h3 className="text-base font-bold text-[#243029]">Nenhum serviço correspondente ao filtro</h3>
            <p className="text-xs text-[#6B7B70] mt-1">
              Alterne para a aba "Todos" ou acesse a Central de Solicitações para iniciar novas execuções.
            </p>
          </div>
        )}
      </div>

      {/* Finish Service Modal */}
      {finishingRequest && (
        <div id="modal-finish-service" className="fixed inset-0 z-50 bg-[#16201A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#DFE5DA] max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#243029] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#5A7D6C] flex items-center justify-center text-white">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Concluir Ordem de Serviço</h3>
                  <span className="text-xs text-[#C8D6CD]">
                    {finishingRequest.code} - {finishingRequest.clientName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFinishingRequest(null)}
                className="p-1 rounded-lg text-[#C8D6CD] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-[#EEF3ED] text-[#3D564A] rounded-xl border border-[#D4E0D1]">
                <p><strong>Tempo Total Registrado:</strong> {formatSecondsToTimer(finishingRequest.executionTracking?.elapsedSeconds || 0)}</p>
                <p><strong>Colaborador:</strong> {finishingRequest.assignedStaffName}</p>
                <p><strong>Valor:</strong> {formatCurrency(finishingRequest.price)}</p>
              </div>

              <div>
                <label className="block font-semibold text-[#243029] mb-1">
                  Parecer Final da Execução / Observações de Inspeção:
                </label>
                <textarea
                  rows={3}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Relate os detalhes da entrega, itens organizados e conformidade com o padrão contratado..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EEF3ED]">
                <button
                  type="button"
                  onClick={() => setFinishingRequest(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#6B7B70] hover:text-[#243029] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-finish-execution"
                  type="button"
                  onClick={handleFinishConfirm}
                  className="px-5 py-2.5 bg-[#5A7D6C] hover:bg-[#4a695b] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  Finalizar e Liberar Faturamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reallocate Staff Modal */}
      {reallocatingRequest && (
        <div id="modal-reallocate-staff" className="fixed inset-0 z-50 bg-[#16201A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#DFE5DA] max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#243029] text-white p-5 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Alterar Designação de Profissional</h3>
              <button
                type="button"
                onClick={() => setReallocatingRequest(null)}
                className="p-1 rounded-lg text-[#C8D6CD] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <label className="block text-xs font-semibold text-[#243029]">
                Selecione o novo colaborador para {reallocatingRequest.code}:
              </label>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {collaborators.filter(c => c.allowAppAccess).map((staff) => (
                  <label
                    key={staff.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedStaffId === staff.id
                        ? 'border-[#5A7D6C] bg-[#EEF3ED]'
                        : 'border-[#DFE5DA] hover:bg-[#F7F8F4]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="reassignStaff"
                        value={staff.id}
                        checked={selectedStaffId === staff.id}
                        onChange={() => setSelectedStaffId(staff.id)}
                        className="w-4 h-4 text-[#5A7D6C] border-[#DFE5DA] focus:ring-[#5A7D6C]"
                      />
                      <img
                        src={staff.photoUrl}
                        alt={staff.name}
                        className="w-8 h-8 rounded-lg object-cover ring-1 ring-[#DFE5DA]"
                      />
                      <div>
                        <p className="text-xs font-bold text-[#243029]">{staff.name}</p>
                        <p className="text-[10px] text-[#6B7B70]">{staff.role}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold text-[#3D564A] bg-[#EEF3ED] px-2 py-0.5 rounded border border-[#D4E0D1]">
                      ★ {staff.rating.toFixed(1)}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EEF3ED]">
                <button
                  type="button"
                  onClick={() => setReallocatingRequest(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#6B7B70] hover:text-[#243029] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleReallocate}
                  disabled={!selectedStaffId}
                  className="px-5 py-2 bg-[#5A7D6C] hover:bg-[#4a695b] text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  Salvar Nova Alocação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Code Validation Modal */}
      {validatingRequest && (
        <SecurityCodeValidationModal
          isOpen={!!validatingRequest}
          onClose={() => setValidatingRequest(null)}
          request={validatingRequest}
          staffName={validatingRequest.assignedStaffName || 'Colaborador da Equipe'}
          staffId={validatingRequest.assignedStaffId || 'colab-1'}
          onSuccess={() => {
            setValidatingRequest(null);
          }}
        />
      )}

      {/* Customer App Simulator Modal */}
      {customerAppReqId && (
        <CustomerAppModal
          isOpen={!!customerAppReqId}
          onClose={() => setCustomerAppReqId(null)}
          initialRequestId={customerAppReqId}
        />
      )}

      {/* Staff Operational App Simulator Modal */}
      {staffAppStaffId && (
        <StaffAppModal
          isOpen={!!staffAppStaffId}
          onClose={() => setStaffAppStaffId(null)}
          initialStaffId={staffAppStaffId}
        />
      )}
    </div>
  );
};
