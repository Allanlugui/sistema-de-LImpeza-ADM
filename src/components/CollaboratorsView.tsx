import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Collaborator, StaffRole, StaffStatus } from '../types';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  FileText, 
  Star, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  MessageCircle, 
  UserCheck, 
  Calendar,
  AlertCircle,
  X
} from 'lucide-react';
import { formatCPF, isValidCPF, formatPhone, getWhatsAppLink, formatDateBR } from '../utils/formatters';
import { PhotoUploadField } from './PhotoUploadField';

export const CollaboratorsView: React.FC = () => {
  const { 
    collaborators, 
    addCollaborator, 
    updateCollaborator, 
    deleteCollaborator, 
    toggleAppAccess, 
    addToast 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [roleFilter, setRoleFilter] = useState<string>('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>('Diarista Profissional');
  const [status, setStatus] = useState<StaffStatus>('ativo');
  const [photoUrl, setPhotoUrl] = useState('');
  const [specialtiesText, setSpecialtiesText] = useState('');
  const [notes, setNotes] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [allowAppAccess, setAllowAppAccess] = useState(true);
  const [formError, setFormError] = useState('');

  // Open modal for new
  const handleOpenNewModal = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setCpf('');
    setPhone('');
    setRole('Diarista Profissional');
    setStatus('ativo');
    setPhotoUrl('');
    setSpecialtiesText('Limpeza fina, Organização de armários, Higienização geral');
    setNotes('');
    setEmergencyContact('');
    setAllowAppAccess(true);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEditModal = (collab: Collaborator) => {
    setEditingId(collab.id);
    setName(collab.name);
    setEmail(collab.email);
    setCpf(collab.cpf);
    setPhone(collab.phone);
    setRole(collab.role);
    setStatus(collab.status);
    setPhotoUrl(collab.photoUrl);
    setSpecialtiesText(collab.specialties.join(', '));
    setNotes(collab.notes || '');
    setEmergencyContact(collab.emergencyContact || '');
    setAllowAppAccess(collab.allowAppAccess);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !email.trim() || !cpf.trim() || !phone.trim()) {
      setFormError('Por favor, preencha todos os campos obrigatórios (Nome, E-mail, CPF e Telefone).');
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setFormError('O CPF informado deve conter exatamente 11 dígitos numéricos.');
      return;
    }

    const specialtiesList = specialtiesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (editingId) {
      updateCollaborator(editingId, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        cpf: formatCPF(cpf),
        phone: formatPhone(phone),
        role,
        status,
        photoUrl: photoUrl.trim(),
        specialties: specialtiesList,
        notes: notes.trim(),
        emergencyContact: emergencyContact.trim(),
        allowAppAccess,
      });
    } else {
      addCollaborator({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        cpf: formatCPF(cpf),
        phone: formatPhone(phone),
        role,
        status,
        photoUrl: photoUrl.trim(),
        hireDate: new Date().toISOString().split('T')[0],
        specialties: specialtiesList,
        notes: notes.trim(),
        emergencyContact: emergencyContact.trim(),
        allowAppAccess,
      });
    }

    setIsModalOpen(false);
  };

  // Filtered List
  const filtered = collaborators.filter((collab) => {
    const matchesSearch = 
      collab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collab.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collab.cpf.includes(searchTerm) ||
      collab.phone.includes(searchTerm) ||
      collab.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || collab.status === statusFilter;
    const matchesRole = roleFilter === 'todos' || collab.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div id="collaborators-management-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#243029] tracking-tight">
              Gestão de Colaboradores (Operacional)
            </h2>
            <span className="bg-[#EBF1ED] text-[#446153] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#DFE5DA]">
              {collaborators.length} cadastrados
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64736B] mt-1">
            Pré-cadastro de equipe operacional e liberação de acesso ao aplicativo móvel de atendimento.
          </p>
        </div>

        <button
          id="btn-open-add-collaborator"
          type="button"
          onClick={handleOpenNewModal}
          className="px-4 py-2.5 bg-[#5A7D6C] hover:bg-[#446153] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo Colaborador
        </button>
      </div>

      {/* Security Rule Notice */}
      <div className="bg-[#EBF1ED] border border-[#DFE5DA] rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#5A7D6C] shrink-0 mt-0.5" />
        <div className="text-xs text-[#243029] leading-relaxed">
          <strong className="font-semibold block mb-0.5 text-[#243029]">Controle de Acesso Operacional Rigoroso:</strong>
          Apenas profissionais com CPF previamente cadastrado nesta base e com a chave 
          <span className="font-semibold text-[#446153] mx-1">"Acesso ao App Liberado"</span>
          conseguirão autenticar e receber ordens de serviço no aplicativo de campo.
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-4 border border-[#DFE5DA] shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#86958E] absolute left-3 top-3" />
          <input
            id="input-search-collaborators"
            type="text"
            placeholder="Buscar por nome, CPF, e-mail ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] focus:border-[#5A7D6C] text-[#243029]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            id="select-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-[#243029] rounded-lg border border-[#DFE5DA] bg-white focus:outline-none focus:ring-2 focus:ring-[#5A7D6C]"
          >
            <option value="todos">Status: Todos</option>
            <option value="ativo">Disponível (Ativo)</option>
            <option value="em_servico">Em Serviço</option>
            <option value="ferias">Em Férias</option>
            <option value="inativo">Inativo</option>
          </select>

          {/* Role Filter */}
          <select
            id="select-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-[#243029] rounded-lg border border-[#DFE5DA] bg-white focus:outline-none focus:ring-2 focus:ring-[#5A7D6C]"
          >
            <option value="todos">Cargo: Todos</option>
            <option value="Diarista Profissional">Diarista Profissional</option>
            <option value="Personal Organizer">Personal Organizer</option>
            <option value="Especialista em Higienização">Especialista em Higienização</option>
            <option value="Líder de Equipe / Supervisora">Líder de Equipe / Supervisora</option>
          </select>
        </div>
      </div>

      {/* Collaborators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((collab) => {
          const statusBadges = {
            ativo: { label: 'Disponível', bg: 'bg-[#EBF1ED] text-[#446153] border-[#DFE5DA]' },
            em_servico: { label: 'Em Serviço', bg: 'bg-[#FAF1E8] text-[#9A5222] border-[#ECD9C5]' },
            ferias: { label: 'Férias', bg: 'bg-[#F0F3EC] text-[#64736B] border-[#DFE5DA]' },
            inativo: { label: 'Inativo', bg: 'bg-[#F0F3EC] text-[#86958E] border-[#DFE5DA]' },
          };

          return (
            <div 
              key={collab.id}
              className="bg-white rounded-xl border border-[#DFE5DA] shadow-2xs hover:border-[#5A7D6C]/50 transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Card Top */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#EBF1ED] ring-2 ring-[#DFE5DA] shadow-2xs overflow-hidden shrink-0 flex items-center justify-center text-[#446153] font-bold text-sm">
                      {collab.photoUrl ? (
                        <img
                          src={collab.photoUrl}
                          alt={collab.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{collab.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#243029]">{collab.name}</h3>
                      <span className="text-xs font-medium text-[#5A7D6C] block">{collab.role}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadges[collab.status].bg}`}>
                    {statusBadges[collab.status].label}
                  </span>
                </div>

                {/* Info List */}
                <div className="space-y-2 text-xs text-[#64736B] pt-2 border-t border-[#F0F3EC]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[#86958E]">
                      <FileText className="w-3.5 h-3.5" />
                      CPF:
                    </span>
                    <span className="font-mono font-medium text-[#243029]">{collab.cpf}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[#86958E]">
                      <Mail className="w-3.5 h-3.5" />
                      E-mail:
                    </span>
                    <span className="font-medium text-[#243029] truncate max-w-[180px]">{collab.email}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[#86958E]">
                      <Phone className="w-3.5 h-3.5" />
                      Telefone:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[#243029]">{collab.phone}</span>
                      <a
                        href={getWhatsAppLink(collab.phone, `Olá ${collab.name}, tudo bem? Mensagem da Gestão Clean & Organize:`)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded bg-[#EBF1ED] text-[#446153] hover:bg-[#DFE5DA] transition-colors"
                        title="Abrir WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1.5 text-[#86958E]">
                      <Star className="w-3.5 h-3.5 text-[#C88346] fill-[#C88346]" />
                      Avaliação:
                    </span>
                    <span className="font-bold text-[#243029]">
                      {collab.rating.toFixed(1)} / 5.0 ({collab.completedServicesCount} atendimentos)
                    </span>
                  </div>
                </div>

                {/* Specialties Tags */}
                {collab.specialties.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#F0F3EC]">
                    <span className="text-[10px] uppercase font-semibold text-[#86958E] block mb-1">
                      Especialidades:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {collab.specialties.map((spec, i) => (
                        <span key={i} className="text-[10px] bg-[#F7F9F5] text-[#243029] border border-[#DFE5DA] px-2 py-0.5 rounded font-medium">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-[#F7F9F5] border-t border-[#DFE5DA] flex items-center justify-between text-xs">
                {/* App Access Switch */}
                <button
                  type="button"
                  onClick={() => toggleAppAccess(collab.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium text-xs border transition-colors ${
                    collab.allowAppAccess
                      ? 'bg-[#EBF1ED] text-[#446153] border-[#DFE5DA] hover:bg-[#DFE5DA]'
                      : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  }`}
                  title={collab.allowAppAccess ? 'Clique para bloquear acesso ao app' : 'Clique para liberar acesso ao app'}
                >
                  {collab.allowAppAccess ? (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-[#5A7D6C]" />
                      <span>App Liberado</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-rose-600" />
                      <span>App Bloqueado</span>
                    </>
                  )}
                </button>

                {/* Edit and Delete Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(collab)}
                    className="p-1.5 rounded-lg text-[#64736B] hover:text-[#5A7D6C] hover:bg-white transition-colors"
                    title="Editar Cadastro"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Deseja realmente remover o colaborador ${collab.name}?`)) {
                        deleteCollaborator(collab.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-[#64736B] hover:text-rose-600 hover:bg-white transition-colors"
                    title="Excluir Colaborador"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-[#DFE5DA] p-8">
            <Users className="w-10 h-10 text-[#86958E] mx-auto mb-2" />
            <h3 className="text-sm font-bold text-[#243029]">Nenhum colaborador encontrado</h3>
            <p className="text-xs text-[#64736B] mt-1">Tente ajustar os filtros de busca ou cadastre um novo membro.</p>
            <button
              type="button"
              onClick={handleOpenNewModal}
              className="mt-4 px-4 py-2 bg-[#5A7D6C] hover:bg-[#446153] text-white text-xs font-semibold rounded-lg shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Cadastrar Colaborador
            </button>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Collaborator */}
      {isModalOpen && (
        <div id="modal-collaborator-form-overlay" className="fixed inset-0 z-50 bg-[#243029]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#DFE5DA] max-w-2xl w-full my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#243029] text-white p-5 flex items-center justify-between border-b border-[#DFE5DA]/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#5A7D6C] flex items-center justify-center text-white">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingId ? 'Editar Colaborador Operacional' : 'Pré-Cadastro de Colaborador'}
                  </h3>
                  <span className="text-xs text-[#D3DED7]">
                    Dados operacionais obrigatórios para habilitação do profissional
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#D3DED7] hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#243029] mb-1">
                    Nome Completo *
                  </label>
                  <input
                    id="input-collab-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Maria Helena dos Santos"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#243029] mb-1">
                    E-mail Institucional / Pessoal *
                  </label>
                  <input
                    id="input-collab-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maria.helena@cleanorganize.com.br"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#243029] mb-1">
                    CPF (Obrigatório para autenticação) *
                  </label>
                  <input
                    id="input-collab-cpf"
                    type="text"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                  />
                  <span className="text-[10px] text-[#64736B] mt-0.5 block">
                    Formato com máscara automática (11 dígitos).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#243029] mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    id="input-collab-phone"
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(11) 90000-0000"
                    maxLength={15}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#243029] mb-1">
                    Cargo / Função
                  </label>
                  <select
                    id="select-collab-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as StaffRole)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] bg-white focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                  >
                    <option value="Diarista Profissional">Diarista Profissional</option>
                    <option value="Personal Organizer">Personal Organizer</option>
                    <option value="Especialista em Higienização">Especialista em Higienização</option>
                    <option value="Líder de Equipe / Supervisora">Líder de Equipe / Supervisora</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#243029] mb-1">
                    Status Operacional
                  </label>
                  <select
                    id="select-collab-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StaffStatus)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] bg-white focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                  >
                    <option value="ativo">Disponível (Ativo)</option>
                    <option value="em_servico">Em Atendimento</option>
                    <option value="ferias">Férias</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <PhotoUploadField
                id="collab-photo-upload"
                label="Foto de Perfil do Colaborador"
                photoUrl={photoUrl}
                onPhotoChange={(url) => setPhotoUrl(url)}
                fallbackName={name || 'Colaborador'}
              />

              <div>
                <label className="block text-xs font-semibold text-[#243029] mb-1">
                  Especialidades & Habilidades (separadas por vírgula)
                </label>
                <input
                  id="input-collab-specialties"
                  type="text"
                  value={specialtiesText}
                  onChange={(e) => setSpecialtiesText(e.target.value)}
                  placeholder="Ex: Organização de Closets, Despensa 5S, Limpeza Fina, Passadoria"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#243029] mb-1">
                    Contato de Emergência
                  </label>
                  <input
                    id="input-collab-emergency"
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Ex: Carlos (Marido) - (11) 99999-9999"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <input
                    id="checkbox-allow-app"
                    type="checkbox"
                    checked={allowAppAccess}
                    onChange={(e) => setAllowAppAccess(e.target.checked)}
                    className="w-4 h-4 text-[#5A7D6C] accent-[#5A7D6C] rounded border-[#DFE5DA] focus:ring-[#5A7D6C]"
                  />
                  <label htmlFor="checkbox-allow-app" className="text-xs font-semibold text-[#243029] cursor-pointer">
                    Liberar Acesso ao App Operacional
                    <span className="block text-[10px] font-normal text-[#64736B]">
                      Permite autenticação no aplicativo mobile.
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#243029] mb-1">
                  Observações Internas da Gerência
                </label>
                <textarea
                  id="textarea-collab-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anotações sobre preferências de região, certificações ou histórico..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0F3EC]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64736B] hover:text-[#243029] rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-collaborator"
                  type="submit"
                  className="px-5 py-2 bg-[#5A7D6C] hover:bg-[#446153] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  {editingId ? 'Salvar Alterações' : 'Concluir Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
