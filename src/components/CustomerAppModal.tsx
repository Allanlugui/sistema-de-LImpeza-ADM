import React, { useState } from 'react';
import { CustomerRequest, Collaborator } from '../types';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Copy, 
  Check, 
  Clock, 
  MapPin, 
  User, 
  Sparkles, 
  Phone, 
  MessageSquare, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Timer, 
  ChevronRight, 
  Layers, 
  Home, 
  Calendar,
  Share2,
  Lock
} from 'lucide-react';
import { formatCurrency, formatDateBR, formatSecondsToTimer } from '../utils/formatters';

interface CustomerAppModalProps {
  initialRequestId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerAppModal: React.FC<CustomerAppModalProps> = ({
  initialRequestId,
  isOpen,
  onClose
}) => {
  const { requests, collaborators, addToast } = useApp();
  const [selectedReqId, setSelectedReqId] = useState<string>(
    initialRequestId || requests[0]?.id || ''
  );
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const currentReq = requests.find(r => r.id === selectedReqId) || requests[0];
  if (!currentReq) return null;

  const assignedStaff = collaborators.find(c => c.id === currentReq.assignedStaffId);
  const code = currentReq.confirmationCode || '4829';
  const isValidated = !!currentReq.codeValidatedAt || currentReq.status === 'em_execucao' || currentReq.status === 'concluido';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    addToast({
      type: 'success',
      title: 'Código Copiado',
      message: `Código ${code} copiado para a área de transferência.`
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getStatusBadge = () => {
    switch (currentReq.status) {
      case 'pendente':
        return { label: 'Solicitação em Análise', bg: 'bg-[#F2EFE9] text-[#7A6B56] border-[#DFD9CD]' };
      case 'alocado':
        return { label: 'Equipe Confirmada • A Caminho', bg: 'bg-[#EEF3ED] text-[#2C473A] border-[#C3D5C9]' };
      case 'em_execucao':
        return { label: 'Em Execução • Cronômetro Ativo', bg: 'bg-[#FAF0E6] text-[#A85820] border-[#F2D7C2]' };
      case 'concluido':
        return { label: 'Serviço Finalizado com Sucesso', bg: 'bg-[#EBF6EE] text-[#236838] border-[#C3E6CC]' };
      default:
        return { label: currentReq.status, bg: 'bg-stone-100 text-stone-700 border-stone-200' };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div 
      id="modal-customer-app-simulator" 
      className="fixed inset-0 z-50 bg-[#16201A]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      {/* Device / Container Frame */}
      <div className="bg-[#243029] p-2.5 sm:p-3.5 rounded-[2.5rem] shadow-2xl border-4 border-[#3D5245] max-w-sm sm:max-w-md w-full relative overflow-hidden">
        
        {/* Top Speaker / Camera Notch Mockup */}
        <div className="flex justify-between items-center px-6 py-2 text-white/70 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#5A7D6C] animate-pulse"></span>
            <span>App do Cliente • LimpaBem & Organiza</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={onClose}
              className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Smartphone Screen Inner Container */}
        <div className="bg-[#FAF7F2] rounded-[2rem] overflow-hidden text-[#243029] flex flex-col max-h-[85vh] border border-[#DFE5DA]">
          
          {/* App Top Bar */}
          <div className="bg-[#2C4035] text-white p-4 border-b border-[#3D564A]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#A3BFA8]">Meu Atendimento</span>
                <h2 className="text-sm font-bold text-white leading-tight">{currentReq.clientName}</h2>
              </div>
              
              {/* Order selector dropdown */}
              <select
                id="select-customer-app-order"
                value={selectedReqId}
                onChange={(e) => setSelectedReqId(e.target.value)}
                className="text-[11px] bg-[#1F2D25] text-[#C8D6CD] rounded-lg px-2.5 py-1 border border-[#3D564A] focus:outline-none cursor-pointer"
              >
                {requests.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.code} - {r.serviceType.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.bg}`}>
                {currentReq.status === 'em_execucao' && <span className="w-1.5 h-1.5 rounded-full bg-[#C88346] animate-ping" />}
                {statusBadge.label}
              </span>
              <span className="text-[11px] text-[#C8D6CD]">
                {formatDateBR(currentReq.scheduleDate)} às {currentReq.scheduleTime}
              </span>
            </div>
          </div>

          {/* Scrollable Screen Body */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">

            {/* HIGHLIGHTED IDENTITY CONFIRMATION CODE CARD */}
            <div 
              id="customer-app-identity-code-card"
              className="p-4 rounded-2xl bg-gradient-to-b from-[#FFFFFF] to-[#F3F6F1] border-2 border-[#5A7D6C]/40 shadow-md relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#5A7D6C] text-white flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#243029] uppercase tracking-wide">
                      Código de Confirmação de Identidade
                    </h3>
                    <p className="text-[11px] text-[#6B7B70]">
                      Segurança e autorização do atendimento
                    </p>
                  </div>
                </div>

                {isValidated ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF6EE] text-[#236838] border border-[#C3E6CC] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Validado
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF0E6] text-[#A85820] border border-[#F2D7C2] flex items-center gap-1 animate-pulse">
                    <Lock className="w-3 h-3" /> Aguardando Local
                  </span>
                )}
              </div>

              {/* Huge Numeric Code Display */}
              <div className="my-3 py-3 px-4 rounded-xl bg-[#243029] text-white flex items-center justify-between shadow-inner">
                <div>
                  <span className="text-[10px] font-medium text-[#A3BFA8] uppercase tracking-wider block">
                    Seu Código de Segurança:
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-mono font-black tracking-widest text-[#E6EFE9]">
                      {code}
                    </span>
                  </div>
                </div>

                <button
                  id="btn-copy-customer-code"
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-2 rounded-lg bg-[#5A7D6C] hover:bg-[#4d6b5d] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Explanation Note for Customer */}
              <p className="text-[11px] text-[#4F6055] leading-relaxed bg-[#EEF3ED] p-2.5 rounded-xl border border-[#D4E0D1]">
                🔒 <strong>Como funciona:</strong> Apresente este código de 4 dígitos à profissional{' '}
                <strong>{assignedStaff?.name || 'designada'}</strong> assim que ela chegar na sua residência. Ela digitará o código no aplicativo dela para comprovar a autorização e liberar o início do serviço com total segurança.
              </p>
            </div>

            {/* LIVE TIMER (If Running or Completed) */}
            {currentReq.executionTracking && (
              <div className="p-3.5 rounded-xl bg-white border border-[#DFE5DA] shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[#243029]">
                    <Timer className={`w-4 h-4 ${currentReq.executionTracking.isRunning ? 'text-[#C88346] animate-spin' : 'text-[#5A7D6C]'}`} />
                    <span>Acompanhamento em Tempo Real</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-[#243029] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#DFE5DA]">
                    {formatSecondsToTimer(currentReq.executionTracking.elapsedSeconds)}
                  </span>
                </div>

                {/* Progress Checklist Summary */}
                {currentReq.executionTracking.checklist.length > 0 && (
                  <div className="pt-2 border-t border-[#EEF1EB] space-y-1.5">
                    <span className="text-[10px] font-bold text-[#6B7B70] uppercase">Checklist do Serviço:</span>
                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {currentReq.executionTracking.checklist.map(chk => (
                        <div key={chk.id} className="flex items-center gap-2 text-[11px]">
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ${chk.completed ? 'bg-[#5A7D6C] text-white' : 'border border-[#CBD5CB]'}`}>
                            {chk.completed && <Check className="w-2.5 h-2.5" />}
                          </div>
                          <span className={chk.completed ? 'line-through text-[#86958E]' : 'text-[#243029]'}>
                            {chk.task}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ASSIGNED PROFESSIONAL CARD */}
            <div className="p-3.5 rounded-xl bg-white border border-[#DFE5DA] shadow-2xs space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7B70]">Profissional Designada</span>
              
              {assignedStaff ? (
                <div className="flex items-center gap-3">
                  <img
                    src={assignedStaff.photoUrl}
                    alt={assignedStaff.name}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-[#5A7D6C]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h4 className="font-bold text-[#243029] text-xs truncate">{assignedStaff.name}</h4>
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#EBF6EE] text-[#236838]">Verificada</span>
                    </div>
                    <p className="text-[11px] text-[#6B7B70]">{assignedStaff.role}</p>
                    <p className="text-[10px] text-[#D4A373] font-bold">★ {assignedStaff.rating.toFixed(1)} ({assignedStaff.completedServicesCount} atendimentos)</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={`https://wa.me/55${assignedStaff.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-[#EBF6EE] text-[#236838] hover:bg-[#D9EFE0] transition-colors"
                      title="Conversar via WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-[#FAF7F2] text-center text-xs text-[#6B7B70]">
                  Alocação em andamento pela nossa central. Em breve você verá a foto da profissional designada.
                </div>
              )}
            </div>

            {/* SERVICE DETAILS */}
            <div className="p-3.5 rounded-xl bg-white border border-[#DFE5DA] shadow-2xs space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7B70]">Detalhes do Pedido</span>
              <div className="space-y-1.5 text-[#3D5245]">
                <div className="flex justify-between">
                  <span className="text-[#6B7B70]">Tipo de Serviço:</span>
                  <span className="font-bold text-[#243029] capitalize">{currentReq.serviceType} ({currentReq.organizationFormat === 'personalizada' ? 'Personalizada' : 'Padrão 5S'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7B70]">Endereço:</span>
                  <span className="font-medium text-[#243029] text-right truncate max-w-[180px]">{currentReq.address.street}, {currentReq.address.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7B70]">Investimento:</span>
                  <span className="font-bold text-[#5A7D6C]">{formatCurrency(currentReq.price)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Navigation Bar */}
          <div className="p-3 bg-white border-t border-[#DFE5DA] flex items-center justify-between text-xs text-[#6B7B70]">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 bg-[#243029] hover:bg-[#1B241F] text-white font-bold rounded-xl text-center cursor-pointer transition-colors"
            >
              Fechar Visualização do Cliente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
