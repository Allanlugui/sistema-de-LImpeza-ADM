import React, { useState } from 'react';
import { CustomerRequest, Collaborator, ServiceType, OrgFormat, DocumentType, FeedbackType } from '../types';
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
  Lock,
  Plus,
  Star,
  Send,
  MessageCircle,
  FileText,
  Building,
  CheckSquare
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
  const { 
    requests, 
    collaborators, 
    clients, 
    addRequest, 
    submitFeedback, 
    feedbacks,
    addToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'acompanhar' | 'novo_pedido' | 'avaliacoes'>('acompanhar');
  const [selectedReqId, setSelectedReqId] = useState<string>(
    initialRequestId || requests[0]?.id || ''
  );
  const [copiedCode, setCopiedCode] = useState(false);

  // Form state for new request
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [clientName, setClientName] = useState(clients[0]?.name || '');
  const [clientEmail, setClientEmail] = useState(clients[0]?.email || '');
  const [clientPhone, setClientPhone] = useState(clients[0]?.phone || '');
  const [serviceType, setServiceType] = useState<ServiceType>('ambos');
  const [orgFormat, setOrgFormat] = useState<OrgFormat>('personalizada');
  const [street, setStreet] = useState(clients[0]?.address.street || '');
  const [number, setNumber] = useState(clients[0]?.address.number || '');
  const [complement, setComplement] = useState(clients[0]?.address.complement || '');
  const [neighborhood, setNeighborhood] = useState(clients[0]?.address.neighborhood || '');
  const [city, setCity] = useState(clients[0]?.address.city || 'São Paulo');
  const [state, setState] = useState(clients[0]?.address.state || 'SP');
  const [zipCode, setZipCode] = useState(clients[0]?.address.zipCode || '');
  const [referencePoint, setReferencePoint] = useState(clients[0]?.address.referencePoint || '');
  const [rooms, setRooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [approxAreaM2, setApproxAreaM2] = useState(120);
  const [hasPets, setHasPets] = useState(false);
  const [petDetails, setPetDetails] = useState('');
  const [allergyAlerts, setAllergyAlerts] = useState('');
  const [scheduleDate, setScheduleDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [scheduleTime, setScheduleTime] = useState('08:30');
  const [clientNotes, setClientNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feedback form state
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('elogio');
  const [feedbackTitle, setFeedbackTitle] = useState('Excelente atendimento!');
  const [feedbackComment, setFeedbackComment] = useState('Profissional pontual, atenciosa e deixou os ambientes impecáveis.');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  if (!isOpen) return null;

  const currentReq = requests.find(r => r.id === selectedReqId) || requests[0];
  const assignedStaff = currentReq ? collaborators.find(c => c.id === currentReq.assignedStaffId) : null;
  const code = currentReq?.confirmationCode || '4829';
  const isValidated = currentReq ? (!!currentReq.codeValidatedAt || currentReq.status === 'em_execucao' || currentReq.status === 'concluido') : false;

  // Sync client profile fields when selecting a registered client
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setClientName(client.name);
      setClientEmail(client.email);
      setClientPhone(client.phone || client.whatsapp);
      setStreet(client.address.street);
      setNumber(client.address.number);
      setComplement(client.address.complement || '');
      setNeighborhood(client.address.neighborhood);
      setCity(client.address.city);
      setState(client.address.state);
      setZipCode(client.address.zipCode);
      setReferencePoint(client.address.referencePoint || '');
      if (client.preferredServiceType) setServiceType(client.preferredServiceType);
      if (client.preferredOrgFormat) setOrgFormat(client.preferredOrgFormat);
    }
  };

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

  const calculateEstimatedPrice = () => {
    let base = 250;
    if (serviceType === 'limpeza') base = 260 + (rooms * 25) + (bathrooms * 30);
    else if (serviceType === 'organizacao') base = 340 + (rooms * 45) + (orgFormat === 'personalizada' ? 80 : 40);
    else base = 480 + (rooms * 50) + (bathrooms * 40) + (orgFormat === 'personalizada' ? 100 : 50);
    return Math.max(180, Math.round(base));
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !street.trim() || !number.trim() || !neighborhood.trim()) {
      addToast({
        type: 'error',
        title: 'Dados Incompletos',
        message: 'Por favor, preencha os dados de identificação e endereço para solicitar o atendimento.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const price = calculateEstimatedPrice();
      const estimatedDurationHours = serviceType === 'ambos' ? 7 : 5;

      const newId = await addRequest({
        clientId: selectedClientId || undefined,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || 'cliente@contato.com.br',
        clientPhone: clientPhone.trim(),
        clientWhatsapp: clientPhone.trim(),
        address: {
          street: street.trim(),
          number: number.trim(),
          complement: complement.trim() || undefined,
          neighborhood: neighborhood.trim(),
          city: city.trim() || 'São Paulo',
          state: state.trim() || 'SP',
          zipCode: zipCode.trim() || '01000-000',
          referencePoint: referencePoint.trim() || undefined,
        },
        serviceType,
        organizationFormat: orgFormat,
        propertyDetails: {
          rooms: Number(rooms),
          bathrooms: Number(bathrooms),
          approxAreaM2: Number(approxAreaM2),
          hasPets: Boolean(hasPets),
          petDetails: hasPets ? petDetails.trim() : undefined,
          allergyAlerts: allergyAlerts.trim() || undefined,
        },
        scheduleDate,
        scheduleTime,
        estimatedDurationHours,
        price,
        status: 'pendente',
        priority: 'alta',
        clientNotes: clientNotes.trim() || undefined,
      });

      setSelectedReqId(newId);
      setActiveTab('acompanhar');
      addToast({
        type: 'success',
        title: 'Solicitação Criada com Sucesso!',
        message: 'Seu pedido foi registrado no Supabase e já está visível para a central de gestão.'
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao Criar Solicitação',
        message: err.message || 'Falha ao sincronizar com o banco de dados.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentReq) return;

    setIsSubmittingFeedback(true);
    try {
      await submitFeedback({
        requestId: currentReq.id,
        clientId: currentReq.clientId || 'client-anon',
        clientName: currentReq.clientName,
        staffId: currentReq.assignedStaffId || 'staff-unassigned',
        staffName: currentReq.assignedStaffName || 'Equipe Geral',
        serviceType: currentReq.serviceType,
        rating: feedbackRating,
        type: feedbackType,
        title: feedbackTitle.trim(),
        comment: feedbackComment.trim(),
      });

      addToast({
        type: 'success',
        title: 'Avaliação Registrada',
        message: 'Obrigado pelo seu feedback! Ele foi salvo no Supabase com sucesso.'
      });
      setFeedbackComment('');
      setActiveTab('acompanhar');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao Enviar Avaliação',
        message: err.message || 'Falha ao gravar avaliação no banco.'
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const getStatusBadge = (req: CustomerRequest) => {
    switch (req.status) {
      case 'pendente':
        return { label: 'Solicitação em Análise', bg: 'bg-[#F2EFE9] text-[#7A6B56] border-[#DFD9CD]' };
      case 'alocado':
        return { label: 'Equipe Confirmada • A Caminho', bg: 'bg-[#EEF3ED] text-[#2C473A] border-[#C3D5C9]' };
      case 'em_execucao':
        return { label: 'Em Execução • Cronômetro Ativo', bg: 'bg-[#FAF0E6] text-[#A85820] border-[#F2D7C2]' };
      case 'concluido':
        return { label: 'Serviço Finalizado com Sucesso', bg: 'bg-[#EBF6EE] text-[#236838] border-[#C3E6CC]' };
      default:
        return { label: req.status, bg: 'bg-stone-100 text-stone-700 border-stone-200' };
    }
  };

  return (
    <div 
      id="modal-customer-pwa" 
      className="fixed inset-0 z-50 bg-[#16201A]/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      {/* Device Frame */}
      <div className="bg-[#243029] p-2.5 sm:p-3.5 rounded-[2.5rem] shadow-2xl border-4 border-[#3D5245] max-w-sm sm:max-w-md w-full relative overflow-hidden">
        
        {/* Device Top Bar */}
        <div className="flex justify-between items-center px-6 py-2 text-white/80 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>PWA do Cliente • Autoatendimento</span>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Smartphone Screen Inner Container */}
        <div className="bg-[#FAF7F2] rounded-[2rem] overflow-hidden text-[#243029] flex flex-col max-h-[85vh] border border-[#DFE5DA]">
          
          {/* App Top Bar */}
          <div className="bg-[#2C4035] text-white p-4 border-b border-[#3D564A]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#5A7D6C] text-white flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#A3BFA8]">Portal do Cliente</span>
                  <h2 className="text-xs sm:text-sm font-bold text-white leading-tight truncate max-w-[150px]">
                    {currentReq?.clientName || clientName || 'Área do Cliente'}
                  </h2>
                </div>
              </div>
              
              {/* Order selector dropdown */}
              {requests.length > 0 && (
                <select
                  id="select-customer-pwa-order"
                  value={selectedReqId}
                  onChange={(e) => setSelectedReqId(e.target.value)}
                  className="text-[11px] bg-[#1F2D25] text-[#C8D6CD] rounded-lg px-2 py-1 border border-[#3D564A] focus:outline-none cursor-pointer max-w-[130px]"
                >
                  {requests.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.code} - {r.serviceType.toUpperCase()}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* PWA Tabs */}
            <div className="flex items-center gap-1 bg-[#1F2D25] p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('acompanhar')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  activeTab === 'acompanhar' 
                    ? 'bg-[#5A7D6C] text-white shadow-xs' 
                    : 'text-[#A3BFA8] hover:text-white'
                }`}
              >
                Acompanhar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('novo_pedido')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  activeTab === 'novo_pedido' 
                    ? 'bg-[#5A7D6C] text-white shadow-xs' 
                    : 'text-[#A3BFA8] hover:text-white'
                }`}
              >
                + Novo Pedido
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('avaliacoes')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  activeTab === 'avaliacoes' 
                    ? 'bg-[#5A7D6C] text-white shadow-xs' 
                    : 'text-[#A3BFA8] hover:text-white'
                }`}
              >
                Avaliações
              </button>
            </div>
          </div>

          {/* Scrollable Screen Body */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">

            {/* TAB 1: ACOMPANHAR ATENDIMENTO */}
            {activeTab === 'acompanhar' && (
              <>
                {!currentReq ? (
                  <div className="p-6 text-center space-y-3 bg-white rounded-2xl border border-[#DFE5DA]">
                    <Sparkles className="w-8 h-8 text-[#5A7D6C] mx-auto" />
                    <h3 className="font-bold text-sm text-[#243029]">Nenhum pedido ativo no momento</h3>
                    <p className="text-xs text-[#6B7B70]">Você pode solicitar um atendimento de limpeza ou organização agora mesmo.</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('novo_pedido')}
                      className="px-4 py-2 bg-[#5A7D6C] text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                    >
                      Solicitar Novo Atendimento
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Status Pill */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(currentReq).bg}`}>
                        {currentReq.status === 'em_execucao' && <span className="w-2 h-2 rounded-full bg-[#C88346] animate-ping" />}
                        {getStatusBadge(currentReq).label}
                      </span>
                      <span className="text-[11px] font-semibold text-[#6B7B70]">
                        {formatDateBR(currentReq.scheduleDate)} às {currentReq.scheduleTime}
                      </span>
                    </div>

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
                        <strong>{assignedStaff?.name || 'designada'}</strong> assim que ela chegar na sua residência. Ela digitará o código no aplicativo operacional dela para validar o início com total segurança.
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
                            <span className="text-[10px] font-bold text-[#6B7B70] uppercase">Tarefas Executadas no Local:</span>
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
                          <div className="w-12 h-12 rounded-xl bg-[#5A7D6C] text-white flex items-center justify-center font-bold text-sm border-2 border-[#5A7D6C] overflow-hidden shrink-0">
                            {assignedStaff.photoUrl ? (
                              <img
                                src={assignedStaff.photoUrl}
                                alt={assignedStaff.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{assignedStaff.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
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

                    {/* Evaluate CTA if service finished */}
                    {currentReq.status === 'concluido' && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('avaliacoes')}
                        className="w-full py-2.5 bg-[#5A7D6C] hover:bg-[#4d6b5d] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                        <span>Avaliar Atendimento Realizado</span>
                      </button>
                    )}
                  </>
                )}
              </>
            )}

            {/* TAB 2: NOVO PEDIDO (CRIAR SOLICITAÇÃO REAL) */}
            {activeTab === 'novo_pedido' && (
              <form onSubmit={handleCreateRequest} className="space-y-3.5 bg-white p-4 rounded-2xl border border-[#DFE5DA] shadow-2xs text-xs">
                <div>
                  <h3 className="font-bold text-sm text-[#243029]">Solicitar Novo Atendimento</h3>
                  <p className="text-[11px] text-[#6B7B70]">Seu pedido será registrado diretamente no banco de dados operacional.</p>
                </div>

                {/* Registered Client Selector */}
                {clients.length > 0 && (
                  <div>
                    <label className="block font-semibold text-[#243029] mb-1 text-[11px]">
                      Identificação do Cliente Cadastrado:
                    </label>
                    <select
                      value={selectedClientId}
                      onChange={(e) => handleClientSelect(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#DFE5DA] rounded-lg text-xs font-medium"
                    >
                      <option value="">-- Novo / Não Listado --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.address.neighborhood})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-[#243029] mb-1 text-[11px]">Seu Nome *</label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#DFE5DA] rounded-lg text-xs"
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#243029] mb-1 text-[11px]">WhatsApp / Tel *</label>
                    <input
                      type="text"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#DFE5DA] rounded-lg text-xs"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                {/* Service Type Selection */}
                <div>
                  <label className="block font-semibold text-[#243029] mb-1 text-[11px]">Tipo de Serviço *</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'limpeza', label: 'Limpeza' },
                      { id: 'organizacao', label: 'Organização' },
                      { id: 'ambos', label: 'Limpeza + Org.' },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setServiceType(t.id as ServiceType)}
                        className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition-all cursor-pointer ${
                          serviceType === t.id 
                            ? 'bg-[#5A7D6C] text-white border-[#5A7D6C]' 
                            : 'bg-[#FAF7F2] text-[#243029] border-[#DFE5DA]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Organization format */}
                {(serviceType === 'organizacao' || serviceType === 'ambos') && (
                  <div>
                    <label className="block font-semibold text-[#243029] mb-1 text-[11px]">Padrão de Organização:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setOrgFormat('personalizada')}
                        className={`py-1.5 px-2 rounded-lg font-bold text-[10px] border transition-all cursor-pointer ${
                          orgFormat === 'personalizada'
                            ? 'bg-[#243029] text-white border-[#243029]'
                            : 'bg-[#FAF7F2] text-[#243029] border-[#DFE5DA]'
                        }`}
                      >
                        Personalizada (Hábitos)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrgFormat('padrao_empresa')}
                        className={`py-1.5 px-2 rounded-lg font-bold text-[10px] border transition-all cursor-pointer ${
                          orgFormat === 'padrao_empresa'
                            ? 'bg-[#243029] text-white border-[#243029]'
                            : 'bg-[#FAF7F2] text-[#243029] border-[#DFE5DA]'
                        }`}
                      >
                        Padrão 5S da Empresa
                      </button>
                    </div>
                  </div>
                )}

                {/* Address Fields */}
                <div className="space-y-2 pt-1 border-t border-[#EEF1EB]">
                  <span className="font-bold text-[11px] text-[#5A7D6C] block">Endereço do Local:</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <input
                        type="text"
                        required
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Rua / Avenida *"
                        className="w-full px-2.5 py-1.5 border border-[#DFE5DA] rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder="Nº *"
                        className="w-full px-2.5 py-1.5 border border-[#DFE5DA] rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Bairro *"
                      className="w-full px-2.5 py-1.5 border border-[#DFE5DA] rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      placeholder="Complemento (Apto, Bloco)"
                      className="w-full px-2.5 py-1.5 border border-[#DFE5DA] rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#EEF1EB]">
                  <div>
                    <label className="block font-semibold text-[#243029] mb-1 text-[11px]">Data Desejada *</label>
                    <input
                      type="date"
                      required
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#DFE5DA] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#243029] mb-1 text-[11px]">Horário *</label>
                    <input
                      type="time"
                      required
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#DFE5DA] rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Estimated Investment Summary */}
                <div className="p-3 rounded-xl bg-[#F4F6F1] border border-[#DFE5DA] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#6B7B70] uppercase font-bold block">Investimento Estimado:</span>
                    <span className="text-base font-bold text-[#236838]">{formatCurrency(calculateEstimatedPrice())}</span>
                  </div>
                  <span className="text-[10px] text-[#6B7B70]">Cálculo em tempo real</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#5A7D6C] hover:bg-[#4d6b5d] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Registrando no Supabase...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Confirmar Solicitação de Atendimento</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 3: AVALIAÇÕES & FEEDBACKS */}
            {activeTab === 'avaliacoes' && (
              <div className="space-y-4">
                {/* Submit Feedback Form */}
                <form onSubmit={handleSubmitFeedback} className="p-4 rounded-2xl bg-white border border-[#DFE5DA] shadow-2xs space-y-3 text-xs">
                  <h3 className="font-bold text-sm text-[#243029] flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Enviar Avaliação do Serviço</span>
                  </h3>
                  <p className="text-[11px] text-[#6B7B70]">Sua avaliação é salva diretamente na base do Supabase e vinculada à profissional.</p>

                  {/* Rating Stars */}
                  <div>
                    <label className="block font-semibold text-[#243029] mb-1 text-[11px]">Sua Nota de Satisfação:</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className="p-1 cursor-pointer transition-transform hover:scale-110"
                        >
                          <Star className={`w-6 h-6 ${star <= feedbackRating ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}`} />
                        </button>
                      ))}
                      <span className="font-bold text-xs text-[#243029] ml-2">{feedbackRating} de 5 estrelas</span>
                    </div>
                  </div>

                  {/* Feedback Type */}
                  <div>
                    <label className="block font-semibold text-[#243029] mb-1 text-[11px]">Tipo de Feedback:</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'elogio', label: 'Elogio' },
                        { id: 'sugestao', label: 'Sugestão' },
                        { id: 'reclamacao', label: 'Reclamação' },
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFeedbackType(f.id as FeedbackType)}
                          className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition-all cursor-pointer ${
                            feedbackType === f.id
                              ? 'bg-[#243029] text-white border-[#243029]'
                              : 'bg-[#FAF7F2] text-[#243029] border-[#DFE5DA]'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#243029] mb-1 text-[11px]">Título do Feedback:</label>
                    <input
                      type="text"
                      required
                      value={feedbackTitle}
                      onChange={(e) => setFeedbackTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#DFE5DA] rounded-lg text-xs"
                      placeholder="Ex: Trabalho maravilhoso"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#243029] mb-1 text-[11px]">Comentário Detalhado:</label>
                    <textarea
                      rows={3}
                      required
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#DFE5DA] rounded-lg text-xs"
                      placeholder="Descreva sua experiência..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingFeedback}
                    className="w-full py-2.5 bg-[#5A7D6C] hover:bg-[#4d6b5d] text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingFeedback ? (
                      <span>Enviando para o Supabase...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Publicar Avaliação</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Feedbacks list */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7B70] block">
                    Histórico de Avaliações ({feedbacks.length})
                  </span>
                  {feedbacks.map(f => (
                    <div key={f.id} className="p-3 rounded-xl bg-white border border-[#DFE5DA] shadow-2xs space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#243029]">{f.clientName}</span>
                        <div className="flex text-amber-400">
                          {Array.from({ length: f.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <h5 className="font-semibold text-[#5A7D6C] text-[11px]">{f.title}</h5>
                      <p className="text-[11px] text-[#4F6055]">{f.comment}</p>
                      <div className="flex justify-between items-center text-[10px] text-[#86958E] pt-1">
                        <span>Profissional: {f.staffName}</span>
                        <span>{formatDateBR(f.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
