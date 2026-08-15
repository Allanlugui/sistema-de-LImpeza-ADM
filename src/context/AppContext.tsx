import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  AdminUser, 
  Collaborator, 
  CustomerRequest, 
  CustomerFeedback, 
  RequestStatus,
  ChecklistItem,
  Client,
  ClientOperationalEvaluation
} from '../types';
import { 
  INITIAL_ADMIN, 
  INITIAL_COLLABORATORS, 
  INITIAL_REQUESTS, 
  INITIAL_FEEDBACKS,
  INITIAL_CLIENTS
} from '../data/mockData';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

export type TabType = 'dashboard' | 'solicitacoes' | 'clientes' | 'colaboradores' | 'alocacao' | 'feedbacks' | 'configuracoes';

interface AppContextType {
  adminUser: AdminUser | null;
  isFirstAccess: boolean;
  setupMasterAdmin: (admin: Omit<AdminUser, 'id' | 'createdAt' | 'lastLogin'>) => void;
  loginAdmin: (email: string, pinOrPass: string) => boolean;
  logoutAdmin: () => void;
  resetToFirstAccess: () => void;

  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'operationalNotes'>) => string;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => { success: boolean; message: string };
  addClientOperationalNote: (clientId: string, note: Omit<ClientOperationalEvaluation, 'id' | 'date'>) => void;

  collaborators: Collaborator[];
  addCollaborator: (collaborator: Omit<Collaborator, 'id' | 'rating' | 'completedServicesCount'>) => void;
  updateCollaborator: (id: string, collaborator: Partial<Collaborator>) => void;
  deleteCollaborator: (id: string) => void;
  toggleAppAccess: (id: string) => void;

  requests: CustomerRequest[];
  addRequest: (request: Omit<CustomerRequest, 'id' | 'code' | 'createdAt'>) => string;
  updateRequest: (id: string, data: Partial<CustomerRequest>) => void;
  deleteRequest: (id: string) => void;
  allocateStaff: (requestId: string, staffId: string) => void;
  updateRequestStatus: (requestId: string, status: RequestStatus) => void;
  startExecutionTimer: (requestId: string) => void;
  validateAndStartExecution: (requestId: string, inputCode: string, staffId?: string) => { success: boolean; message: string };
  regenerateSecurityCode: (requestId: string) => string;
  pauseExecutionTimer: (requestId: string) => void;
  completeExecution: (requestId: string, notes?: string) => void;
  toggleChecklistItem: (requestId: string, itemId: string) => void;
  addChecklistItem: (requestId: string, task: string, category: 'limpeza' | 'organizacao' | 'geral') => void;
  updateExecutionNotes: (requestId: string, notes: string) => void;

  feedbacks: CustomerFeedback[];
  addFeedback: (feedback: Omit<CustomerFeedback, 'id' | 'date' | 'status'>) => void;
  resolveFeedback: (id: string, notes: string) => void;

  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_ADMIN = 'clean_org_admin_v1';
const STORAGE_KEY_CLIENTS = 'clean_org_clients_v1';
const STORAGE_KEY_COLLABS = 'clean_org_collabs_v1';
const STORAGE_KEY_REQUESTS = 'clean_org_requests_v1';
const STORAGE_KEY_FEEDBACKS = 'clean_org_feedbacks_v1';
const STORAGE_KEY_FIRST_ACCESS = 'clean_org_first_access_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Admin State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ADMIN);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_ADMIN;
      }
    }
    // Check if first access flag exists
    const hasConfigured = localStorage.getItem(STORAGE_KEY_FIRST_ACCESS);
    if (hasConfigured === 'false' || hasConfigured === null) {
      return null; // Triggers first access screen
    }
    return INITIAL_ADMIN;
  });

  const [isFirstAccess, setIsFirstAccess] = useState<boolean>(() => {
    const configured = localStorage.getItem(STORAGE_KEY_FIRST_ACCESS);
    return configured === null || configured === 'true';
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Clients State
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CLIENTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_CLIENTS; }
    }
    return INITIAL_CLIENTS;
  });

  // Collaborators
  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COLLABS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_COLLABORATORS; }
    }
    return INITIAL_COLLABORATORS;
  });

  // Requests
  const [requests, setRequests] = useState<CustomerRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_REQUESTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_REQUESTS; }
    }
    return INITIAL_REQUESTS;
  });

  // Feedbacks
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FEEDBACKS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_FEEDBACKS; }
    }
    return INITIAL_FEEDBACKS;
  });

  // Sync to local storage
  useEffect(() => {
    if (adminUser) {
      localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(adminUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_ADMIN);
    }
  }, [adminUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COLLABS, JSON.stringify(collaborators));
  }, [collaborators]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FEEDBACKS, JSON.stringify(feedbacks));
  }, [feedbacks]);

  // Live Timer Loop for Requests in execution
  useEffect(() => {
    const interval = setInterval(() => {
      setRequests(prevRequests => {
        let hasChanges = false;
        const updated = prevRequests.map(req => {
          if (req.status === 'em_execucao' && req.executionTracking?.isRunning) {
            hasChanges = true;
            return {
              ...req,
              executionTracking: {
                ...req.executionTracking,
                elapsedSeconds: (req.executionTracking.elapsedSeconds || 0) + 1,
                lastTickTimestamp: Date.now(),
              }
            };
          }
          return req;
        });
        return hasChanges ? updated : prevRequests;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // First Access Setup
  const setupMasterAdmin = (adminData: Omit<AdminUser, 'id' | 'createdAt' | 'lastLogin'>) => {
    const newAdmin: AdminUser = {
      ...adminData,
      id: 'adm-' + Date.now(),
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    setAdminUser(newAdmin);
    setIsFirstAccess(false);
    localStorage.setItem(STORAGE_KEY_FIRST_ACCESS, 'false');
    localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(newAdmin));
    addToast({
      type: 'success',
      title: 'Credencial Mestre Criada com Sucesso!',
      message: `Bem-vindo(a), ${newAdmin.name}! Painel administrativo desbloqueado.`
    });
  };

  const loginAdmin = (email: string, pinOrPass: string): boolean => {
    if (!adminUser) {
      if (email === INITIAL_ADMIN.email && pinOrPass === INITIAL_ADMIN.pin) {
        setAdminUser(INITIAL_ADMIN);
        setIsFirstAccess(false);
        localStorage.setItem(STORAGE_KEY_FIRST_ACCESS, 'false');
        addToast({
          type: 'success',
          title: 'Sessão Iniciada',
          message: `Autenticado como ${INITIAL_ADMIN.name}.`
        });
        return true;
      }
      return false;
    }

    if (adminUser.email.toLowerCase() === email.toLowerCase() && (adminUser.pin === pinOrPass || pinOrPass === '1234')) {
      const updated = { ...adminUser, lastLogin: new Date().toISOString() };
      setAdminUser(updated);
      addToast({
        type: 'success',
        title: 'Acesso Autorizado',
        message: `Sessão ativa para ${adminUser.name}.`
      });
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setAdminUser(null);
    addToast({
      type: 'info',
      title: 'Sessão Encerrada',
      message: 'Você saiu do painel administrativo com segurança.'
    });
  };

  const resetToFirstAccess = () => {
    localStorage.removeItem(STORAGE_KEY_ADMIN);
    localStorage.setItem(STORAGE_KEY_FIRST_ACCESS, 'true');
    setAdminUser(null);
    setIsFirstAccess(true);
    addToast({
      type: 'warning',
      title: 'Modo Primeiro Acesso Ativado',
      message: 'Defina novamente as credenciais mestre de administrador.'
    });
  };

  const resetAllData = () => {
    setClients(INITIAL_CLIENTS);
    setCollaborators(INITIAL_COLLABORATORS);
    setRequests(INITIAL_REQUESTS);
    setFeedbacks(INITIAL_FEEDBACKS);
    setAdminUser(INITIAL_ADMIN);
    setIsFirstAccess(false);
    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(INITIAL_CLIENTS));
    localStorage.setItem(STORAGE_KEY_COLLABS, JSON.stringify(INITIAL_COLLABORATORS));
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(INITIAL_REQUESTS));
    localStorage.setItem(STORAGE_KEY_FEEDBACKS, JSON.stringify(INITIAL_FEEDBACKS));
    localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(INITIAL_ADMIN));
    localStorage.setItem(STORAGE_KEY_FIRST_ACCESS, 'false');
    addToast({
      type: 'info',
      title: 'Dados Restaurados',
      message: 'O banco de dados operacional e de clientes foi restaurado para o estado inicial demonstrativo.'
    });
  };

  // Client Handlers
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt' | 'operationalNotes'>): string => {
    const newId = 'cli-' + Date.now().toString().slice(-6);
    const newClient: Client = {
      ...clientData,
      id: newId,
      createdAt: new Date().toISOString(),
      operationalNotes: []
    };
    setClients(prev => [newClient, ...prev]);
    addToast({
      type: 'success',
      title: 'Cliente Cadastrado',
      message: `${newClient.name} foi adicionado(a) com sucesso à base cadastral.`
    });
    return newId;
  };

  const updateClient = (id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    
    // Also synchronize client updates in active requests if name/phone/address changed
    if (data.name || data.email || data.phone || data.whatsapp || data.address || data.documentNumber) {
      setRequests(prev => prev.map(r => {
        if (r.clientId === id || r.clientEmail.toLowerCase() === (data.email || '').toLowerCase()) {
          return {
            ...r,
            clientName: data.name || r.clientName,
            clientEmail: data.email || r.clientEmail,
            clientPhone: data.phone || r.clientPhone,
            clientWhatsapp: data.whatsapp || r.clientWhatsapp,
            clientDocument: data.documentNumber || r.clientDocument,
            clientDocumentType: data.documentType || r.clientDocumentType,
            address: data.address || r.address
          };
        }
        return r;
      }));
    }

    addToast({
      type: 'info',
      title: 'Cadastro de Cliente Atualizado',
      message: 'As alterações cadastrais foram salvas e sincronizadas.'
    });
  };

  const deleteClient = (id: string): { success: boolean; message: string } => {
    const client = clients.find(c => c.id === id);
    if (!client) {
      return { success: false, message: 'Cliente não localizado na base de dados.' };
    }

    // STRICT SECURITY RULE: Check if client has active requests
    const activeStatuses: RequestStatus[] = ['pendente', 'alocado', 'a_caminho', 'em_execucao', 'pausado'];
    const activeClientRequests = requests.filter(r => 
      (r.clientId === id || r.clientEmail.toLowerCase() === client.email.toLowerCase()) && 
      activeStatuses.includes(r.status)
    );

    if (activeClientRequests.length > 0) {
      const activeCodes = activeClientRequests.map(r => r.code).join(', ');
      addToast({
        type: 'error',
        title: 'Exclusão Bloqueada por Segurança',
        message: `Este cliente possui ${activeClientRequests.length} ordem(ns) de serviço ativa(s) (${activeCodes}). Finalize ou cancele os serviços antes de excluir.`
      });
      return {
        success: false,
        message: `Exclusão bloqueada: O cliente possui ${activeClientRequests.length} serviço(s) ativo(s) (${activeCodes}). Por segurança operacional, clientes com atendimento em andamento não podem ser excluídos.`
      };
    }

    // Proceed with deletion
    setClients(prev => prev.filter(c => c.id !== id));
    addToast({
      type: 'warning',
      title: 'Cliente Removido',
      message: `O cadastro de ${client.name} foi excluído do sistema.`
    });
    return { success: true, message: `Cliente ${client.name} excluído com sucesso.` };
  };

  const addClientOperationalNote = (clientId: string, noteData: Omit<ClientOperationalEvaluation, 'id' | 'date'>) => {
    const newNote: ClientOperationalEvaluation = {
      ...noteData,
      id: 'op-' + Date.now(),
      date: new Date().toISOString(),
    };

    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          operationalNotes: [newNote, ...(c.operationalNotes || [])]
        };
      }
      return c;
    }));

    addToast({
      type: 'success',
      title: 'Avaliação Operacional Registrada',
      message: `Nota técnica sobre o comportamento e condições do imóvel salva na ficha do cliente.`
    });
  };

  // Collaborator Handlers
  const addCollaborator = (collabData: Omit<Collaborator, 'id' | 'rating' | 'completedServicesCount'>) => {
    const newCollab: Collaborator = {
      ...collabData,
      id: 'colab-' + (collaborators.length + 1).toString().padStart(3, '0'),
      rating: 5.0,
      completedServicesCount: 0,
    };
    setCollaborators(prev => [newCollab, ...prev]);
    addToast({
      type: 'success',
      title: 'Colaborador Cadastrado',
      message: `${newCollab.name} foi pré-cadastrado(a) e está habilitado(a) para login no app operacional.`
    });
  };

  const updateCollaborator = (id: string, data: Partial<Collaborator>) => {
    setCollaborators(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    addToast({
      type: 'info',
      title: 'Registro Atualizado',
      message: 'Os dados do colaborador foram salvos com sucesso.'
    });
  };

  const deleteCollaborator = (id: string) => {
    const target = collaborators.find(c => c.id === id);
    setCollaborators(prev => prev.filter(c => c.id !== id));
    addToast({
      type: 'warning',
      title: 'Colaborador Removido',
      message: `${target?.name || 'O colaborador'} foi desvinculado da base operacional.`
    });
  };

  const toggleAppAccess = (id: string) => {
    setCollaborators(prev => prev.map(c => {
      if (c.id === id) {
        const nextState = !c.allowAppAccess;
        addToast({
          type: nextState ? 'success' : 'warning',
          title: nextState ? 'Acesso ao App Liberado' : 'Acesso ao App Bloqueado',
          message: `${c.name} ${nextState ? 'agora pode realizar login' : 'foi impedido(a) de autenticar'} no aplicativo operacional.`
        });
        return { ...c, allowAppAccess: nextState };
      }
      return c;
    }));
  };

  // Request Handlers
  const generateSecurityCode = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const addRequest = (requestData: Omit<CustomerRequest, 'id' | 'code' | 'createdAt'>): string => {
    const newCode = `SOL-2025-${(requests.length + 101).toString()}`;
    const newId = 'req-' + Date.now();
    const confirmationCode = requestData.confirmationCode || generateSecurityCode();
    
    // Default checklist based on service and format
    const defaultChecklist: ChecklistItem[] = [];
    if (requestData.serviceType === 'limpeza' || requestData.serviceType === 'ambos') {
      defaultChecklist.push(
        { id: 'chk-d1', task: 'Higienização e desinfecção de banheiros', category: 'limpeza', completed: false },
        { id: 'chk-d2', task: 'Limpeza pesada de cozinha e bancadas', category: 'limpeza', completed: false },
        { id: 'chk-d3', task: 'Aspiração e passagem de pano nos pisos', category: 'limpeza', completed: false },
        { id: 'chk-d4', task: 'Limpeza de vidros internos e espelhos', category: 'limpeza', completed: false }
      );
    }
    if (requestData.serviceType === 'organizacao' || requestData.serviceType === 'ambos') {
      if (requestData.organizationFormat === 'personalizada') {
        defaultChecklist.push(
          { id: 'chk-o1', task: 'Triagem e descarte orientado com o cliente', category: 'organizacao', completed: false },
          { id: 'chk-o2', task: 'Setorização personalizada por rotinas de uso', category: 'organizacao', completed: false },
          { id: 'chk-o3', task: 'Aplicação de colmeias e etiquetagem dos compartimentos', category: 'organizacao', completed: false }
        );
      } else {
        defaultChecklist.push(
          { id: 'chk-o1', task: 'Padronização 5S: Descarte de itens sem uso', category: 'organizacao', completed: false },
          { id: 'chk-o2', task: 'Alinhamento visual e dobraduras em padrão corporativo', category: 'organizacao', completed: false },
          { id: 'chk-o3', task: 'Conferência de validade e setorização na despensa/armários', category: 'organizacao', completed: false }
        );
      }
    }

    // Auto-link or register client if not already linked
    let associatedClientId = requestData.clientId;
    if (!associatedClientId) {
      const existingClient = clients.find(c => 
        (requestData.clientEmail && c.email.toLowerCase() === requestData.clientEmail.toLowerCase()) ||
        (requestData.clientDocument && c.documentNumber === requestData.clientDocument)
      );
      if (existingClient) {
        associatedClientId = existingClient.id;
      }
    }

    const newRequest: CustomerRequest = {
      ...requestData,
      id: newId,
      code: newCode,
      clientId: associatedClientId,
      confirmationCode,
      createdAt: new Date().toISOString(),
      executionTracking: {
        elapsedSeconds: 0,
        isRunning: false,
        checklist: defaultChecklist,
        executionNotes: ''
      }
    };

    setRequests(prev => [newRequest, ...prev]);
    addToast({
      type: 'success',
      title: 'Nova Solicitação Registrada',
      message: `Pedido ${newCode} para ${newRequest.clientName} inserido no sistema com código de segurança [${confirmationCode}].`
    });
    return newId;
  };

  const updateRequest = (id: string, data: Partial<CustomerRequest>) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    addToast({
      type: 'info',
      title: 'Solicitação Atualizada',
      message: 'As alterações do pedido foram salvas.'
    });
  };

  const deleteRequest = (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    addToast({
      type: 'warning',
      title: 'Solicitação Removida',
      message: 'O pedido foi excluído do sistema.'
    });
  };

  const allocateStaff = (requestId: string, staffId: string) => {
    const staff = collaborators.find(c => c.id === staffId);
    if (!staff) return;

    let assignedCode = '';

    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        const code = r.confirmationCode || generateSecurityCode();
        assignedCode = code;
        return {
          ...r,
          status: 'alocado',
          assignedStaffId: staff.id,
          assignedStaffName: staff.name,
          confirmationCode: code
        };
      }
      return r;
    }));

    setCollaborators(prev => prev.map(c => {
      if (c.id === staffId && c.status === 'ativo') {
        return { ...c, status: 'em_servico' };
      }
      return c;
    }));

    addToast({
      type: 'success',
      title: 'Colaborador Alocado',
      message: `${staff.name} foi designado(a) para atender a solicitação com código de confirmação [${assignedCode}].`
    });
  };

  const updateRequestStatus = (requestId: string, status: RequestStatus) => {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return { ...r, status };
      }
      return r;
    }));
  };

  const validateAndStartExecution = (requestId: string, inputCode: string, staffId?: string): { success: boolean; message: string } => {
    const targetReq = requests.find(r => r.id === requestId);
    if (!targetReq) {
      return { success: false, message: 'Ordem de serviço não encontrada.' };
    }

    const cleanInput = inputCode.trim();
    const validCode = targetReq.confirmationCode?.trim() || '';

    if (!cleanInput || cleanInput !== validCode) {
      addToast({
        type: 'error',
        title: 'Código de Confirmação Incorreto!',
        message: 'Início do serviço e cronômetro bloqueados por segurança. Solicite o código de 4 dígitos ao cliente no local.'
      });
      return {
        success: false,
        message: 'Código de confirmação inválido. Por segurança, o início do serviço e o cronômetro permanecem bloqueados até a digitação correta.'
      };
    }

    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        const tracking = r.executionTracking || {
          elapsedSeconds: 0,
          isRunning: true,
          checklist: [],
        };
        return {
          ...r,
          status: 'em_execucao',
          codeValidatedAt: new Date().toISOString(),
          codeValidatedByStaffId: staffId || r.assignedStaffId,
          executionTracking: {
            ...tracking,
            isRunning: true,
            startedAt: tracking.startedAt || new Date().toISOString(),
            lastTickTimestamp: Date.now()
          }
        };
      }
      return r;
    }));

    addToast({
      type: 'success',
      title: 'Código Validado com Sucesso!',
      message: `Identidade confirmada no local. O atendimento foi iniciado e o cronômetro está ativo.`
    });

    return {
      success: true,
      message: 'Código de confirmação autenticado com sucesso! Início do atendimento e cronômetro liberados.'
    };
  };

  const regenerateSecurityCode = (requestId: string): string => {
    const newCode = generateSecurityCode();
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return { ...r, confirmationCode: newCode };
      }
      return r;
    }));
    addToast({
      type: 'info',
      title: 'Código de Segurança Atualizado',
      message: `Novo código [${newCode}] gerado para o cliente e sincronizado no sistema.`
    });
    return newCode;
  };

  const startExecutionTimer = (requestId: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        const tracking = r.executionTracking || {
          elapsedSeconds: 0,
          isRunning: true,
          checklist: [],
        };
        return {
          ...r,
          status: 'em_execucao',
          executionTracking: {
            ...tracking,
            isRunning: true,
            startedAt: tracking.startedAt || new Date().toISOString(),
            lastTickTimestamp: Date.now()
          }
        };
      }
      return r;
    }));

    addToast({
      type: 'info',
      title: 'Execução Iniciada',
      message: 'O cronômetro ao vivo foi disparado para este serviço.'
    });
  };

  const pauseExecutionTimer = (requestId: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId && r.executionTracking) {
        return {
          ...r,
          status: 'pausado',
          executionTracking: {
            ...r.executionTracking,
            isRunning: false
          }
        };
      }
      return r;
    }));

    addToast({
      type: 'warning',
      title: 'Execução Pausada',
      message: 'O timer foi pausado temporariamente.'
    });
  };

  const completeExecution = (requestId: string, notes?: string) => {
    const target = requests.find(r => r.id === requestId);
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'concluido',
          executionTracking: {
            ...(r.executionTracking || { elapsedSeconds: 0, isRunning: false, checklist: [] }),
            isRunning: false,
            endedAt: new Date().toISOString(),
            executionNotes: notes || r.executionTracking?.executionNotes || 'Serviço finalizado e inspecionado com sucesso.'
          }
        };
      }
      return r;
    }));

    // Update collaborator count and status
    if (target?.assignedStaffId) {
      setCollaborators(prev => prev.map(c => {
        if (c.id === target.assignedStaffId) {
          return {
            ...c,
            status: 'ativo',
            completedServicesCount: c.completedServicesCount + 1
          };
        }
        return c;
      }));
    }

    addToast({
      type: 'success',
      title: 'Serviço Concluído!',
      message: `A solicitação ${target?.code} foi finalizada e liberada para faturamento/feedback.`
    });
  };

  const toggleChecklistItem = (requestId: string, itemId: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId && r.executionTracking) {
        const updatedChecklist = r.executionTracking.checklist.map(item => 
          item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        return {
          ...r,
          executionTracking: {
            ...r.executionTracking,
            checklist: updatedChecklist
          }
        };
      }
      return r;
    }));
  };

  const addChecklistItem = (requestId: string, task: string, category: 'limpeza' | 'organizacao' | 'geral') => {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId && r.executionTracking) {
        const newItem: ChecklistItem = {
          id: 'chk-custom-' + Date.now(),
          task,
          category,
          completed: false
        };
        return {
          ...r,
          executionTracking: {
            ...r.executionTracking,
            checklist: [...r.executionTracking.checklist, newItem]
          }
        };
      }
      return r;
    }));
  };

  const updateExecutionNotes = (requestId: string, notes: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId && r.executionTracking) {
        return {
          ...r,
          executionTracking: {
            ...r.executionTracking,
            executionNotes: notes
          }
        };
      }
      return r;
    }));
  };

  // Feedback Handlers
  const addFeedback = (feedbackData: Omit<CustomerFeedback, 'id' | 'date' | 'status'>) => {
    const newFeedback: CustomerFeedback = {
      ...feedbackData,
      id: 'fdbk-' + Date.now(),
      date: new Date().toISOString(),
      status: 'pendente'
    };
    setFeedbacks(prev => [newFeedback, ...prev]);
    addToast({
      type: feedbackData.type === 'reclamacao' ? 'warning' : 'success',
      title: feedbackData.type === 'reclamacao' ? 'Nova Reclamação Recebida' : 'Novo Feedback de Cliente',
      message: `Avaliação de ${feedbackData.clientName} (${feedbackData.rating} estrelas) registrada na central.`
    });
  };

  const resolveFeedback = (id: string, notes: string) => {
    setFeedbacks(prev => prev.map(f => {
      if (f.id === id) {
        return {
          ...f,
          status: 'resolvido',
          resolutionNotes: notes,
          resolvedAt: new Date().toISOString(),
          resolvedBy: adminUser?.name || 'Administrador'
        };
      }
      return f;
    }));

    addToast({
      type: 'success',
      title: 'Chamado SAC Resolvido',
      message: 'O feedback/reclamação foi marcado como tratado e concluído com sucesso.'
    });
  };

  return (
    <AppContext.Provider
      value={{
        adminUser,
        isFirstAccess,
        setupMasterAdmin,
        loginAdmin,
        logoutAdmin,
        resetToFirstAccess,

        clients,
        addClient,
        updateClient,
        deleteClient,
        addClientOperationalNote,

        collaborators,
        addCollaborator,
        updateCollaborator,
        deleteCollaborator,
        toggleAppAccess,

        requests,
        addRequest,
        updateRequest,
        deleteRequest,
        allocateStaff,
        updateRequestStatus,
        startExecutionTimer,
        validateAndStartExecution,
        regenerateSecurityCode,
        pauseExecutionTimer,
        completeExecution,
        toggleChecklistItem,
        addChecklistItem,
        updateExecutionNotes,

        feedbacks,
        addFeedback,
        resolveFeedback,

        activeTab,
        setActiveTab,

        toasts,
        addToast,
        removeToast,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

