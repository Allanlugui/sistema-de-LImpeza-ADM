import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CustomerRequest, 
  ServiceType, 
  OrgFormat, 
  RequestStatus, 
  Collaborator 
} from '../types';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Calendar, 
  Clock, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  MessageCircle, 
  ArrowRight, 
  Home, 
  PawPrint, 
  ShieldAlert, 
  Trash2, 
  X, 
  UserPlus, 
  Eye, 
  Check, 
  ShieldCheck, 
  Smartphone, 
  Lock, 
  RotateCcw, 
  Copy,
  Printer,
  Navigation,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Zap,
  DollarSign,
  AlertTriangle,
  ArrowUpDown,
  CheckSquare,
  Building2,
  Share2
} from 'lucide-react';
import { SecurityCodeValidationModal } from './SecurityCodeValidationModal';
import { CustomerAppModal } from './CustomerAppModal';
import { 
  formatCurrency, 
  formatPhone, 
  formatCEP, 
  getWhatsAppLink, 
  formatDateBR 
} from '../utils/formatters';

interface RequestsViewProps {
  isNewModalOpen: boolean;
  setIsNewModalOpen: (open: boolean) => void;
}

type DateFilterType = 'todas' | 'hoje' | 'amanha' | 'semana' | 'mes' | 'especifica' | 'intervalo';
type SortOption = 'data_asc' | 'data_desc' | 'criacao_desc' | 'valor_desc' | 'valor_asc' | 'cliente_asc';
type ViewMode = 'cards' | 'tabela';

export const RequestsView: React.FC<RequestsViewProps> = ({
  isNewModalOpen,
  setIsNewModalOpen
}) => {
  const { 
    requests, 
    clients,
    collaborators, 
    addRequest, 
    updateRequest, 
    deleteRequest, 
    allocateStaff, 
    startExecutionTimer,
    regenerateSecurityCode,
    setActiveTab,
    addToast 
  } = useApp();

  // Search, Filters & View Mode
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('todos');
  const [orgFormatFilter, setOrgFormatFilter] = useState<string>('todos');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>('todos');
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>('todas');
  const [specificDate, setSpecificDate] = useState<string>('');
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('data_asc');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Security Validation & Customer App Modals
  const [validatingReq, setValidatingReq] = useState<CustomerRequest | null>(null);
  const [customerAppReqId, setCustomerAppReqId] = useState<string | null>(null);

  // Allocation Modal State
  const [allocatingRequest, setAllocatingRequest] = useState<CustomerRequest | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  // Request Details & Print Modal
  const [viewingRequest, setViewingRequest] = useState<CustomerRequest | null>(null);
  const [showPrintView, setShowPrintView] = useState(false);

  // New Request Form State
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientDocument, setClientDocument] = useState('');
  const [clientDocumentType, setClientDocumentType] = useState<'CPF' | 'RG'>('CPF');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('São Paulo');
  const [state, setState] = useState('SP');
  const [zipCode, setZipCode] = useState('');
  const [referencePoint, setReferencePoint] = useState('');


  const [serviceType, setServiceType] = useState<ServiceType>('ambos');
  const [organizationFormat, setOrganizationFormat] = useState<OrgFormat>('personalizada');
  const [customOrgNotes, setCustomOrgNotes] = useState('');
  const [selectedZones, setSelectedZones] = useState<string[]>(['Closet Master', 'Cozinha & Despensa']);
  
  const [rooms, setRooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [approxAreaM2, setApproxAreaM2] = useState(110);
  const [hasPets, setHasPets] = useState(false);
  const [petDetails, setPetDetails] = useState('');
  const [allergyAlerts, setAllergyAlerts] = useState('');
  
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [scheduleTime, setScheduleTime] = useState('08:30');
  const [estimatedDurationHours, setEstimatedDurationHours] = useState(6);
  const [price, setPrice] = useState(480.00);
  const [clientNotes, setClientNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Auto calculate suggested price based on rooms/service
  const handleRecalculateSuggestedPrice = (svc: ServiceType, r: number, b: number, format: OrgFormat) => {
    let baseRate = 220;
    if (svc === 'organizacao') baseRate = 260;
    if (svc === 'ambos') baseRate = 420;
    
    const extraRoomRate = (r - 2) > 0 ? (r - 2) * 45 : 0;
    const extraBathRate = (b - 1) > 0 ? (b - 1) * 35 : 0;
    const formatSurcharge = format === 'personalizada' ? 50 : 0;
    
    const calculated = baseRate + extraRoomRate + extraBathRate + formatSurcharge;
    setPrice(calculated);
    
    let hours = 4;
    if (svc === 'ambos') hours = 6 + Math.max(0, r - 2);
    else if (svc === 'organizacao') hours = 5 + Math.max(0, r - 2);
    else hours = 4 + Math.max(0, r - 2);
    setEstimatedDurationHours(hours);
  };

  const resetForm = () => {
    setSelectedClientId('');
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setClientDocument('');
    setClientDocumentType('CPF');
    setStreet('');
    setNumber('');
    setComplement('');
    setNeighborhood('');
    setCity('São Paulo');
    setState('SP');
    setZipCode('');
    setReferencePoint('');
    setServiceType('ambos');
    setOrganizationFormat('personalizada');
    setCustomOrgNotes('');
    setSelectedZones(['Closet Master', 'Cozinha & Despensa']);
    setRooms(3);
    setBathrooms(2);
    setApproxAreaM2(110);
    setHasPets(false);
    setPetDetails('');
    setAllergyAlerts('');
    setEstimatedDurationHours(6);
    setPrice(480.00);
    setClientNotes('');
    setFormError('');
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) return;
    const found = clients.find(c => c.id === clientId);
    if (found) {
      setClientName(found.name);
      setClientEmail(found.email);
      setClientPhone(found.phone);
      setClientDocument(found.documentNumber || '');
      setClientDocumentType(found.documentType || 'CPF');
      setStreet(found.address.street || '');
      setNumber(found.address.number || '');
      setComplement(found.address.complement || '');
      setNeighborhood(found.address.neighborhood || '');
      setCity(found.address.city || 'São Paulo');
      setState(found.address.state || 'SP');
      setZipCode(found.address.zipCode || '');
      setReferencePoint(found.address.referencePoint || '');
    }
  };

  const handleOpenNew = () => {
    resetForm();
    setIsNewModalOpen(true);
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!clientName.trim() || !clientPhone.trim() || !street.trim() || !neighborhood.trim()) {
      setFormError('Por favor, preencha os dados obrigatórios do cliente e endereço.');
      return;
    }

    addRequest({
      clientId: selectedClientId || undefined,
      clientName: clientName.trim(),
      clientDocument: clientDocument.trim() || undefined,
      clientDocumentType: clientDocumentType,
      clientEmail: clientEmail.trim() || `${clientName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      clientPhone: formatPhone(clientPhone),
      clientWhatsapp: formatPhone(clientPhone),
      address: {
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim(),
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: formatCEP(zipCode),
        referencePoint: referencePoint.trim(),
      },
      serviceType,
      organizationFormat,
      orgDetails: {
        methodology: organizationFormat === 'personalizada'
          ? 'Personalização Baseada nos Hábitos e Rotinas do Cliente'
          : 'Metodologia Padrão Ouro 5S da Empresa',
        selectedZones: selectedZones,
        customNotes: customOrgNotes.trim() || 'Organização com atenção prioritária aos cômodos assinalados.',
        organizerProductsNeeded: organizationFormat === 'personalizada' ? ['Colmeias organizadoras', 'Cestos acrílicos', 'Etiquetas'] : []
      },
      propertyDetails: {
        rooms: Number(rooms),
        bathrooms: Number(bathrooms),
        approxAreaM2: Number(approxAreaM2),
        hasPets,
        petDetails: hasPets ? petDetails : undefined,
        allergyAlerts: allergyAlerts.trim() || undefined,
      },
      scheduleDate,
      scheduleTime,
      estimatedDurationHours: Number(estimatedDurationHours),
      price: Number(price),
      status: 'pendente',
      priority: 'media',
      clientNotes: clientNotes.trim(),
    });

    setIsNewModalOpen(false);
  };

  const handleConfirmAllocation = () => {
    if (!allocatingRequest || !selectedStaffId) return;
    allocateStaff(allocatingRequest.id, selectedStaffId);
    setAllocatingRequest(null);
    setSelectedStaffId('');
  };

  // Get unique neighborhoods for filtering
  const uniqueNeighborhoods = useMemo(() => {
    const set = new Set<string>();
    requests.forEach(r => {
      if (r.address.neighborhood) set.add(r.address.neighborhood);
    });
    return Array.from(set).sort();
  }, [requests]);

  // Compute live KPIs
  const kpis = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pendente').length;
    const allocated = requests.filter(r => r.status === 'alocado' || r.status === 'a_caminho').length;
    const inProgress = requests.filter(r => r.status === 'em_execucao' || r.status === 'pausado').length;
    const completed = requests.filter(r => r.status === 'concluido').length;
    const totalRevenue = requests.reduce((acc, r) => acc + (r.status !== 'cancelado' ? r.price : 0), 0);
    return { total, pending, allocated, inProgress, completed, totalRevenue };
  }, [requests]);

  // Date filtering helper
  const isDateMatching = (reqDateStr: string): boolean => {
    if (dateFilterType === 'todas') return true;
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dateFilterType === 'hoje') {
      return reqDateStr === todayStr;
    }
    if (dateFilterType === 'amanha') {
      return reqDateStr === tomorrowStr;
    }
    if (dateFilterType === 'semana') {
      // Next 7 days
      const reqDate = new Date(reqDateStr + 'T00:00:00');
      const startOfWeek = new Date();
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      endOfWeek.setHours(23, 59, 59, 999);
      return reqDate >= startOfWeek && reqDate <= endOfWeek;
    }
    if (dateFilterType === 'mes') {
      const reqDate = new Date(reqDateStr + 'T00:00:00');
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      return reqDate.getMonth() === currentMonth && reqDate.getFullYear() === currentYear;
    }
    if (dateFilterType === 'especifica') {
      if (!specificDate) return true;
      return reqDateStr === specificDate;
    }
    if (dateFilterType === 'intervalo') {
      if (!dateRangeStart && !dateRangeEnd) return true;
      const reqDate = new Date(reqDateStr + 'T00:00:00');
      if (dateRangeStart && reqDate < new Date(dateRangeStart + 'T00:00:00')) return false;
      if (dateRangeEnd && reqDate > new Date(dateRangeEnd + 'T23:59:59')) return false;
      return true;
    }
    return true;
  };

  // Filter and sort requests
  const filtered = useMemo(() => {
    return requests.filter((req) => {
      // Search
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        !term ||
        req.clientName.toLowerCase().includes(term) ||
        req.code.toLowerCase().includes(term) ||
        req.address.neighborhood.toLowerCase().includes(term) ||
        req.address.street.toLowerCase().includes(term) ||
        req.address.city.toLowerCase().includes(term) ||
        req.clientPhone.includes(term) ||
        (req.confirmationCode && req.confirmationCode.includes(term)) ||
        (req.assignedStaffName && req.assignedStaffName.toLowerCase().includes(term));

      // Status
      const matchesStatus = statusFilter === 'todos' || req.status === statusFilter;
      
      // Service
      const matchesService = serviceTypeFilter === 'todos' || req.serviceType === serviceTypeFilter;
      
      // Format
      const matchesFormat = orgFormatFilter === 'todos' || req.organizationFormat === orgFormatFilter;
      
      // Neighborhood
      const matchesNeighborhood = neighborhoodFilter === 'todos' || req.address.neighborhood === neighborhoodFilter;

      // Date
      const matchesDate = isDateMatching(req.scheduleDate);

      return matchesSearch && matchesStatus && matchesService && matchesFormat && matchesNeighborhood && matchesDate;
    }).sort((a, b) => {
      if (sortBy === 'data_asc') {
        return a.scheduleDate.localeCompare(b.scheduleDate) || a.scheduleTime.localeCompare(b.scheduleTime);
      }
      if (sortBy === 'data_desc') {
        return b.scheduleDate.localeCompare(a.scheduleDate) || b.scheduleTime.localeCompare(a.scheduleTime);
      }
      if (sortBy === 'criacao_desc') {
        return b.createdAt.localeCompare(a.createdAt);
      }
      if (sortBy === 'valor_desc') {
        return b.price - a.price;
      }
      if (sortBy === 'valor_asc') {
        return a.price - b.price;
      }
      if (sortBy === 'cliente_asc') {
        return a.clientName.localeCompare(b.clientName);
      }
      return 0;
    });
  }, [requests, searchTerm, statusFilter, serviceTypeFilter, orgFormatFilter, neighborhoodFilter, dateFilterType, specificDate, dateRangeStart, dateRangeEnd, sortBy]);

  const availableStaff = collaborators.filter(c => c.allowAppAccess);

  const statusConfig: Record<RequestStatus, { label: string; bg: string; text: string; border: string }> = {
    pendente: { label: 'Pendente de Alocação', bg: 'bg-[#FEF6E9]', text: 'text-[#925C18]', border: 'border-[#FCE2B6]' },
    alocado: { label: 'Colaborador Designado', bg: 'bg-[#EEF3ED]', text: 'text-[#3D564A]', border: 'border-[#D4E0D1]' },
    a_caminho: { label: 'A Caminho do Local', bg: 'bg-[#EBF3FA]', text: 'text-[#2C6288]', border: 'border-[#CCE0F4]' },
    em_execucao: { label: 'Em Execução ao Vivo', bg: 'bg-[#F2EBF9]', text: 'text-[#6B3BA7]', border: 'border-[#DFC9F4]' },
    pausado: { label: 'Execução Pausada', bg: 'bg-[#F0F2ED]', text: 'text-[#55635B]', border: 'border-[#DFE5DA]' },
    concluido: { label: 'Serviço Concluído', bg: 'bg-[#EBF6EE]', text: 'text-[#236838]', border: 'border-[#C3E6CC]' },
    cancelado: { label: 'Cancelado', bg: 'bg-[#FDF0EE]', text: 'text-[#A63529]', border: 'border-[#F8CDC8]' },
  };

  return (
    <div id="requests-central-view" className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header & Live Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DFE5DA] shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#243029] text-white flex items-center justify-center shadow-xs">
              <ClipboardList className="w-5 h-5 text-[#C8D6CD]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#243029] tracking-tight">
                Central de Solicitações
              </h2>
              <p className="text-xs text-[#6B7B70] mt-0.5">
                Gestão operacional de clientes, endereços, tipos de serviço (Limpeza, Organização ou Ambos) e formatos (Personalizada vs. Padrão 5S).
              </p>
            </div>
          </div>
        </div>

        {/* Live indicator & Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Sync Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EBF6EE] text-[#236838] border border-[#C3E6CC] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#236838] animate-ping" />
            <span className="w-2 h-2 rounded-full bg-[#236838] -ml-4" />
            <span>Supabase Realtime Ativo</span>
          </div>

          {/* Open Customer PWA */}
          <button
            id="btn-open-customer-pwa"
            type="button"
            onClick={() => setCustomerAppReqId(requests[0]?.id || '')}
            className="px-3 py-2 bg-[#F4F6F1] hover:bg-[#EEF3ED] text-[#2C473A] border border-[#DFE5DA] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            title="Abrir o PWA do Cliente para autoatendimento, acompanhamento e criação de pedidos"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#5A7D6C]" />
            <span>PWA do Cliente</span>
          </button>

          {/* Create Request */}
          <button
            id="btn-open-new-request-modal"
            type="button"
            onClick={handleOpenNew}
            className="px-4 py-2 bg-[#5A7D6C] hover:bg-[#4a695b] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Solicitação</span>
          </button>
        </div>
      </div>

      {/* 2. Real-Time KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div 
          onClick={() => setStatusFilter('todos')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'todos' ? 'bg-[#243029] text-white border-[#243029] shadow-xs' : 'bg-white text-[#243029] border-[#DFE5DA] hover:border-[#CAD4C4]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold ${statusFilter === 'todos' ? 'text-[#C8D6CD]' : 'text-[#6B7B70]'}`}>Total Geral</span>
            <ClipboardList className="w-4 h-4 opacity-70" />
          </div>
          <span className="text-xl font-extrabold block mt-1">{kpis.total}</span>
        </div>

        <div 
          onClick={() => setStatusFilter('pendente')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'pendente' 
              ? 'bg-[#925C18] text-white border-[#925C18] shadow-xs' 
              : kpis.pending > 0 
                ? 'bg-[#FEF6E9] text-[#925C18] border-[#FCE2B6] hover:bg-[#FCE2B6]' 
                : 'bg-white text-[#243029] border-[#DFE5DA]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold ${statusFilter === 'pendente' ? 'text-amber-100' : 'text-[#925C18]'}`}>Pendentes</span>
            {kpis.pending > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
          </div>
          <span className="text-xl font-extrabold block mt-1">{kpis.pending}</span>
        </div>

        <div 
          onClick={() => setStatusFilter('alocado')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'alocado' ? 'bg-[#3D564A] text-white border-[#3D564A]' : 'bg-white text-[#243029] border-[#DFE5DA] hover:border-[#CAD4C4]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold ${statusFilter === 'alocado' ? 'text-[#C8D6CD]' : 'text-[#6B7B70]'}`}>Alocados</span>
            <UserPlus className="w-4 h-4 opacity-70" />
          </div>
          <span className="text-xl font-extrabold block mt-1">{kpis.allocated}</span>
        </div>

        <div 
          onClick={() => setStatusFilter('em_execucao')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'em_execucao' ? 'bg-[#6B3BA7] text-white border-[#6B3BA7]' : 'bg-white text-[#243029] border-[#DFE5DA] hover:border-[#CAD4C4]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold ${statusFilter === 'em_execucao' ? 'text-purple-100' : 'text-[#6B3BA7]'}`}>Em Execução</span>
            <Clock className="w-4 h-4 opacity-70" />
          </div>
          <span className="text-xl font-extrabold block mt-1">{kpis.inProgress}</span>
        </div>

        <div 
          onClick={() => setStatusFilter('concluido')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'concluido' ? 'bg-[#236838] text-white border-[#236838]' : 'bg-white text-[#243029] border-[#DFE5DA] hover:border-[#CAD4C4]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold ${statusFilter === 'concluido' ? 'text-emerald-100' : 'text-[#6B7B70]'}`}>Concluídos</span>
            <CheckCircle2 className="w-4 h-4 opacity-70" />
          </div>
          <span className="text-xl font-extrabold block mt-1">{kpis.completed}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-[#DFE5DA] text-[#243029]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#6B7B70]">Valor Total</span>
            <DollarSign className="w-4 h-4 text-[#5A7D6C]" />
          </div>
          <span className="text-sm font-bold text-[#5A7D6C] block mt-1">{formatCurrency(kpis.totalRevenue)}</span>
        </div>
      </div>

      {/* 3. Comprehensive Filter Control Center */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#DFE5DA] shadow-2xs space-y-4">
        
        {/* Row 1: Search & Quick Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Search */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-[#8FA395] absolute left-3.5 top-3" />
            <input
              id="input-search-requests"
              type="text"
              placeholder="Buscar cliente, código, bairro, rua, telefone ou colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] bg-white text-[#243029] placeholder-[#8FA395]"
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-[#8FA395] hover:text-[#243029]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Service Type Filter */}
          <div className="md:col-span-3">
            <select
              id="select-filter-service-type"
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold text-[#243029] rounded-xl border border-[#DFE5DA] bg-white focus:outline-none focus:ring-2 focus:ring-[#5A7D6C]"
            >
              <option value="todos">Tipo de Serviço: Todos</option>
              <option value="limpeza">Apenas Limpeza</option>
              <option value="organizacao">Apenas Organização</option>
              <option value="ambos">Ambos (Limpeza + Organização)</option>
            </select>
          </div>

          {/* Org Format Filter */}
          <div className="md:col-span-3">
            <select
              id="select-filter-org-format"
              value={orgFormatFilter}
              onChange={(e) => setOrgFormatFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold text-[#243029] rounded-xl border border-[#DFE5DA] bg-white focus:outline-none focus:ring-2 focus:ring-[#5A7D6C]"
            >
              <option value="todos">Formato Org: Todos</option>
              <option value="personalizada">Org. Personalizada (Cliente)</option>
              <option value="padrao_empresa">Org. Padrão da Empresa (5S)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="md:col-span-2 flex items-center justify-end gap-1">
            <div className="bg-[#F4F6F1] p-1 rounded-xl border border-[#DFE5DA] flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-[#243029] shadow-2xs' : 'text-[#6B7B70] hover:text-[#243029]'
                }`}
                title="Visualização em Cards Detalhados"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('tabela')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'tabela' ? 'bg-white text-[#243029] shadow-2xs' : 'text-[#6B7B70] hover:text-[#243029]'
                }`}
                title="Visualização em Tabela Operacional Densa"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Tabela</span>
              </button>
            </div>
          </div>

        </div>

        {/* Row 2: Date Filters & Sort Bar */}
        <div className="pt-3 border-t border-[#EEF3ED] flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Date Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#6B7B70] flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-[#5A7D6C]" />
              Filtro por Data:
            </span>

            {[
              { id: 'todas', label: 'Todas as Datas' },
              { id: 'hoje', label: 'Hoje' },
              { id: 'amanha', label: 'Amanhã' },
              { id: 'semana', label: 'Esta Semana' },
              { id: 'mes', label: 'Este Mês' },
              { id: 'especifica', label: 'Data Específica' },
              { id: 'intervalo', label: 'Intervalo' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDateFilterType(d.id as DateFilterType)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  dateFilterType === d.id
                    ? 'bg-[#5A7D6C] text-white shadow-2xs'
                    : 'bg-[#F4F6F1] text-[#4F6055] hover:bg-[#EEF3ED]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Sort Selector & Neighborhood */}
          <div className="flex items-center gap-2">
            {/* Neighborhood select */}
            {uniqueNeighborhoods.length > 0 && (
              <select
                value={neighborhoodFilter}
                onChange={(e) => setNeighborhoodFilter(e.target.value)}
                className="px-2.5 py-1 text-[11px] font-semibold text-[#3D4C42] rounded-lg border border-[#DFE5DA] bg-white"
              >
                <option value="todos">Bairro: Todos</option>
                {uniqueNeighborhoods.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            )}

            {/* Sort order */}
            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#8FA395]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-2.5 py-1 text-[11px] font-semibold text-[#3D4C42] rounded-lg border border-[#DFE5DA] bg-white"
              >
                <option value="data_asc">Data de Atendimento (Mais Próximos)</option>
                <option value="data_desc">Data de Atendimento (Mais Distantes)</option>
                <option value="criacao_desc">Mais Recentes Criados</option>
                <option value="valor_desc">Maior Valor (R$)</option>
                <option value="valor_asc">Menor Valor (R$)</option>
                <option value="cliente_asc">Nome do Cliente (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Optional Date Inputs when specific or interval is active */}
        {(dateFilterType === 'especifica' || dateFilterType === 'intervalo') && (
          <div className="p-3 bg-[#F7F8F4] rounded-xl border border-[#DFE5DA] flex flex-wrap items-center gap-3 text-xs animate-in fade-in duration-150">
            {dateFilterType === 'especifica' && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#243029]">Selecionar Data:</span>
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  className="px-3 py-1 text-xs rounded-lg border border-[#DFE5DA] bg-white text-[#243029]"
                />
                {specificDate && (
                  <button
                    type="button"
                    onClick={() => setSpecificDate('')}
                    className="text-xs text-[#5A7D6C] underline cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>
            )}

            {dateFilterType === 'intervalo' && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[#243029]">De:</span>
                <input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  className="px-3 py-1 text-xs rounded-lg border border-[#DFE5DA] bg-white text-[#243029]"
                />
                <span className="font-semibold text-[#243029]">Até:</span>
                <input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  className="px-3 py-1 text-xs rounded-lg border border-[#DFE5DA] bg-white text-[#243029]"
                />
                {(dateRangeStart || dateRangeEnd) && (
                  <button
                    type="button"
                    onClick={() => { setDateRangeStart(''); setDateRangeEnd(''); }}
                    className="text-xs text-[#5A7D6C] underline cursor-pointer"
                  >
                    Limpar Intervalo
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pt-2 border-t border-[#EEF3ED] text-xs">
          {[
            { id: 'todos', label: 'Todos', count: requests.length },
            { id: 'pendente', label: 'Pendentes', count: requests.filter(r => r.status === 'pendente').length },
            { id: 'alocado', label: 'Alocados', count: requests.filter(r => r.status === 'alocado' || r.status === 'a_caminho').length },
            { id: 'em_execucao', label: 'Em Execução', count: requests.filter(r => r.status === 'em_execucao').length },
            { id: 'concluido', label: 'Concluídos', count: requests.filter(r => r.status === 'concluido').length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#243029] text-white shadow-2xs'
                  : 'text-[#6B7B70] hover:bg-[#EEF3ED] hover:text-[#243029]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-[#EEF3ED] text-[#3D564A]'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Results List: Cards Mode OR Table Mode */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-[#DFE5DA] p-8 shadow-2xs">
          <ClipboardList className="w-12 h-12 text-[#A2B3A6] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#243029]">Nenhuma solicitação encontrada</h3>
          <p className="text-xs text-[#6B7B70] mt-1 max-w-md mx-auto">
            Não encontramos pedidos correspondentes aos filtros selecionados. Tente ajustar os parâmetros de data, status ou termo de busca.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('todos');
                setServiceTypeFilter('todos');
                setOrgFormatFilter('todos');
                setDateFilterType('todas');
                setNeighborhoodFilter('todos');
              }}
              className="px-4 py-2 bg-[#F4F6F1] hover:bg-[#EEF3ED] text-[#243029] text-xs font-semibold rounded-xl border border-[#DFE5DA] cursor-pointer"
            >
              Limpar Todos os Filtros
            </button>
            <button
              type="button"
              onClick={handleOpenNew}
              className="px-4 py-2 bg-[#5A7D6C] hover:bg-[#4a695b] text-white text-xs font-semibold rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Criar Nova Solicitação
            </button>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="space-y-4">
          {filtered.map((req) => {
            const isCustom = req.organizationFormat === 'personalizada';
            const mapsQuery = encodeURIComponent(`${req.address.street}, ${req.address.number}, ${req.address.neighborhood}, ${req.address.city}, ${req.address.state}`);
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

            return (
              <div 
                key={req.id}
                id={`request-card-${req.code}`}
                className="bg-white rounded-2xl border border-[#DFE5DA] shadow-2xs hover:border-[#CAD4C4] transition-all p-5 space-y-4"
              >
                {/* Header Row: Code, Customer Name, Service Badges, Total Price & Status */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#EEF3ED]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#3D564A] bg-[#EEF3ED] px-2.5 py-1 rounded-md border border-[#D4E0D1]">
                      {req.code}
                    </span>
                    <h3 className="text-base font-bold text-[#243029]">{req.clientName}</h3>
                    
                    {/* Service Type Tag */}
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      req.serviceType === 'ambos'
                        ? 'bg-[#F2EBF9] text-[#6B3BA7] border-[#DFC9F4]'
                        : req.serviceType === 'organizacao'
                        ? 'bg-[#EBF3FA] text-[#2C6288] border-[#CCE0F4]'
                        : 'bg-[#EEF3ED] text-[#3D564A] border-[#D4E0D1]'
                    }`}>
                      {req.serviceType === 'ambos' ? 'Limpeza + Organização' : req.serviceType === 'organizacao' ? 'Apenas Organização' : 'Apenas Limpeza'}
                    </span>

                    {/* Organization Format Tag */}
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                      isCustom
                        ? 'bg-[#F5F8F4] text-[#3D564A] border-[#D4E0D1]'
                        : 'bg-[#F0F2ED] text-[#55635B] border-[#DFE5DA]'
                    }`}>
                      <Layers className="w-3 h-3 text-[#5A7D6C]" />
                      {isCustom ? 'Org. Personalizada (Hábitos)' : 'Padrão da Empresa (5S)'}
                    </span>

                    {/* Security Confirmation Code Badge */}
                    {req.confirmationCode && (
                      <div 
                        className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                          req.codeValidatedAt
                            ? 'bg-[#EBF6EE] text-[#236838] border-[#C3E6CC]'
                            : 'bg-[#FAF7F2] text-[#8C5E24] border-[#ECD9C5]'
                        }`}
                        title={req.codeValidatedAt ? `Código validado com sucesso em ${req.codeValidatedAt}` : 'Código de confirmação gerado. O cliente apresentará este código à equipe no local.'}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#5A7D6C]" />
                        <span>Cód. Cliente: <strong>{req.confirmationCode}</strong></span>
                        {req.codeValidatedAt ? (
                          <span className="text-[9px] bg-[#236838] text-white px-1.5 rounded-full">Validado</span>
                        ) : (
                          <span className="text-[9px] bg-[#D4A373] text-white px-1.5 rounded-full">Pendente</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end lg:self-auto">
                    <div className="text-right">
                      <span className="text-[11px] text-[#8FA395] block leading-tight">Investimento Total</span>
                      <span className="text-base font-bold text-[#243029]">{formatCurrency(req.price)}</span>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusConfig[req.status]?.bg || 'bg-[#F0F2ED]'} ${statusConfig[req.status]?.text || 'text-[#55635B]'} ${statusConfig[req.status]?.border || 'border-[#DFE5DA]'}`}>
                      {statusConfig[req.status]?.label || req.status}
                    </span>
                  </div>
                </div>

                {/* 3 Detail Columns: Contact & Address, Specs & Org Format, Schedule & Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  
                  {/* Column 1: Contact & Address */}
                  <div className="space-y-2.5 p-3.5 rounded-xl bg-[#F7F8F4] border border-[#DFE5DA]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#243029] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#5A7D6C]" />
                        Endereço & Contato
                      </span>
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-[#5A7D6C] hover:underline flex items-center gap-1"
                        title="Abrir no Google Maps para traçar rota"
                      >
                        <Navigation className="w-3 h-3" />
                        Ver Rota
                      </a>
                    </div>

                    <div className="space-y-1 text-[#4F6055]">
                      <p className="font-semibold text-[#243029] leading-snug">
                        {req.address.street}, {req.address.number}
                        {req.address.complement && ` (${req.address.complement})`}
                      </p>
                      <p>{req.address.neighborhood} - {req.address.city}/{req.address.state}</p>
                      <p className="text-[11px] text-[#6B7B70]">CEP: {req.address.zipCode}</p>
                      {req.address.referencePoint && (
                        <p className="text-[11px] text-[#6B7B70] italic">Ref: {req.address.referencePoint}</p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#DFE5DA] flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[#243029] font-medium">{req.clientPhone}</span>
                        <span className="text-[10px] text-[#8FA395]">{req.clientEmail}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <a
                          href={getWhatsAppLink(req.clientWhatsapp, `Olá ${req.clientName}, tudo bem? Aqui é da equipe administrativa da Clean & Organize sobre sua solicitação ${req.code}:`)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-[#EEF3ED] text-[#3D564A] hover:bg-[#DFE5DA] rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3" />
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Specs & Organization Details */}
                  <div className="space-y-2.5 p-3.5 rounded-xl bg-[#F7F8F4] border border-[#DFE5DA]">
                    <span className="font-bold text-[#243029] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#5A7D6C]" />
                      Especificações do Imóvel & Formato
                    </span>

                    <div className="space-y-1 text-[#4F6055]">
                      <div className="flex items-center justify-between">
                        <span>Dimensão do Imóvel:</span>
                        <strong className="text-[#243029]">
                          {req.propertyDetails.rooms} qtos, {req.propertyDetails.bathrooms} wcs (~{req.propertyDetails.approxAreaM2}m²)
                        </strong>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Presença de Pets:</span>
                        <strong className="text-[#243029]">
                          {req.propertyDetails.hasPets ? 'Sim (Animais no local)' : 'Não possui'}
                        </strong>
                      </div>

                      {req.propertyDetails.allergyAlerts && (
                        <div className="text-[11px] text-[#925C18] bg-[#FEF6E9] p-1.5 rounded-lg border border-[#FCE2B6] flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 shrink-0" />
                          <span>Alergia: {req.propertyDetails.allergyAlerts}</span>
                        </div>
                      )}

                      {/* Format specification details */}
                      <div className="pt-1.5 border-t border-[#DFE5DA]">
                        <span className="text-[10px] uppercase font-bold text-[#8FA395] block">
                          Metodologia Aplicada:
                        </span>
                        <p className="text-[11px] font-semibold text-[#243029] mt-0.5">
                          {isCustom ? 'Personalizada aos Hábitos e Rotinas' : 'Padrão da Empresa (Metodologia 5S)'}
                        </p>

                        {req.orgDetails?.selectedZones && req.orgDetails.selectedZones.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {req.orgDetails.selectedZones.map((z, i) => (
                              <span key={i} className="text-[10px] bg-white border border-[#DFE5DA] text-[#3D4C42] px-1.5 py-0.5 rounded font-medium">
                                {z}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Schedule, Allocated Staff & Actions */}
                  <div className="space-y-2.5 p-3.5 rounded-xl bg-[#F7F8F4] border border-[#DFE5DA] flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-[#243029] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#5A7D6C]" />
                        Agendamento & Profissional
                      </span>

                      <div className="space-y-1 text-[#4F6055] mt-2">
                        <div className="flex items-center justify-between">
                          <span>Data / Horário:</span>
                          <strong className="text-[#243029]">
                            {formatDateBR(req.scheduleDate)} às {req.scheduleTime}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between">
                          <span>Duração Estimada:</span>
                          <strong className="text-[#243029]">{req.estimatedDurationHours} horas</strong>
                        </div>

                        <div className="pt-1.5 border-t border-[#DFE5DA] flex items-center justify-between">
                          <span className="text-[#6B7B70]">Colaborador:</span>
                          {req.assignedStaffName ? (
                            <span className="font-bold text-[#3D564A] bg-[#EEF3ED] px-2 py-0.5 rounded border border-[#D4E0D1]">
                              {req.assignedStaffName}
                            </span>
                          ) : (
                            <span className="text-[#925C18] font-bold bg-[#FEF6E9] px-2 py-0.5 rounded border border-[#FCE2B6]">
                              Pendente
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="pt-2 flex items-center gap-1.5">
                      {req.status === 'pendente' && (
                        <button
                          type="button"
                          onClick={() => {
                            setAllocatingRequest(req);
                            setSelectedStaffId(availableStaff[0]?.id || '');
                          }}
                          className="flex-1 py-1.5 bg-[#5A7D6C] hover:bg-[#4a695b] text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Designar Equipe
                        </button>
                      )}

                      {req.status === 'alocado' && (
                        <button
                          type="button"
                          onClick={() => setValidatingReq(req)}
                          className="flex-1 py-1.5 bg-[#4E7A62] hover:bg-[#3f6551] text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          title="Validar Código de Segurança de 4 dígitos no local para iniciar execução"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Validar Código & Iniciar
                        </button>
                      )}

                      {req.status === 'em_execucao' && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('alocacao')}
                          className="flex-1 py-1.5 bg-[#6B3BA7] hover:bg-[#582e8c] text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Ver Timer ao Vivo
                        </button>
                      )}

                      {/* Customer App Simulator Button */}
                      <button
                        type="button"
                        onClick={() => setCustomerAppReqId(req.id)}
                        className="p-1.5 text-[#5A7D6C] hover:text-[#243029] bg-[#EEF3ED] border border-[#D4E0D1] rounded-lg hover:bg-[#DFE5DA] transition-colors cursor-pointer"
                        title="Ver como o Cliente visualiza este pedido e o Código de Confirmação"
                      >
                        <Smartphone className="w-4 h-4" />
                      </button>

                      {/* View Full Sheet Modal */}
                      <button
                        type="button"
                        onClick={() => setViewingRequest(req)}
                        className="p-1.5 text-[#55635B] hover:text-[#243029] bg-white border border-[#DFE5DA] rounded-lg hover:bg-[#EEF3ED] transition-colors cursor-pointer"
                        title="Ver Ficha Completa & Imprimir Ordem de Serviço"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Delete Request */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Deseja realmente excluir a solicitação ${req.code} de ${req.clientName}?`)) {
                            deleteRequest(req.id);
                          }
                        }}
                        className="p-1.5 text-[#55635B] hover:text-rose-600 bg-white border border-[#DFE5DA] rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Excluir Solicitação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Mode (Dense Operational View) */
        <div className="bg-white rounded-2xl border border-[#DFE5DA] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8F4] border-b border-[#DFE5DA] text-[#6B7B70] font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Código / Status</th>
                  <th className="py-3 px-4">Cliente / Contato</th>
                  <th className="py-3 px-4">Endereço / Bairro</th>
                  <th className="py-3 px-4">Tipo & Formato</th>
                  <th className="py-3 px-4">Data & Horário</th>
                  <th className="py-3 px-4">Colaborador</th>
                  <th className="py-3 px-4">Cód. Segurança</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF3ED] text-[#243029]">
                {filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-[#F9FAF7] transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[#3D564A] block">{req.code}</span>
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.2 rounded-full border mt-1 ${statusConfig[req.status]?.bg || ''} ${statusConfig[req.status]?.text || ''} ${statusConfig[req.status]?.border || ''}`}>
                        {statusConfig[req.status]?.label || req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <strong className="block font-bold">{req.clientName}</strong>
                      <span className="text-[11px] text-[#6B7B70] block">{req.clientPhone}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium block">{req.address.street}, {req.address.number}</span>
                      <span className="text-[11px] text-[#6B7B70] block">{req.address.neighborhood} - {req.address.city}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold block">
                        {req.serviceType === 'ambos' ? 'Limpeza + Organização' : req.serviceType === 'organizacao' ? 'Organização' : 'Limpeza'}
                      </span>
                      <span className="text-[10px] text-[#5A7D6C] block">
                        {req.organizationFormat === 'personalizada' ? 'Personalizada (Cliente)' : 'Padrão 5S'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold block">{formatDateBR(req.scheduleDate)}</span>
                      <span className="text-[11px] text-[#6B7B70] block">{req.scheduleTime} ({req.estimatedDurationHours}h)</span>
                    </td>
                    <td className="py-3 px-4">
                      {req.assignedStaffName ? (
                        <span className="font-bold text-[#3D564A] bg-[#EEF3ED] px-2 py-0.5 rounded text-[11px] border border-[#D4E0D1]">
                          {req.assignedStaffName}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setAllocatingRequest(req);
                            setSelectedStaffId(availableStaff[0]?.id || '');
                          }}
                          className="text-[11px] text-[#925C18] bg-[#FEF6E9] px-2 py-0.5 rounded font-bold border border-[#FCE2B6] hover:bg-[#FCE2B6] cursor-pointer"
                        >
                          + Designar
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-mono font-bold text-xs bg-[#FAF7F2] px-2 py-1 rounded border border-[#ECD9C5] text-[#8C5E24]">
                        <ShieldCheck className="w-3 h-3 text-[#5A7D6C]" />
                        <span>{req.confirmationCode || '----'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#243029]">
                      {formatCurrency(req.price)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingRequest(req)}
                          className="p-1 text-[#55635B] hover:text-[#243029] hover:bg-[#EEF3ED] rounded"
                          title="Ver Ficha"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomerAppReqId(req.id)}
                          className="p-1 text-[#5A7D6C] hover:text-[#243029] hover:bg-[#EEF3ED] rounded"
                          title="Abrir no PWA do Cliente"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                        </button>
                        {req.status === 'alocado' && (
                          <button
                            type="button"
                            onClick={() => setValidatingReq(req)}
                            className="p-1 text-[#4E7A62] hover:text-[#243029] hover:bg-[#EEF3ED] rounded"
                            title="Validar Código"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Allocation Modal */}
      {allocatingRequest && (
        <div id="modal-allocation-overlay" className="fixed inset-0 z-50 bg-[#16201A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#DFE5DA] max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#243029] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#5A7D6C] flex items-center justify-center text-white">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Designar Colaborador</h3>
                  <span className="text-xs text-[#C8D6CD]">
                    Solicitação {allocatingRequest.code} - {allocatingRequest.clientName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAllocatingRequest(null)}
                className="p-1 rounded-lg text-[#C8D6CD] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-[#F7F8F4] rounded-xl border border-[#DFE5DA] text-xs space-y-1 text-[#3D4C42]">
                <p><strong>Serviço:</strong> {allocatingRequest.serviceType.toUpperCase()} ({allocatingRequest.organizationFormat === 'personalizada' ? 'Organização Personalizada' : 'Padrão 5S'})</p>
                <p><strong>Data & Hora:</strong> {formatDateBR(allocatingRequest.scheduleDate)} às {allocatingRequest.scheduleTime} ({allocatingRequest.estimatedDurationHours}h)</p>
                <p><strong>Endereço:</strong> {allocatingRequest.address.neighborhood} - {allocatingRequest.address.city}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#243029] mb-2">
                  Selecione o Profissional Operacional Cadastrado:
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {availableStaff.map((staff) => (
                    <label
                      key={staff.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedStaffId === staff.id
                          ? 'border-[#5A7D6C] bg-[#EEF3ED] shadow-xs'
                          : 'border-[#DFE5DA] hover:border-[#CAD4C4] bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="selectedStaff"
                          value={staff.id}
                          checked={selectedStaffId === staff.id}
                          onChange={() => setSelectedStaffId(staff.id)}
                          className="w-4 h-4 text-[#5A7D6C] border-[#DFE5DA] focus:ring-[#5A7D6C]"
                        />
                        <div className="w-9 h-9 rounded-lg bg-[#DFE5DA] overflow-hidden shrink-0 flex items-center justify-center text-[#3D564A] font-bold text-xs ring-1 ring-[#DFE5DA]">
                          {staff.photoUrl ? (
                            <img
                              src={staff.photoUrl}
                              alt={staff.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{staff.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#243029]">{staff.name}</p>
                          <p className="text-[11px] text-[#6B7B70]">{staff.role} • ★ {staff.rating.toFixed(1)}</p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        staff.status === 'ativo' ? 'bg-[#EEF3ED] text-[#3D564A]' : 'bg-[#FEF6E9] text-[#925C18]'
                      }`}>
                        {staff.status === 'ativo' ? 'Disponível' : 'Em Atendimento'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EEF3ED]">
                <button
                  type="button"
                  onClick={() => setAllocatingRequest(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#6B7B70] hover:text-[#243029] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-allocation"
                  type="button"
                  onClick={handleConfirmAllocation}
                  disabled={!selectedStaffId}
                  className="px-5 py-2 bg-[#5A7D6C] hover:bg-[#4a695b] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar Alocação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Request Details & Printable Order Sheet Modal */}
      {viewingRequest && (
        <div id="modal-view-request-details" className="fixed inset-0 z-50 bg-[#16201A]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#DFE5DA] max-w-3xl w-full my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-[#243029] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#5A7D6C] flex items-center justify-center text-white">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Ficha da Solicitação {viewingRequest.code}
                  </h3>
                  <span className="text-xs text-[#C8D6CD]">
                    Registrado em {formatDateBR(viewingRequest.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Imprimir Ordem de Serviço"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir OS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingRequest(null)}
                  className="p-1 rounded-lg text-[#C8D6CD] hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs text-[#3D4C42] max-h-[75vh] overflow-y-auto print:max-h-none">
              
              {/* Client & Address Block */}
              <div className="p-4 rounded-xl bg-[#F7F8F4] border border-[#DFE5DA] space-y-2">
                <h4 className="font-bold text-sm text-[#243029] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#5A7D6C]" />
                  Dados do Cliente & Local de Atendimento
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <p><strong>Nome Completo:</strong> {viewingRequest.clientName}</p>
                  <p><strong>E-mail:</strong> {viewingRequest.clientEmail}</p>
                  <p><strong>Telefone:</strong> {viewingRequest.clientPhone}</p>
                  <p><strong>WhatsApp:</strong> {viewingRequest.clientWhatsapp}</p>
                  <p className="sm:col-span-2">
                    <strong>Endereço Completo:</strong> {viewingRequest.address.street}, {viewingRequest.address.number} {viewingRequest.address.complement && `(${viewingRequest.address.complement})`} - {viewingRequest.address.neighborhood}, {viewingRequest.address.city}/{viewingRequest.address.state}
                  </p>
                  <p><strong>CEP:</strong> {viewingRequest.address.zipCode}</p>
                  {viewingRequest.address.referencePoint && (
                    <p className="text-[#6B7B70] italic">
                      <strong>Ponto de Referência:</strong> {viewingRequest.address.referencePoint}
                    </p>
                  )}
                </div>
              </div>

              {/* Service & Organization Format Specifications */}
              <div className="p-4 rounded-xl bg-[#EEF3ED] border border-[#D4E0D1] space-y-2">
                <h4 className="font-bold text-sm text-[#243029] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#5A7D6C]" />
                  Especificações de Organização & Limpeza
                </h4>
                <div className="space-y-1.5 text-xs text-[#3D564A]">
                  <p><strong>Tipo de Serviço:</strong> {viewingRequest.serviceType === 'ambos' ? 'Limpeza Completa + Organização Especializada' : viewingRequest.serviceType.toUpperCase()}</p>
                  <p>
                    <strong>Formato de Organização:</strong>{' '}
                    <span className="font-bold">
                      {viewingRequest.organizationFormat === 'personalizada'
                        ? 'Personalizada (de acordo com as preferências do cliente)'
                        : 'Padrão da Empresa (Metodologia 5S / Checklist Oficial)'}
                    </span>
                  </p>
                  <p><strong>Metodologia Aplicada:</strong> {viewingRequest.orgDetails?.methodology}</p>
                  
                  {viewingRequest.orgDetails?.customNotes && (
                    <p className="bg-white/90 p-2.5 rounded-lg border border-[#D4E0D1] mt-2">
                      <strong>Observações do Formato / Preferências:</strong> {viewingRequest.orgDetails.customNotes}
                    </p>
                  )}

                  {viewingRequest.orgDetails?.selectedZones && (
                    <div className="pt-2">
                      <strong>Cômodos Selecionados para Organização:</strong>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {viewingRequest.orgDetails.selectedZones.map((z, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-white font-semibold text-[#3D564A] border border-[#D4E0D1]">
                            {z}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Property Details */}
              <div className="p-4 rounded-xl bg-[#F7F8F4] border border-[#DFE5DA] space-y-2">
                <h4 className="font-bold text-sm text-[#243029] flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-[#5A7D6C]" />
                  Dados do Imóvel & Restrições
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <p><strong>Quartos / Cômodos:</strong> {viewingRequest.propertyDetails.rooms}</p>
                  <p><strong>Banheiros:</strong> {viewingRequest.propertyDetails.bathrooms}</p>
                  <p><strong>Área Aprox:</strong> {viewingRequest.propertyDetails.approxAreaM2} m²</p>
                  <p className="col-span-2">
                    <strong>Presença de Pets:</strong> {viewingRequest.propertyDetails.hasPets ? viewingRequest.propertyDetails.petDetails || 'Sim (Presentes no local)' : 'Não possui'}
                  </p>
                  {viewingRequest.propertyDetails.allergyAlerts && (
                    <p className="col-span-full text-[#A63529] bg-[#FDF0EE] p-2 rounded-lg border border-[#F8CDC8]">
                      <strong>Alerta de Alergia a Produtos Químicos:</strong> {viewingRequest.propertyDetails.allergyAlerts}
                    </p>
                  )}
                  {viewingRequest.clientNotes && (
                    <p className="col-span-full text-[#243029] bg-white p-2 rounded-lg border border-[#DFE5DA]">
                      <strong>Instruções Adicionais do Cliente:</strong> {viewingRequest.clientNotes}
                    </p>
                  )}
                </div>
              </div>

              {/* Security Confirmation Code Module */}
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#ECD9C5] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#243029] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#5A7D6C]" />
                    Módulo de Segurança & Código de Confirmação de Identidade
                  </h4>
                  {viewingRequest.codeValidatedAt ? (
                    <span className="text-[11px] font-bold bg-[#EBF6EE] text-[#236838] border border-[#C3E6CC] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Validado no Local
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold bg-[#FAF1E8] text-[#9A5222] border border-[#ECD9C5] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Aguardando Validação
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center bg-white p-3.5 rounded-lg border border-[#DFE5DA]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8FA395] block">
                      Código de 4 Dígitos Gerado
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-mono font-extrabold tracking-widest text-[#243029] bg-[#EEF3ED] px-3 py-1 rounded-lg border border-[#D4E0D1]">
                        {viewingRequest.confirmationCode || '4829'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newCode = regenerateSecurityCode(viewingRequest.id);
                          setViewingRequest({ ...viewingRequest, confirmationCode: newCode });
                        }}
                        className="px-2 py-1.5 bg-[#F4F6F1] hover:bg-[#EEF3ED] text-[#3D564A] text-xs font-semibold rounded-lg border border-[#DFE5DA] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Gerar um novo código numérico de 4 dígitos"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Regerar
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-[#55635B] space-y-1">
                    <p className="leading-relaxed">
                      Este código é exibido no app do cliente. O colaborador é obrigado a digitá-lo no local para desbloquear o início do serviço e o cronômetro.
                    </p>
                    {viewingRequest.codeValidatedAt && (
                      <p className="text-[11px] font-semibold text-[#236838]">
                        ✓ Validado em: {viewingRequest.codeValidatedAt}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerAppReqId(viewingRequest.id);
                    }}
                    className="px-3 py-1.5 bg-[#EEF3ED] hover:bg-[#DFE5DA] text-[#2C473A] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#5A7D6C]" />
                    Visualizar no App do Cliente
                  </button>

                  {viewingRequest.status === 'alocado' && (
                    <button
                      type="button"
                      onClick={() => {
                        setValidatingReq(viewingRequest);
                      }}
                      className="px-3 py-1.5 bg-[#5A7D6C] hover:bg-[#4a695b] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Validar Código & Iniciar Serviço
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#F7F8F4] border-t border-[#DFE5DA] flex items-center justify-between">
              <span className="text-xs text-[#6B7B70]">
                Status Atual: <strong>{statusConfig[viewingRequest.status]?.label || viewingRequest.status}</strong>
              </span>
              <button
                type="button"
                onClick={() => setViewingRequest(null)}
                className="px-5 py-2 bg-[#243029] text-white text-xs font-semibold rounded-xl cursor-pointer hover:bg-[#16201A]"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal New Request Form */}
      {isNewModalOpen && (
        <div id="modal-new-request-form-overlay" className="fixed inset-0 z-50 bg-[#16201A]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#DFE5DA] max-w-3xl w-full my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#243029] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#5A7D6C] flex items-center justify-center text-white">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Nova Solicitação de Atendimento</h3>
                  <span className="text-xs text-[#C8D6CD]">
                    Cadastre um novo pedido de limpeza ou organização doméstica
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-lg text-[#C8D6CD] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-[#FDF0EE] border border-[#F8CDC8] rounded-xl text-xs text-[#A63529] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#A63529] shrink-0" />
                  {formError}
                </div>
              )}

              {/* 1. Customer Details */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#5A7D6C] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    1. Dados de Contato do Cliente
                  </h4>
                  {clients.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[#64736B]">Vincular Cliente:</span>
                      <select
                        value={selectedClientId}
                        onChange={(e) => handleSelectClient(e.target.value)}
                        className="px-2 py-1 text-xs bg-[#F4F6F1] border border-[#DFE5DA] rounded-lg text-[#243029] focus:outline-none focus:border-[#5A7D6C]"
                      >
                        <option value="">Novo / Não cadastrado</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.documentType || 'CPF'}: {c.documentNumber || 'S/ doc'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Nome do Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ex: Beatriz Vasconcelos"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Telefone / WhatsApp *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(formatPhone(e.target.value))}
                      placeholder="(11) 90000-0000"
                      maxLength={15}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      E-mail do Cliente
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="cliente@email.com"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Full Address */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5A7D6C] mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  2. Endereço Completo do Imóvel
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Rua / Logradouro *
                    </label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Ex: Alameda dos Jacarandás"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Número *
                    </label>
                    <input
                      type="text"
                      required
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="Ex: 420"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Complemento (Apto/Bloco)
                    </label>
                    <input
                      type="text"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      placeholder="Apto 142 Bloco B"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Bairro *
                    </label>
                    <input
                      type="text"
                      required
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Ex: Moema"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="São Paulo"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(formatCEP(e.target.value))}
                      placeholder="00000-000"
                      maxLength={9}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#DFE5DA] focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Ponto de Referência
                    </label>
                    <input
                      type="text"
                      value={referencePoint}
                      onChange={(e) => setReferencePoint(e.target.value)}
                      placeholder="Próximo à padaria..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Service Type & Organization Format */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5A7D6C] mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  3. Tipo de Serviço & Formato de Organização
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Service Type Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1.5">
                      Tipo de Atendimento:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'limpeza', label: 'Limpeza' },
                        { id: 'organizacao', label: 'Organização' },
                        { id: 'ambos', label: 'Ambos' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            const svc = item.id as ServiceType;
                            setServiceType(svc);
                            handleRecalculateSuggestedPrice(svc, rooms, bathrooms, organizationFormat);
                          }}
                          className={`py-2 px-2 text-xs rounded-lg font-medium border text-center transition-all cursor-pointer ${
                            serviceType === item.id
                              ? 'bg-[#5A7D6C] text-white border-[#5A7D6C] shadow-2xs font-bold'
                              : 'bg-white text-[#3D4C42] border-[#DFE5DA] hover:bg-[#F7F8F4]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Org Format Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1.5">
                      Formato de Organização:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOrganizationFormat('personalizada');
                          handleRecalculateSuggestedPrice(serviceType, rooms, bathrooms, 'personalizada');
                        }}
                        className={`p-2 text-left text-xs rounded-lg font-medium border transition-all cursor-pointer ${
                          organizationFormat === 'personalizada'
                            ? 'bg-[#EEF3ED] border-[#5A7D6C] text-[#243029] ring-1 ring-[#5A7D6C]'
                            : 'bg-white text-[#3D4C42] border-[#DFE5DA] hover:bg-[#F7F8F4]'
                        }`}
                      >
                        <strong className="block font-bold">Personalizada</strong>
                        <span className="text-[10px] text-[#6B7B70] block">Adaptada às rotinas do cliente</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOrganizationFormat('padrao_empresa');
                          handleRecalculateSuggestedPrice(serviceType, rooms, bathrooms, 'padrao_empresa');
                        }}
                        className={`p-2 text-left text-xs rounded-lg font-medium border transition-all cursor-pointer ${
                          organizationFormat === 'padrao_empresa'
                            ? 'bg-[#EEF3ED] border-[#5A7D6C] text-[#243029] ring-1 ring-[#5A7D6C]'
                            : 'bg-white text-[#3D4C42] border-[#DFE5DA] hover:bg-[#F7F8F4]'
                        }`}
                      >
                        <strong className="block font-bold">Padrão 5S</strong>
                        <span className="text-[10px] text-[#6B7B70] block">Metodologia corporativa padrão</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Specific custom notes */}
                {organizationFormat === 'personalizada' && (
                  <div className="mt-3 p-3 bg-[#EEF3ED] rounded-xl border border-[#D4E0D1] space-y-2">
                    <label className="block text-xs font-semibold text-[#243029]">
                      Preferências e Detalhes da Organização Personalizada:
                    </label>
                    <textarea
                      rows={2}
                      value={customOrgNotes}
                      onChange={(e) => setCustomOrgNotes(e.target.value)}
                      placeholder="Ex: Cliente prefere cabides de veludo, dobradura em colmeias nas gavetas de camisetas, e setorização por cor no closet master..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#D4E0D1] bg-white focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                    />
                  </div>
                )}
              </div>

              {/* 4. Property Specs and Schedule */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5A7D6C] mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  4. Detalhes do Imóvel & Agendamento
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Quartos / Cômodos
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={rooms}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setRooms(val);
                        handleRecalculateSuggestedPrice(serviceType, val, bathrooms, organizationFormat);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] text-[#243029]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Banheiros
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={bathrooms}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setBathrooms(val);
                        handleRecalculateSuggestedPrice(serviceType, rooms, val, organizationFormat);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] text-[#243029]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Área Aprox (m²)
                    </label>
                    <input
                      type="number"
                      min={20}
                      value={approxAreaM2}
                      onChange={(e) => setApproxAreaM2(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] text-[#243029]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Valor do Serviço (R$) *
                    </label>
                    <input
                      type="number"
                      step="10"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] font-bold text-[#243029]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Data Agendada *
                    </label>
                    <input
                      type="date"
                      required
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] text-[#243029]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Horário de Início *
                    </label>
                    <input
                      type="time"
                      required
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] text-[#243029]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Duração Estimada (horas)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={estimatedDurationHours}
                      onChange={(e) => setEstimatedDurationHours(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] text-[#243029]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-5">
                    <input
                      id="checkbox-pets"
                      type="checkbox"
                      checked={hasPets}
                      onChange={(e) => setHasPets(e.target.checked)}
                      className="w-4 h-4 text-[#5A7D6C] rounded border-[#DFE5DA] focus:ring-[#5A7D6C]"
                    />
                    <label htmlFor="checkbox-pets" className="text-xs font-semibold text-[#243029] cursor-pointer">
                      Possui Pets no Imóvel
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Restrições / Alergia a Produtos
                    </label>
                    <input
                      type="text"
                      value={allergyAlerts}
                      onChange={(e) => setAllergyAlerts(e.target.value)}
                      placeholder="Ex: Morador tem rinite, usar apenas produto neutro sem fragrância"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] text-[#243029]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Observações Adicionais para a Equipe
                    </label>
                    <input
                      type="text"
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      placeholder="Ex: Chave na portaria, interfone 142..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] text-[#243029]"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EEF3ED]">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#6B7B70] hover:text-[#243029] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-submit-create-request"
                  type="submit"
                  className="px-5 py-2.5 bg-[#5A7D6C] hover:bg-[#4a695b] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Salvar e Criar Solicitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Validation Modal */}
      {validatingReq && (
        <SecurityCodeValidationModal
          isOpen={!!validatingReq}
          onClose={() => setValidatingReq(null)}
          request={validatingReq}
          staffName={validatingReq.assignedStaffName || 'Colaborador da Equipe'}
          staffId={validatingReq.assignedStaffId || 'colab-1'}
          onSuccess={() => {
            setValidatingReq(null);
            setActiveTab('alocacao');
          }}
        />
      )}

      {/* Customer App Modal */}
      {customerAppReqId && (
        <CustomerAppModal
          isOpen={!!customerAppReqId}
          onClose={() => setCustomerAppReqId(null)}
          initialRequestId={customerAppReqId}
        />
      )}
    </div>
  );
};
