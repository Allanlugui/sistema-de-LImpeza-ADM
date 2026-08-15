import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Client, ClientOperationalEvaluation, CustomerRequest, RequestStatus } from '../types';
import { 
  formatCPF, 
  isValidCPF, 
  formatRG, 
  isValidRG, 
  formatPhone, 
  isValidEmail, 
  formatCEP, 
  isValidCEP,
  formatCurrency,
  formatDate
} from '../utils/formatters';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  ShieldCheck, 
  ShieldAlert, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Star, 
  KeyRound, 
  History, 
  Building2, 
  MessageSquare,
  Sparkles,
  Calendar,
  X,
  AlertTriangle,
  ArrowRight,
  Filter,
  UserPlus
} from 'lucide-react';

interface ClientFormData {
  name: string;
  documentType: 'CPF' | 'RG';
  documentNumber: string;
  email: string;
  phone: string;
  whatsapp: string;
  preferredContact: 'whatsapp' | 'telefone' | 'email';
  address: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    referencePoint: string;
  };
  notes: string;
  status: 'ativo' | 'inativo';
}

const INITIAL_FORM_DATA: ClientFormData = {
  name: '',
  documentType: 'CPF',
  documentNumber: '',
  email: '',
  phone: '',
  whatsapp: '',
  preferredContact: 'whatsapp',
  address: {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '',
    referencePoint: '',
  },
  notes: '',
  status: 'ativo',
};

export const CustomersView: React.FC = () => {
  const { 
    clients, 
    addClient, 
    updateClient, 
    deleteClient, 
    addClientOperationalNote,
    requests,
    setActiveTab,
    addToast
  } = useApp();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'services'>('recent');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // History & Details Modal
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<Client | null>(null);

  // New Operational Note Modal State
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [newNoteData, setNewNoteData] = useState({
    rating: 5,
    behaviorEvaluation: 'excelente' as 'excelente' | 'bom' | 'neutro' | 'dificil' | 'critico',
    propertyCondition: 'adequado' as 'impecavel' | 'adequado' | 'desafiador' | 'precario',
    comment: '',
    tags: 'Pontual, Local Organizado',
    staffName: 'Administração Central',
  });

  // Client Deletion Confirmation Modal
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleteWarningMsg, setDeleteWarningMsg] = useState<string | null>(null);

  // Filtered and Sorted Clients
  const filteredClients = useMemo(() => {
    return clients
      .filter(client => {
        const query = searchTerm.toLowerCase().trim();
        const matchesSearch = 
          !query ||
          client.name.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query) ||
          client.phone.includes(query) ||
          client.documentNumber.includes(query) ||
          client.address.neighborhood.toLowerCase().includes(query) ||
          client.address.city.toLowerCase().includes(query);

        const matchesStatus = statusFilter === 'todos' || client.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'services') {
          const aServices = requests.filter(r => r.clientId === a.id || r.clientEmail.toLowerCase() === a.email.toLowerCase()).length;
          const bServices = requests.filter(r => r.clientId === b.id || r.clientEmail.toLowerCase() === b.email.toLowerCase()).length;
          return bServices - aServices;
        }
        // Recent default
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [clients, searchTerm, statusFilter, sortBy, requests]);

  // Handle Form Open (New or Edit)
  const handleOpenForm = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        documentType: client.documentType || 'CPF',
        documentNumber: client.documentNumber || '',
        email: client.email,
        phone: client.phone,
        whatsapp: client.whatsapp || client.phone,
        preferredContact: client.preferredContact || 'whatsapp',
        address: {
          street: client.address.street || '',
          number: client.address.number || '',
          complement: client.address.complement || '',
          neighborhood: client.address.neighborhood || '',
          city: client.address.city || 'São Paulo',
          state: client.address.state || 'SP',
          zipCode: client.address.zipCode || '',
          referencePoint: client.address.referencePoint || '',
        },
        notes: client.notes || '',
        status: client.status,
      });
    } else {
      setEditingClient(null);
      setFormData(INITIAL_FORM_DATA);
    }
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome completo é obrigatório.';
    } else if (formData.name.trim().split(' ').length < 2) {
      errors.name = 'Informe o nome e sobrenome completo.';
    }

    if (!formData.documentNumber.trim()) {
      errors.documentNumber = `${formData.documentType} é obrigatório.`;
    } else if (formData.documentType === 'CPF' && !isValidCPF(formData.documentNumber)) {
      errors.documentNumber = 'CPF inválido. Verifique os 11 dígitos.';
    } else if (formData.documentType === 'RG' && !isValidRG(formData.documentNumber)) {
      errors.documentNumber = 'RG inválido (mínimo 7 dígitos).';
    }

    if (!formData.email.trim()) {
      errors.email = 'E-mail é obrigatório para notificações e faturas.';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Formato de e-mail inválido.';
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone) {
      errors.phone = 'Telefone de contato é obrigatório.';
    } else if (cleanPhone.length < 10) {
      errors.phone = 'Telefone inválido com DDD.';
    }

    if (!formData.address.zipCode.trim()) {
      errors.zipCode = 'CEP é obrigatório.';
    } else if (!isValidCEP(formData.address.zipCode)) {
      errors.zipCode = 'CEP deve conter 8 dígitos válidos.';
    }

    if (!formData.address.street.trim()) {
      errors.street = 'Logradouro/Rua é obrigatório.';
    }

    if (!formData.address.number.trim()) {
      errors.number = 'Número do imóvel é obrigatório.';
    }

    if (!formData.address.neighborhood.trim()) {
      errors.neighborhood = 'Bairro é obrigatório.';
    }

    if (!formData.address.city.trim()) {
      errors.city = 'Cidade é obrigatória.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submit
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast({
        type: 'error',
        title: 'Dados Incompletos ou Inválidos',
        message: 'Por favor, preencha todos os campos cadastrais obrigatórios destacados.'
      });
      return;
    }

    if (editingClient) {
      updateClient(editingClient.id, {
        name: formData.name.trim(),
        documentType: formData.documentType,
        documentNumber: formData.documentNumber.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        whatsapp: formData.whatsapp.trim() || formData.phone.trim(),
        preferredContact: formData.preferredContact,
        address: {
          ...formData.address,
          street: formData.address.street.trim(),
          number: formData.address.number.trim(),
          neighborhood: formData.address.neighborhood.trim(),
          city: formData.address.city.trim(),
          zipCode: formData.address.zipCode.trim(),
        },
        notes: formData.notes.trim(),
        status: formData.status,
      });
    } else {
      addClient({
        name: formData.name.trim(),
        documentType: formData.documentType,
        documentNumber: formData.documentNumber.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        whatsapp: formData.whatsapp.trim() || formData.phone.trim(),
        preferredContact: formData.preferredContact,
        address: {
          ...formData.address,
          street: formData.address.street.trim(),
          number: formData.address.number.trim(),
          neighborhood: formData.address.neighborhood.trim(),
          city: formData.address.city.trim(),
          zipCode: formData.address.zipCode.trim(),
        },
        notes: formData.notes.trim(),
        status: formData.status,
      });
    }

    setIsFormModalOpen(false);
  };

  // Handle Delete Click
  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setDeleteWarningMsg(null);

    // Check if client has active requests
    const activeStatuses: RequestStatus[] = ['pendente', 'alocado', 'a_caminho', 'em_execucao', 'pausado'];
    const activeRequests = requests.filter(r => 
      (r.clientId === client.id || r.clientEmail.toLowerCase() === client.email.toLowerCase()) && 
      activeStatuses.includes(r.status)
    );

    if (activeRequests.length > 0) {
      const activeCodes = activeRequests.map(r => r.code).join(', ');
      setDeleteWarningMsg(`Bloqueio de Segurança: O cliente possui ${activeRequests.length} ordem(ns) de serviço em andamento (${activeCodes}). Conclua ou cancele os serviços antes de tentar excluir.`);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!clientToDelete) return;
    const res = deleteClient(clientToDelete.id);
    if (res.success) {
      setClientToDelete(null);
      if (selectedClientForDetails?.id === clientToDelete.id) {
        setSelectedClientForDetails(null);
      }
    }
  };

  // Handle Add Operational Note
  const handleSaveOperationalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForDetails) return;
    if (!newNoteData.comment.trim()) {
      addToast({
        type: 'error',
        title: 'Comentário Obrigatório',
        message: 'Descreva a observação técnica ou comportamental da equipe.'
      });
      return;
    }

    const tagList = newNoteData.tags.split(',').map(t => t.trim()).filter(Boolean);

    addClientOperationalNote(selectedClientForDetails.id, {
      rating: Number(newNoteData.rating),
      behaviorEvaluation: newNoteData.behaviorEvaluation,
      propertyCondition: newNoteData.propertyCondition,
      comment: newNoteData.comment.trim(),
      tags: tagList,
      staffName: newNoteData.staffName.trim() || 'Equipe de Campo',
    });

    // Update local modal state
    const updatedClient = clients.find(c => c.id === selectedClientForDetails.id);
    if (updatedClient) {
      setSelectedClientForDetails(updatedClient);
    }

    setIsAddNoteModalOpen(false);
    setNewNoteData({
      rating: 5,
      behaviorEvaluation: 'excelente',
      propertyCondition: 'adequado',
      comment: '',
      tags: 'Pontual, Local Organizado',
      staffName: 'Administração Central',
    });
  };

  // Quick stats
  const totalActiveClients = clients.filter(c => c.status === 'ativo').length;
  const totalServicesExecuted = requests.filter(r => r.status === 'concluido').length;

  return (
    <div id="customers-view-container" className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#DFE5DA] shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#EBF1ED] flex items-center justify-center text-[#5A7D6C]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#243029]">Gestão de Clientes</h1>
              <p className="text-sm text-[#64736B]">
                Base cadastral completa com validação rigorosa de CPF/RG, endereços detalhados e histórico de ordens de serviço.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-add-new-client"
            type="button"
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#5A7D6C] text-white rounded-xl text-sm font-semibold hover:bg-[#476356] transition-all shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#DFE5DA] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#EBF1ED] text-[#446153] flex items-center justify-center font-bold">
            {clients.length}
          </div>
          <div>
            <p className="text-xs text-[#64736B] font-medium">Total de Clientes</p>
            <p className="text-base font-bold text-[#243029]">{totalActiveClients} Ativos</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#DFE5DA] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#64736B] font-medium">Serviços Executados</p>
            <p className="text-base font-bold text-[#243029]">{totalServicesExecuted} Ordens Finalizadas</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#DFE5DA] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#64736B] font-medium">Segurança de Acesso</p>
            <p className="text-base font-bold text-[#243029]">Código 4 Dígitos Ativo</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#DFE5DA] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#64736B] font-medium">Proteção Anti-Exclusão</p>
            <p className="text-base font-bold text-[#243029]">Trava de Serviços Ativos</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-[#DFE5DA] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#86958E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-clients"
            type="text"
            placeholder="Buscar por nome, CPF/RG, telefone, e-mail ou bairro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-[#F4F6F1] border border-[#DFE5DA] rounded-xl text-[#243029] placeholder-[#86958E] focus:outline-none focus:border-[#5A7D6C] focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto">
          {/* Status Filter */}
          <div className="flex items-center bg-[#F4F6F1] p-1 rounded-xl border border-[#DFE5DA] shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'todos' ? 'bg-white text-[#243029] shadow-2xs' : 'text-[#64736B] hover:text-[#243029]'
              }`}
            >
              Todos ({clients.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ativo')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'ativo' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-[#64736B] hover:text-[#243029]'
              }`}
            >
              Ativos ({clients.filter(c => c.status === 'ativo').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inativo')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'inativo' ? 'bg-white text-slate-700 shadow-2xs' : 'text-[#64736B] hover:text-[#243029]'
              }`}
            >
              Inativos ({clients.filter(c => c.status === 'inativo').length})
            </button>
          </div>

          {/* Sort selector */}
          <select
            id="select-sort-clients"
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-white border border-[#DFE5DA] rounded-xl text-[#243029] focus:outline-none focus:border-[#5A7D6C]"
          >
            <option value="recent">Mais Recentes</option>
            <option value="name">Ordem Alfabética (A-Z)</option>
            <option value="services">Mais Serviços Solicitados</option>
          </select>
        </div>
      </div>

      {/* Clients Table / Cards */}
      <div className="bg-white rounded-2xl border border-[#DFE5DA] shadow-xs overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F4F6F1] flex items-center justify-center text-[#86958E] mb-3">
              <UserCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#243029]">Nenhum cliente encontrado</h3>
            <p className="text-sm text-[#64736B] max-w-md mx-auto mt-1 mb-4">
              Não encontramos nenhum registro correspondente aos filtros de busca atuais.
            </p>
            <button
              type="button"
              onClick={() => handleOpenForm()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#5A7D6C] text-white rounded-xl text-sm font-semibold hover:bg-[#476356]"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Primeiro Cliente
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F6F1] border-b border-[#DFE5DA] text-[11px] font-bold text-[#64736B] uppercase tracking-wider">
                  <th className="py-3 px-4">Cliente & Documento</th>
                  <th className="py-3 px-4">Endereço Completo</th>
                  <th className="py-3 px-4">Contatos</th>
                  <th className="py-3 px-4">Histórico de Serviços</th>
                  <th className="py-3 px-4">Status & Avaliação</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE5DA] text-sm">
                {filteredClients.map((client) => {
                  const clientRequests = requests.filter(r => r.clientId === client.id || r.clientEmail.toLowerCase() === client.email.toLowerCase());
                  const activeRequestsCount = clientRequests.filter(r => ['pendente', 'alocado', 'a_caminho', 'em_execucao', 'pausado'].includes(r.status)).length;
                  const operationalNotesCount = client.operationalNotes?.length || 0;

                  return (
                    <tr key={client.id} className="hover:bg-[#FAFBF9] transition-colors">
                      {/* Name and Doc */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#243029] flex items-center gap-2">
                          <span>{client.name}</span>
                          {client.status === 'ativo' ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Cliente Ativo" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-400" title="Cliente Inativo" />
                          )}
                        </div>
                        <div className="text-xs text-[#64736B] flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 bg-[#EBF1ED] text-[#446153] rounded font-mono text-[10px] font-bold">
                            {client.documentType || 'CPF'}: {client.documentNumber ? (client.documentType === 'RG' ? formatRG(client.documentNumber) : formatCPF(client.documentNumber)) : 'Não inf.'}
                          </span>
                        </div>
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-xs font-medium text-[#243029] flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#5A7D6C] shrink-0 mt-0.5" />
                          <span>
                            {client.address.street}, {client.address.number}
                            {client.address.complement ? ` - ${client.address.complement}` : ''}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#64736B] pl-5">
                          {client.address.neighborhood} - {client.address.city}/{client.address.state} • CEP {formatCEP(client.address.zipCode)}
                        </div>
                        {client.address.referencePoint && (
                          <div className="text-[10px] text-[#86958E] italic pl-5 mt-0.5">
                            Ref: {client.address.referencePoint}
                          </div>
                        )}
                      </td>

                      {/* Contacts */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-[#243029] flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#5A7D6C]" />
                          <span>{formatPhone(client.phone)}</span>
                        </div>
                        <div className="text-xs text-[#64736B] flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-[#86958E]" />
                          <span className="truncate max-w-[150px]">{client.email}</span>
                        </div>
                      </td>

                      {/* History summary */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-[#EBF1ED] text-[#446153] rounded-lg text-xs font-bold">
                            {clientRequests.length} pedido(s)
                          </span>
                          {activeRequestsCount > 0 && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold animate-pulse flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {activeRequestsCount} em andamento
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#64736B] mt-1">
                          {operationalNotesCount > 0 ? (
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                              <Star className="w-3 h-3 fill-emerald-600" />
                              {operationalNotesCount} avaliação(ões) de equipe
                            </span>
                          ) : (
                            <span className="text-[#86958E]">Sem notas técnicas</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                          client.status === 'ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {client.status === 'ativo' ? 'Cadastro Ativo' : 'Cadastro Inativo'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-view-client-${client.id}`}
                            type="button"
                            onClick={() => setSelectedClientForDetails(client)}
                            title="Ver Histórico Completo, Códigos de Segurança e Avaliações"
                            className="p-1.5 text-[#5A7D6C] hover:bg-[#EBF1ED] rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-edit-client-${client.id}`}
                            type="button"
                            onClick={() => handleOpenForm(client)}
                            title="Editar Dados Cadastrais"
                            className="p-1.5 text-[#64736B] hover:bg-[#F4F6F1] rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-delete-client-${client.id}`}
                            type="button"
                            onClick={() => handleDeleteClick(client)}
                            title="Excluir Cliente (com trava de segurança)"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL DE CADASTRO / EDIÇÃO DE CLIENTE ================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-[#DFE5DA] shadow-xl">
            <div className="p-5 border-b border-[#DFE5DA] flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EBF1ED] text-[#5A7D6C] flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#243029]">
                    {editingClient ? 'Editar Cadastro de Cliente' : 'Cadastrar Novo Cliente'}
                  </h3>
                  <p className="text-xs text-[#64736B]">
                    Preencha todos os dados obrigatórios e verifique a integridade do CPF/RG e CEP.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-[#86958E] hover:text-[#243029] hover:bg-[#F4F6F1] rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-5">
              {/* Personal Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#5A7D6C] uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  Dados Pessoais & Documentação
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Nome Completo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-client-name"
                      type="text"
                      placeholder="Ex: Mariana Albuquerque Santos"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-3.5 py-2 text-sm bg-[#F4F6F1] border rounded-xl focus:outline-none focus:bg-white transition-all ${
                        formErrors.name ? 'border-rose-500' : 'border-[#DFE5DA] focus:border-[#5A7D6C]'
                      }`}
                    />
                    {formErrors.name && <p className="text-[11px] text-rose-600 mt-1">{formErrors.name}</p>}
                  </div>

                  {/* Doc Type */}
                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Tipo de Documento <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="select-client-doc-type"
                      value={formData.documentType}
                      onChange={(e: any) => {
                        const newType = e.target.value;
                        setFormData({ ...formData, documentType: newType, documentNumber: '' });
                      }}
                      className="w-full px-3.5 py-2 text-sm bg-[#F4F6F1] border border-[#DFE5DA] rounded-xl focus:outline-none focus:border-[#5A7D6C]"
                    >
                      <option value="CPF">CPF (Pessoa Física)</option>
                      <option value="RG">RG (Registro Geral)</option>
                    </select>
                  </div>

                  {/* Doc Number */}
                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Número do {formData.documentType} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-client-doc-number"
                      type="text"
                      placeholder={formData.documentType === 'CPF' ? '000.000.000-00' : '00.000.000-0'}
                      value={formData.documentNumber}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const formatted = formData.documentType === 'CPF' ? formatCPF(raw) : formatRG(raw);
                        setFormData({ ...formData, documentNumber: formatted });
                      }}
                      className={`w-full px-3.5 py-2 text-sm bg-[#F4F6F1] border rounded-xl focus:outline-none focus:bg-white font-mono transition-all ${
                        formErrors.documentNumber ? 'border-rose-500' : 'border-[#DFE5DA] focus:border-[#5A7D6C]'
                      }`}
                    />
                    {formErrors.documentNumber && (
                      <p className="text-[11px] text-rose-600 mt-1">{formErrors.documentNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className="space-y-3 pt-3 border-t border-[#DFE5DA]">
                <h4 className="text-xs font-bold text-[#5A7D6C] uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Contatos & Comunicação
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Telefone Principal <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-client-phone"
                      type="text"
                      placeholder="(11) 98888-7777"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                      className={`w-full px-3.5 py-2 text-sm bg-[#F4F6F1] border rounded-xl focus:outline-none focus:bg-white transition-all ${
                        formErrors.phone ? 'border-rose-500' : 'border-[#DFE5DA] focus:border-[#5A7D6C]'
                      }`}
                    />
                    {formErrors.phone && <p className="text-[11px] text-rose-600 mt-1">{formErrors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      WhatsApp (opcional)
                    </label>
                    <input
                      id="input-client-whatsapp"
                      type="text"
                      placeholder="(11) 98888-7777"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: formatPhone(e.target.value) })}
                      className="w-full px-3.5 py-2 text-sm bg-[#F4F6F1] border border-[#DFE5DA] rounded-xl focus:outline-none focus:border-[#5A7D6C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Canal Preferencial
                    </label>
                    <select
                      id="select-client-pref-contact"
                      value={formData.preferredContact}
                      onChange={(e: any) => setFormData({ ...formData, preferredContact: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-[#F4F6F1] border border-[#DFE5DA] rounded-xl focus:outline-none focus:border-[#5A7D6C]"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="telefone">Ligação Telefônica</option>
                      <option value="email">E-mail</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      E-mail de Notificações / Cobrança <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-client-email"
                      type="email"
                      placeholder="cliente@exemplo.com.br"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-3.5 py-2 text-sm bg-[#F4F6F1] border rounded-xl focus:outline-none focus:bg-white transition-all ${
                        formErrors.email ? 'border-rose-500' : 'border-[#DFE5DA] focus:border-[#5A7D6C]'
                      }`}
                    />
                    {formErrors.email && <p className="text-[11px] text-rose-600 mt-1">{formErrors.email}</p>}
                  </div>
                </div>
              </div>

              {/* Detailed Address */}
              <div className="space-y-3 pt-3 border-t border-[#DFE5DA]">
                <h4 className="text-xs font-bold text-[#5A7D6C] uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Endereço Completo & Ponto de Referência
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      CEP <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-client-cep"
                      type="text"
                      placeholder="01310-100"
                      value={formData.address.zipCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, zipCode: formatCEP(e.target.value) }
                      })}
                      className={`w-full px-3.5 py-2 text-sm bg-[#F4F6F1] border rounded-xl focus:outline-none focus:bg-white font-mono transition-all ${
                        formErrors.zipCode ? 'border-rose-500' : 'border-[#DFE5DA] focus:border-[#5A7D6C]'
                      }`}
                    />
                    {formErrors.zipCode && <p className="text-[11px] text-rose-600 mt-1">{formErrors.zipCode}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Logradouro (Rua, Av, Travessa) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-client-street"
                      type="text"
                      placeholder="Ex: Av. Paulista"
                      value={formData.address.street}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value }
                      })}
                      className={`w-full px-3.5 py-2 text-sm bg-[#F4F6F1] border rounded-xl focus:outline-none focus:bg-white transition-all ${
                        formErrors.street ? 'border-rose-500' : 'border-[#DFE5DA] focus:border-[#5A7D6C]'
                      }`}
                    />
                    {formErrors.street && <p className="text-[11px] text-rose-600 mt-1">{formErrors.street}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Número <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-client-number"
                      type="text"
                      placeholder="Ex: 1578"
                      value={formData.address.number}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, number: e.target.value }
                      })}
                      className={`w-full px-3.5 py-2 text-sm bg-[#F4F6F1] border rounded-xl focus:outline-none focus:bg-white transition-all ${
                        formErrors.number ? 'border-rose-500' : 'border-[#DFE5DA] focus:border-[#5A7D6C]'
                      }`}
                    />
                    {formErrors.number && <p className="text-[11px] text-rose-600 mt-1">{formErrors.number}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Complemento (Apto, Bloco, Casa)
                    </label>
                    <input
                      id="input-client-complement"
                      type="text"
                      placeholder="Ex: Apto 104 Bloco B"
                      value={formData.address.complement}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, complement: e.target.value }
                      })}
                      className="w-full px-3.5 py-2 text-sm bg-[#F4F6F1] border border-[#DFE5DA] rounded-xl focus:outline-none focus:border-[#5A7D6C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Bairro <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-client-neighborhood"
                      type="text"
                      placeholder="Ex: Bela Vista"
                      value={formData.address.neighborhood}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, neighborhood: e.target.value }
                      })}
                      className={`w-full px-3.5 py-2 text-sm bg-[#F4F6F1] border rounded-xl focus:outline-none focus:bg-white transition-all ${
                        formErrors.neighborhood ? 'border-rose-500' : 'border-[#DFE5DA] focus:border-[#5A7D6C]'
                      }`}
                    />
                    {formErrors.neighborhood && (
                      <p className="text-[11px] text-rose-600 mt-1">{formErrors.neighborhood}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Cidade <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-client-city"
                      type="text"
                      placeholder="São Paulo"
                      value={formData.address.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value }
                      })}
                      className="w-full px-3.5 py-2 text-sm bg-[#F4F6F1] border border-[#DFE5DA] rounded-xl focus:outline-none focus:border-[#5A7D6C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Estado (UF)
                    </label>
                    <input
                      id="input-client-state"
                      type="text"
                      placeholder="SP"
                      maxLength={2}
                      value={formData.address.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value.toUpperCase() }
                      })}
                      className="w-full px-3.5 py-2 text-sm bg-[#F4F6F1] border border-[#DFE5DA] rounded-xl focus:outline-none focus:border-[#5A7D6C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Status do Cadastro
                    </label>
                    <select
                      id="select-client-status"
                      value={formData.status}
                      onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-[#F4F6F1] border border-[#DFE5DA] rounded-xl focus:outline-none focus:border-[#5A7D6C]"
                    >
                      <option value="ativo">Ativo (Permitido solicitar)</option>
                      <option value="inativo">Inativo (Bloqueado)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-[#243029] mb-1">
                      Ponto de Referência (Crucial para equipe de campo)
                    </label>
                    <input
                      id="input-client-ref-point"
                      type="text"
                      placeholder="Ex: Próximo à estação Trianon-Masp, portaria com cancela preta ao lado da padaria"
                      value={formData.address.referencePoint}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, referencePoint: e.target.value }
                      })}
                      className="w-full px-3.5 py-2 text-sm bg-[#F4F6F1] border border-[#DFE5DA] rounded-xl focus:outline-none focus:border-[#5A7D6C]"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2 pt-3 border-t border-[#DFE5DA]">
                <label className="block text-xs font-semibold text-[#243029]">
                  Observações Internas Administrativas
                </label>
                <textarea
                  id="textarea-client-notes"
                  rows={2}
                  placeholder="Informações adicionais, particularidades de acesso, restrições com animais de estimação..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-[#F4F6F1] border border-[#DFE5DA] rounded-xl focus:outline-none focus:border-[#5A7D6C]"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DFE5DA]">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-[#64736B] hover:text-[#243029] hover:bg-[#F4F6F1] rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-client"
                  type="submit"
                  className="px-5 py-2.5 bg-[#5A7D6C] text-white rounded-xl text-sm font-semibold hover:bg-[#476356] transition-all shadow-xs"
                >
                  {editingClient ? 'Salvar Alterações' : 'Concluir Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE HISTÓRICO & AVALIAÇÕES DO CLIENTE ================= */}
      {selectedClientForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-[#DFE5DA] shadow-xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#DFE5DA] flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#5A7D6C] text-white flex items-center justify-center font-bold text-lg">
                  {selectedClientForDetails.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#243029] flex items-center gap-2">
                    {selectedClientForDetails.name}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedClientForDetails.status === 'ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {selectedClientForDetails.status.toUpperCase()}
                    </span>
                  </h3>
                  <p className="text-xs text-[#64736B]">
                    {selectedClientForDetails.documentType || 'CPF'}: {selectedClientForDetails.documentNumber || 'Não informado'} • Cliente desde {formatDate(selectedClientForDetails.createdAt)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClientForDetails(null)}
                className="p-1.5 text-[#86958E] hover:text-[#243029] hover:bg-[#F4F6F1] rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact & Address Card */}
              <div className="bg-[#FAFBF9] rounded-xl p-4 border border-[#DFE5DA] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-bold text-[#5A7D6C] uppercase tracking-wider text-[10px] mb-1">Contatos Oficiais</p>
                  <p className="text-[#243029] font-medium flex items-center gap-1.5 mt-1">
                    <Phone className="w-3.5 h-3.5 text-[#5A7D6C]" /> {formatPhone(selectedClientForDetails.phone)}
                  </p>
                  {selectedClientForDetails.whatsapp && (
                    <p className="text-[#243029] font-medium flex items-center gap-1.5 mt-1">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> {formatPhone(selectedClientForDetails.whatsapp)} (WhatsApp)
                    </p>
                  )}
                  <p className="text-[#243029] font-medium flex items-center gap-1.5 mt-1">
                    <Mail className="w-3.5 h-3.5 text-[#86958E]" /> {selectedClientForDetails.email}
                  </p>
                </div>

                <div>
                  <p className="font-bold text-[#5A7D6C] uppercase tracking-wider text-[10px] mb-1">Localização do Atendimento</p>
                  <p className="text-[#243029] font-medium flex items-start gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#5A7D6C] shrink-0 mt-0.5" />
                    <span>
                      {selectedClientForDetails.address.street}, {selectedClientForDetails.address.number}
                      {selectedClientForDetails.address.complement ? ` (${selectedClientForDetails.address.complement})` : ''}
                      <br />
                      {selectedClientForDetails.address.neighborhood} - {selectedClientForDetails.address.city}/{selectedClientForDetails.address.state} • CEP {formatCEP(selectedClientForDetails.address.zipCode)}
                    </span>
                  </p>
                  {selectedClientForDetails.address.referencePoint && (
                    <p className="text-[11px] text-[#64736B] italic mt-1 bg-white p-1.5 rounded border border-[#DFE5DA]">
                      <span className="font-semibold text-[#243029]">Ref:</span> {selectedClientForDetails.address.referencePoint}
                    </p>
                  )}
                </div>
              </div>

              {/* 1. Requests and Service History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#243029] uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-[#5A7D6C]" />
                    Histórico de Solicitações & Códigos de Confirmação
                  </h4>
                  <span className="text-xs font-medium text-[#64736B]">
                    {requests.filter(r => r.clientId === selectedClientForDetails.id || r.clientEmail.toLowerCase() === selectedClientForDetails.email.toLowerCase()).length} serviço(s)
                  </span>
                </div>

                {(() => {
                  const clientReqs = requests.filter(r => 
                    r.clientId === selectedClientForDetails.id || 
                    r.clientEmail.toLowerCase() === selectedClientForDetails.email.toLowerCase()
                  );

                  if (clientReqs.length === 0) {
                    return (
                      <div className="p-6 bg-[#F4F6F1] rounded-xl text-center text-xs text-[#64736B]">
                        Nenhuma ordem de serviço registrada para este cliente até o momento.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2.5">
                      {clientReqs.map(req => {
                        const statusColors: Record<RequestStatus, string> = {
                          pendente: 'bg-amber-100 text-amber-900 border-amber-200',
                          alocado: 'bg-blue-100 text-blue-900 border-blue-200',
                          a_caminho: 'bg-indigo-100 text-indigo-900 border-indigo-200',
                          em_execucao: 'bg-emerald-100 text-emerald-900 border-emerald-300 animate-pulse',
                          pausado: 'bg-slate-100 text-slate-800 border-slate-200',
                          concluido: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                          cancelado: 'bg-rose-50 text-rose-800 border-rose-200',
                        };

                        return (
                          <div 
                            key={req.id} 
                            className="bg-white rounded-xl p-3.5 border border-[#DFE5DA] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#243029] font-mono">{req.code}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[req.status]}`}>
                                  {req.status.replace('_', ' ').toUpperCase()}
                                </span>
                                <span className="text-[11px] text-[#64736B]">
                                  {formatDate(req.scheduledDate)} ({req.scheduledPeriod})
                                </span>
                              </div>

                              <p className="text-[#243029] font-medium mt-1">
                                {req.serviceType === 'ambos' ? 'Limpeza Completa + Organização' : req.serviceType.toUpperCase()}
                                {req.organizationFormat && ` • Formato: ${req.organizationFormat.toUpperCase()}`}
                              </p>

                              <div className="text-[11px] text-[#64736B] flex items-center gap-2 mt-1">
                                <span>Profissional: <strong className="text-[#243029]">{req.assignedStaffName || 'Pendente de alocação'}</strong></span>
                                <span>•</span>
                                <span>Valor: <strong className="text-[#243029]">{formatCurrency(req.estimatedValue)}</strong></span>
                              </div>
                            </div>

                            {/* Security Confirmation Code for this service */}
                            <div className="bg-[#EBF1ED] border border-[#5A7D6C]/30 rounded-xl px-3 py-2 text-center shrink-0">
                              <span className="text-[9px] font-bold text-[#5A7D6C] uppercase block tracking-wider">
                                Código de Segurança
                              </span>
                              <span className="font-mono text-base font-black text-[#243029] tracking-widest">
                                {req.confirmationCode || '----'}
                              </span>
                              {req.codeValidatedAt && (
                                <span className="text-[9px] text-emerald-700 block font-semibold">
                                  ✓ Validado no local
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* 2. Operational Notes & Staff Evaluations */}
              <div className="space-y-3 pt-3 border-t border-[#DFE5DA]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#243029] uppercase tracking-wider flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      Avaliações da Equipe Operacional (Comportamento & Local)
                    </h4>
                    <p className="text-[11px] text-[#64736B]">
                      Notas técnicas registradas pelos profissionais de campo para instruir futuras escalas.
                    </p>
                  </div>
                  <button
                    id="btn-add-operational-note"
                    type="button"
                    onClick={() => setIsAddNoteModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EBF1ED] text-[#446153] hover:bg-[#5A7D6C] hover:text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nova Avaliação
                  </button>
                </div>

                {(!selectedClientForDetails.operationalNotes || selectedClientForDetails.operationalNotes.length === 0) ? (
                  <div className="p-5 bg-[#FAFBF9] rounded-xl border border-dashed border-[#DFE5DA] text-center text-xs text-[#64736B]">
                    Nenhuma avaliação operacional registrada pela equipe de campo ainda.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedClientForDetails.operationalNotes.map((note) => {
                      const behaviorColors = {
                        excelente: 'bg-emerald-100 text-emerald-800',
                        bom: 'bg-blue-100 text-blue-800',
                        neutro: 'bg-slate-100 text-slate-800',
                        dificil: 'bg-amber-100 text-amber-800',
                        critico: 'bg-rose-100 text-rose-800',
                      };

                      const propertyColors = {
                        impecavel: 'bg-emerald-100 text-emerald-800',
                        adequado: 'bg-blue-100 text-blue-800',
                        desafiador: 'bg-amber-100 text-amber-800',
                        precario: 'bg-rose-100 text-rose-800',
                      };

                      const noteRating = note.rating || note.clientBehaviorRating || 5;
                      const behavior = note.behaviorEvaluation || 'bom';
                      const condition = note.propertyCondition || 'adequado';
                      const author = note.staffName || note.authorName || 'Equipe';

                      return (
                        <div key={note.id} className="bg-[#FAFBF9] rounded-xl p-3.5 border border-[#DFE5DA] text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex text-amber-500">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-3.5 h-3.5 ${i < noteRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} 
                                  />
                                ))}
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${behaviorColors[behavior] || 'bg-slate-100 text-slate-800'}`}>
                                Cliente: {behavior.toUpperCase()}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${propertyColors[condition] || 'bg-slate-100 text-slate-800'}`}>
                                Imóvel: {condition.toUpperCase()}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#86958E]">
                              {formatDate(note.date)} • Por {author}
                            </span>
                          </div>

                          <p className="text-[#243029] italic bg-white p-2.5 rounded-lg border border-[#DFE5DA]">
                            "{note.comment}"
                          </p>

                          {note.tags && note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {note.tags.map((tag, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-[#EBF1ED] text-[#446153] rounded text-[10px] font-medium">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-[#DFE5DA] bg-[#F4F6F1] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  handleOpenForm(selectedClientForDetails);
                  setSelectedClientForDetails(null);
                }}
                className="text-xs font-bold text-[#5A7D6C] hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Editar Cadastro
              </button>
              <button
                type="button"
                onClick={() => setSelectedClientForDetails(null)}
                className="px-4 py-2 bg-white border border-[#DFE5DA] text-xs font-semibold rounded-xl text-[#243029] hover:bg-[#EBF1ED]"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL ADICIONAR NOTA OPERACIONAL ================= */}
      {isAddNoteModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#DFE5DA] shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DFE5DA] pb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h4 className="text-sm font-bold text-[#243029]">Registrar Avaliação Técnica</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAddNoteModalOpen(false)}
                className="p-1 text-[#86958E] hover:text-[#243029]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOperationalNote} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#243029] mb-1">Nota Geral (1 a 5 estrelas)</label>
                <select
                  value={newNoteData.rating}
                  onChange={(e) => setNewNoteData({ ...newNoteData, rating: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#F4F6F1] border border-[#DFE5DA] rounded-xl focus:outline-none focus:border-[#5A7D6C]"
                >
                  <option value={5}>5 Estrelas - Excelente</option>
                  <option value={4}>4 Estrelas - Bom</option>
                  <option value={3}>3 Estrelas - Neutro/Regular</option>
                  <option value={2}>2 Estrelas - Desafiador</option>
                  <option value={1}>1 Estrela - Crítico</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#243029] mb-1">Comportamento</label>
                  <select
                    value={newNoteData.behaviorEvaluation}
                    onChange={(e: any) => setNewNoteData({ ...newNoteData, behaviorEvaluation: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F4F6F1] border border-[#DFE5DA] rounded-xl focus:outline-none focus:border-[#5A7D6C]"
                  >
                    <option value="excelente">Excelente</option>
                    <option value="bom">Bom</option>
                    <option value="neutro">Neutro</option>
                    <option value="dificil">Difícil</option>
                    <option value="critico">Crítico</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#243029] mb-1">Condição do Imóvel</label>
                  <select
                    value={newNoteData.propertyCondition}
                    onChange={(e: any) => setNewNoteData({ ...newNoteData, propertyCondition: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F4F6F1] border border-[#DFE5DA] rounded-xl focus:outline-none focus:border-[#5A7D6C]"
                  >
                    <option value="impecavel">Impecável</option>
                    <option value="adequado">Adequado</option>
                    <option value="desafiador">Desafiador</option>
                    <option value="precario">Precário</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#243029] mb-1">
                  Parecer Técnico / Comentário da Equipe <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Imóvel com acesso fácil, cliente cordial, forneceu produtos adequados e água para a equipe..."
                  value={newNoteData.comment}
                  onChange={(e) => setNewNoteData({ ...newNoteData, comment: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F4F6F1] border border-[#DFE5DA] rounded-xl focus:outline-none focus:border-[#5A7D6C]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#243029] mb-1">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  placeholder="Ex: Pontual, Tem Pets, Exige Cuidado Especial"
                  value={newNoteData.tags}
                  onChange={(e) => setNewNoteData({ ...newNoteData, tags: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F4F6F1] border border-[#DFE5DA] rounded-xl focus:outline-none focus:border-[#5A7D6C]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#243029] mb-1">Avaliador / Colaborador</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Mendes (Supervisor Operacional)"
                  value={newNoteData.staffName}
                  onChange={(e) => setNewNoteData({ ...newNoteData, staffName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F4F6F1] border border-[#DFE5DA] rounded-xl focus:outline-none focus:border-[#5A7D6C]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DFE5DA]">
                <button
                  type="button"
                  onClick={() => setIsAddNoteModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#64736B] hover:bg-[#F4F6F1] rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#5A7D6C] text-white rounded-xl text-xs font-bold hover:bg-[#476356]"
                >
                  Salvar Avaliação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE EXCLUSÃO COM SEGURANÇA ================= */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#DFE5DA] shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-[#243029]">
                Excluir Cadastro de {clientToDelete.name}?
              </h3>
              <p className="text-xs text-[#64736B] mt-1">
                Esta ação removerá o cliente da base cadastral.
              </p>
            </div>

            {deleteWarningMsg ? (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Operação Bloqueada por Segurança</span>
                </div>
                <p>{deleteWarningMsg}</p>
              </div>
            ) : (
              <p className="text-xs text-[#64736B] bg-[#FAFBF9] p-3 rounded-xl border border-[#DFE5DA]">
                Nenhum serviço ativo detectado. O cliente pode ser removido com segurança. O histórico anterior será desvinculado.
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-[#64736B] hover:bg-[#F4F6F1] rounded-xl"
              >
                Voltar
              </button>
              {!deleteWarningMsg && (
                <button
                  id="btn-confirm-delete-client"
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs"
                >
                  Confirmar Exclusão
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
