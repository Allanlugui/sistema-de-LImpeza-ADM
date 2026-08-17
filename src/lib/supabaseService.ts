import { getSupabase, isSupabaseConfigured } from './supabase';
import {
  CustomerRequest,
  Client,
  Collaborator,
  CustomerFeedback,
  ClientOperationalEvaluation,
  RequestStatus,
  ServiceType,
  OrgFormat,
  DocumentType,
  StaffRole,
  StaffStatus,
  FeedbackType,
  FeedbackStatus,
  ClientStatus
} from '../types';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateRecoveryCode(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const code = 100000 + (array[0] % 900000);
    return code.toString();
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// --------------------------------------------------------------------------
// MAPPERS: Database -> Application Types
// --------------------------------------------------------------------------

export function mapDbToRequest(row: any): CustomerRequest {
  return {
    id: row.id,
    code: row.codigo_ordem || row.code || `SOL-${String(row.id).slice(0, 6)}`,
    clientId: row.cliente_id || row.clientId || undefined,
    clientName: row.cliente_nome || row.clientName || 'Cliente',
    clientDocument: row.cliente_documento || row.clientDocument || '',
    clientDocumentType: (row.cliente_documento_tipo || row.clientDocumentType || 'CPF') as DocumentType,
    clientEmail: row.cliente_email || row.clientEmail || '',
    clientPhone: row.cliente_telefone || row.clientPhone || '',
    clientWhatsapp: row.cliente_whatsapp || row.clientWhatsapp || row.cliente_telefone || '',
    address: row.endereco || row.endereco_completo || row.address || {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '',
      referencePoint: ''
    },
    serviceType: (row.tipo_servico || row.serviceType || 'limpeza') as ServiceType,
    organizationFormat: (row.formato_organizacao || row.organizationFormat || 'padrao_empresa') as OrgFormat,
    orgDetails: row.detalhes_organizacao || row.orgDetails || undefined,
    propertyDetails: row.detalhes_imovel || row.propertyDetails || {
      rooms: 2,
      bathrooms: 1,
      approxAreaM2: 70,
      hasPets: false
    },
    scheduleDate: row.data_agendada || row.scheduleDate || new Date().toISOString().split('T')[0],
    scheduleTime: (row.horario_agendado || row.scheduleTime || '08:00').slice(0, 5),
    estimatedDurationHours: Number(row.duracao_estimada_horas || row.estimatedDurationHours || 4),
    price: Number(row.preco || row.price || row.valor_total || 0),
    status: (row.status || 'pendente') as RequestStatus,
    assignedStaffId: row.colaborador_id || row.assignedStaffId || undefined,
    assignedStaffName: row.colaborador_nome || row.assignedStaffName || undefined,
    priority: (row.prioridade || row.priority || 'media') as 'baixa' | 'media' | 'alta',
    clientNotes: row.observacoes_cliente || row.clientNotes || '',
    confirmationCode: row.codigo_confirmacao || row.codigo_seguranca || row.confirmationCode || '1234',
    codeValidatedAt: row.codigo_validado_em || row.codeValidatedAt || undefined,
    codeValidatedByStaffId: row.codigo_validado_por_id || row.codeValidatedByStaffId || undefined,
    executionTracking: row.rastreamento_execucao || row.executionTracking || {
      elapsedSeconds: 0,
      isRunning: false,
      checklist: []
    },
    createdAt: row.created_at || row.createdAt || new Date().toISOString()
  };
}

export function mapRequestToDb(req: Partial<CustomerRequest>): Record<string, any> {
  const dbRow: Record<string, any> = {};

  if (req.id) dbRow.id = req.id;
  if (req.code) dbRow.codigo_ordem = req.code;
  if (req.clientId !== undefined) dbRow.cliente_id = req.clientId || null;
  if (req.clientName !== undefined) dbRow.cliente_nome = req.clientName;
  if (req.clientDocument !== undefined) dbRow.cliente_documento = req.clientDocument;
  if (req.clientDocumentType !== undefined) dbRow.cliente_documento_tipo = req.clientDocumentType;
  if (req.clientEmail !== undefined) dbRow.cliente_email = req.clientEmail;
  if (req.clientPhone !== undefined) dbRow.cliente_telefone = req.clientPhone;
  if (req.clientWhatsapp !== undefined) dbRow.cliente_whatsapp = req.clientWhatsapp;
  if (req.address !== undefined) dbRow.endereco = req.address;
  if (req.serviceType !== undefined) dbRow.tipo_servico = req.serviceType;
  if (req.organizationFormat !== undefined) dbRow.formato_organizacao = req.organizationFormat;
  if (req.orgDetails !== undefined) dbRow.detalhes_organizacao = req.orgDetails;
  if (req.propertyDetails !== undefined) dbRow.detalhes_imovel = req.propertyDetails;
  if (req.scheduleDate !== undefined) dbRow.data_agendada = req.scheduleDate;
  if (req.scheduleTime !== undefined) dbRow.horario_agendado = req.scheduleTime;
  if (req.estimatedDurationHours !== undefined) dbRow.duracao_estimada_horas = req.estimatedDurationHours;
  if (req.price !== undefined) dbRow.preco = req.price;
  if (req.status !== undefined) dbRow.status = req.status;
  if (req.assignedStaffId !== undefined) dbRow.colaborador_id = req.assignedStaffId || null;
  if (req.assignedStaffName !== undefined) dbRow.colaborador_nome = req.assignedStaffName || null;
  if (req.priority !== undefined) dbRow.prioridade = req.priority;
  if (req.clientNotes !== undefined) dbRow.observacoes_cliente = req.clientNotes;
  if (req.confirmationCode !== undefined) dbRow.codigo_confirmacao = req.confirmationCode;
  if (req.codeValidatedAt !== undefined) dbRow.codigo_validado_em = req.codeValidatedAt;
  if (req.codeValidatedByStaffId !== undefined) dbRow.codigo_validado_por_id = req.codeValidatedByStaffId || null;
  if (req.executionTracking !== undefined) dbRow.rastreamento_execucao = req.executionTracking;

  return dbRow;
}

export function mapDbToClient(row: any, operationalNotes: ClientOperationalEvaluation[] = []): Client {
  const clientNotes = operationalNotes.filter(n => n.staffId === row.id || (n as any).clientId === row.id);

  return {
    id: row.id,
    name: row.nome || row.name || 'Cliente',
    photoUrl: row.foto_url || row.photo_url || row.photoUrl || undefined,
    documentType: (row.tipo_documento || row.document_type || row.documentType || 'CPF') as DocumentType,
    documentNumber: row.documento || row.document_number || row.documentNumber || '',
    email: row.email || '',
    phone: row.telefone || row.phone || '',
    whatsapp: row.whatsapp || row.telefone || '',
    preferredContact: row.canal_preferencial || row.preferred_contact || row.preferredContact || 'whatsapp',
    address: {
      street: row.logradouro || row.address?.street || '',
      number: row.numero || row.address?.number || '',
      complement: row.complemento || row.address?.complement || '',
      neighborhood: row.bairro || row.address?.neighborhood || '',
      city: row.cidade || row.address?.city || 'São Paulo',
      state: row.estado || row.address?.state || 'SP',
      zipCode: row.cep || row.address?.zipCode || '',
      referencePoint: row.ponto_referencia || row.address?.referencePoint || ''
    },
    status: (row.status || 'ativo') as ClientStatus,
    recoveryCode: row.recovery_code || row.codigo_recuperacao || row.recoveryCode || undefined,
    password: row.password || row.senha || row.password_hash || undefined,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    notes: row.observacoes_internas || row.notes || '',
    preferredServiceType: row.servico_preferencial || row.preferred_service_type || row.preferredServiceType || undefined,
    preferredOrgFormat: row.formato_organizacao_preferencial || row.preferred_org_format || row.preferredOrgFormat || undefined,
    emergencyContact: row.contato_emergencia || row.emergency_contact || row.emergencyContact || undefined,
    operationalNotes: clientNotes
  };
}

export function mapClientToDb(c: Partial<Client>): Record<string, any> {
  const dbRow: Record<string, any> = {};

  if (c.id) dbRow.id = c.id;
  if (c.name !== undefined) {
    dbRow.nome = c.name;
    dbRow.name = c.name;
  }
  if (c.photoUrl !== undefined) {
    dbRow.foto_url = c.photoUrl;
    dbRow.photo_url = c.photoUrl;
  }
  if (c.documentType !== undefined) {
    dbRow.tipo_documento = c.documentType;
    dbRow.document_type = c.documentType;
  }
  if (c.documentNumber !== undefined) {
    dbRow.documento = c.documentNumber;
    dbRow.document_number = c.documentNumber;
  }
  if (c.email !== undefined) dbRow.email = c.email;
  if (c.phone !== undefined) {
    dbRow.telefone = c.phone;
    dbRow.phone = c.phone;
  }
  if (c.whatsapp !== undefined) dbRow.whatsapp = c.whatsapp;
  if (c.preferredContact !== undefined) {
    dbRow.canal_preferencial = c.preferredContact;
    dbRow.preferred_contact = c.preferredContact;
  }

  if (c.address) {
    if (c.address.street !== undefined) dbRow.logradouro = c.address.street;
    if (c.address.number !== undefined) dbRow.numero = c.address.number;
    if (c.address.complement !== undefined) dbRow.complemento = c.address.complement;
    if (c.address.neighborhood !== undefined) dbRow.bairro = c.address.neighborhood;
    if (c.address.city !== undefined) dbRow.cidade = c.address.city;
    if (c.address.state !== undefined) dbRow.estado = c.address.state;
    if (c.address.zipCode !== undefined) dbRow.cep = c.address.zipCode;
    if (c.address.referencePoint !== undefined) dbRow.ponto_referencia = c.address.referencePoint;
    dbRow.address = c.address;
  }

  if (c.status !== undefined) dbRow.status = c.status;
  if (c.recoveryCode !== undefined) {
    dbRow.recovery_code = c.recoveryCode;
    dbRow.codigo_recuperacao = c.recoveryCode;
  }
  if (c.password !== undefined) {
    dbRow.password = c.password;
    dbRow.senha = c.password;
  }
  if (c.notes !== undefined) dbRow.observacoes_internas = c.notes;
  if (c.preferredServiceType !== undefined) dbRow.servico_preferencial = c.preferredServiceType;
  if (c.preferredOrgFormat !== undefined) dbRow.formato_organizacao_preferencial = c.preferredOrgFormat;
  if (c.emergencyContact !== undefined) dbRow.contato_emergencia = c.emergencyContact;

  return dbRow;
}

export function mapDbToCollaborator(row: any): Collaborator {
  return {
    id: row.id,
    name: row.nome || row.name || 'Colaborador',
    email: row.email || '',
    cpf: row.cpf || '',
    phone: row.telefone || row.phone || '',
    photoUrl: row.foto_url || row.photoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    role: (row.cargo || row.role || 'Diarista Profissional') as StaffRole,
    status: (row.status || row.status_disponibilidade || 'ativo') as StaffStatus,
    rating: Number(row.avaliacao_media || row.rating || 5.0),
    completedServicesCount: Number(row.total_servicos_concluidos || row.completedServicesCount || 0),
    hireDate: row.data_contratacao || row.hireDate || new Date().toISOString().split('T')[0],
    specialties: Array.isArray(row.especialidades) ? row.especialidades : ['Limpeza Residencial', 'Organização'],
    notes: row.observacoes_operacionais || row.notes || '',
    allowAppAccess: row.permite_acesso_app !== false,
    emergencyContact: row.contato_emergencia || row.emergencyContact || ''
  };
}

export function mapCollaboratorToDb(collab: Partial<Collaborator>): Record<string, any> {
  const dbRow: Record<string, any> = {};

  if (collab.id) dbRow.id = collab.id;
  if (collab.name !== undefined) dbRow.nome = collab.name;
  if (collab.email !== undefined) dbRow.email = collab.email;
  if (collab.cpf !== undefined) dbRow.cpf = collab.cpf;
  if (collab.phone !== undefined) dbRow.telefone = collab.phone;
  if (collab.photoUrl !== undefined) dbRow.foto_url = collab.photoUrl;
  if (collab.role !== undefined) dbRow.cargo = collab.role;
  if (collab.status !== undefined) dbRow.status = collab.status;
  if (collab.rating !== undefined) dbRow.avaliacao_media = collab.rating;
  if (collab.completedServicesCount !== undefined) dbRow.total_servicos_concluidos = collab.completedServicesCount;
  if (collab.hireDate !== undefined) dbRow.data_contratacao = collab.hireDate;
  if (collab.specialties !== undefined) dbRow.especialidades = collab.specialties;
  if (collab.notes !== undefined) dbRow.observacoes_operacionais = collab.notes;
  if (collab.allowAppAccess !== undefined) dbRow.permite_acesso_app = collab.allowAppAccess;
  if (collab.emergencyContact !== undefined) dbRow.contato_emergencia = collab.emergencyContact;

  return dbRow;
}

export function mapDbToFeedback(row: any): CustomerFeedback {
  return {
    id: row.id,
    requestId: row.solicitacao_id || row.requestId || '',
    requestCode: row.solicitacao_codigo || row.requestCode || '',
    clientName: row.cliente_nome || row.clientName || 'Cliente',
    clientEmail: row.cliente_email || row.clientEmail || '',
    staffId: row.colaborador_id || row.staffId || undefined,
    staffName: row.colaborador_nome || row.staffName || undefined,
    serviceType: (row.tipo_servico || row.serviceType || 'limpeza') as ServiceType,
    rating: Number(row.nota || row.rating || 5),
    type: (row.tipo || row.type || 'elogio') as FeedbackType,
    title: row.titulo || row.title || 'Feedback de Atendimento',
    comment: row.comentario || row.comment || '',
    date: row.created_at || row.date || new Date().toISOString(),
    status: (row.status || row.status_tratativa || 'pendente') as FeedbackStatus,
    resolutionNotes: row.notas_resolucao || row.resposta_gestao || undefined,
    resolvedAt: row.resolvido_em || undefined,
    resolvedBy: row.resolvido_por || undefined
  };
}

export function mapFeedbackToDb(f: Partial<CustomerFeedback>): Record<string, any> {
  const dbRow: Record<string, any> = {};

  if (f.id) dbRow.id = f.id;
  if (f.requestId !== undefined) dbRow.solicitacao_id = f.requestId || null;
  if (f.requestCode !== undefined) dbRow.solicitacao_codigo = f.requestCode;
  if (f.clientName !== undefined) dbRow.cliente_nome = f.clientName;
  if (f.clientEmail !== undefined) dbRow.cliente_email = f.clientEmail;
  if (f.staffId !== undefined) dbRow.colaborador_id = f.staffId || null;
  if (f.staffName !== undefined) dbRow.colaborador_nome = f.staffName || null;
  if (f.serviceType !== undefined) dbRow.tipo_servico = f.serviceType;
  if (f.rating !== undefined) dbRow.nota = f.rating;
  if (f.type !== undefined) dbRow.tipo = f.type;
  if (f.title !== undefined) dbRow.titulo = f.title;
  if (f.comment !== undefined) dbRow.comentario = f.comment;
  if (f.status !== undefined) dbRow.status = f.status;
  if (f.resolutionNotes !== undefined) dbRow.notas_resolucao = f.resolutionNotes;
  if (f.resolvedAt !== undefined) dbRow.resolvido_em = f.resolvedAt;
  if (f.resolvedBy !== undefined) dbRow.resolvido_por = f.resolvedBy;

  return dbRow;
}

// --------------------------------------------------------------------------
// CRUD & REALTIME SERVICE FUNCTIONS
// --------------------------------------------------------------------------

export const SupabaseService = {
  // Fetch All Requests
  async fetchRequests(): Promise<CustomerRequest[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('solicitacoes_servico')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Supabase] Erro ao buscar solicitações:', error.message);
        return [];
      }
      return (data || []).map(mapDbToRequest);
    } catch (err) {
      console.error('[Supabase] Falha de conexão ao buscar solicitações:', err);
      return [];
    }
  },

  // Fetch All Clients
  async fetchClients(): Promise<Client[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const supabase = getSupabase();
      const { data: clientsData, error: clientErr } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientErr) {
        console.error('[Supabase] Erro ao buscar clientes:', clientErr.message);
        return [];
      }

      // Fetch operational notes if available
      let opNotes: ClientOperationalEvaluation[] = [];
      try {
        const { data: notesData } = await supabase
          .from('avaliacoes_operacionais_cliente')
          .select('*');
        if (notesData) {
          opNotes = notesData.map((n: any) => ({
            id: n.id,
            clientId: n.cliente_id,
            date: n.created_at,
            authorName: n.autor_nome || 'Supervisora',
            authorRole: n.autor_cargo || 'Supervisora',
            staffId: n.autor_id,
            clientBehaviorRating: n.nota_comportamento,
            propertyConditionRating: n.nota_condicao_imovel,
            behaviorEvaluation: n.avaliacao_comportamento,
            propertyCondition: n.condicao_imovel,
            comment: n.comentario,
            tags: n.tags || []
          }));
        }
      } catch (e) {
        // Table might not have records
      }

      return (clientsData || []).map(row => mapDbToClient(row, opNotes));
    } catch (err) {
      console.error('[Supabase] Falha ao carregar clientes:', err);
      return [];
    }
  },

  // Fetch All Collaborators
  async fetchCollaborators(): Promise<Collaborator[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('[Supabase] Erro ao buscar colaboradores:', error.message);
        return [];
      }
      return (data || []).map(mapDbToCollaborator);
    } catch (err) {
      console.error('[Supabase] Falha ao carregar colaboradores:', err);
      return [];
    }
  },

  // Fetch All Feedbacks
  async fetchFeedbacks(): Promise<CustomerFeedback[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('avaliacoes_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Supabase] Erro ao buscar feedbacks:', error.message);
        return [];
      }
      return (data || []).map(mapDbToFeedback);
    } catch (err) {
      console.error('[Supabase] Falha ao carregar feedbacks:', err);
      return [];
    }
  },

  // Insert Request
  async insertRequest(request: CustomerRequest): Promise<CustomerRequest | null> {
    if (!isSupabaseConfigured()) return request;
    try {
      const supabase = getSupabase();
      const dbRow = mapRequestToDb(request);
      const { data, error } = await supabase
        .from('solicitacoes_servico')
        .insert(dbRow)
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Erro ao salvar solicitação:', error.message);
        return null;
      }
      return mapDbToRequest(data);
    } catch (err) {
      console.error('[Supabase] Falha na gravação da solicitação:', err);
      return null;
    }
  },

  // Update Request
  async updateRequest(id: string, updates: Partial<CustomerRequest>): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;
    try {
      const supabase = getSupabase();
      const dbRow = mapRequestToDb(updates);
      delete dbRow.id; // do not update primary key
      const { error } = await supabase
        .from('solicitacoes_servico')
        .update(dbRow)
        .eq('id', id);

      if (error) {
        console.error('[Supabase] Erro ao atualizar solicitação:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase] Falha ao atualizar solicitação:', err);
      return false;
    }
  },

  // Delete Request
  async deleteRequest(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('solicitacoes_servico')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[Supabase] Erro ao deletar solicitação:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase] Falha ao deletar solicitação:', err);
      return false;
    }
  },

  // Insert Client
  async insertClient(client: Client): Promise<Client | null> {
    if (!isSupabaseConfigured()) return client;
    try {
      const supabase = getSupabase();
      const dbRow = mapClientToDb(client);
      const { data, error } = await supabase
        .from('clientes')
        .insert(dbRow)
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Erro ao cadastrar cliente:', error.message);
        return null;
      }
      return mapDbToClient(data);
    } catch (err) {
      console.error('[Supabase] Falha na gravação do cliente:', err);
      return null;
    }
  },

  // Update Client
  async updateClient(id: string, updates: Partial<Client>): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;
    try {
      const supabase = getSupabase();
      const dbRow = mapClientToDb(updates);
      delete dbRow.id;
      const { error } = await supabase
        .from('clientes')
        .update(dbRow)
        .eq('id', id);

      if (error) {
        console.error('[Supabase] Erro ao atualizar cliente:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase] Falha ao atualizar cliente:', err);
      return false;
    }
  },

  // Delete Client
  async deleteClient(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[Supabase] Erro ao excluir cliente:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase] Falha ao excluir cliente:', err);
      return false;
    }
  },

  // Insert Collaborator
  async insertCollaborator(collab: Collaborator): Promise<Collaborator | null> {
    if (!isSupabaseConfigured()) return collab;
    try {
      const supabase = getSupabase();
      const dbRow = mapCollaboratorToDb(collab);
      const { data, error } = await supabase
        .from('colaboradores')
        .insert(dbRow)
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Erro ao cadastrar colaborador:', error.message);
        return null;
      }
      return mapDbToCollaborator(data);
    } catch (err) {
      console.error('[Supabase] Falha na gravação do colaborador:', err);
      return null;
    }
  },

  // Update Collaborator
  async updateCollaborator(id: string, updates: Partial<Collaborator>): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;
    try {
      const supabase = getSupabase();
      const dbRow = mapCollaboratorToDb(updates);
      delete dbRow.id;
      const { error } = await supabase
        .from('colaboradores')
        .update(dbRow)
        .eq('id', id);

      if (error) {
        console.error('[Supabase] Erro ao atualizar colaborador:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase] Falha ao atualizar colaborador:', err);
      return false;
    }
  },

  // Delete Collaborator
  async deleteCollaborator(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('colaboradores')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[Supabase] Erro ao excluir colaborador:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase] Falha ao excluir colaborador:', err);
      return false;
    }
  },

  // Insert Feedback
  async insertFeedback(feedback: CustomerFeedback): Promise<CustomerFeedback | null> {
    if (!isSupabaseConfigured()) return feedback;
    try {
      const supabase = getSupabase();
      const dbRow = mapFeedbackToDb(feedback);
      const { data, error } = await supabase
        .from('avaliacoes_feedback')
        .insert(dbRow)
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Erro ao cadastrar feedback:', error.message);
        return null;
      }
      return mapDbToFeedback(data);
    } catch (err) {
      console.error('[Supabase] Falha ao inserir feedback:', err);
      return null;
    }
  },

  // Update Feedback
  async updateFeedback(id: string, updates: Partial<CustomerFeedback>): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;
    try {
      const supabase = getSupabase();
      const dbRow = mapFeedbackToDb(updates);
      delete dbRow.id;
      const { error } = await supabase
        .from('avaliacoes_feedback')
        .update(dbRow)
        .eq('id', id);

      if (error) {
        console.error('[Supabase] Erro ao atualizar feedback:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase] Falha ao atualizar feedback:', err);
      return false;
    }
  }
};
