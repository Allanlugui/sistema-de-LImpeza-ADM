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
  Database
} from 'lucide-react';
import { formatDateBR } from '../utils/formatters';

export const SettingsView: React.FC = () => {
  const { 
    adminUser, 
    setupMasterAdmin, 
    resetToFirstAccess, 
    resetAllData, 
    collaborators, 
    requests, 
    feedbacks, 
    addToast 
  } = useApp();

  const [adminName, setAdminName] = useState(adminUser?.name || '');
  const [adminEmail, setAdminEmail] = useState(adminUser?.email || '');
  const [companyName, setCompanyName] = useState(adminUser?.companyName || '');
  const [adminPin, setAdminPin] = useState(adminUser?.pin || '1234');
  const [adminRole, setAdminRole] = useState(adminUser?.role || 'Administrador Mestre');

  const handleUpdateAdminProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim() || !adminEmail.trim() || !adminPin.trim()) {
      alert('Preencha os campos obrigatórios.');
      return;
    }
    setupMasterAdmin({
      name: adminName.trim(),
      email: adminEmail.trim(),
      companyName: companyName.trim() || 'Clean & Organize Pro',
      role: adminRole.trim() || 'Administrador Mestre',
      pin: adminPin.trim(),
      avatar: adminUser?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    });
  };

  const handleExportBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      admin: adminUser,
      collaborators,
      requests,
      feedbacks,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-clean-organize-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({
      type: 'success',
      title: 'Backup Exportado com Sucesso',
      message: 'Arquivo JSON contendo toda a base operacional baixado para o seu dispositivo.'
    });
  };

  return (
    <div id="settings-management-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#243029] tracking-tight">
          Configurações & Segurança do Sistema
        </h2>
        <p className="text-xs sm:text-sm text-[#6B7B70] mt-1">
          Gestão de credenciais mestres, regras de acesso operacional e manutenção do banco de dados.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin Profile Form (2/3) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#DFE5DA] shadow-2xs p-6">
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

        {/* System Operations & Maintenance (1/3) */}
        <div className="space-y-6">
          {/* Data Backup & Export */}
          <div className="bg-white rounded-xl border border-[#DFE5DA] shadow-2xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#243029] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#5A7D6C]" />
              Backup & Dados Operacionais
            </h3>

            <p className="text-xs text-[#6B7B70]">
              Exporte todos os colaboradores, solicitações ativas e feedbacks em formato JSON seguro.
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

          {/* Reset & First Access Testing */}
          <div className="bg-white rounded-xl border border-[#DFE5DA] shadow-2xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#243029] flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#D4A373]" />
              Ambiente & Reset de Teste
            </h3>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Deseja restaurar os dados de demonstração iniciais?')) {
                    resetAllData();
                  }
                }}
                className="w-full py-2 px-3 bg-[#EEF3ED] hover:bg-[#DFE5DA] text-[#243029] text-xs font-semibold rounded-lg transition-colors text-left flex items-center justify-between cursor-pointer"
              >
                <span>Restaurar Base Demonstrativa</span>
                <RotateCcw className="w-3.5 h-3.5 text-[#6B7B70]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Ativar modo Primeiro Acesso para configurar uma nova conta de Administrador Mestre do zero?')) {
                    resetToFirstAccess();
                  }
                }}
                className="w-full py-2 px-3 bg-[#FEF6E9] hover:bg-[#FCE2B6] text-[#925C18] text-xs font-semibold rounded-lg border border-[#FCE2B6] transition-colors text-left flex items-center justify-between cursor-pointer"
              >
                <span>Simular "Primeiro Acesso Absoluto"</span>
                <Lock className="w-3.5 h-3.5 text-[#925C18]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
