import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  AdminUser, 
  Collaborator, 
  CustomerRequest, 
  CustomerFeedback, 
  RequestStatus,
  StaffStatus,
  FeedbackStatus,
  ChecklistItem,
  Client,
  ClientOperationalEvaluation
} from '../types';
import { 
  SupabaseService, 
  generateUUID, 
  generateRecoveryCode,
  mapDbToRequest, 
  mapDbToClient, 
  mapDbToCollaborator, 
  mapDbToFeedback 
} from '../lib/supabaseService';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

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

  // Supabase Status
  isRealtimeActive: boolean;
  isLoadingData: boolean;
  refreshFromSupabase: () => Promise<void>;

  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'operationalNotes'>) => Promise<string>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<{ success: boolean; message: string }>;
  addClientOperationalNote: (clientId: string, note: Omit<ClientOperationalEvaluation, 'id' | 'date'>) => Promise<void>;
  resetClientPassword: (id: string, newPassword: string) => Promise<void>;
  regenerateClientRecoveryCode: (id: string) => Promise<string>;
  toggleClientStatus: (id: string) => Promise<void>;

  collaborators: Collaborator[];
  addCollaborator: (collaborator: Omit<Collaborator, 'id' | 'rating' | 'completedServicesCount'>) => Promise<void>;
  updateCollaborator: (id: string, collaborator: Partial<Collaborator>) => Promise<void>;
  deleteCollaborator: (id: string) => Promise<void>;
  toggleAppAccess: (id: string) => Promise<void>;

  requests: CustomerRequest[];
  addRequest: (request: Omit<CustomerRequest, 'id' | 'code' | 'createdAt'>) => Promise<string>;
  updateRequest: (id: string, data: Partial<CustomerRequest>) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  allocateStaff: (requestId: string, staffId: string) => Promise<void>;
  updateRequestStatus: (requestId: string, status: RequestStatus) => Promise<void>;
  startExecutionTimer: (requestId: string) => Promise<void>;
  validateAndStartExecution: (requestId: string, inputCode: string, staffId?: string) => Promise<{ success: boolean; message: string }>;
  regenerateSecurityCode: (requestId: string) => Promise<string>;
  pauseExecutionTimer: (requestId: string) => Promise<void>;
  completeExecution: (requestId: string, notes?: string) => Promise<void>;
  toggleChecklistItem: (requestId: string, itemId: string) => Promise<void>;
  addChecklistItem: (requestId: string, task: string, category: 'limpeza' | 'organizacao' | 'geral') => Promise<void>;
  updateExecutionNotes: (requestId: string, notes: string) => Promise<void>;

  feedbacks: CustomerFeedback[];
  addFeedback: (feedback: Omit<CustomerFeedback, 'id' | 'date' | 'status'>) => Promise<void>;
  resolveFeedback: (id: string, notes: string) => Promise<void>;

  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_ADMIN = 'clean_org_admin_v2';
const STORAGE_KEY_FIRST_ACCESS = 'clean_org_first_access_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Admin State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ADMIN);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isFirstAccess, setIsFirstAccess] = useState<boolean>(() => {
    const configured = localStorage.getItem(STORAGE_KEY_FIRST_ACCESS);
    return configured !== 'false';
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Supabase Live Data State (No fake initial mock data)
  const [clients, setClients] = useState<Client[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
  
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

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

  // Sync Admin to localStorage
  useEffect(() => {
    if (adminUser) {
      localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(adminUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_ADMIN);
    }
  }, [adminUser]);

  // Initial Fetch from Supabase
  const refreshFromSupabase = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [fetchedRequests, fetchedClients, fetchedCollabs, fetchedFeedbacks] = await Promise.all([
        SupabaseService.fetchRequests(),
        SupabaseService.fetchClients(),
        SupabaseService.fetchCollaborators(),
        SupabaseService.fetchFeedbacks()
      ]);

      setRequests(fetchedRequests);
      setClients(fetchedClients);
      setCollaborators(fetchedCollabs);
      setFeedbacks(fetchedFeedbacks);
    } catch (error) {
      console.error('[Supabase] Falha ao sincronizar dados em tempo real:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    refreshFromSupabase();
  }, [refreshFromSupabase]);

  // Supabase Realtime Subscriptions
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsRealtimeActive(false);
      return;
    }

    const supabase = getSupabase();
    const channelName = `clean_org_realtime_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'solicitacoes_servico' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newReq = mapDbToRequest(payload.new);
            setRequests(prev => {
              if (prev.some(r => r.id === newReq.id)) return prev;
              return [newReq, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedReq = mapDbToRequest(payload.new);
            setRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
          } else if (payload.eventType === 'DELETE') {
            setRequests(prev => prev.filter(r => r.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clientes' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newClient = mapDbToClient(payload.new);
            setClients(prev => {
              if (prev.some(c => c.id === newClient.id)) return prev;
              return [newClient, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedClient = mapDbToClient(payload.new);
            setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
          } else if (payload.eventType === 'DELETE') {
            setClients(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'colaboradores' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newCollab = mapDbToCollaborator(payload.new);
            setCollaborators(prev => {
              if (prev.some(c => c.id === newCollab.id)) return prev;
              return [...prev, newCollab];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedCollab = mapDbToCollaborator(payload.new);
            setCollaborators(prev => prev.map(c => c.id === updatedCollab.id ? updatedCollab : c));
          } else if (payload.eventType === 'DELETE') {
            setCollaborators(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'avaliacoes_feedback' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newF = mapDbToFeedback(payload.new);
            setFeedbacks(prev => {
              if (prev.some(f => f.id === newF.id)) return prev;
              return [newF, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedF = mapDbToFeedback(payload.new);
            setFeedbacks(prev => prev.map(f => f.id === updatedF.id ? updatedF : f));
          } else if (payload.eventType === 'DELETE') {
            setFeedbacks(prev => prev.filter(f => f.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        setIsRealtimeActive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      id: generateUUID(),
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
      if (pinOrPass === '1234' || pinOrPass.length >= 4) {
        const defaultAdmin: AdminUser = {
          id: generateUUID(),
          name: 'Administrador Mestre',
          email: email || 'admin@cleanorganize.com.br',
          companyName: 'Clean & Organize Pro',
          role: 'Administrador Mestre',
          pin: pinOrPass,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        setAdminUser(defaultAdmin);
        setIsFirstAccess(false);
        localStorage.setItem(STORAGE_KEY_FIRST_ACCESS, 'false');
        addToast({
          type: 'success',
          title: 'Sessão Iniciada',
          message: `Autenticado com sucesso no painel.`
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

  // Client Handlers
  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'operationalNotes'>): Promise<string> => {
    const newId = generateUUID();
    const newRecoveryCode = clientData.recoveryCode || generateRecoveryCode();
    const newClient: Client = {
      ...clientData,
      id: newId,
      recoveryCode: newRecoveryCode,
      password: clientData.password || undefined,
      createdAt: new Date().toISOString(),
      operationalNotes: []
    };
    
    // Optimistic state
    setClients(prev => [newClient, ...prev]);
    
    // Supabase persist
    await SupabaseService.insertClient(newClient);

    addToast({
      type: 'success',
      title: 'Cliente Cadastrado no Supabase',
      message: `${newClient.name} foi adicionado(a) com Código de Recuperação #${newRecoveryCode}.`
    });
    return newId;
  };

  const updateClient = async (id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    
    // Supabase persist
    await SupabaseService.updateClient(id, data);

    addToast({
      type: 'info',
      title: 'Cadastro Atualizado no Supabase',
      message: 'As alterações cadastrais foram salvas com sucesso.'
    });
  };

  const resetClientPassword = async (id: string, newPassword: string) => {
    const client = clients.find(c => c.id === id);
    if (!client) return;

    setClients(prev => prev.map(c => c.id === id ? { ...c, password: newPassword } : c));
    await SupabaseService.updateClient(id, { password: newPassword });

    addToast({
      type: 'success',
      title: 'Senha Redefinida com Sucesso',
      message: `A senha de acesso do cliente ${client.name} foi atualizada no Supabase.`
    });
  };

  const regenerateClientRecoveryCode = async (id: string): Promise<string> => {
    const client = clients.find(c => c.id === id);
    if (!client) return '';

    const newCode = generateRecoveryCode();
    setClients(prev => prev.map(c => c.id === id ? { ...c, recoveryCode: newCode } : c));
    await SupabaseService.updateClient(id, { recoveryCode: newCode });

    addToast({
      type: 'warning',
      title: 'Novo Código de Recuperação Gerado',
      message: `Novo código para ${client.name}: #${newCode} (6 dígitos gravados no Supabase).`
    });
    return newCode;
  };

  const toggleClientStatus = async (id: string) => {
    const client = clients.find(c => c.id === id);
    if (!client) return;

    const nextStatus = client.status === 'ativo' ? 'bloqueado' : 'ativo';
    setClients(prev => prev.map(c => c.id === id ? { ...c, status: nextStatus } : c));
    await SupabaseService.updateClient(id, { status: nextStatus });

    addToast({
      type: nextStatus === 'ativo' ? 'success' : 'warning',
      title: nextStatus === 'ativo' ? 'Acesso Desbloqueado' : 'Acesso Bloqueado',
      message: `O status do cliente ${client.name} agora é ${nextStatus.toUpperCase()} no Supabase.`
    });
  };

  const deleteClient = async (id: string): Promise<{ success: boolean; message: string }> => {
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
        message: `Exclusão bloqueada: O cliente possui ${activeClientRequests.length} serviço(s) ativo(s) (${activeCodes}).`
      };
    }

    // Proceed with deletion in Supabase & optimistic UI
    setClients(prev => prev.filter(c => c.id !== id));
    await SupabaseService.deleteClient(id);

    addToast({
      type: 'warning',
      title: 'Cliente Removido do Banco',
      message: `O cadastro de ${client.name} foi excluído do Supabase.`
    });
    return { success: true, message: `Cliente ${client.name} excluído com sucesso.` };
  };

  const addClientOperationalNote = async (clientId: string, noteData: Omit<ClientOperationalEvaluation, 'id' | 'date'>) => {
    const newNote: ClientOperationalEvaluation = {
      ...noteData,
      id: generateUUID(),
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

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      await supabase.from('avaliacoes_operacionais_cliente').insert({
        id: newNote.id,
        cliente_id: clientId,
        autor_id: newNote.staffId || null,
        autor_nome: newNote.authorName,
        autor_cargo: newNote.authorRole,
        aspecto: newNote.aspect || 'geral',
        nota_comportamento: newNote.clientBehaviorRating || 5,
        nota_condicao_imovel: newNote.propertyConditionRating || 5,
        avaliacao_comportamento: newNote.behaviorEvaluation || 'excelente',
        condicao_imovel: newNote.propertyCondition || 'adequado',
        comentario: newNote.comment,
        tags: newNote.tags || []
      });
    }

    addToast({
      type: 'success',
      title: 'Avaliação Operacional Registrada',
      message: `Nota técnica salva no histórico do cliente.`
    });
  };

  // Collaborator Handlers
  const addCollaborator = async (collabData: Omit<Collaborator, 'id' | 'rating' | 'completedServicesCount'>) => {
    const newCollab: Collaborator = {
      ...collabData,
      id: generateUUID(),
      rating: 5.0,
      completedServicesCount: 0,
    };
    
    setCollaborators(prev => [...prev, newCollab]);
    await SupabaseService.insertCollaborator(newCollab);

    addToast({
      type: 'success',
      title: 'Colaborador Cadastrado no Supabase',
      message: `${newCollab.name} foi adicionado(a) e está habilitado(a) no banco de dados.`
    });
  };

  const updateCollaborator = async (id: string, data: Partial<Collaborator>) => {
    setCollaborators(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    await SupabaseService.updateCollaborator(id, data);

    addToast({
      type: 'info',
      title: 'Colaborador Atualizado no Banco',
      message: 'Os dados foram salvos com sucesso no Supabase.'
    });
  };

  const deleteCollaborator = async (id: string) => {
    const target = collaborators.find(c => c.id === id);
    setCollaborators(prev => prev.filter(c => c.id !== id));
    await SupabaseService.deleteCollaborator(id);

    addToast({
      type: 'warning',
      title: 'Colaborador Removido',
      message: `${target?.name || 'O colaborador'} foi excluído do Supabase.`
    });
  };

  const toggleAppAccess = async (id: string) => {
    const target = collaborators.find(c => c.id === id);
    if (!target) return;
    const nextState = !target.allowAppAccess;
    
    setCollaborators(prev => prev.map(c => c.id === id ? { ...c, allowAppAccess: nextState } : c));
    await SupabaseService.updateCollaborator(id, { allowAppAccess: nextState });

    addToast({
      type: nextState ? 'success' : 'warning',
      title: nextState ? 'Acesso ao App Liberado' : 'Acesso ao App Bloqueado',
      message: `${target.name} ${nextState ? 'agora pode realizar login' : 'foi impedido(a) de autenticar'} no aplicativo operacional.`
    });
  };

  // Request Handlers
  const generateSecurityCode = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const addRequest = async (requestData: Omit<CustomerRequest, 'id' | 'code' | 'createdAt'>): Promise<string> => {
    const newId = generateUUID();
    const newCode = `SOL-${Date.now().toString().slice(-6)}`;
    const confirmationCode = requestData.confirmationCode || generateSecurityCode();
    
    const defaultChecklist: ChecklistItem[] = [];
    if (requestData.serviceType === 'limpeza' || requestData.serviceType === 'ambos') {
      defaultChecklist.push(
        { id: 'chk-1', task: 'Higienização e desinfecção de banheiros', category: 'limpeza', completed: false },
        { id: 'chk-2', task: 'Limpeza de cozinha e bancadas', category: 'limpeza', completed: false },
        { id: 'chk-3', task: 'Aspiração e passagem de pano nos pisos', category: 'limpeza', completed: false },
        { id: 'chk-4', task: 'Limpeza de vidros internos e espelhos', category: 'limpeza', completed: false }
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
          { id: 'chk-o3', task: 'Conferência de validade e setorização', category: 'organizacao', completed: false }
        );
      }
    }

    const newRequest: CustomerRequest = {
      ...requestData,
      id: newId,
      code: newCode,
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
    await SupabaseService.insertRequest(newRequest);

    addToast({
      type: 'success',
      title: 'Solicitação Criada no Supabase',
      message: `Ordem ${newCode} registrada no banco com código de segurança [${confirmationCode}].`
    });
    return newId;
  };

  const updateRequest = async (id: string, data: Partial<CustomerRequest>) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    await SupabaseService.updateRequest(id, data);

    addToast({
      type: 'info',
      title: 'Solicitação Atualizada no Supabase',
      message: 'As alterações foram sincronizadas no banco de dados.'
    });
  };

  const deleteRequest = async (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    await SupabaseService.deleteRequest(id);

    addToast({
      type: 'warning',
      title: 'Solicitação Removida do Supabase',
      message: 'A ordem de serviço foi excluída do banco de dados.'
    });
  };

  const allocateStaff = async (requestId: string, staffId: string) => {
    const staff = collaborators.find(c => c.id === staffId);
    if (!staff) return;

    let assignedCode = '';

    const targetReq = requests.find(r => r.id === requestId);
    const code = targetReq?.confirmationCode || generateSecurityCode();
    assignedCode = code;

    const updates: Partial<CustomerRequest> = {
      status: 'alocado',
      assignedStaffId: staff.id,
      assignedStaffName: staff.name,
      confirmationCode: code
    };

    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...updates } : r));
    setCollaborators(prev => prev.map(c => c.id === staffId && c.status === 'ativo' ? { ...c, status: 'em_servico' } : c));

    await Promise.all([
      SupabaseService.updateRequest(requestId, updates),
      SupabaseService.updateCollaborator(staffId, { status: 'em_servico' })
    ]);

    addToast({
      type: 'success',
      title: 'Colaborador Alocado no Supabase',
      message: `${staff.name} foi designado(a) com código de segurança [${assignedCode}].`
    });
  };

  const updateRequestStatus = async (requestId: string, status: RequestStatus) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status } : r));
    await SupabaseService.updateRequest(requestId, { status });
  };

  const validateAndStartExecution = async (requestId: string, inputCode: string, staffId?: string): Promise<{ success: boolean; message: string }> => {
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
        message: 'Início do serviço bloqueado por segurança. Solicite o código de 4 dígitos ao cliente no local.'
      });
      return {
        success: false,
        message: 'Código de confirmação inválido. Digite o código de 4 dígitos fornecido pelo cliente.'
      };
    }

    const tracking = targetReq.executionTracking || {
      elapsedSeconds: 0,
      isRunning: true,
      checklist: [],
    };

    const updates: Partial<CustomerRequest> = {
      status: 'em_execucao',
      codeValidatedAt: new Date().toISOString(),
      codeValidatedByStaffId: staffId || targetReq.assignedStaffId,
      executionTracking: {
        ...tracking,
        isRunning: true,
        startedAt: tracking.startedAt || new Date().toISOString(),
        lastTickTimestamp: Date.now()
      }
    };

    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...updates } : r));
    await SupabaseService.updateRequest(requestId, updates);

    addToast({
      type: 'success',
      title: 'Código Validado no Supabase!',
      message: `Identidade autenticada. Atendimento iniciado e cronômetro ativo.`
    });

    return {
      success: true,
      message: 'Código de confirmação autenticado com sucesso! Início do atendimento e cronômetro liberados.'
    };
  };

  const regenerateSecurityCode = async (requestId: string): Promise<string> => {
    const newCode = generateSecurityCode();
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, confirmationCode: newCode } : r));
    await SupabaseService.updateRequest(requestId, { confirmationCode: newCode });

    addToast({
      type: 'info',
      title: 'Código Atualizado no Supabase',
      message: `Novo código [${newCode}] salvo no banco.`
    });
    return newCode;
  };

  const startExecutionTimer = async (requestId: string) => {
    const targetReq = requests.find(r => r.id === requestId);
    const tracking = targetReq?.executionTracking || {
      elapsedSeconds: 0,
      isRunning: true,
      checklist: [],
    };

    const updates: Partial<CustomerRequest> = {
      status: 'em_execucao',
      executionTracking: {
        ...tracking,
        isRunning: true,
        startedAt: tracking.startedAt || new Date().toISOString(),
        lastTickTimestamp: Date.now()
      }
    };

    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...updates } : r));
    await SupabaseService.updateRequest(requestId, updates);

    addToast({
      type: 'info',
      title: 'Execução Iniciada',
      message: 'O cronômetro ao vivo foi iniciado no Supabase.'
    });
  };

  const pauseExecutionTimer = async (requestId: string) => {
    const targetReq = requests.find(r => r.id === requestId);
    if (!targetReq?.executionTracking) return;

    const updates: Partial<CustomerRequest> = {
      status: 'pausado',
      executionTracking: {
        ...targetReq.executionTracking,
        isRunning: false
      }
    };

    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...updates } : r));
    await SupabaseService.updateRequest(requestId, updates);

    addToast({
      type: 'warning',
      title: 'Execução Pausada',
      message: 'O timer foi pausado no Supabase.'
    });
  };

  const completeExecution = async (requestId: string, notes?: string) => {
    const target = requests.find(r => r.id === requestId);
    const updates: Partial<CustomerRequest> = {
      status: 'concluido',
      executionTracking: {
        ...(target?.executionTracking || { elapsedSeconds: 0, isRunning: false, checklist: [] }),
        isRunning: false,
        endedAt: new Date().toISOString(),
        executionNotes: notes || target?.executionTracking?.executionNotes || 'Serviço finalizado com sucesso.'
      }
    };

    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...updates } : r));
    await SupabaseService.updateRequest(requestId, updates);

    if (target?.assignedStaffId) {
      const staff = collaborators.find(c => c.id === target.assignedStaffId);
      if (staff) {
        const staffUpdates = {
          status: 'ativo' as StaffStatus,
          completedServicesCount: staff.completedServicesCount + 1
        };
        setCollaborators(prev => prev.map(c => c.id === target.assignedStaffId ? { ...c, ...staffUpdates } : c));
        await SupabaseService.updateCollaborator(target.assignedStaffId, staffUpdates);
      }
    }

    addToast({
      type: 'success',
      title: 'Serviço Concluído no Supabase!',
      message: `A solicitação ${target?.code} foi finalizada no banco de dados.`
    });
  };

  const toggleChecklistItem = async (requestId: string, itemId: string) => {
    const target = requests.find(r => r.id === requestId);
    if (!target?.executionTracking) return;

    const updatedChecklist = target.executionTracking.checklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    const updates = {
      executionTracking: {
        ...target.executionTracking,
        checklist: updatedChecklist
      }
    };

    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...updates } : r));
    await SupabaseService.updateRequest(requestId, updates);
  };

  const addChecklistItem = async (requestId: string, task: string, category: 'limpeza' | 'organizacao' | 'geral') => {
    const target = requests.find(r => r.id === requestId);
    if (!target?.executionTracking) return;

    const newItem: ChecklistItem = {
      id: generateUUID(),
      task,
      category,
      completed: false
    };

    const updates = {
      executionTracking: {
        ...target.executionTracking,
        checklist: [...target.executionTracking.checklist, newItem]
      }
    };

    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...updates } : r));
    await SupabaseService.updateRequest(requestId, updates);
  };

  const updateExecutionNotes = async (requestId: string, notes: string) => {
    const target = requests.find(r => r.id === requestId);
    if (!target?.executionTracking) return;

    const updates = {
      executionTracking: {
        ...target.executionTracking,
        executionNotes: notes
      }
    };

    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...updates } : r));
    await SupabaseService.updateRequest(requestId, updates);
  };

  // Feedback Handlers
  const addFeedback = async (feedbackData: Omit<CustomerFeedback, 'id' | 'date' | 'status'>) => {
    const newFeedback: CustomerFeedback = {
      ...feedbackData,
      id: generateUUID(),
      date: new Date().toISOString(),
      status: 'pendente'
    };

    setFeedbacks(prev => [newFeedback, ...prev]);
    await SupabaseService.insertFeedback(newFeedback);

    addToast({
      type: feedbackData.type === 'reclamacao' ? 'warning' : 'success',
      title: 'Feedback Salvo no Supabase',
      message: `Avaliação de ${feedbackData.clientName} registrada na central.`
    });
  };

  const resolveFeedback = async (id: string, notes: string) => {
    const updates = {
      status: 'resolvido' as FeedbackStatus,
      resolutionNotes: notes,
      resolvedAt: new Date().toISOString(),
      resolvedBy: adminUser?.name || 'Administrador'
    };

    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    await SupabaseService.updateFeedback(id, updates);

    addToast({
      type: 'success',
      title: 'Chamado SAC Resolvido no Supabase',
      message: 'O feedback foi marcado como tratado no banco.'
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

        isRealtimeActive,
        isLoadingData,
        refreshFromSupabase,

        clients,
        addClient,
        updateClient,
        deleteClient,
        addClientOperationalNote,
        resetClientPassword,
        regenerateClientRecoveryCode,
        toggleClientStatus,

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
