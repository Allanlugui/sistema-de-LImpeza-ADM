import React, { useState } from 'react';
import { CustomerRequest, Collaborator } from '../types';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  ShieldAlert, 
  X, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  User, 
  MapPin, 
  Sparkles,
  Info
} from 'lucide-react';
import { formatDateBR } from '../utils/formatters';

interface SecurityCodeValidationModalProps {
  request: CustomerRequest;
  collaborator?: Collaborator;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SecurityCodeValidationModal: React.FC<SecurityCodeValidationModalProps> = ({
  request,
  collaborator,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { validateAndStartExecution, regenerateSecurityCode } = useApp();
  const [codeInput, setCodeInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);

  if (!isOpen) return null;

  const staff = collaborator || {
    name: request.assignedStaffName || 'Colaborador Designado',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    role: 'Profissional de Atendimento'
  };

  const handleDigitChange = (val: string) => {
    // Only accept numeric characters up to 4 digits
    const clean = val.replace(/\D/g, '').slice(0, 4);
    setCodeInput(clean);
    if (errorMessage) setErrorMessage('');
  };

  const handleValidate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (codeInput.length < 4) {
      setErrorMessage('Digite os 4 dígitos do código de confirmação fornecido pelo cliente.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    setTimeout(() => {
      const result = validateAndStartExecution(request.id, codeInput, request.assignedStaffId);
      setIsSubmitting(false);

      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setCodeInput('');
          onClose();
          if (onSuccess) onSuccess();
        }, 1200);
      } else {
        setAttempts(prev => prev + 1);
        setErrorMessage(result.message);
      }
    }, 400);
  };

  const handleQuickFillDemo = () => {
    if (request.confirmationCode) {
      setCodeInput(request.confirmationCode);
      setErrorMessage('');
    }
  };

  return (
    <div 
      id="modal-security-code-validation" 
      className="fixed inset-0 z-50 bg-[#16201A]/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-[#DFE5DA] max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#243029] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5A7D6C] flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Confirmação de Identidade</h3>
              <p className="text-xs text-[#C8D6CD]">
                {request.code} • {request.clientName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#C8D6CD] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Instructions Box */}
          <div className="p-3.5 rounded-xl bg-[#F7F8F4] border border-[#DFE5DA] flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#EEF3ED] text-[#3D564A] shrink-0 mt-0.5">
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="text-xs text-[#4F6055] space-y-1">
              <p className="font-bold text-[#243029]">Protocolo de Segurança no Local</p>
              <p className="leading-relaxed">
                Peça ao cliente o <strong>Código de 4 dígitos</strong> exibido no aplicativo dele. O início do atendimento e o disparo do cronômetro só serão liberados após a validação correta.
              </p>
            </div>
          </div>

          {/* Success State */}
          {isSuccess ? (
            <div className="py-6 text-center space-y-3 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-full bg-[#EBF6EE] text-[#236838] border-2 border-[#C3E6CC] mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold text-[#243029]">Identidade Confirmada!</h4>
              <p className="text-xs text-[#6B7B70]">
                Código autenticado com sucesso. O cronômetro de execução foi disparado.
              </p>
            </div>
          ) : (
            <form onSubmit={handleValidate} className="space-y-4">
              {/* Service Context */}
              <div className="p-3 rounded-lg bg-[#EEF3ED] border border-[#D4E0D1] text-xs space-y-1">
                <div className="flex justify-between items-center text-[#3D564A]">
                  <span className="font-semibold">Profissional no Local:</span>
                  <span className="font-bold text-[#243029]">{staff.name}</span>
                </div>
                <div className="flex justify-between items-center text-[#3D564A]">
                  <span className="font-semibold">Endereço:</span>
                  <span className="text-[#243029]">{request.address.neighborhood} - {request.address.city}</span>
                </div>
              </div>

              {/* 4-Digit Input Area */}
              <div className="space-y-2">
                <label className="block text-center text-xs font-bold text-[#243029] uppercase tracking-wider">
                  Digite o Código de 4 Dígitos do Cliente:
                </label>

                <div className="flex justify-center items-center gap-3">
                  <input
                    id="input-security-confirmation-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={codeInput}
                    onChange={(e) => handleDigitChange(e.target.value)}
                    placeholder="••••"
                    autoFocus
                    className={`w-48 text-center text-3xl font-mono font-bold tracking-[0.5em] px-4 py-3 rounded-xl border-2 transition-all shadow-inner focus:outline-none ${
                      errorMessage
                        ? 'border-rose-500 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-400 animate-shake'
                        : 'border-[#5A7D6C] bg-white text-[#243029] focus:ring-2 focus:ring-[#5A7D6C]'
                    }`}
                  />
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-[#FDF0EE] border border-[#F8CDC8] text-xs text-[#A63529] flex items-start gap-2 animate-in fade-in duration-150">
                    <ShieldAlert className="w-4 h-4 text-[#A63529] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold">Acesso Bloqueado por Segurança</p>
                      <p>{errorMessage}</p>
                      {attempts >= 2 && (
                        <p className="text-[11px] text-[#A63529] font-medium pt-1">
                          Dica: Se o cliente não souber o código, verifique o código gerado no Painel de Gestão ou no App do Cliente.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  id="btn-submit-security-code"
                  type="submit"
                  disabled={codeInput.length < 4 || isSubmitting}
                  className="w-full py-3 bg-[#5A7D6C] hover:bg-[#4a695b] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Validando Código...</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Validar & Iniciar Atendimento</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-2 text-[#6B7B70]">
                  <button
                    type="button"
                    onClick={handleQuickFillDemo}
                    className="text-[11px] text-[#5A7D6C] hover:underline flex items-center gap-1 cursor-pointer"
                    title="Preencher com o código correto gerado no sistema (Atalho de Demonstração)"
                  >
                    <Sparkles className="w-3 h-3 text-[#D4A373]" />
                    <span>Demo: Preencher código ({request.confirmationCode || '4829'})</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="text-[11px] text-[#6B7B70] hover:text-[#243029] cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
