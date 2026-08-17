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
import { generateRecoveryCode } from '../lib/supabaseService';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff,
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
  UserPlus,
  Copy,
  Check,
  RefreshCw,
  Lock,
  Unlock,
  Ban,
  Send
} from 'lucide-react';

import { PhotoUploadField } from './PhotoUploadField';

interface ClientFormData {
  name: string;
  photoUrl: string;
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
  status: 'ativo' | 'bloqueado' | 'inativo';
  recoveryCode: string;
  password?: string;
}

const INITIAL_FORM_DATA: ClientFormData = {
  name: '',
  photoUrl: '',
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
  recoveryCode: '',
  password: '',
};

export const CustomersView: React.FC = () => {
  const { 
    clients, 
    addClient, 
    updateClient, 
    deleteClient, 
    addClientOperationalNote,
    resetClientPassword,
    regenerateClientRecoveryCode,
    toggleClientStatus,
    requests,
    setActiveTab,
    addToast
  } = useApp();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'bloqueado'>('todos');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'services'>('recent');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showFormPassword, setShowFormPassword] = useState(false);

  // Quick Password Reset Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [clientForPasswordReset, setClientForPasswordReset] = useState<Client | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Copy Feedback Tracking
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  // Helper for safe random password generation
  const generateRandomPassword = () => {
    const prefixes = ['Limpeza', 'Cliente', 'Acesso', 'Facil', 'Organize'];
    const symbols = ['@', '#', '$', '!'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${symbol}${num}`;
  };

  // Helper to copy text to clipboard with UI feedback
  const handleCopyText = (text: string, key: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
    addToast({
      type: 'info',
      title: `${label} Copiado`,
      message: `"${text}" copiado para a área de transferência.`
    });
  };

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
          (client.recoveryCode && client.recoveryCode.includes(query)) ||
          client.address.neighborhood.toLowerCase().includes(query) ||
          client.address.city.toLowerCase().includes(query);

        const matchesStatus = 
          statusFilter === 'todos' ? true : 
          statusFilter === 'bloqueado' ? (client.status === 'bloqueado' || client.status === 'inativo') :
          client.status === 'ativo' || client.status === 'vip';

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
        photoUrl: client.photoUrl || '',
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
        status: (client.status === 'bloqueado' || client.status === 'inativo') ? 'bloqueado' : 'ativo',
        recoveryCode: client.recoveryCode || generateRecoveryCode(),
        password: client.password || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        ...INITIAL_FORM_DATA,
        recoveryCode: generateRecoveryCode(),
        password: generateRandomPassword(),
      });
    }
    setShowFormPassword(false);
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
      errors.email = 'E-mail é obrigatório para notificações e login no PWA.';
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

    if (!formData.recoveryCode || formData.recoveryCode.length !== 6 || !/^\d+$/.test(formData.recoveryCode)) {
      errors.recoveryCode = 'Código de recuperação deve conter exatamente 6 dígitos numéricos.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast({
        type: 'error',
        title: 'Dados Incompletos ou Inválidos',
        message: 'Por favor, preencha todos os campos cadastrais obrigatórios destacados.'
      });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      photoUrl: formData.photoUrl,
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
      recoveryCode: formData.recoveryCode.trim() || generateRecoveryCode(),
      password: formData.password?.trim() || undefined,
    };

    if (editingClient) {
      await updateClient(editingClient.id, payload);
    } else {
      await addClient(payload);
    }

    setIsFormModalOpen(false);
  };

  // Handle Quick Password Reset Modal
  const handleOpenPasswordResetModal = (client: Client) => {
    setClientForPasswordReset(client);
    setNewPasswordInput(generateRandomPassword());
    setShowResetPassword(true);
    setIsPasswordModalOpen(true);
  };

  const handleSavePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForPasswordReset) return;

    if (!newPasswordInput.trim() || newPasswordInput.trim().length < 4) {
      addToast({
        type: 'error',
        title: 'Senha Muito Curta',
        message: 'A senha do cliente deve conter no mínimo 4 caracteres.'
      });
      return;
    }

    await resetClientPassword(clientForPasswordReset.id, newPasswordInput.trim());
    setIsPasswordModalOpen(false);
  };

  // Handle Direct Status Toggle on Table Row
  const handleToggleStatus = async (client: Client) => {
    await toggleClientStatus(client.id);
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
  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    const res = await deleteClient(clientToDelete.id);
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

    setNewNoteData({
      rating: 5,
      behaviorEvaluation: 'excelente',
      propertyCondition: 'adequado',
      comment: '',
      tags: 'Pontual, Local Organizado',
      staffName: 'Administração Central',
    });
    setIsAddNoteModalOpen(false);
  };

  // Stats calculation
  const totalClientsCount = clients.length;
  const activeClientsCount = clients.filter(c => c.status === 'ativo' || c.status === 'vip').length;
  const blockedClientsCount = clients.filter(c => c.status === 'bloqueado' || c.status === 'inativo').length;
  const totalCompletedServices = requests.filter(r => r.status === 'concluido').length;

  return (
    <div className="space-y-6">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#243029] tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-[#5A7D6C]" />
            Cadastro & Gestão de Clientes
          </h1>
          <p className="text-xs text-[#64736B] mt-0.5">
            Controle de cadastros, códigos únicos de recuperação (6 dígitos), senhas de acesso e status no Supabase.
          </p>
        </div>

        <button
          id="btn-new-client"
          type="button"
          onClick={() => handleOpenForm()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5A7D6C] text-white rounded-xl text-xs font-bold hover:bg-[#476356] transition-all shadow-xs shrink-0 active:scale-98"
        >
          <UserPlus className="w-4 h-4" />
          Cadastrar Novo Cliente
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-[#DFE5DA] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#64736B] mb-1">
            <span>Total de Clientes</span>
            <Building2 className="w-4 h-4 text-[#5A7D6C]" />
          </div>
          <p className="text-2xl font-black text-[#243029]">{totalClientsCount}</p>
          <span className="text-[11px] text-[#64736B] mt-0.5 block">Sincronizados com Supabase</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DFE5DA] shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-700 mb-1">
            <span>Acessos Ativos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-800">{activeClientsCount}</p>
          <span className="text-[11px] text-emerald-700 mt-0.5 block">Login liberado no PWA</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DFE5DA] shadow-xs">
          <div className="flex items-center justify-between text-xs text-rose-700 mb-1">
            <span>Acessos Bloqueados</span>
            <Ban className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-800">{blockedClientsCount}</p>
          <span className="text-[11px] text-rose-700 mt-0.5 block">Acesso restrito pelo admin</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DFE5DA] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#64736B] mb-1">
            <span>Ordens Finalizadas</span>
            <History className="w-4 h-4 text-[#5A7D6C]" />
          </div>
          <p className="text-2xl font-black text-[#243029]">{totalCompletedServices}</p>
          <span className="text-[11px] text-[#64736B] mt-0.5 block">Histórico total do sistema</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-[#DFE5DA] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#86958E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-clients"
            type="text"
            placeholder="Buscar por nome, CPF/RG, recovery code, fone, e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#F4F6F1] border border-[#DFE5DA] rounded-xl text-[#243029] placeholder-[#86958E] focus:outline-none focus:border-[#5A7D6C] focus:bg-white transition-all"
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
              Ativos ({activeClientsCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('bloqueado')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'bloqueado' ? 'bg-white text-rose-800 shadow-2xs' : 'text-[#64736B] hover:text-[#243029]'
              }`}
            >
              Bloqueados ({blockedClientsCount})
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

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-[#DFE5DA] shadow-xs overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F4F6F1] flex items-center justify-center text-[#86958E] mb-3">
              <UserCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#243029]">Nenhum cliente encontrado</h3>
            <p className="text-xs text-[#64736B] max-w-md mx-auto mt-1 mb-4">
              Não encontramos nenhum registro correspondente aos filtros de busca atuais.
            </p>
            <button
              type="button"
              onClick={() => handleOpenForm()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#5A7D6C] text-white rounded-xl text-xs font-semibold hover:bg-[#476356]"
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
                  <th className="py-3.5 px-4">Cliente & Documento</th>
                  <th className="py-3.5 px-4">Código de Recuperação</th>
                  <th className="py-3.5 px-4">Acesso & Senha</th>
                  <th className="py-3.5 px-4">Status de Acesso</th>
                  <th className="py-3.5 px-4">Contatos & Local</th>
                  <th className="py-3.5 px-4">Histórico</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE5DA] text-xs">
                {filteredClients.map((client) => {
                  const clientRequests = requests.filter(r => r.clientId === client.id || r.clientEmail.toLowerCase() === client.email.toLowerCase());
                  const isBlocked = client.status === 'bloqueado' || client.status === 'inativo';
                  const recoveryCode = client.recoveryCode || '100000';

                  return (
                    <tr 
                      key={client.id} 
                      className={`transition-colors ${isBlocked ? 'bg-rose-50/25 hover:bg-rose-50/40' : 'hover:bg-[#FAFBF9]'}`}
                    >
                      {/* Name and Document */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#EBF1ED] border border-[#DFE5DA] overflow-hidden shrink-0 flex items-center justify-center text-[#446153] font-bold text-xs shadow-2xs">
                            {client.photoUrl ? (
                              <img src={client.photoUrl} alt={client.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{client.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-[#243029] flex items-center gap-2">
                              <span>{client.name}</span>
                              {client.status === 'vip' && (
                                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-black uppercase">VIP</span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#64736B] flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.5 bg-[#EBF1ED] text-[#446153] rounded font-mono text-[10px] font-bold">
                                {client.documentType || 'CPF'}: {client.documentNumber ? (client.documentType === 'RG' ? formatRG(client.documentNumber) : formatCPF(client.documentNumber)) : 'Não inf.'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Unique Recovery Code (6 digits) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#EBF1ED] border border-[#5A7D6C]/30 rounded-xl text-[#243029]">
                            <KeyRound className="w-3.5 h-3.5 text-[#5A7D6C]" />
                            <span className="font-mono text-xs font-black tracking-widest text-[#243029]">
                              #{recoveryCode}
                            </span>
                          </div>

                          <button
                            type="button"
                            title="Copiar Código de Recuperação de 6 Dígitos"
                            onClick={() => handleCopyText(recoveryCode, `code-${client.id}`, 'Código de Recuperação')}
                            className="p-1.5 text-[#64736B] hover:text-[#243029] hover:bg-[#F4F6F1] rounded-lg transition-colors"
                          >
                            {copiedKey === `code-${client.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-[#86958E] block mt-0.5">6 dígitos para resgate</span>
                      </td>

                      {/* Password & Admin Reset Action */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            {client.password ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#243029]">
                                <Lock className="w-3 h-3 text-emerald-600" />
                                <span className="font-mono">••••••••</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-amber-700 font-medium">Pendente de senha</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenPasswordResetModal(client)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5A7D6C] hover:text-[#476356] underline"
                          >
                            <KeyRound className="w-3 h-3" />
                            Redefinir Senha
                          </button>
                        </div>
                      </td>

                      {/* Visual Access Status & Direct Toggle */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(client)}
                            title={isBlocked ? "Clique para DESBLOQUEAR o acesso do cliente" : "Clique para BLOQUEAR o acesso do cliente"}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all shadow-2xs ${
                              isBlocked 
                                ? 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200' 
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                            }`}
                          >
                            {isBlocked ? (
                              <>
                                <Ban className="w-3.5 h-3.5 text-rose-600" />
                                <span>Bloqueado</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Ativo</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(client)}
                            className="text-[10px] text-[#64736B] hover:text-[#243029] underline"
                          >
                            {isBlocked ? 'Desbloquear' : 'Bloquear'}
                          </button>
                        </div>
                        <span className="text-[10px] text-[#86958E] block mt-0.5">
                          {isBlocked ? 'Acesso ao PWA suspenso' : 'Login e agendamentos liberados'}
                        </span>
                      </td>

                      {/* Contacts & Location */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[11px] text-[#243029] font-medium">
                            <Phone className="w-3 h-3 text-[#5A7D6C]" />
                            <span>{formatPhone(client.phone)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-[#64736B]">
                            <MapPin className="w-3 h-3 text-[#86958E] shrink-0" />
                            <span className="truncate">{client.address.neighborhood} - {client.address.city}/{client.address.state}</span>
                          </div>
                        </div>
                      </td>

                      {/* Service History */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F4F6F1] rounded-lg text-[11px] font-semibold text-[#243029]">
                          <History className="w-3 h-3 text-[#5A7D6C]" />
                          {clientRequests.length} OS
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Ver Detalhes & Histórico Completo"
                            onClick={() => setSelectedClientForDetails(client)}
                            className="p-1.5 text-[#64736B] hover:text-[#5A7D6C] hover:bg-[#F4F6F1] rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Redefinir Senha do Cliente"
                            onClick={() => handleOpenPasswordResetModal(client)}
                            className="p-1.5 text-[#64736B] hover:text-[#5A7D6C] hover:bg-[#F4F6F1] rounded-lg transition-colors"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Editar Cadastro"
                            onClick={() => handleOpenForm(client)}
                            className="p-1.5 text-[#64736B] hover:text-[#5A7D6C] hover:bg-[#F4F6F1] rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Excluir Cadastro"
                            onClick={() => handleDeleteClick(client)}
                            className="p-1.5 text-[#64736B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
                    Preencha os dados cadastrais, credenciais de acesso ao PWA e código de recuperação no Supabase.
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
              {/* 1. Security & PWA Access Credentials Card */}
              <div className="bg-[#FAFBF9] rounded-2xl p-4 border border-[#DFE5DA] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#5A7D6C] uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-[#5A7D6C]" />
                    Credenciais de Acesso & Segurança do Cliente
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Supabase Auth & RLS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Recovery Code (6 digits) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-[#243029] flex items-center gap-1">
                        Código Único de Recuperação (6 dígitos) <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newCode = generateRecoveryCode();
                          setFormData({ ...formData, recoveryCode: newCode });
                          addToast({
                            type: 'info',
                            title: 'Novo Código Gerado',
                            message: `Código #${newCode} gerado automaticamente.`
                          });
                        }}
                        className="text-[11px] font-bold text-[#5A7D6C] hover:text-[#476356] inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Gerar Novo
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        id="input-recovery-code"
                        type="text"
                        maxLength={6}
                        value={formData.recoveryCode}
                        onChange={(e) => setFormData({ ...formData, recoveryCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        placeholder="Ex: 849201"
                        className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl font-mono font-bold tracking-widest text-[#243029] focus:outline-none transition-all ${
                          formErrors.recoveryCode ? 'border-rose-500' : 'border-[#DFE5DA] focus:border-[#5A7D6C]'
                        }`}
                      />
                    </div>
                    {formErrors.recoveryCode ? (
                      <p className="text-[11px] text-rose-600 mt-1">{formErrors.recoveryCode}</p>
                    ) : (
                      <p className="text-[10px] text-[#64736B] mt-1">
                        Código de resgate emergencial gerado no cadastro para suporte ao cliente.
                      </p>
                    )}
                  </div>

                  {/* Client Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-[#243029]">
                        Senha de Acesso (PWA do Cliente)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const randomPass = generateRandomPassword();
                          setFormData({ ...formData, password: randomPass });
                          setShowFormPassword(true);
                          addToast({
                            type: 'info',
                            title: 'Senha Segura Gerada',
                            message: `Nova senha gerada: ${randomPass}`
                          });
                        }}
                        className="text-[11px] font-bold text-[#5A7D6C] hover:text-[#476356] inline-flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        Gerar Segura
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        id="input-client-password"
                        type={showFormPassword ? 'text' : 'password'}
                        value={formData.password || ''}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Definir senha de acesso..."
                        className="w-full pl-3.5 pr-10 py-2 text-sm bg-white border border-[#DFE5DA] rounded-xl text-[#243029] focus:outline-none focus:border-[#5A7D6C] transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86958E] hover:text-[#243029]"
                      >
                        {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-[#64736B] mt-1">
                      O gestor pode definir ou redefinir a senha a qualquer momento para suporte.
                    </p>
                  </div>
                </div>

                {/* Status selector */}
                <div className="pt-2 border-t border-[#DFE5DA]">
                  <label className="block text-xs font-semibold text-[#243029] mb-1.5">
                    Status de Acesso do Cliente no PWA
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: 'ativo' })}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        formData.status === 'ativo'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs font-bold'
                          : 'bg-white border-[#DFE5DA] text-[#64736B] hover:bg-[#F4F6F1]'
                      }`}
                    >
                      <CheckCircle2 className={`w-4 h-4 ${formData.status === 'ativo' ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <div>
                        <span className="text-xs block">Acesso Liberado (Ativo)</span>
                        <span className="text-[10px] opacity-75 block font-normal">Pode solicitar e acompanhar serviços</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: 'bloqueado' })}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        formData.status === 'bloqueado'
                          ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-2xs font-bold'
                          : 'bg-white border-[#DFE5DA] text-[#64736B] hover:bg-[#F4F6F1]'
                      }`}
                    >
                      <Ban className={`w-4 h-4 ${formData.status === 'bloqueado' ? 'text-rose-600' : 'text-slate-400'}`} />
                      <div>
                        <span className="text-xs block">Acesso Bloqueado</span>
                        <span className="text-[10px] opacity-75 block font-normal">Login suspenso pela administração</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Personal Info */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-[#5A7D6C] uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  Dados Pessoais & Documentação
                </h4>

                {/* Photo Upload */}
                <PhotoUploadField
                  id="client-photo-upload"
                  label="Foto de Perfil do Cliente"
                  photoUrl={formData.photoUrl}
                  onPhotoChange={(url) => setFormData({ ...formData, photoUrl: url })}
                  fallbackName={formData.name || 'Cliente'}
                />

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

              {/* 3. Contacts */}
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
                      WhatsApp
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
                      E-mail (Login no PWA e Notificações) <span className="text-rose-500">*</span>
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

              {/* 4. Detailed Address */}
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
                      Complemento
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

              {/* 5. Notes */}
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

              {/* Form Actions */}
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

      {/* ================= MODAL DE REDEFINIÇÃO RÁPIDA DE SENHA ================= */}
      {isPasswordModalOpen && clientForPasswordReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#DFE5DA] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#DFE5DA] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EBF1ED] text-[#5A7D6C] flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#243029]">Redefinir Senha do Cliente</h3>
                  <p className="text-[11px] text-[#64736B]">{clientForPasswordReset.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 text-[#86958E] hover:text-[#243029] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePasswordReset} className="space-y-4">
              <div className="bg-[#FAFBF9] p-3 rounded-xl border border-[#DFE5DA] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#64736B]">
                  <span>E-mail de Login:</span>
                  <span className="font-semibold text-[#243029]">{clientForPasswordReset.email}</span>
                </div>
                <div className="flex items-center justify-between text-[#64736B]">
                  <span>Código de Recuperação:</span>
                  <span className="font-mono font-bold text-[#5A7D6C]">#{clientForPasswordReset.recoveryCode || '100000'}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#243029]">
                    Nova Senha Provisória / Definitiva
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const pass = generateRandomPassword();
                      setNewPasswordInput(pass);
                      setShowResetPassword(true);
                    }}
                    className="text-[11px] font-bold text-[#5A7D6C] hover:text-[#476356] inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Gerar Aleatória
                  </button>
                </div>

                <div className="relative">
                  <input
                    id="input-reset-password-value"
                    type={showResetPassword ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Digite a nova senha..."
                    className="w-full pl-3 pr-10 py-2 text-sm bg-[#F4F6F1] border border-[#DFE5DA] rounded-xl text-[#243029] font-mono focus:outline-none focus:border-[#5A7D6C] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86958E] hover:text-[#243029]"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Copy & Share message helper */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const message = `Olá ${clientForPasswordReset.name}, sua nova senha de acesso ao portal Clean & Organize é: ${newPasswordInput}. Seu Código de Recuperação é #${clientForPasswordReset.recoveryCode || '100000'}.`;
                    handleCopyText(message, 'whatsapp-msg', 'Mensagem de Suporte');
                  }}
                  className="w-full py-2 px-3 bg-[#EBF1ED] text-[#446153] hover:bg-[#dfe8e2] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Mensagem Pronta para WhatsApp
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DFE5DA]">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-[#64736B] hover:bg-[#F4F6F1] rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#5A7D6C] text-white rounded-xl text-xs font-bold hover:bg-[#476356] shadow-xs"
                >
                  Salvar Nova Senha no Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE DETALHES, HISTÓRICO & AVALIAÇÕES ================= */}
      {selectedClientForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-[#DFE5DA] shadow-xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#DFE5DA] flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#5A7D6C] text-white flex items-center justify-center font-bold text-lg overflow-hidden border border-[#DFE5DA] shadow-xs">
                  {selectedClientForDetails.photoUrl ? (
                    <img src={selectedClientForDetails.photoUrl} alt={selectedClientForDetails.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{selectedClientForDetails.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#243029] flex items-center gap-2">
                    {selectedClientForDetails.name}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedClientForDetails.status === 'ativo' || selectedClientForDetails.status === 'vip' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-rose-100 text-rose-800'
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
              {/* Security & Access Box */}
              <div className="bg-[#FAFBF9] rounded-2xl p-4 border border-[#DFE5DA] grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div>
                  <span className="text-[10px] font-bold text-[#64736B] uppercase block">Código Único de Recuperação</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-base font-black text-[#243029] bg-white px-2.5 py-1 rounded-lg border border-[#DFE5DA]">
                      #{selectedClientForDetails.recoveryCode || '100000'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(selectedClientForDetails.recoveryCode || '100000', 'modal-rec', 'Código')}
                      className="p-1.5 text-[#64736B] hover:text-[#243029] hover:bg-white rounded-lg"
                    >
                      {copiedKey === 'modal-rec' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#64736B] uppercase block">Status de Acesso PWA</span>
                  <button
                    type="button"
                    onClick={async () => {
                      await toggleClientStatus(selectedClientForDetails.id);
                      setSelectedClientForDetails(prev => prev ? {
                        ...prev,
                        status: prev.status === 'ativo' ? 'bloqueado' : 'ativo'
                      } : null);
                    }}
                    className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      selectedClientForDetails.status === 'ativo'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    {selectedClientForDetails.status === 'ativo' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                    {selectedClientForDetails.status === 'ativo' ? 'Acesso Ativo (Liberado)' : 'Acesso Bloqueado'}
                  </button>
                </div>

                <div className="sm:text-right">
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenPasswordResetModal(selectedClientForDetails);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#5A7D6C] text-white rounded-xl text-xs font-bold hover:bg-[#476356]"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Redefinir Senha
                  </button>
                </div>
              </div>

              {/* Contact & Address Card */}
              <div className="bg-white rounded-xl p-4 border border-[#DFE5DA] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
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
                    <p className="text-[11px] text-[#64736B] italic mt-1 bg-[#FAFBF9] p-1.5 rounded border border-[#DFE5DA]">
                      <span className="font-semibold text-[#243029]">Ref:</span> {selectedClientForDetails.address.referencePoint}
                    </p>
                  )}
                </div>
              </div>

              {/* Service History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#243029] uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-[#5A7D6C]" />
                    Histórico de Solicitações & Ordens de Serviço
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
                      {clientReqs.map(req => (
                        <div 
                          key={req.id} 
                          className="bg-white rounded-xl p-3.5 border border-[#DFE5DA] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#243029] font-mono">{req.code}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF1ED] text-[#446153] border border-[#5A7D6C]/20">
                                {req.status.replace('_', ' ').toUpperCase()}
                              </span>
                              <span className="text-[11px] text-[#64736B]">
                                {formatDate(req.scheduleDate)} ({req.scheduleTime})
                              </span>
                            </div>

                            <p className="text-[#243029] font-medium mt-1">
                              {req.serviceType === 'ambos' ? 'Limpeza Completa + Organização' : req.serviceType.toUpperCase()}
                              {req.organizationFormat && ` • Formato: ${req.organizationFormat.toUpperCase()}`}
                            </p>

                            <div className="text-[11px] text-[#64736B] flex items-center gap-2 mt-1">
                              <span>Profissional: <strong className="text-[#243029]">{req.assignedStaffName || 'Pendente de alocação'}</strong></span>
                              <span>•</span>
                              <span>Valor: <strong className="text-[#243029]">{formatCurrency(req.price)}</strong></span>
                            </div>
                          </div>

                          {/* Security Confirmation Code */}
                          <div className="bg-[#EBF1ED] border border-[#5A7D6C]/30 rounded-xl px-3 py-2 text-center shrink-0">
                            <span className="text-[9px] font-bold text-[#5A7D6C] uppercase block tracking-wider">
                              Código Confirmação
                            </span>
                            <span className="font-mono text-base font-black text-[#243029] tracking-widest">
                              {req.confirmationCode || '----'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Operational Notes */}
              <div className="space-y-3 pt-3 border-t border-[#DFE5DA]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#243029] uppercase tracking-wider flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      Avaliações da Equipe Operacional
                    </h4>
                  </div>
                  <button
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
                    {selectedClientForDetails.operationalNotes.map((note) => (
                      <div key={note.id} className="bg-[#FAFBF9] p-3.5 rounded-xl border border-[#DFE5DA] space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#243029]">{note.authorName || 'Equipe Operacional'}</span>
                          <span className="text-[11px] text-[#64736B]">{formatDate(note.date)}</span>
                        </div>
                        <p className="text-[#243029]">{note.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DE NOVA AVALIAÇÃO OPERACIONAL ================= */}
      {isAddNoteModalOpen && selectedClientForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#DFE5DA] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#DFE5DA] pb-3">
              <h3 className="text-sm font-bold text-[#243029]">Nova Avaliação Operacional</h3>
              <button
                type="button"
                onClick={() => setIsAddNoteModalOpen(false)}
                className="p-1 text-[#86958E] hover:text-[#243029] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOperationalNote} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#243029] mb-1">
                  Parecer Técnico / Comentário da Equipe <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Imóvel com acesso fácil, cliente cordial, forneceu produtos adequados..."
                  value={newNoteData.comment}
                  onChange={(e) => setNewNoteData({ ...newNoteData, comment: e.target.value })}
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
                Esta ação removerá o cliente da base cadastral no Supabase.
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
                Nenhum serviço ativo detectado. O cliente pode ser removido com segurança.
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
