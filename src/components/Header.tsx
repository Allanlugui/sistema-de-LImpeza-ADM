import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  Clock, 
  Activity, 
  LogOut, 
  UserCheck, 
  RotateCcw,
  Smartphone,
  HardHat,
  RefreshCw,
  Database,
  Radio
} from 'lucide-react';
import { CustomerAppModal } from './CustomerAppModal';
import { StaffAppModal } from './StaffAppModal';

export const Header: React.FC = () => {
  const { 
    adminUser, 
    logoutAdmin, 
    requests, 
    setActiveTab, 
    resetToFirstAccess,
    isRealtimeActive,
    isLoadingData,
    refreshFromSupabase
  } = useApp();

  const [time, setTime] = useState(new Date());
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCustomerApp, setShowCustomerApp] = useState(false);
  const [showStaffApp, setShowStaffApp] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const runningServicesCount = requests.filter(
    r => r.status === 'em_execucao' && r.executionTracking?.isRunning
  ).length;

  return (
    <header id="main-header" className="bg-white border-b border-[#DFE5DA] sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5A7D6C] flex items-center justify-center text-white shadow-xs shadow-[#5A7D6C]/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#243029] text-base leading-tight tracking-tight">
                  {adminUser?.companyName || 'Clean & Organize Pro'}
                </span>
                <span className="text-[10px] font-semibold bg-[#EBF1ED] text-[#446153] px-2 py-0.5 rounded-full border border-[#DFE5DA]">
                  ADM
                </span>
              </div>
              <span className="text-xs text-[#64736B] hidden sm:inline-block">
                Gestão Administrativa de Limpeza e Organização
              </span>
            </div>
          </div>

          {/* Center Simulators & Live Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Supabase Realtime Connection Badge */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={refreshFromSupabase}
                disabled={isLoadingData}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isRealtimeActive
                    ? 'bg-[#EBF1ED] text-[#345143] border-[#C2D6CA] hover:bg-[#DFEBE3]'
                    : 'bg-[#FBF6EE] text-[#87551C] border-[#E8D9C0] hover:bg-[#F5ECD9]'
                }`}
                title="Sincronização em tempo real via Supabase. Clique para forçar atualização imediata."
              >
                {isLoadingData ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#5A7D6C]" />
                    <span className="hidden md:inline">Sincronizando...</span>
                  </>
                ) : isRealtimeActive ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <Radio className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden md:inline">Realtime Ativo</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5 text-[#A06C28]" />
                    <span className="hidden md:inline">Supabase Sincronizado</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick App Simulator Launchers */}
            <div className="flex items-center gap-1.5 bg-[#F4F6F1] p-1 rounded-xl border border-[#DFE5DA]">
              <button
                id="btn-header-open-customer-app"
                type="button"
                onClick={() => setShowCustomerApp(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-[#2C473A] hover:bg-[#EEF3ED] border border-[#DFE5DA] shadow-2xs transition-all cursor-pointer"
                title="Abrir Simulador do App do Cliente (exibe Código de Confirmação)"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#5A7D6C]" />
                <span className="hidden md:inline">App do</span>
                <span>Cliente</span>
                <span className="w-2 h-2 rounded-full bg-[#5A7D6C]"></span>
              </button>

              <button
                id="btn-header-open-staff-app"
                type="button"
                onClick={() => setShowStaffApp(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-[#2C473A] hover:bg-[#EEF3ED] border border-[#DFE5DA] shadow-2xs transition-all cursor-pointer"
                title="Abrir Simulador do App Operacional da Equipe (com validação de código de 4 dígitos)"
              >
                <HardHat className="w-3.5 h-3.5 text-[#C88346]" />
                <span className="hidden md:inline">App da</span>
                <span>Equipe</span>
                <span className="w-2 h-2 rounded-full bg-[#C88346]"></span>
              </button>
            </div>

            {/* Live Service Counter */}
            {runningServicesCount > 0 && (
              <button
                id="btn-header-running-services"
                onClick={() => setActiveTab('alocacao')}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAF1E8] text-[#9A5222] border border-[#ECD9C5] text-xs font-medium hover:bg-[#F5E6D5] transition-colors animate-pulse"
              >
                <span className="w-2 h-2 rounded-full bg-[#C88346] animate-ping" />
                <Activity className="w-3.5 h-3.5 text-[#C88346]" />
                <span>{runningServicesCount} em execução</span>
              </button>
            )}

            <div className="hidden xl:flex items-center gap-1.5 text-xs text-[#64736B] bg-[#F4F6F1] px-3 py-1.5 rounded-full border border-[#DFE5DA]">
              <Clock className="w-3.5 h-3.5 text-[#86958E]" />
              <span>
                {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Right Admin Profile */}
          <div className="relative flex items-center gap-3">
            <button
              id="btn-admin-profile-toggle"
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1.5 pl-2.5 pr-2 rounded-xl hover:bg-[#F4F6F1] border border-transparent hover:border-[#DFE5DA] transition-all text-left cursor-pointer"
            >
              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold text-[#243029] leading-tight">
                  {adminUser?.name || 'Administrador'}
                </div>
                <div className="text-[11px] text-[#64736B] leading-tight">
                  {adminUser?.role || 'Acesso Mestre'}
                </div>
              </div>
              <img
                src={adminUser?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}
                alt={adminUser?.name || 'Admin'}
                className="w-9 h-9 rounded-lg object-cover ring-2 ring-[#5A7D6C]/20"
              />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div 
                id="dropdown-admin-profile"
                className="absolute right-0 top-12 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#DFE5DA] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="px-4 py-2.5 border-b border-[#F0F3EC]">
                  <p className="text-xs font-bold text-[#243029]">{adminUser?.name}</p>
                  <p className="text-xs text-[#64736B] truncate">{adminUser?.email}</p>
                  <span className="inline-block mt-1 text-[10px] bg-[#EBF1ED] text-[#446153] px-2 py-0.5 rounded font-medium border border-[#DFE5DA]">
                    {adminUser?.role}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('configuracoes');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-[#243029] hover:bg-[#F4F6F1] flex items-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-[#86958E]" />
                    Perfil & Segurança Mestre
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      resetToFirstAccess();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-[#9A5222] hover:bg-[#FAF1E8] flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-[#C88346]" />
                    Recriar Credencial Mestre
                  </button>
                </div>

                <div className="border-t border-[#F0F3EC] pt-1">
                  <button
                    id="btn-admin-logout"
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      logoutAdmin();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-700 hover:bg-rose-50 font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    Encerrar Sessão
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer App Portal Simulator Modal */}
      {showCustomerApp && (
        <CustomerAppModal
          isOpen={showCustomerApp}
          onClose={() => setShowCustomerApp(false)}
        />
      )}

      {/* Staff Operational App Simulator Modal */}
      {showStaffApp && (
        <StaffAppModal
          isOpen={showStaffApp}
          onClose={() => setShowStaffApp(false)}
        />
      )}
    </header>
  );
};
