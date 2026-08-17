import React, { useState } from 'react';
import { CustomerRequest, Collaborator } from '../types';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  Timer, 
  CheckCircle2, 
  Play, 
  Pause, 
  Check, 
  MapPin, 
  Phone, 
  MessageSquare, 
  X, 
  User, 
  Sparkles, 
  AlertTriangle,
  Lock,
  RotateCcw,
  Camera,
  Plus,
  Image as ImageIcon,
  Trash2,
  Send,
  Navigation as NavIcon
} from 'lucide-react';
import { formatDateBR, formatSecondsToTimer } from '../utils/formatters';
import { SecurityCodeValidationModal } from './SecurityCodeValidationModal';

interface StaffAppModalProps {
  initialStaffId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const StaffAppModal: React.FC<StaffAppModalProps> = ({
  initialStaffId,
  isOpen,
  onClose
}) => {
  const { 
    collaborators, 
    requests, 
    validateAndStartExecution, 
    startExecutionTimer,
    pauseExecutionTimer, 
    completeExecution, 
    toggleChecklistItem,
    addChecklistItem,
    updateExecutionNotes,
    addToast
  } = useApp();

  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    initialStaffId || collaborators[0]?.id || ''
  );
  
  const [validatingRequest, setValidatingRequest] = useState<CustomerRequest | null>(null);
  const [newTaskText, setNewTaskText] = useState('');
  const [notesText, setNotesText] = useState('');
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);

  if (!isOpen) return null;

  const currentStaff = collaborators.find(c => c.id === selectedStaffId) || collaborators[0];
  if (!currentStaff) return null;

  // Find requests assigned to this staff member
  const staffRequests = requests.filter(r => r.assignedStaffId === currentStaff.id);
  const activeService = staffRequests.find(r => r.status === 'em_execucao' || r.status === 'pausado');
  const upcomingService = staffRequests.find(r => r.status === 'alocado');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, stage: 'antes' | 'depois') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 4 * 1024 * 1024) {
        addToast({
          type: 'error',
          title: 'Arquivo muito grande',
          message: 'Tamanho máximo permitido: 4MB.'
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          if (stage === 'antes') {
            setBeforePhotos(prev => [...prev, base64]);
          } else {
            setAfterPhotos(prev => [...prev, base64]);
          }
          addToast({
            type: 'success',
            title: `Foto ${stage === 'antes' ? 'do Antes' : 'do Depois'} adicionada`,
            message: 'Registro fotográfico anexado com sucesso.'
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNewTask = (requestId: string) => {
    if (!newTaskText.trim()) return;
    addChecklistItem(requestId, newTaskText.trim(), 'geral');
    setNewTaskText('');
  };

  return (
    <div 
      id="modal-staff-operational-app" 
      className="fixed inset-0 z-50 bg-[#16201A]/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      {/* Device Frame */}
      <div className="bg-[#1C2820] p-2.5 sm:p-3.5 rounded-[2.5rem] shadow-2xl border-4 border-[#2C4035] max-w-sm sm:max-w-md w-full relative overflow-hidden">
        
        {/* Device Top Bar */}
        <div className="flex justify-between items-center px-6 py-2 text-white/80 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>App Operacional da Equipe</span>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Smartphone Screen */}
        <div className="bg-[#FAF7F2] rounded-[2rem] overflow-hidden text-[#243029] flex flex-col max-h-[85vh] border border-[#DFE5DA]">
          
          {/* App Top Bar */}
          <div className="bg-[#243029] text-white p-4 border-b border-[#3D5245]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#5A7D6C] text-white flex items-center justify-center font-bold text-xs border-2 border-[#5A7D6C] overflow-hidden shrink-0">
                  {currentStaff.photoUrl ? (
                    <img 
                      src={currentStaff.photoUrl} 
                      alt={currentStaff.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{currentStaff.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white leading-tight">{currentStaff.name}</h3>
                  <p className="text-[10px] text-[#A3BFA8]">{currentStaff.role}</p>
                </div>
              </div>

              {/* Staff selector */}
              <select
                id="select-staff-app-profile"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="text-[11px] bg-[#16201A] text-[#C8D6CD] rounded-lg px-2.5 py-1 border border-[#3D564A] focus:outline-none cursor-pointer max-w-[130px]"
              >
                {collaborators.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name.split(' ')[0]} ({c.role.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>

            {/* Access Permission Status Banner */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentStaff.allowAppAccess 
                  ? 'bg-[#EBF6EE] text-[#236838]' 
                  : 'bg-rose-900/50 text-rose-200 border border-rose-700'
              }`}>
                {currentStaff.allowAppAccess ? '✓ Acesso Autorizado' : '✕ Acesso Bloqueado pelo Painel'}
              </span>
              <span className="text-[10px] text-[#C8D6CD]">
                {staffRequests.length} atendimentos no seu histórico
              </span>
            </div>
          </div>

          {/* Screen Content */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
            
            {/* If Access Blocked */}
            {!currentStaff.allowAppAccess && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <ShieldAlert className="w-5 h-5" />
                  <span>Acesso Bloqueado pela Administração</span>
                </div>
                <p className="text-xs">
                  O administrador do sistema desativou temporariamente o acesso deste colaborador ao aplicativo.
                </p>
              </div>
            )}

            {/* UPCOMING / ALLOCATED SERVICE (Awaiting Identity Confirmation Code) */}
            {upcomingService && (
              <div className="p-4 rounded-2xl bg-white border-2 border-[#5A7D6C]/50 shadow-md space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#A85820] bg-[#FAF0E6] px-2 py-0.5 rounded-full border border-[#F2D7C2]">
                      Próximo Atendimento • No Local
                    </span>
                    <h4 className="font-bold text-[#243029] text-sm mt-1">{upcomingService.clientName}</h4>
                    <p className="text-[11px] text-[#6B7B70]">{upcomingService.code} • {upcomingService.serviceType.toUpperCase()}</p>
                  </div>
                </div>

                {/* Address Box */}
                <div className="p-2.5 rounded-xl bg-[#F7F8F4] border border-[#DFE5DA] text-[11px] space-y-1">
                  <div className="flex items-start gap-1.5 text-[#3D5245]">
                    <MapPin className="w-3.5 h-3.5 text-[#5A7D6C] shrink-0 mt-0.5" />
                    <span>{upcomingService.address.street}, {upcomingService.address.number} - {upcomingService.address.neighborhood}</span>
                  </div>
                  {upcomingService.address.referencePoint && (
                    <p className="text-[10px] text-[#6B7B70] pl-5 italic">Ref: {upcomingService.address.referencePoint}</p>
                  )}
                </div>

                {/* SECURITY VALIDATION ACTION BUTTON */}
                <div className="pt-1 space-y-2">
                  <div className="p-2.5 rounded-xl bg-[#EEF3ED] border border-[#C8D6CD] text-[11px] text-[#2C473A] flex items-start gap-2">
                    <KeyRound className="w-4 h-4 text-[#5A7D6C] shrink-0 mt-0.5" />
                    <p>
                      <strong>Regra de Segurança:</strong> Solicite o código de 4 dígitos ao cliente no local para iniciar o atendimento e o cronômetro.
                    </p>
                  </div>

                  <button
                    id={`btn-staff-start-service-${upcomingService.id}`}
                    type="button"
                    onClick={() => setValidatingRequest(upcomingService)}
                    className="w-full py-3 bg-[#5A7D6C] hover:bg-[#4a695b] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Digitar Código & Iniciar Serviço</span>
                  </button>
                </div>
              </div>
            )}

            {/* ACTIVE RUNNING SERVICE */}
            {activeService && (
              <div className="p-4 rounded-2xl bg-white border-2 border-[#C88346] shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                    activeService.status === 'em_execucao'
                      ? 'bg-[#FAF0E6] text-[#A85820] border border-[#F2D7C2]'
                      : 'bg-[#FEF6E9] text-[#925C18] border border-[#FCE2B6]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${activeService.status === 'em_execucao' ? 'bg-[#C88346] animate-ping' : 'bg-[#925C18]'}`} />
                    {activeService.status === 'em_execucao' ? 'Em Execução • Cronômetro Ativo' : 'Atendimento Pausado'}
                  </span>
                  <span className="text-[10px] text-[#236838] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Código Validado
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-[#243029] text-sm">{activeService.clientName}</h4>
                  <p className="text-[11px] text-[#6B7B70]">{activeService.address.neighborhood} • {activeService.code}</p>
                </div>

                {/* Live Timer Clock & Pause/Resume Controls */}
                {activeService.executionTracking && (
                  <div className="p-3 bg-[#243029] text-white rounded-xl text-center shadow-inner space-y-2">
                    <span className="text-[10px] uppercase tracking-wider text-[#A3BFA8]">Tempo em Execução</span>
                    <div className="text-2xl font-mono font-black text-[#FAF7F2] tracking-wider my-0.5">
                      {formatSecondsToTimer(activeService.executionTracking.elapsedSeconds)}
                    </div>
                    
                    <div className="flex justify-center gap-2 pt-1">
                      {activeService.executionTracking.isRunning ? (
                        <button
                          type="button"
                          onClick={() => pauseExecutionTimer(activeService.id)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Pause className="w-3 h-3" />
                          Pausar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startExecutionTimer(activeService.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          Retomar
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Real-time Checklist */}
                {activeService.executionTracking && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold uppercase text-[#6B7B70]">Marcar Tarefas Realizadas:</span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {activeService.executionTracking.checklist.map(chk => (
                        <label 
                          key={chk.id}
                          className="flex items-start gap-2.5 p-2 rounded-lg bg-[#F7F8F4] border border-[#DFE5DA] hover:bg-[#EEF3ED] transition-colors cursor-pointer text-[11px]"
                        >
                          <input
                            type="checkbox"
                            checked={chk.completed}
                            onChange={() => toggleChecklistItem(activeService.id, chk.id)}
                            className="mt-0.5 rounded text-[#5A7D6C] focus:ring-[#5A7D6C] cursor-pointer"
                          />
                          <span className={chk.completed ? 'line-through text-[#86958E]' : 'text-[#243029] font-medium'}>
                            {chk.task}
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Add Custom Task in the Field */}
                    <div className="flex gap-1.5 pt-1">
                      <input
                        type="text"
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNewTask(activeService.id)}
                        placeholder="Adicionar tarefa avulsa..."
                        className="flex-1 px-2.5 py-1 text-xs border border-[#DFE5DA] rounded-lg bg-[#FAF7F2]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddNewTask(activeService.id)}
                        className="px-2.5 py-1 bg-[#5A7D6C] text-white rounded-lg font-bold text-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Before & After Photo Attachments */}
                <div className="space-y-2 pt-2 border-t border-[#EEF1EB]">
                  <span className="text-[10px] font-bold uppercase text-[#6B7B70] block">Registros Fotográficos no Local:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Before upload button */}
                    <label className="p-2 border border-dashed border-[#DFE5DA] rounded-xl text-center bg-[#FAF7F2] hover:bg-[#EEF3ED] transition-colors cursor-pointer block">
                      <Camera className="w-4 h-4 text-[#5A7D6C] mx-auto mb-1" />
                      <span className="text-[10px] font-bold text-[#243029] block">+ Foto ANTES</span>
                      <span className="text-[9px] text-[#86958E]">({beforePhotos.length} fotos)</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handlePhotoUpload(e, 'antes')}
                        className="hidden"
                      />
                    </label>

                    {/* After upload button */}
                    <label className="p-2 border border-dashed border-[#DFE5DA] rounded-xl text-center bg-[#FAF7F2] hover:bg-[#EEF3ED] transition-colors cursor-pointer block">
                      <Camera className="w-4 h-4 text-[#C88346] mx-auto mb-1" />
                      <span className="text-[10px] font-bold text-[#243029] block">+ Foto DEPOIS</span>
                      <span className="text-[9px] text-[#86958E]">({afterPhotos.length} fotos)</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handlePhotoUpload(e, 'depois')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Complete Service Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => completeExecution(activeService.id, 'Finalizado com sucesso no local pela equipe operacional.')}
                    className="w-full py-2.5 bg-[#236838] hover:bg-[#1b522c] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Concluir Atendimento com Sucesso</span>
                  </button>
                </div>
              </div>
            )}

            {/* List of all assigned orders */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7B70]">
                Todos os Seus Atendimentos ({staffRequests.length})
              </span>

              {staffRequests.length === 0 ? (
                <div className="p-4 rounded-xl bg-white border border-[#DFE5DA] text-center text-xs text-[#6B7B70]">
                  Nenhum serviço alocado para este profissional no momento.
                </div>
              ) : (
                <div className="space-y-2">
                  {staffRequests.map(r => (
                    <div 
                      key={r.id} 
                      className="p-3 rounded-xl bg-white border border-[#DFE5DA] shadow-2xs text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#243029]">{r.code} • {r.clientName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          r.status === 'concluido' ? 'bg-[#EBF6EE] text-[#236838]' :
                          r.status === 'em_execucao' ? 'bg-[#FAF0E6] text-[#A85820]' :
                          'bg-[#F2EFE9] text-[#7A6B56]'
                        }`}>
                          {r.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7B70]">{formatDateBR(r.scheduleDate)} às {r.scheduleTime} • {r.address.neighborhood}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="p-3 bg-white border-t border-[#DFE5DA]">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 bg-[#243029] hover:bg-[#1B241F] text-white font-bold rounded-xl text-center cursor-pointer transition-colors text-xs"
            >
              Fechar Visualização da Equipe
            </button>
          </div>
        </div>
      </div>

      {/* Validation Modal popup if triggered */}
      {validatingRequest && (
        <SecurityCodeValidationModal
          request={validatingRequest}
          staffName={currentStaff.name}
          staffId={currentStaff.id}
          isOpen={!!validatingRequest}
          onClose={() => setValidatingRequest(null)}
          onSuccess={() => setValidatingRequest(null)}
        />
      )}
    </div>
  );
};
