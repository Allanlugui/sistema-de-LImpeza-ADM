import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, ShieldCheck, Lock, Mail, User, Building2, KeyRound, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const FirstAccessAuthModal: React.FC = () => {
  const { isFirstAccess, setupMasterAdmin, loginAdmin } = useApp();

  // Setup Form State
  const [setupName, setSetupName] = useState('Camila Albuquerque');
  const [setupEmail, setSetupEmail] = useState('gestao@cleanorganize.com.br');
  const [setupCompany, setSetupCompany] = useState('Clean & Organize Pro Brasil');
  const [setupPin, setSetupPin] = useState('1234');
  const [setupRole, setSetupRole] = useState('Administradora Mestre');
  const [setupPassword, setSetupPassword] = useState('Admin@2025!');
  const [confirmPassword, setConfirmPassword] = useState('Admin@2025!');

  // Login Form State (if not first access)
  const [loginEmail, setLoginEmail] = useState('gestao@cleanorganize.com.br');
  const [loginPin, setLoginPin] = useState('1234');
  const [loginError, setLoginError] = useState('');

  // Mode switcher
  const [isLoginMode, setIsLoginMode] = useState(!isFirstAccess);

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupName.trim() || !setupEmail.trim() || !setupPin.trim() || !setupCompany.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (setupPassword !== confirmPassword) {
      alert('As senhas digitadas não coincidem.');
      return;
    }
    setupMasterAdmin({
      name: setupName.trim(),
      email: setupEmail.trim().toLowerCase(),
      companyName: setupCompany.trim(),
      role: setupRole.trim() || 'Administrador Mestre',
      pin: setupPin.trim(),
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    });
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = loginAdmin(loginEmail, loginPin);
    if (!success) {
      setLoginError('Credenciais inválidas. Verifique o e-mail ou o PIN de acesso.');
    }
  };

  const handleQuickDemoLogin = () => {
    loginAdmin('gestao@cleanorganize.com.br', '1234');
  };

  return (
    <div id="auth-screen-overlay" className="fixed inset-0 z-50 bg-[#16201A]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-2xl shadow-2xl border border-[#DFE5DA] max-w-xl w-full overflow-hidden my-6"
      >
        {/* Header Header Brand */}
        <div className="bg-[#243029] text-white p-6 md:p-8 relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#5A7D6C]/30 border border-[#5A7D6C]/40 flex items-center justify-center text-[#DFE5DA]">
              <Sparkles className="w-5 h-5 text-[#8FA395]" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-[#8FA395]">
                Painel Administrativo & Operacional
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">Clean & Organize Pro</h1>
            </div>
          </div>
          <p className="text-[#C8D6CD] text-sm mt-1 max-w-md">
            {isFirstAccess || !isLoginMode
              ? 'Configuração de Primeiro Acesso: Defina a conta mestre do Administrador para gerenciar equipes, solicitações e operações.'
              : 'Acesso Restrito: Autentique-se com sua credencial administrativa para acessar o painel.'}
          </p>

          <div className="absolute top-6 right-6 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-[#C8D6CD] border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-[#5A7D6C]" />
            Ambiente Seguro
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8">
          {isFirstAccess || !isLoginMode ? (
            /* First Access Setup Form */
            <form id="form-first-access-setup" onSubmit={handleSetupSubmit} className="space-y-4">
              <div className="bg-[#EEF3ED] border border-[#D4E0D1] rounded-xl p-3.5 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#3D564A] shrink-0 mt-0.5" />
                <div className="text-xs text-[#243029] leading-relaxed">
                  <strong className="font-semibold block mb-0.5 text-[#243029]">Primeiro Acesso ao Sistema:</strong>
                  Esta etapa inicializa o banco de dados e cria a chave de segurança administrativa mestre.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#243029] mb-1.5">
                    Nome do Administrador *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#8FA395] absolute left-3 top-3" />
                    <input
                      id="input-setup-name"
                      type="text"
                      required
                      value={setupName}
                      onChange={(e) => setSetupName(e.target.value)}
                      placeholder="Ex: Camila Albuquerque"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#243029] mb-1.5">
                    Nome da Empresa / Franquia *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-[#8FA395] absolute left-3 top-3" />
                    <input
                      id="input-setup-company"
                      type="text"
                      required
                      value={setupCompany}
                      onChange={(e) => setSetupCompany(e.target.value)}
                      placeholder="Ex: Clean & Organize Pro"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#243029] mb-1.5">
                  E-mail Corporativo de Gestão *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8FA395] absolute left-3 top-3" />
                  <input
                    id="input-setup-email"
                    type="email"
                    required
                    value={setupEmail}
                    onChange={(e) => setSetupEmail(e.target.value)}
                    placeholder="gestao@cleanorganize.com.br"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#243029] mb-1.5">
                    Senha Mestre de Acesso *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8FA395] absolute left-3 top-3" />
                    <input
                      id="input-setup-password"
                      type="password"
                      required
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#243029] mb-1.5">
                    Confirmar Senha *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8FA395] absolute left-3 top-3" />
                    <input
                      id="input-setup-password-confirm"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#243029] mb-1.5">
                    PIN de Segurança Rápida (4 dígitos) *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#8FA395] absolute left-3 top-3" />
                    <input
                      id="input-setup-pin"
                      type="text"
                      maxLength={6}
                      required
                      value={setupPin}
                      onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ex: 1234"
                      className="w-full pl-9 pr-3 py-2 text-sm tracking-widest font-mono rounded-lg border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                    />
                  </div>
                  <span className="text-[10px] text-[#6B7B70] mt-1 block">
                    Usado para aprovações rápidas e login expresso.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#243029] mb-1.5">
                    Cargo / Nível de Acesso
                  </label>
                  <input
                    id="input-setup-role"
                    type="text"
                    value={setupRole}
                    onChange={(e) => setSetupRole(e.target.value)}
                    placeholder="Administrador Mestre"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                  />
                </div>
              </div>

              <button
                id="btn-submit-first-access"
                type="submit"
                className="w-full mt-3 py-3 px-4 bg-[#5A7D6C] hover:bg-[#4a695b] text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Criar Credencial Mestre & Entrar no Painel
              </button>

              {!isFirstAccess && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsLoginMode(true)}
                    className="text-xs text-[#3D564A] hover:text-[#243029] font-semibold cursor-pointer"
                  >
                    Já possui conta configurada? Fazer Login
                  </button>
                </div>
              )}
            </form>
          ) : (
            /* Regular Login Form */
            <form id="form-admin-login" onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3 bg-[#FDECEB] border border-[#F8C8C6] rounded-xl text-xs text-[#591C1A] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#D9534F] shrink-0" />
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#243029] mb-1.5">
                  E-mail do Administrador
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8FA395] absolute left-3 top-3" />
                  <input
                    id="input-login-email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="gestao@cleanorganize.com.br"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#243029]">
                    PIN / Senha de Acesso
                  </label>
                  <span className="text-[11px] text-[#6B7B70]">PIN padrão: 1234</span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#8FA395] absolute left-3 top-3" />
                  <input
                    id="input-login-pin"
                    type="password"
                    required
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    placeholder="Digite seu PIN ou senha"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-[#DFE5DA] focus:outline-none focus:ring-2 focus:ring-[#5A7D6C] text-[#243029]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  id="btn-login-submit"
                  type="submit"
                  className="flex-1 py-3 px-4 bg-[#5A7D6C] hover:bg-[#4a695b] text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  Entrar no Painel
                </button>

                <button
                  id="btn-login-demo-quick"
                  type="button"
                  onClick={handleQuickDemoLogin}
                  className="py-3 px-4 bg-[#EEF3ED] hover:bg-[#DFE5DA] text-[#3D564A] font-semibold text-xs rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                  title="Entrar imediatamente como Camila Albuquerque (Admin)"
                >
                  Acesso Rápido Demo
                </button>
              </div>

              <div className="text-center pt-3 border-t border-[#EEF3ED]">
                <button
                  type="button"
                  onClick={() => setIsLoginMode(false)}
                  className="text-xs text-[#3D564A] hover:text-[#243029] font-semibold cursor-pointer"
                >
                  Configurar novo Administrador Mestre (Primeiro Acesso)
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
