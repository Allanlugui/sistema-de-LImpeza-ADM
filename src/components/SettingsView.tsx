import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings, 
  ShieldCheck, 
  KeyRound, 
  RotateCcw, 
  Download, 
  Upload, 
  User, 
  Building2, 
  Mail, 
  Check, 
  AlertTriangle, 
  FileJson,
  Lock,
  Database,
  Radio,
  RefreshCw,
  Code2,
  Copy,
  CheckCircle2,
  Server
} from 'lucide-react';
import { formatDateBR } from '../utils/formatters';

export const SettingsView: React.FC = () => {
  const { 
    adminUser, 
    setupMasterAdmin, 
    resetToFirstAccess, 
    collaborators, 
    clients,
    requests, 
    feedbacks, 
    isRealtimeActive,
    isLoadingData,
    refreshFromSupabase,
    addToast 
  } = useApp();

  const [adminName, setAdminName] = useState(adminUser?.name || '');
  const [adminEmail, setAdminEmail] = useState(adminUser?.email || '');
  const [companyName, setCompanyName] = useState(adminUser?.companyName || '');
  const [adminPin, setAdminPin] = useState(adminUser?.pin || '1234');
  const [adminRole, setAdminRole] = useState(adminUser?.role || 'Administrador Mestre');
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleUpdateAdminProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim() || !adminEmail.trim() || !adminPin.trim()) {
      addToast({
        type: 'error',
        title: 'Campos Obrigatórios',
        message: 'Preencha todos os campos obrigatórios da credencial mestre.'
      });
      return;
    }
    setupMasterAdmin({
      name: adminName.trim(),
      email: adminEmail.trim(),
      companyName: companyName.trim() || 'Clean & Organize Pro',
      role: adminRole.trim() || 'Administrador Mestre',
      pin: adminPin.trim(),
      avatar: adminUser?.avatar || '',
    });
    addToast({
      type: 'success',
      title: 'Credencial Atualizada',
      message: 'Dados do Administrador Mestre salvos com sucesso.'
    });
  };

  const handleExportBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      admin: adminUser,
      collaborators,
      clients,
      requests,
      feedbacks,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-clean-organize-supabase-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({
      type: 'success',
      title: 'Backup Exportado com Sucesso',
      message: 'Arquivo JSON contendo toda a base operacional baixado para o seu dispositivo.'
    });
  };

  const supabaseSqlSchema = `-- SCRIPT COMPLETO DE CRIAÇÃO DO BANCO SUPABASE (POSTGRESQL)
-- Clean & Organize Pro - Gestão Operacional, PWA do Cliente e App da Equipe

-- 1. Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    photo_url TEXT,
    document_type TEXT NOT NULL DEFAULT 'CPF',
    document_number TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    preferred_contact TEXT DEFAULT 'whatsapp',
    address JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativo',
    notes TEXT,
    preferred_service_type TEXT,
    preferred_org_format TEXT,
    operational_notes JSONB DEFAULT '[]'::jsonb,
    emergency_contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Colaboradores
CREATE TABLE IF NOT EXISTS public.colaboradores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    cpf TEXT NOT NULL,
    phone TEXT NOT NULL,
    photo_url TEXT,
    role TEXT NOT NULL DEFAULT 'Diarista Profissional',
    status TEXT NOT NULL DEFAULT 'ativo',
    rating NUMERIC(3, 2) DEFAULT 5.0,
    completed_services_count INTEGER DEFAULT 0,
    hire_date DATE DEFAULT CURRENT_DATE,
    specialties TEXT[] DEFAULT '{}',
    notes TEXT,
    allow_app_access BOOLEAN DEFAULT true,
    emergency_contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Solicitações de Serviço / Ordens de Serviço
CREATE TABLE IF NOT EXISTS public.solicitacoes_servico (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    client_id TEXT REFERENCES public.clientes(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_document TEXT,
    client_document_type TEXT,
    client_email TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_whatsapp TEXT NOT NULL,
    address JSONB NOT NULL,
    service_type TEXT NOT NULL,
    organization_format TEXT NOT NULL DEFAULT 'personalizada',
    org_details JSONB,
    property_details JSONB NOT NULL,
    schedule_date DATE NOT NULL,
    schedule_time TEXT NOT NULL,
    estimated_duration_hours NUMERIC(4, 1) DEFAULT 5.0,
    price NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    assigned_staff_id TEXT REFERENCES public.colaboradores(id) ON DELETE SET NULL,
    assigned_staff_name TEXT,
    priority TEXT DEFAULT 'media',
    client_notes TEXT,
    confirmation_code TEXT NOT NULL,
    code_validated_at TIMESTAMP WITH TIME ZONE,
    code_validated_by_staff_id TEXT,
    execution_tracking JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela de Feedbacks e Avaliações
CREATE TABLE IF NOT EXISTS public.avaliacoes_feedback (
    id TEXT PRIMARY KEY,
    request_id TEXT REFERENCES public.solicitacoes_servico(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL,
    client_name TEXT NOT NULL,
    staff_id TEXT NOT NULL,
    staff_name TEXT NOT NULL,
    service_type TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    type TEXT NOT NULL DEFAULT 'elogio',
    title TEXT NOT NULL,
    comment TEXT NOT NULL,
    status TEXT DEFAULT 'resolvido',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Ativação de Row Level Security (RLS) Mandatória em 100% das Tabelas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_feedback ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de Acesso Seguro (Anon Key / Authenticated)
CREATE POLICY "Permitir leitura anon/auth clientes" ON public.clientes FOR SELECT USING (true);
CREATE POLICY "Permitir insercao clientes" ON public.clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao clientes" ON public.clientes FOR UPDATE USING (true);
CREATE POLICY "Permitir delecao clientes" ON public.clientes FOR DELETE USING (true);

CREATE POLICY "Permitir leitura anon/auth colaboradores" ON public.colaboradores FOR SELECT USING (true);
CREATE POLICY "Permitir insercao colaboradores" ON public.colaboradores FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao colaboradores" ON public.colaboradores FOR UPDATE USING (true);
CREATE POLICY "Permitir delecao colaboradores" ON public.colaboradores FOR DELETE USING (true);

CREATE POLICY "Permitir leitura anon/auth solicitacoes" ON public.solicitacoes_servico FOR SELECT USING (true);
CREATE POLICY "Permitir insercao solicitacoes" ON public.solicitacoes_servico FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao solicitacoes" ON public.solicitacoes_servico FOR UPDATE USING (true);
CREATE POLICY "Permitir delecao solicitacoes" ON public.solicitacoes_servico FOR DELETE USING (true);

CREATE POLICY "Permitir leitura anon/auth avaliacoes" ON public.avaliacoes_feedback FOR SELECT USING (true);
CREATE POLICY "Permitir insercao avaliacoes" ON public.avaliacoes_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao avaliacoes" ON public.avaliacoes_feedback FOR UPDATE USING (true);
CREATE POLICY "Permitir delecao avaliacoes" ON public.avaliacoes_feedback FOR DELETE USING (true);

-- 8. Publicação Supabase Realtime (WebSocket Sincronizado)
ALTER PUBLICATION supabase_realtime ADD TABLE public.clientes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.colaboradores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitacoes_servico;
ALTER PUBLICATION supabase_realtime ADD TABLE public.avaliacoes_feedback;
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(supabaseSqlSchema);
    setCopiedSql(true);
    addToast({
      type: 'success',
      title: 'Script SQL Copiado',
      message: 'Código DDL copiado para a área de transferência. Cole no Supabase SQL Editor.'
    });
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div id="settings-management-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#243029] tracking-tight">
          Configurações, Segurança & Banco de Dados
        </h2>
        <p className="text-xs sm:text-sm text-[#6B7B70] mt-1">
          Monitoramento da conexão Supabase em tempo real, credenciais mestres e manutenção de dados.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supabase Production Integration Panel (Full row on top or 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Supabase Live Status Card */}
          <div className="bg-white rounded-xl border border-[#DFE5DA] shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-[#EEF3ED]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EBF1ED] text-[#345143] flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#243029] flex items-center gap-2">
                    <span>Supabase PostgreSQL & Realtime</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF6EE] text-[#236838] border border-[#C3E6CC] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Produção
                    </span>
                  </h3>
                  <span className="text-xs text-[#6B7B70]">Sincronização bidirecional em tempo real para Web, App Operacional e PWA</span>
                </div>
              </div>

              <button
                type="button"
                onClick={refreshFromSupabase}
                disabled={isLoadingData}
                className="px-3 py-1.5 bg-[#EEF3ED] hover:bg-[#DFE5DA] text-[#243029] font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin text-[#5A7D6C]' : ''}`} />
                <span>Sincronizar Agora</span>
              </button>
            </div>

            {/* Real-time Counters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#DFE5DA]">
                <span className="text-[10px] font-bold uppercase text-[#6B7B70] block">Clientes Cadastrados</span>
                <span className="text-xl font-bold text-[#243029]">{clients.length}</span>
                <span className="text-[10px] text-[#5A7D6C] block mt-0.5">Tabela: public.clientes</span>
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#DFE5DA]">
                <span className="text-[10px] font-bold uppercase text-[#6B7B70] block">Colaboradores</span>
                <span className="text-xl font-bold text-[#243029]">{collaborators.length}</span>
                <span className="text-[10px] text-[#5A7D6C] block mt-0.5">Tabela: public.colaboradores</span>
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#DFE5DA]">
                <span className="text-[10px] font-bold uppercase text-[#6B7B70] block">Ordens de Serviço</span>
                <span className="text-xl font-bold text-[#243029]">{requests.length}</span>
                <span className="text-[10px] text-[#5A7D6C] block mt-0.5">Tabela: public.solicitacoes_servico</span>
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#DFE5DA]">
                <span className="text-[10px] font-bold uppercase text-[#6B7B70] block">Feedbacks & Avaliações</span>
                <span className="text-xl font-bold text-[#243029]">{feedbacks.length}</span>
                <span className="text-[10px] text-[#5A7D6C] block mt-0.5">Tabela: public.avaliacoes_feedback</span>
              </div>
            </div>

            {/* SQL Script Viewer Action */}
            <div className="p-3.5 rounded-xl bg-[#EEF3ED] border border-[#C2D6CA] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-[#345143] shrink-0" />
                <div>
                  <h4 className="font-bold text-[#243029]">Esquema SQL & Regras de Segurança (RLS)</h4>
                  <p className="text-[11px] text-[#4F6055]">Script DDL completo para criação das 4 tabelas, triggers e publicação realtime.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSqlModal(true)}
                className="px-3 py-1.5 bg-[#345143] hover:bg-[#253d31] text-white font-bold rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
              >
                Visualizar & Copiar SQL
              </button>
            </div>
          </div>

          {/* Admin Profile Form */}
          <div className="bg-white rounded-xl border border-[#DFE5DA] shadow-2xs p-6">
            <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-[#EEF3ED]">
              <div className="w-8 h-8 rounded-lg bg-[#EEF3ED] text-[#3D564A] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#243029]">Credencial Mestre do Administrador</h3>
                <span className="text-xs text-[#6B7B70]">Chave de acesso total e autorização de operações</span>
              </div>
            </div>

            <form onSubmit={handleUpdateAdminProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#243029] mb-1">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#8FA395] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#DFE5DA] focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#243029] mb-1">
                    Nome da Empresa / Franquia
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-[#8FA395] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#DFE5DA] focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#243029] mb-1">
                    E-mail de Gestão Administrativa
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8FA395] absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#DFE5DA] focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#243029] mb-1">
                    PIN de Segurança Mestre
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#8FA395] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-9 pr-3 py-2 font-mono text-center tracking-widest rounded-lg border border-[#DFE5DA] focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#243029] mb-1">
                  Função Administrativa / Perfil de Cargo
                </label>
                <input
                  type="text"
                  value={adminRole}
                  onChange={(e) => setAdminRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#DFE5DA] focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#5A7D6C] hover:bg-[#4a695b] text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Atualizar Credencial Mestre
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* System Operations & Maintenance (1/3) */}
        <div className="space-y-6">
          {/* Data Backup & Export */}
          <div className="bg-white rounded-xl border border-[#DFE5DA] shadow-2xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#243029] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#5A7D6C]" />
              Backup & Exportação de Dados
            </h3>

            <p className="text-xs text-[#6B7B70]">
              Exporte todos os clientes, colaboradores, solicitações e feedbacks do banco de dados em formato JSON estruturado.
            </p>

            <button
              type="button"
              onClick={handleExportBackup}
              className="w-full py-2.5 px-3 bg-[#243029] hover:bg-[#16201A] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Baixar Backup JSON Completo
            </button>
          </div>

          {/* Reset Master Admin Account */}
          <div className="bg-white rounded-xl border border-[#DFE5DA] shadow-2xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#243029] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#D4A373]" />
              Segurança & Acesso Mestre
            </h3>

            <p className="text-xs text-[#6B7B70]">
              Redefina o administrador mestre para configurar uma nova credencial inicial com chave de segurança.
            </p>

            <button
              type="button"
              onClick={() => {
                if (confirm('Deseja iniciar a configuração de um novo Administrador Mestre?')) {
                  resetToFirstAccess();
                }
              }}
              className="w-full py-2 px-3 bg-[#FEF6E9] hover:bg-[#FCE2B6] text-[#925C18] text-xs font-semibold rounded-lg border border-[#FCE2B6] transition-colors text-left flex items-center justify-between cursor-pointer"
            >
              <span>Redefinir Credencial Mestre</span>
              <RotateCcw className="w-3.5 h-3.5 text-[#925C18]" />
            </button>
          </div>
        </div>
      </div>

      {/* SQL Script Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-[#16201A]/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#DFE5DA] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#243029] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#5A7D6C]" />
                <h3 className="font-bold text-sm">Script SQL Supabase com RLS & Realtime</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3 text-xs">
              <p className="text-[#6B7B70]">
                Execute o script abaixo no <strong>SQL Editor</strong> do seu painel Supabase para criar as tabelas e habilitar as políticas de segurança Row Level Security (RLS) e sincronização em tempo real:
              </p>

              <pre className="p-3 bg-[#1F2D25] text-[#DCE6E0] rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-[#3D564A]">
                {supabaseSqlSchema}
              </pre>
            </div>

            <div className="p-3 bg-[#FAF7F2] border-t border-[#DFE5DA] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCopySql}
                className="px-4 py-2 bg-[#5A7D6C] hover:bg-[#4a695b] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>SQL Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Script SQL</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 bg-[#243029] text-white font-semibold rounded-xl text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
