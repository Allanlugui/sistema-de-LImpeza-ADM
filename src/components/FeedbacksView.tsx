import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CustomerFeedback, FeedbackType, FeedbackStatus, ServiceType } from '../types';
import { 
  MessageSquareHeart, 
  Star, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ThumbsUp, 
  HelpCircle, 
  Search, 
  Filter, 
  Plus, 
  MessageCircle, 
  ShieldCheck, 
  User, 
  Calendar, 
  Check, 
  X, 
  Sparkles,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { formatDateBR, getWhatsAppLink } from '../utils/formatters';

export const FeedbacksView: React.FC = () => {
  const { feedbacks, requests, collaborators, addFeedback, resolveFeedback } = useApp();

  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [ratingFilter, setRatingFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Resolve modal state
  const [resolvingFeedback, setResolvingFeedback] = useState<CustomerFeedback | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  // New feedback modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newRequestCode, setNewRequestCode] = useState('SOL-2025-101');
  const [newStaffName, setNewStaffName] = useState('Maria Helena dos Santos');
  const [newServiceType, setNewServiceType] = useState<ServiceType>('ambos');
  const [newRating, setNewRating] = useState<number>(5);
  const [newType, setNewType] = useState<FeedbackType>('elogio');
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');

  // Overall CSAT calculations
  const total = feedbacks.length;
  const avgRating = total > 0 
    ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / total).toFixed(1)
    : '5.0';

  const praisesCount = feedbacks.filter(f => f.type === 'elogio').length;
  const suggestionsCount = feedbacks.filter(f => f.type === 'sugestao').length;
  const complaintsCount = feedbacks.filter(f => f.type === 'reclamacao').length;
  const resolvedComplaints = feedbacks.filter(f => f.type === 'reclamacao' && f.status === 'resolvido').length;

  const starCounts = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: feedbacks.filter(f => f.rating === stars).length,
    percentage: total > 0 ? Math.round((feedbacks.filter(f => f.rating === stars).length / total) * 100) : 0
  }));

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingFeedback || !resolutionText.trim()) return;
    resolveFeedback(resolvingFeedback.id, resolutionText.trim());
    setResolvingFeedback(null);
    setResolutionText('');
  };

  const handleCreateFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newTitle.trim() || !newComment.trim()) {
      alert('Preencha os campos obrigatórios do feedback.');
      return;
    }

    addFeedback({
      requestId: 'req-manual-' + Date.now(),
      requestCode: newRequestCode,
      clientName: newClientName.trim(),
      clientEmail: newClientEmail.trim() || `${newClientName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      staffName: newStaffName,
      serviceType: newServiceType,
      rating: newRating,
      type: newType,
      title: newTitle.trim(),
      comment: newComment.trim(),
    });

    setIsNewModalOpen(false);
    setNewTitle('');
    setNewComment('');
  };

  // Filtered feedbacks
  const filtered = feedbacks.filter(f => {
    const matchesSearch = 
      f.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.requestCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.staffName && f.staffName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'todos' || f.type === typeFilter;
    const matchesStatus = statusFilter === 'todos' || f.status === statusFilter;
    const matchesRating = ratingFilter === 'todos' || f.rating.toString() === ratingFilter;

    return matchesSearch && matchesType && matchesStatus && matchesRating;
  });

  return (
    <div id="feedbacks-management-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#243029] tracking-tight">
              Central de Feedback & Reclamações (SAC)
            </h2>
            <span className="bg-[#EEF3ED] text-[#3D564A] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#D4E0D1]">
              {feedbacks.length} avaliações
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7B70] mt-1">
            Dashboard unificado de satisfação do cliente (CSAT/NPS), elogios, sugestões e resolução de chamados de SAC.
          </p>
        </div>

        <button
          id="btn-open-new-feedback"
          type="button"
          onClick={() => setIsNewModalOpen(true)}
          className="px-4 py-2.5 bg-[#5A7D6C] hover:bg-[#4a695b] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Registrar Avaliação / SAC
        </button>
      </div>

      {/* CSAT & Quality Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Rating Card */}
        <div className="bg-white rounded-xl p-5 border border-[#DFE5DA] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#6B7B70]">Média Geral de Satisfação</span>
            <Star className="w-5 h-5 text-[#D4A373] fill-[#D4A373]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#243029]">{avgRating}</span>
            <span className="text-xs text-[#6B7B70]">de 5.0 estrelas</span>
          </div>
          <div className="mt-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <Star
                key={s}
                className={`w-4 h-4 ${
                  s <= Math.round(Number(avgRating))
                    ? 'text-[#D4A373] fill-[#D4A373]'
                    : 'text-[#DFE5DA]'
                }`}
              />
            ))}
            <span className="text-xs text-[#6B7B70] ml-1.5 font-medium">({total} registros)</span>
          </div>
        </div>

        {/* Praises Card */}
        <div className="bg-white rounded-xl p-5 border border-[#DFE5DA] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#6B7B70]">Elogios Registrados</span>
            <div className="w-8 h-8 rounded-lg bg-[#EBF6EE] text-[#236838] flex items-center justify-center">
              <ThumbsUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-[#236838]">{praisesCount}</span>
            <span className="text-xs text-[#6B7B70] ml-2 font-medium">clientes satisfeitos</span>
          </div>
          <span className="text-xs text-[#236838] font-medium mt-2">
            {total > 0 ? Math.round((praisesCount / total) * 100) : 0}% do total de feedbacks
          </span>
        </div>

        {/* Complaints / SAC Card */}
        <div className="bg-white rounded-xl p-5 border border-[#DFE5DA] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#6B7B70]">Reclamações / Chamados SAC</span>
            <div className="w-8 h-8 rounded-lg bg-[#FDECEB] text-[#D9534F] flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-[#D9534F]">{complaintsCount}</span>
            <span className="text-xs text-[#6B7B70] ml-2 font-medium">
              ({complaintsCount - resolvedComplaints} pendentes)
            </span>
          </div>
          <span className="text-xs text-[#6B7B70] font-medium mt-2">
            {resolvedComplaints} de {complaintsCount} resolvidas com sucesso
          </span>
        </div>

        {/* Star Breakdown Card */}
        <div className="bg-white rounded-xl p-4 border border-[#DFE5DA] shadow-2xs">
          <span className="text-xs font-semibold text-[#243029] block mb-2">
            Distribuição de Estrelas
          </span>
          <div className="space-y-1.5 text-xs">
            {starCounts.map(({ stars, count, percentage }) => (
              <div key={stars} className="flex items-center gap-2">
                <span className="w-6 text-[#6B7B70] font-bold">{stars}★</span>
                <div className="flex-1 bg-[#EEF3ED] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      stars >= 4 ? 'bg-[#5A7D6C]' : stars === 3 ? 'bg-[#D4A373]' : 'bg-[#D9534F]'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right text-[11px] text-[#6B7B70]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-[#DFE5DA] shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#8FA395] absolute left-3 top-3" />
          <input
            id="input-search-feedbacks"
            type="text"
            placeholder="Buscar por cliente, colaborador, código ou palavra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Type Filter */}
          <select
            id="select-feedback-type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-[#243029] rounded-lg border border-[#DFE5DA] bg-white focus:ring-2 focus:ring-[#5A7D6C]"
          >
            <option value="todos">Tipo: Todos</option>
            <option value="elogio">Apenas Elogios</option>
            <option value="reclamacao">Reclamações (SAC)</option>
            <option value="sugestao">Sugestões</option>
          </select>

          {/* Status Filter */}
          <select
            id="select-feedback-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-[#243029] rounded-lg border border-[#DFE5DA] bg-white focus:ring-2 focus:ring-[#5A7D6C]"
          >
            <option value="todos">Status: Todos</option>
            <option value="pendente">Pendente de Resolução</option>
            <option value="em_analise">Em Análise / Contato</option>
            <option value="resolvido">Resolvido</option>
          </select>

          {/* Rating Filter */}
          <select
            id="select-feedback-rating"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-[#243029] rounded-lg border border-[#DFE5DA] bg-white focus:ring-2 focus:ring-[#5A7D6C]"
          >
            <option value="todos">Nota: Todas</option>
            <option value="5">5 Estrelas</option>
            <option value="4">4 Estrelas</option>
            <option value="3">3 Estrelas</option>
            <option value="2">2 Estrelas</option>
            <option value="1">1 Estrela</option>
          </select>
        </div>
      </div>

      {/* Feedbacks List */}
      <div className="space-y-4">
        {filtered.map((feedback) => {
          const typeBadges = {
            elogio: { label: 'Elogio', bg: 'bg-[#EBF6EE] text-[#236838] border-[#C3E6CC]' },
            reclamacao: { label: 'Reclamação (SAC)', bg: 'bg-[#FDECEB] text-[#D9534F] border-[#F8C8C6] font-bold' },
            sugestao: { label: 'Sugestão', bg: 'bg-[#EBF3FA] text-[#2C6288] border-[#CCE0F4]' }
          };

          const isComplaint = feedback.type === 'reclamacao';
          const isResolved = feedback.status === 'resolvido';

          return (
            <div
              key={feedback.id}
              className={`bg-white rounded-xl border p-5 transition-all shadow-2xs space-y-3 ${
                isComplaint && !isResolved
                  ? 'border-[#F8C8C6] bg-[#FDECEB]/20'
                  : 'border-[#DFE5DA]'
              }`}
            >
              {/* Top Row: Stars, Type, Client, Date */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EEF3ED]">
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Star rating */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= feedback.rating
                            ? 'text-[#D4A373] fill-[#D4A373]'
                            : 'text-[#DFE5DA]'
                        }`}
                      />
                    ))}
                  </div>

                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${typeBadges[feedback.type].bg}`}>
                    {typeBadges[feedback.type].label}
                  </span>

                  <span className="font-mono text-xs font-bold text-[#3D564A] bg-[#EEF3ED] px-2 py-0.5 rounded">
                    {feedback.requestCode}
                  </span>

                  <span className="text-xs text-[#6B7B70] font-medium">
                    {feedback.serviceType === 'ambos' ? 'Limpeza + Organização' : feedback.serviceType.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#6B7B70]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDateBR(feedback.date)}</span>
                  
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    feedback.status === 'resolvido'
                      ? 'bg-[#EBF6EE] text-[#236838]'
                      : feedback.status === 'em_analise'
                      ? 'bg-[#FEF6E9] text-[#925C18]'
                      : 'bg-[#EEF3ED] text-[#55635B]'
                  }`}>
                    {feedback.status === 'resolvido' ? 'Tratado / Concluído' : feedback.status === 'em_analise' ? 'Em Tratativa' : 'Pendente'}
                  </span>
                </div>
              </div>

              {/* Title & Comment */}
              <div>
                <h3 className="text-sm font-bold text-[#243029] mb-1">{feedback.title}</h3>
                <p className="text-xs text-[#3D4C42] leading-relaxed bg-[#F7F8F4] p-3 rounded-lg border border-[#DFE5DA]">
                  "{feedback.comment}"
                </p>
              </div>

              {/* Resolution Notes Block (if resolved) */}
              {feedback.resolutionNotes && (
                <div className="p-3 bg-[#EBF6EE]/70 rounded-lg border border-[#C3E6CC] text-xs text-[#1F4E2B] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#1F4E2B]">
                    <ShieldCheck className="w-4 h-4 text-[#236838]" />
                    <span>Tratativa da Gestão Administrativa:</span>
                  </div>
                  <p>{feedback.resolutionNotes}</p>
                  {feedback.resolvedBy && (
                    <span className="text-[10px] text-[#236838] block mt-1">
                      Finalizado por: {feedback.resolvedBy} {feedback.resolvedAt && `em ${formatDateBR(feedback.resolvedAt)}`}
                    </span>
                  )}
                </div>
              )}

              {/* Footer: Client, Staff and Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
                <div className="flex items-center gap-3 text-[#6B7B70]">
                  <span>Cliente: <strong className="text-[#243029]">{feedback.clientName}</strong></span>
                  {feedback.staffName && (
                    <>
                      <span>•</span>
                      <span>Colaborador(a): <strong className="text-[#3D564A]">{feedback.staffName}</strong></span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={getWhatsAppLink(feedback.clientEmail, `Olá ${feedback.clientName}, tudo bem? Aqui é da Gestão Clean & Organize sobre sua avaliação do serviço ${feedback.requestCode}:`)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-[#EEF3ED] hover:bg-[#DFE5DA] text-[#3D564A] rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Responder no WhatsApp
                  </a>

                  {isComplaint && !isResolved && (
                    <button
                      type="button"
                      onClick={() => {
                        setResolvingFeedback(feedback);
                        setResolutionText('');
                      }}
                      className="px-3 py-1.5 bg-[#D9534F] hover:bg-[#c4413d] text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Tratar Reclamação no SAC
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-12 text-center bg-white rounded-xl border border-[#DFE5DA] p-8">
            <MessageSquareHeart className="w-10 h-10 text-[#A2B3A6] mx-auto mb-2" />
            <h3 className="text-sm font-bold text-[#243029]">Nenhum feedback encontrado</h3>
            <p className="text-xs text-[#6B7B70] mt-1">Ajuste os filtros de busca ou registre uma nova avaliação de cliente.</p>
          </div>
        )}
      </div>

      {/* Modal Resolve Complaint */}
      {resolvingFeedback && (
        <div id="modal-resolve-complaint" className="fixed inset-0 z-50 bg-[#16201A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#DFE5DA] max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#243029] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#D9534F] flex items-center justify-center text-white">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Tratativa de Reclamação (SAC)</h3>
                  <span className="text-xs text-[#C8D6CD]">
                    Chamado referente a {resolvingFeedback.requestCode} - {resolvingFeedback.clientName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResolvingFeedback(null)}
                className="p-1 rounded-lg text-[#C8D6CD] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-[#FDECEB] text-[#9A2D2A] rounded-xl border border-[#F8C8C6]">
                <p className="font-bold text-sm mb-1">{resolvingFeedback.title}</p>
                <p className="italic">"{resolvingFeedback.comment}"</p>
              </div>

              <div>
                <label className="block font-semibold text-[#243029] mb-1">
                  Ação Corretiva & Solução Acordada com o Cliente *
                </label>
                <textarea
                  rows={4}
                  required
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Ex: Entramos em contato com o cliente via WhatsApp, pedimos desculpas pelo ocorrido, oferecemos voucher de compensação de R$ 50 e realizamos reciclagem de rota com o profissional..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EEF3ED]">
                <button
                  type="button"
                  onClick={() => setResolvingFeedback(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#6B7B70] hover:text-[#243029] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-resolve-complaint"
                  type="submit"
                  className="px-5 py-2.5 bg-[#5A7D6C] hover:bg-[#4a695b] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Salvar Resolução & Encerrar SAC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal New Feedback */}
      {isNewModalOpen && (
        <div id="modal-new-feedback" className="fixed inset-0 z-50 bg-[#16201A]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#DFE5DA] max-w-xl w-full my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#243029] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#5A7D6C] flex items-center justify-center text-white">
                  <MessageSquareHeart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Registrar Avaliação ou Chamado SAC</h3>
                  <span className="text-xs text-[#C8D6CD]">
                    Insira o feedback enviado pelo cliente por mensagem ou pós-atendimento
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

            <form onSubmit={handleCreateFeedback} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#243029] mb-1">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Ex: Dra. Beatriz Vasconcelos"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#243029] mb-1">
                    Código da Solicitação
                  </label>
                  <select
                    value={newRequestCode}
                    onChange={(e) => setNewRequestCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] bg-white text-[#243029]"
                  >
                    {requests.map(r => (
                      <option key={r.id} value={r.code}>{r.code} - {r.clientName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#243029] mb-1">
                    Tipo de Registro
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as FeedbackType)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] bg-white text-[#243029]"
                  >
                    <option value="elogio">Elogio</option>
                    <option value="sugestao">Sugestão</option>
                    <option value="reclamacao">Reclamação (SAC)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#243029] mb-1">
                    Nota em Estrelas (1 a 5)
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNewRating(s)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            s <= newRating
                              ? 'text-[#D4A373] fill-[#D4A373]'
                              : 'text-[#DFE5DA]'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="font-bold text-sm text-[#243029] ml-2">{newRating}★</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#243029] mb-1">
                  Título Resumido *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Excelente organização de armários e pontualidade"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#243029] mb-1">
                  Comentário / Relato Completo do Cliente *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva a mensagem ou avaliação enviada pelo cliente..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFE5DA] focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EEF3ED]">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#6B7B70] hover:text-[#243029] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-new-feedback"
                  type="submit"
                  className="px-5 py-2.5 bg-[#5A7D6C] hover:bg-[#4a695b] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Salvar Avaliação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
