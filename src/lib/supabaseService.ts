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
  ClientStatus,
  SystemNotification,
  NotificationAcknowledgement,
  NotificationTarget,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus
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
// SCHEMA DIALECT DETECTION & MAPPERS: Database <-> Application Types
// --------------------------------------------------------------------------

type SchemaDialect = 'en' | 'pt';

const detectedDialects: Record<string, SchemaDialect> = {
  colaboradores: 'pt',
  clientes: 'pt',
  solicitacoes_servico: 'pt',
  avaliacoes_feedback: 'pt',
  notificacoes_sistema: 'pt'
};

function isSchemaColumnError(err: any): boolean {
  if (!err) return false;
  const code = String(err.code || '');
  const msg = String(err.message || '').toLowerCase();
  const details = String(err.details || '').toLowerCase();
  const hint = String(err.hint || '').toLowerCase();
  return (
    code === 'PGRST204' ||
    code === '42703' ||
    code === 'PGRST200' ||
    code === '42883' ||
    msg.includes('column') ||
    msg.includes('schema cache') ||
    msg.includes('could not find') ||
    msg.includes('does not exist') ||
    details.includes('column') ||
    hint.includes('column')
  );
}

// 1. CLIENT MAPPERS
export function mapDbToClient(row: any, operationalNotes: ClientOperationalEvaluation[] = []): Client {
  const embeddedNotes = Array.isArray(row.operational_notes) ? row.operational_notes : [];
  const clientNotes = [
    ...embeddedNotes,
    ...operationalNotes
  ];
  const uniqueNotes = Array.from(new Map(clientNotes.map(item => [item.id, item])).values());

  const addressObj = typeof row.address === 'object' && row.address !== null
    ? row.address
    : (typeof row.endereco === 'object' && row.endereco !== null ? row.endereco : {
        street: row.logradouro || '',
        number: row.numero || '',
        complement: row.complemento || '',
        neighborhood: row.bairro || '',
        city: row.cidade || 'São Paulo',
        state: row.estado || 'SP',
        zipCode: row.cep || '',
        referencePoint: row.ponto_referencia || ''
      });

  return {
    id: row.id,
    name: row.name || row.nome || 'Cliente',
    photoUrl: row.photo_url || row.foto_url || undefined,
    documentType: (row.document_type || row.tipo_documento || 'CPF') as DocumentType,
    documentNumber: row.document_number || row.documento || '',
    email: row.email || '',
    phone: row.phone || row.telefone || '',
    whatsapp: row.whatsapp || row.telefone || '',
    preferredContact: row.preferred_contact || row.canal_preferencial || 'whatsapp',
    address: {
      street: addressObj.street || addressObj.logradouro || '',
      number: addressObj.number || addressObj.numero || '',
      complement: addressObj.complement || addressObj.complemento || '',
      neighborhood: addressObj.neighborhood || addressObj.bairro || '',
      city: addressObj.city || addressObj.cidade || 'São Paulo',
      state: addressObj.state || addressObj.estado || 'SP',
      zipCode: addressObj.zipCode || addressObj.cep || '',
      referencePoint: addressObj.referencePoint || addressObj.ponto_referencia || ''
    },
    status: (row.status || 'ativo') as ClientStatus,
    recoveryCode: row.recovery_code || row.codigo_recuperacao || undefined,
    password: row.password || row.senha || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    notes: row.notes || row.observacoes_internas || '',
    preferredServiceType: row.preferred_service_type || row.servico_preferencial || undefined,
    preferredOrgFormat: row.preferred_org_format || row.formato_organizacao_preferencial || undefined,
    emergencyContact: row.emergency_contact || row.contato_emergencia || undefined,
    operationalNotes: uniqueNotes
  };
}

export function mapClientToDb(c: Partial<Client>, dialect: SchemaDialect = detectedDialects.clientes || 'en'): Record<string, any> {
  const dbRow: Record<string, any> = {};

  if (dialect === 'pt') {
    if (c.id !== undefined) dbRow.id = c.id;
    if (c.name !== undefined) dbRow.nome = c.name;
    if (c.photoUrl !== undefined) dbRow.foto_url = c.photoUrl;
    if (c.documentType !== undefined) dbRow.tipo_documento = c.documentType;
    if (c.documentNumber !== undefined) dbRow.documento = c.documentNumber;
    if (c.email !== undefined) dbRow.email = c.email;
    if (c.phone !== undefined) dbRow.telefone = c.phone;
    if (c.whatsapp !== undefined) dbRow.whatsapp = c.whatsapp;
    if (c.preferredContact !== undefined) dbRow.canal_preferencial = c.preferredContact;
    if (c.address !== undefined) dbRow.endereco = c.address;
    if (c.status !== undefined) dbRow.status = c.status;
    if (c.recoveryCode !== undefined) dbRow.codigo_recuperacao = c.recoveryCode;
    if (c.password !== undefined) dbRow.senha = c.password;
    if (c.notes !== undefined) dbRow.observacoes_internas = c.notes;
    if (c.preferredServiceType !== undefined) dbRow.servico_preferencial = c.preferredServiceType;
    if (c.preferredOrgFormat !== undefined) dbRow.formato_organizacao_preferencial = c.preferredOrgFormat;
    if (c.emergencyContact !== undefined) dbRow.contato_emergencia = c.emergencyContact;
    if (c.operationalNotes !== undefined) dbRow.operational_notes = c.operationalNotes;
  } else {
    if (c.id !== undefined) dbRow.id = c.id;
    if (c.name !== undefined) dbRow.name = c.name;
    if (c.photoUrl !== undefined) dbRow.photo_url = c.photoUrl;
    if (c.documentType !== undefined) dbRow.document_type = c.documentType;
    if (c.documentNumber !== undefined) dbRow.document_number = c.documentNumber;
    if (c.email !== undefined) dbRow.email = c.email;
    if (c.phone !== undefined) dbRow.phone = c.phone;
    if (c.whatsapp !== undefined) dbRow.whatsapp = c.whatsapp;
    if (c.preferredContact !== undefined) dbRow.preferred_contact = c.preferredContact;
    if (c.address !== undefined) dbRow.address = c.address;
    if (c.status !== undefined) dbRow.status = c.status;
    if (c.recoveryCode !== undefined) dbRow.recovery_code = c.recoveryCode;
    if (c.password !== undefined) dbRow.password = c.password;
    if (c.notes !== undefined) dbRow.notes = c.notes;
    if (c.preferredServiceType !== undefined) dbRow.preferred_service_type = c.preferredServiceType;
    if (c.preferredOrgFormat !== undefined) dbRow.preferred_org_format = c.preferredOrgFormat;
    if (c.emergencyContact !== undefined) dbRow.emergency_contact = c.emergencyContact;
    if (c.operationalNotes !== undefined) dbRow.operational_notes = c.operationalNotes;
  }

  return dbRow;
}

// 2. COLLABORATOR MAPPERS
export function mapDbToCollaborator(row: any): Collaborator {
  return {
    id: row.id,
    name: row.name || row.nome || 'Colaborador',
    email: row.email || '',
    cpf: row.cpf || '',
    phone: row.phone || row.telefone || '',
    photoUrl: row.photo_url || row.foto_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    role: (row.role || row.cargo || 'Diarista Profissional') as StaffRole,
    status: (row.status || 'ativo') as StaffStatus,
    rating: Number(row.rating || row.avaliacao_media || 5.0),
    completedServicesCount: Number(row.completed_services_count || row.total_servicos_concluidos || 0),
    hireDate: row.hire_date || row.data_contratacao || new Date().toISOString().split('T')[0],
    specialties: Array.isArray(row.specialties) ? row.specialties : (Array.isArray(row.especialidades) ? row.especialidades : ['Limpeza Residencial', 'Organização']),
    notes: row.notes || row.observacoes_operacionais || '',
    allowAppAccess: row.allow_app_access !== false && row.permite_acesso_app !== false,
    emergencyContact: row.emergency_contact || row.contato_emergencia || ''
  };
}

export function mapCollaboratorToDb(collab: Partial<Collaborator>, dialect: SchemaDialect = detectedDialects.colaboradores || 'pt'): Record<string, any> {
  const dbRow: Record<string, any> = {};

  if (dialect === 'pt') {
    if (collab.id !== undefined) dbRow.id = collab.id;
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
  } else {
    if (collab.id !== undefined) dbRow.id = collab.id;
    if (collab.name !== undefined) dbRow.name = collab.name;
    if (collab.email !== undefined) dbRow.email = collab.email;
    if (collab.cpf !== undefined) dbRow.cpf = collab.cpf;
    if (collab.phone !== undefined) dbRow.phone = collab.phone;
    if (collab.photoUrl !== undefined) dbRow.photo_url = collab.photoUrl;
    if (collab.role !== undefined) dbRow.role = collab.role;
    if (collab.status !== undefined) dbRow.status = collab.status;
    if (collab.rating !== undefined) dbRow.rating = collab.rating;
    if (collab.completedServicesCount !== undefined) dbRow.completed_services_count = collab.completedServicesCount;
    if (collab.hireDate !== undefined) dbRow.hire_date = collab.hireDate;
    if (collab.specialties !== undefined) dbRow.specialties = collab.specialties;
    if (collab.notes !== undefined) dbRow.notes = collab.notes;
    if (collab.allowAppAccess !== undefined) dbRow.allow_app_access = collab.allowAppAccess;
    if (collab.emergencyContact !== undefined) dbRow.emergency_contact = collab.emergencyContact;
  }

  return dbRow;
}

// 3. SERVICE REQUEST MAPPERS
export function mapDbToRequest(row: any): CustomerRequest {
  const addressObj = typeof row.address === 'object' && row.address !== null
    ? row.address
    : (typeof row.endereco === 'object' && row.endereco !== null ? row.endereco : {
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '',
        referencePoint: ''
      });

  return {
    id: row.id,
    code: row.code || row.codigo_ordem || `SOL-${String(row.id).slice(0, 6)}`,
    clientId: row.client_id || row.cliente_id || undefined,
    clientName: row.client_name || row.cliente_nome || 'Cliente',
    clientDocument: row.client_document || row.cliente_documento || '',
    clientDocumentType: (row.client_document_type || row.cliente_documento_tipo || 'CPF') as DocumentType,
    clientEmail: row.client_email || row.cliente_email || '',
    clientPhone: row.client_phone || row.cliente_telefone || '',
    clientWhatsapp: row.client_whatsapp || row.cliente_whatsapp || row.client_phone || '',
    address: addressObj,
    serviceType: (row.service_type || row.tipo_servico || 'limpeza') as ServiceType,
    organizationFormat: (row.organization_format || row.formato_organizacao || 'personalizada') as OrgFormat,
    orgDetails: row.org_details || row.detalhes_organizacao || undefined,
    propertyDetails: row.property_details || row.detalhes_imovel || {
      rooms: 2,
      bathrooms: 1,
      approxAreaM2: 70,
      hasPets: false
    },
    scheduleDate: row.schedule_date || row.data_agendada || new Date().toISOString().split('T')[0],
    scheduleTime: (row.schedule_time || row.horario_agendado || '08:00').slice(0, 5),
    estimatedDurationHours: Number(row.estimated_duration_hours || row.duracao_estimada_horas || 4),
    price: Number(row.price || row.preco || row.valor_total || 0),
    status: (row.status || 'pendente') as RequestStatus,
    assignedStaffId: row.assigned_staff_id || row.colaborador_id || undefined,
    assignedStaffName: row.assigned_staff_name || row.colaborador_nome || undefined,
    priority: (row.priority || row.prioridade || 'media') as 'baixa' | 'media' | 'alta',
    clientNotes: row.client_notes || row.observacoes_cliente || '',
    confirmationCode: row.confirmation_code || row.codigo_confirmacao || '1234',
    codeValidatedAt: row.code_validated_at || row.codigo_validado_em || undefined,
    codeValidatedByStaffId: row.code_validated_by_staff_id || row.codigo_validado_por_id || undefined,
    executionTracking: row.execution_tracking || row.rastreamento_execucao || {
      elapsedSeconds: 0,
      isRunning: false,
      checklist: []
    },
    createdAt: row.created_at || new Date().toISOString()
  };
}

export function mapRequestToDb(req: Partial<CustomerRequest>, dialect: SchemaDialect = detectedDialects.solicitacoes_servico || 'en'): Record<string, any> {
  const dbRow: Record<string, any> = {};

  if (dialect === 'pt') {
    if (req.id !== undefined) dbRow.id = req.id;
    if (req.code !== undefined) dbRow.codigo_ordem = req.code;
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
    if (req.price !== undefined) dbRow.valor_total = req.price;
    if (req.status !== undefined) dbRow.status = req.status;
    if (req.assignedStaffId !== undefined) dbRow.colaborador_id = req.assignedStaffId || null;
    if (req.assignedStaffName !== undefined) dbRow.colaborador_nome = req.assignedStaffName || null;
    if (req.priority !== undefined) dbRow.prioridade = req.priority;
    if (req.clientNotes !== undefined) dbRow.observacoes_cliente = req.clientNotes;
    if (req.confirmationCode !== undefined) dbRow.codigo_confirmacao = req.confirmationCode;
    if (req.codeValidatedAt !== undefined) dbRow.codigo_validado_em = req.codeValidatedAt;
    if (req.codeValidatedByStaffId !== undefined) dbRow.codigo_validado_por_id = req.codeValidatedByStaffId || null;
    if (req.executionTracking !== undefined) dbRow.rastreamento_execucao = req.executionTracking;
  } else {
    if (req.id !== undefined) dbRow.id = req.id;
    if (req.code !== undefined) dbRow.code = req.code;
    if (req.clientId !== undefined) dbRow.client_id = req.clientId || null;
    if (req.clientName !== undefined) dbRow.client_name = req.clientName;
    if (req.clientDocument !== undefined) dbRow.client_document = req.clientDocument;
    if (req.clientDocumentType !== undefined) dbRow.client_document_type = req.clientDocumentType;
    if (req.clientEmail !== undefined) dbRow.client_email = req.clientEmail;
    if (req.clientPhone !== undefined) dbRow.client_phone = req.clientPhone;
    if (req.clientWhatsapp !== undefined) dbRow.client_whatsapp = req.clientWhatsapp;
    if (req.address !== undefined) dbRow.address = req.address;
    if (req.serviceType !== undefined) dbRow.service_type = req.serviceType;
    if (req.organizationFormat !== undefined) dbRow.organization_format = req.organizationFormat;
    if (req.orgDetails !== undefined) dbRow.org_details = req.orgDetails;
    if (req.propertyDetails !== undefined) dbRow.property_details = req.propertyDetails;
    if (req.scheduleDate !== undefined) dbRow.schedule_date = req.scheduleDate;
    if (req.scheduleTime !== undefined) dbRow.schedule_time = req.scheduleTime;
    if (req.estimatedDurationHours !== undefined) dbRow.estimated_duration_hours = req.estimatedDurationHours;
    if (req.price !== undefined) dbRow.price = req.price;
    if (req.status !== undefined) dbRow.status = req.status;
    if (req.assignedStaffId !== undefined) dbRow.assigned_staff_id = req.assignedStaffId || null;
    if (req.assignedStaffName !== undefined) dbRow.assigned_staff_name = req.assignedStaffName || null;
    if (req.priority !== undefined) dbRow.priority = req.priority;
    if (req.clientNotes !== undefined) dbRow.client_notes = req.clientNotes;
    if (req.confirmationCode !== undefined) dbRow.confirmation_code = req.confirmationCode;
    if (req.codeValidatedAt !== undefined) dbRow.code_validated_at = req.codeValidatedAt;
    if (req.codeValidatedByStaffId !== undefined) dbRow.code_validated_by_staff_id = req.codeValidatedByStaffId || null;
    if (req.executionTracking !== undefined) dbRow.execution_tracking = req.executionTracking;
  }

  return dbRow;
}

// 4. FEEDBACK MAPPERS
export function mapDbToFeedback(row: any): CustomerFeedback {
  return {
    id: row.id,
    requestId: row.request_id || row.solicitacao_id || '',
    requestCode: row.request_code || row.solicitacao_codigo || `SOL-${String(row.id).slice(0, 6)}`,
    clientName: row.client_name || row.cliente_nome || 'Cliente',
    clientEmail: row.client_email || row.cliente_email || '',
    staffId: row.staff_id || row.colaborador_id || undefined,
    staffName: row.staff_name || row.colaborador_nome || 'Equipe Clean & Organize',
    serviceType: (row.service_type || row.tipo_servico || 'limpeza') as ServiceType,
    rating: Number(row.rating || row.nota || 5),
    type: (row.type || row.tipo || 'elogio') as FeedbackType,
    title: row.title || row.titulo || 'Atendimento',
    comment: row.comment || row.comentario || '',
    date: row.created_at || new Date().toISOString(),
    status: (row.status || 'resolvido') as FeedbackStatus,
    resolutionNotes: row.resolution_notes || row.notas_resolucao || undefined,
    resolvedAt: row.resolved_at || row.resolvido_em || undefined,
    resolvedBy: row.resolved_by || row.resolvido_por || undefined
  };
}

export function mapFeedbackToDb(f: Partial<CustomerFeedback>, dialect: SchemaDialect = detectedDialects.avaliacoes_feedback || 'en'): Record<string, any> {
  const dbRow: Record<string, any> = {};

  if (dialect === 'pt') {
    if (f.id !== undefined) dbRow.id = f.id;
    if (f.requestId !== undefined) dbRow.solicitacao_id = f.requestId;
    if (f.requestCode !== undefined) dbRow.solicitacao_codigo = f.requestCode;
    if (f.clientName !== undefined) dbRow.cliente_nome = f.clientName;
    if (f.clientEmail !== undefined) dbRow.cliente_email = f.clientEmail;
    if (f.staffId !== undefined) dbRow.colaborador_id = f.staffId;
    if (f.staffName !== undefined) dbRow.colaborador_nome = f.staffName;
    if (f.serviceType !== undefined) dbRow.tipo_servico = f.serviceType;
    if (f.rating !== undefined) dbRow.nota = f.rating;
    if (f.type !== undefined) dbRow.tipo = f.type;
    if (f.title !== undefined) dbRow.titulo = f.title;
    if (f.comment !== undefined) dbRow.comentario = f.comment;
    if (f.status !== undefined) dbRow.status = f.status;
    if (f.resolutionNotes !== undefined) dbRow.notas_resolucao = f.resolutionNotes;
    if (f.resolvedAt !== undefined) dbRow.resolvido_em = f.resolvedAt;
    if (f.resolvedBy !== undefined) dbRow.resolvido_por = f.resolvedBy;
  } else {
    if (f.id !== undefined) dbRow.id = f.id;
    if (f.requestId !== undefined) dbRow.request_id = f.requestId;
    if (f.requestCode !== undefined) dbRow.request_code = f.requestCode;
    if (f.clientName !== undefined) dbRow.client_name = f.clientName;
    if (f.clientEmail !== undefined) dbRow.client_email = f.clientEmail;
    if (f.staffId !== undefined) dbRow.staff_id = f.staffId;
    if (f.staffName !== undefined) dbRow.staff_name = f.staffName;
    if (f.serviceType !== undefined) dbRow.service_type = f.serviceType;
    if (f.rating !== undefined) dbRow.rating = f.rating;
    if (f.type !== undefined) dbRow.type = f.type;
    if (f.title !== undefined) dbRow.title = f.title;
    if (f.comment !== undefined) dbRow.comment = f.comment;
    if (f.status !== undefined) dbRow.status = f.status;
    if (f.resolutionNotes !== undefined) dbRow.resolution_notes = f.resolutionNotes;
    if (f.resolvedAt !== undefined) dbRow.resolved_at = f.resolvedAt;
    if (f.resolvedBy !== undefined) dbRow.resolved_by = f.resolvedBy;
  }

  return dbRow;
}

// 5. SYSTEM NOTIFICATION MAPPERS
export function mapDbToNotification(row: any): SystemNotification {
  return {
    id: row.id,
    title: row.title || row.titulo || 'Notificação do Sistema',
    message: row.message || row.mensagem || '',
    target: (row.target || row.destinatario || 'all') as NotificationTarget,
    channel: (row.channel || row.canal || 'broadcast') as NotificationChannel,
    priority: (row.priority || row.prioridade || 'media') as NotificationPriority,
    sender: row.sender || row.remetente || 'Administração Central',
    senderRole: row.sender_role || row.cargo_remetente || 'Admin',
    category: row.category || row.categoria || 'Geral',
    metadata: row.metadata || row.metadados || {},
    createdAt: row.created_at || new Date().toISOString(),
    status: (row.status || 'dispatched') as NotificationStatus,
    acknowledgedBy: Array.isArray(row.acknowledged_by || row.confirmacoes)
      ? (row.acknowledged_by || row.confirmacoes).map((ack: any) => ({
          recipientId: ack.recipientId || ack.id || '',
          recipientName: ack.recipientName || ack.nome || 'Usuário',
          recipientType: ack.recipientType || ack.tipo || 'cliente',
          acknowledgedAt: ack.acknowledgedAt || ack.data_hora || new Date().toISOString(),
          deviceInfo: ack.deviceInfo || ack.dispositivo || 'Navegador Web',
          responseNote: ack.responseNote || ack.nota || '',
          latencyMs: ack.latencyMs || ack.latencia_ms || 0
        }))
      : []
  };
}

export function mapNotificationToDb(n: Partial<SystemNotification>, dialect: SchemaDialect = 'pt'): any {
  const dbRow: any = {};

  if (dialect === 'pt') {
    if (n.id !== undefined) dbRow.id = n.id;
    if (n.title !== undefined) dbRow.titulo = n.title;
    if (n.message !== undefined) dbRow.mensagem = n.message;
    if (n.target !== undefined) dbRow.destinatario = n.target;
    if (n.channel !== undefined) dbRow.canal = n.channel;
    if (n.priority !== undefined) dbRow.prioridade = n.priority;
    if (n.sender !== undefined) dbRow.remetente = n.sender;
    if (n.senderRole !== undefined) dbRow.cargo_remetente = n.senderRole;
    if (n.category !== undefined) dbRow.categoria = n.category;
    if (n.metadata !== undefined) dbRow.metadados = n.metadata;
    if (n.status !== undefined) dbRow.status = n.status;
    if (n.acknowledgedBy !== undefined) dbRow.confirmacoes = n.acknowledgedBy;
    if (n.createdAt !== undefined) dbRow.created_at = n.createdAt;
  } else {
    if (n.id !== undefined) dbRow.id = n.id;
    if (n.title !== undefined) dbRow.title = n.title;
    if (n.message !== undefined) dbRow.message = n.message;
    if (n.target !== undefined) dbRow.target = n.target;
    if (n.channel !== undefined) dbRow.channel = n.channel;
    if (n.priority !== undefined) dbRow.priority = n.priority;
    if (n.sender !== undefined) dbRow.sender = n.sender;
    if (n.senderRole !== undefined) dbRow.sender_role = n.senderRole;
    if (n.category !== undefined) dbRow.category = n.category;
    if (n.metadata !== undefined) dbRow.metadata = n.metadata;
    if (n.status !== undefined) dbRow.status = n.status;
    if (n.acknowledgedBy !== undefined) dbRow.acknowledged_by = n.acknowledgedBy;
    if (n.createdAt !== undefined) dbRow.created_at = n.createdAt;
  }

  return dbRow;
}

// --------------------------------------------------------------------------
// CRUD SERVICE DIRECTLY TARGETING SUPABASE POSTGRESQL TABLES
// --------------------------------------------------------------------------

export const SupabaseService = {
  // 1. Fetch All Requests
  async fetchRequests(): Promise<CustomerRequest[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('solicitacoes_servico')
      .select('*');

    if (error) {
      console.error('[Supabase Error: fetchRequests]', error);
      throw new Error(`Falha ao buscar solicitações no Supabase: ${error.message}`);
    }

    if (data && data.length > 0) {
      if (data[0].codigo_ordem !== undefined || data[0].cliente_nome !== undefined) {
        detectedDialects.solicitacoes_servico = 'pt';
      } else if (data[0].code !== undefined || data[0].client_name !== undefined) {
        detectedDialects.solicitacoes_servico = 'en';
      }
    }

    return (data || [])
      .map(mapDbToRequest)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  },

  // 2. Fetch All Clients
  async fetchClients(): Promise<Client[]> {
    const supabase = getSupabase();
    const { data: clientsData, error: clientErr } = await supabase
      .from('clientes')
      .select('*');

    if (clientErr) {
      console.error('[Supabase Error: fetchClients]', clientErr);
      throw new Error(`Falha ao buscar clientes no Supabase: ${clientErr.message}`);
    }

    if (clientsData && clientsData.length > 0) {
      if (clientsData[0].nome !== undefined || clientsData[0].telefone !== undefined) {
        detectedDialects.clientes = 'pt';
      } else if (clientsData[0].name !== undefined || clientsData[0].phone !== undefined) {
        detectedDialects.clientes = 'en';
      }
    }

    // Fetch operational notes if available
    let opNotes: ClientOperationalEvaluation[] = [];
    try {
      const { data: notesData, error: notesErr } = await supabase
        .from('avaliacoes_operacionais_cliente')
        .select('*');
      if (!notesErr && notesData) {
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
      console.warn('[Supabase] Tabela opcional avaliacoes_operacionais_cliente não disponível:', e);
    }

    return (clientsData || [])
      .map(row => mapDbToClient(row, opNotes))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  },

  // 3. Fetch All Collaborators (Sorted safely in JS to prevent column name errors)
  async fetchCollaborators(): Promise<Collaborator[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('colaboradores')
      .select('*');

    if (error) {
      console.error('[Supabase Error: fetchCollaborators]', error);
      throw new Error(`Falha ao buscar colaboradores no Supabase: ${error.message}`);
    }

    if (data && data.length > 0) {
      if (data[0].nome !== undefined || data[0].cargo !== undefined) {
        detectedDialects.colaboradores = 'pt';
      } else if (data[0].name !== undefined || data[0].role !== undefined) {
        detectedDialects.colaboradores = 'en';
      }
    }

    return (data || [])
      .map(mapDbToCollaborator)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  },

  // 4. Fetch All Feedbacks
  async fetchFeedbacks(): Promise<CustomerFeedback[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('avaliacoes_feedback')
      .select('*');

    if (error) {
      console.error('[Supabase Error: fetchFeedbacks]', error);
      throw new Error(`Falha ao buscar feedbacks no Supabase: ${error.message}`);
    }

    if (data && data.length > 0) {
      if (data[0].cliente_nome !== undefined || data[0].nota !== undefined) {
        detectedDialects.avaliacoes_feedback = 'pt';
      } else if (data[0].client_name !== undefined || data[0].rating !== undefined) {
        detectedDialects.avaliacoes_feedback = 'en';
      }
    }

    return (data || [])
      .map(mapDbToFeedback)
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  },

  // 5. Insert Request with auto-retry dialect switch
  async insertRequest(request: CustomerRequest): Promise<CustomerRequest> {
    const supabase = getSupabase();
    let currentDialect = detectedDialects.solicitacoes_servico || 'pt';
    let dbRow = mapRequestToDb(request, currentDialect);
    
    let res = await supabase.from('solicitacoes_servico').insert(dbRow).select().single();
    if (res.error && isSchemaColumnError(res.error)) {
      currentDialect = currentDialect === 'en' ? 'pt' : 'en';
      detectedDialects.solicitacoes_servico = currentDialect;
      dbRow = mapRequestToDb(request, currentDialect);
      res = await supabase.from('solicitacoes_servico').insert(dbRow).select().single();
    }

    if (res.error) {
      console.error('[Supabase Error: insertRequest]', res.error);
      throw new Error(`Erro ao gravar solicitação no Supabase: ${res.error.message}`);
    }
    return mapDbToRequest(res.data);
  },

  // 6. Update Request with auto-retry dialect switch
  async updateRequest(id: string, updates: Partial<CustomerRequest>): Promise<boolean> {
    const supabase = getSupabase();
    let currentDialect = detectedDialects.solicitacoes_servico || 'pt';
    let dbRow = mapRequestToDb(updates, currentDialect);
    delete dbRow.id;
    
    let res = await supabase.from('solicitacoes_servico').update(dbRow).eq('id', id);
    if (res.error && isSchemaColumnError(res.error)) {
      currentDialect = currentDialect === 'en' ? 'pt' : 'en';
      detectedDialects.solicitacoes_servico = currentDialect;
      dbRow = mapRequestToDb(updates, currentDialect);
      delete dbRow.id;
      res = await supabase.from('solicitacoes_servico').update(dbRow).eq('id', id);
    }

    if (res.error) {
      console.error('[Supabase Error: updateRequest]', res.error);
      throw new Error(`Erro ao atualizar solicitação no Supabase: ${res.error.message}`);
    }
    return true;
  },

  // 7. Delete Request
  async deleteRequest(id: string): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('solicitacoes_servico')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Supabase Error: deleteRequest]', error);
      throw new Error(`Erro ao excluir solicitação no Supabase: ${error.message}`);
    }
    return true;
  },

  // 8. Insert Client with auto-retry dialect switch
  async insertClient(client: Client): Promise<Client> {
    const supabase = getSupabase();
    let currentDialect = detectedDialects.clientes || 'pt';
    let dbRow = mapClientToDb(client, currentDialect);

    let res = await supabase.from('clientes').insert(dbRow).select().single();
    if (res.error && isSchemaColumnError(res.error)) {
      currentDialect = currentDialect === 'en' ? 'pt' : 'en';
      detectedDialects.clientes = currentDialect;
      dbRow = mapClientToDb(client, currentDialect);
      res = await supabase.from('clientes').insert(dbRow).select().single();
    }

    if (res.error) {
      console.error('[Supabase Error: insertClient]', res.error);
      throw new Error(`Erro ao gravar cliente no Supabase: ${res.error.message}`);
    }
    return mapDbToClient(res.data);
  },

  // 9. Update Client with auto-retry dialect switch
  async updateClient(id: string, updates: Partial<Client>): Promise<boolean> {
    const supabase = getSupabase();
    let currentDialect = detectedDialects.clientes || 'pt';
    let dbRow = mapClientToDb(updates, currentDialect);
    delete dbRow.id;

    let res = await supabase.from('clientes').update(dbRow).eq('id', id);
    if (res.error && isSchemaColumnError(res.error)) {
      currentDialect = currentDialect === 'en' ? 'pt' : 'en';
      detectedDialects.clientes = currentDialect;
      dbRow = mapClientToDb(updates, currentDialect);
      delete dbRow.id;
      res = await supabase.from('clientes').update(dbRow).eq('id', id);
    }

    if (res.error) {
      console.error('[Supabase Error: updateClient]', res.error);
      throw new Error(`Erro ao atualizar cliente no Supabase: ${res.error.message}`);
    }
    return true;
  },

  // 10. Delete Client
  async deleteClient(id: string): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Supabase Error: deleteClient]', error);
      throw new Error(`Erro ao excluir cliente no Supabase: ${error.message}`);
    }
    return true;
  },

  // 11. Insert Collaborator with auto-retry dialect switch
  async insertCollaborator(collab: Collaborator): Promise<Collaborator> {
    const supabase = getSupabase();
    let currentDialect = detectedDialects.colaboradores || 'pt';
    let dbRow = mapCollaboratorToDb(collab, currentDialect);

    let res = await supabase.from('colaboradores').insert(dbRow).select().single();
    if (res.error && isSchemaColumnError(res.error)) {
      currentDialect = currentDialect === 'pt' ? 'en' : 'pt';
      detectedDialects.colaboradores = currentDialect;
      dbRow = mapCollaboratorToDb(collab, currentDialect);
      res = await supabase.from('colaboradores').insert(dbRow).select().single();
    }

    if (res.error) {
      console.error('[Supabase Error: insertCollaborator]', res.error);
      throw new Error(`Erro ao cadastrar colaborador no Supabase: ${res.error.message}`);
    }
    return mapDbToCollaborator(res.data);
  },

  // 12. Update Collaborator with auto-retry dialect switch
  async updateCollaborator(id: string, updates: Partial<Collaborator>): Promise<boolean> {
    const supabase = getSupabase();
    let currentDialect = detectedDialects.colaboradores || 'pt';
    let dbRow = mapCollaboratorToDb(updates, currentDialect);
    delete dbRow.id;

    let res = await supabase.from('colaboradores').update(dbRow).eq('id', id);
    if (res.error && isSchemaColumnError(res.error)) {
      currentDialect = currentDialect === 'pt' ? 'en' : 'pt';
      detectedDialects.colaboradores = currentDialect;
      dbRow = mapCollaboratorToDb(updates, currentDialect);
      delete dbRow.id;
      res = await supabase.from('colaboradores').update(dbRow).eq('id', id);
    }

    if (res.error) {
      console.error('[Supabase Error: updateCollaborator]', res.error);
      throw new Error(`Erro ao atualizar colaborador no Supabase: ${res.error.message}`);
    }
    return true;
  },

  // 13. Delete Collaborator
  async deleteCollaborator(id: string): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('colaboradores')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Supabase Error: deleteCollaborator]', error);
      throw new Error(`Erro ao excluir colaborador no Supabase: ${error.message}`);
    }
    return true;
  },

  // 14. Insert Feedback with auto-retry dialect switch
  async insertFeedback(feedback: CustomerFeedback): Promise<CustomerFeedback> {
    const supabase = getSupabase();
    let currentDialect = detectedDialects.avaliacoes_feedback || 'pt';
    let dbRow = mapFeedbackToDb(feedback, currentDialect);

    let res = await supabase.from('avaliacoes_feedback').insert(dbRow).select().single();
    if (res.error && isSchemaColumnError(res.error)) {
      currentDialect = currentDialect === 'en' ? 'pt' : 'en';
      detectedDialects.avaliacoes_feedback = currentDialect;
      dbRow = mapFeedbackToDb(feedback, currentDialect);
      res = await supabase.from('avaliacoes_feedback').insert(dbRow).select().single();
    }

    if (res.error) {
      console.error('[Supabase Error: insertFeedback]', res.error);
      throw new Error(`Erro ao registrar feedback no Supabase: ${res.error.message}`);
    }
    return mapDbToFeedback(res.data);
  },

  // 15. Update Feedback with auto-retry dialect switch
  async updateFeedback(id: string, updates: Partial<CustomerFeedback>): Promise<boolean> {
    const supabase = getSupabase();
    let currentDialect = detectedDialects.avaliacoes_feedback || 'pt';
    let dbRow = mapFeedbackToDb(updates, currentDialect);
    delete dbRow.id;

    let res = await supabase.from('avaliacoes_feedback').update(dbRow).eq('id', id);
    if (res.error && isSchemaColumnError(res.error)) {
      currentDialect = currentDialect === 'en' ? 'pt' : 'en';
      detectedDialects.avaliacoes_feedback = currentDialect;
      dbRow = mapFeedbackToDb(updates, currentDialect);
      delete dbRow.id;
      res = await supabase.from('avaliacoes_feedback').update(dbRow).eq('id', id);
    }

    if (res.error) {
      console.error('[Supabase Error: updateFeedback]', res.error);
      throw new Error(`Erro ao atualizar feedback no Supabase: ${res.error.message}`);
    }
    return true;
  },

  // 16. Insert Operational Note
  async insertOperationalNote(clientId: string, note: ClientOperationalEvaluation): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('avaliacoes_operacionais_cliente')
      .insert({
        id: note.id,
        cliente_id: clientId,
        autor_id: note.staffId || null,
        autor_nome: note.authorName,
        autor_cargo: note.authorRole,
        aspecto: note.aspect || 'geral',
        nota_comportamento: note.clientBehaviorRating || 5,
        nota_condicao_imovel: note.propertyConditionRating || 5,
        avaliacao_comportamento: note.behaviorEvaluation || 'excelente',
        condicao_imovel: note.propertyCondition || 'adequado',
        comentario: note.comment,
        tags: note.tags || []
      });

    if (error) {
      console.warn('[Supabase Notice: insertOperationalNote]', error.message);
      // Also update embedded jsonb in clientes table
      const { data: clientRow } = await supabase.from('clientes').select('operational_notes').eq('id', clientId).single();
      const existingNotes = clientRow?.operational_notes || [];
      await supabase.from('clientes').update({
        operational_notes: [note, ...existingNotes]
      }).eq('id', clientId);
    }
    return true;
  },

  // 17. Fetch System Notifications
  async fetchNotifications(): Promise<SystemNotification[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('notificacoes_sistema')
      .select('*');

    if (error) {
      console.warn('[Supabase Notice: fetchNotifications]', error.message);
      return [];
    }

    if (data && data.length > 0) {
      if (data[0].titulo !== undefined || data[0].mensagem !== undefined) {
        detectedDialects.notificacoes_sistema = 'pt';
      } else if (data[0].title !== undefined || data[0].message !== undefined) {
        detectedDialects.notificacoes_sistema = 'en';
      }
    }

    return (data || [])
      .map(mapDbToNotification)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  },

  // 18. Insert System Notification with auto-retry dialect switch
  async insertNotification(notification: SystemNotification): Promise<SystemNotification> {
    const supabase = getSupabase();
    let currentDialect = detectedDialects.notificacoes_sistema || 'pt';
    let dbRow = mapNotificationToDb(notification, currentDialect);

    let res = await supabase.from('notificacoes_sistema').insert(dbRow).select().single();
    if (res.error && isSchemaColumnError(res.error)) {
      currentDialect = currentDialect === 'en' ? 'pt' : 'en';
      detectedDialects.notificacoes_sistema = currentDialect;
      dbRow = mapNotificationToDb(notification, currentDialect);
      res = await supabase.from('notificacoes_sistema').insert(dbRow).select().single();
    }

    if (res.error) {
      console.warn('[Supabase Notice: insertNotification]', res.error.message);
      // Return notification as is if table doesn't exist yet, it will propagate via Realtime Broadcast
      return notification;
    }
    return mapDbToNotification(res.data);
  },

  // 19. Acknowledge Notification
  async acknowledgeNotification(notificationId: string, ack: NotificationAcknowledgement): Promise<boolean> {
    const supabase = getSupabase();
    try {
      const { data: existing } = await supabase
        .from('notificacoes_sistema')
        .select('*')
        .eq('id', notificationId)
        .single();

      if (existing) {
        const notif = mapDbToNotification(existing);
        const alreadyAcked = notif.acknowledgedBy.some(a => a.recipientId === ack.recipientId);
        const updatedAcks = alreadyAcked 
          ? notif.acknowledgedBy.map(a => a.recipientId === ack.recipientId ? ack : a)
          : [...notif.acknowledgedBy, ack];

        const dialect = detectedDialects.notificacoes_sistema || 'pt';
        const updatePayload = mapNotificationToDb({
          status: 'acknowledged',
          acknowledgedBy: updatedAcks
        }, dialect);
        delete updatePayload.id;

        await supabase.from('notificacoes_sistema').update(updatePayload).eq('id', notificationId);
      }
    } catch (e) {
      console.warn('[Supabase Notice: acknowledgeNotification error]', e);
    }
    return true;
  },

  // 20. Delete Notification
  async deleteNotification(id: string): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase.from('notificacoes_sistema').delete().eq('id', id);
    if (error) {
      console.warn('[Supabase Notice: deleteNotification]', error.message);
    }
    return true;
  },

  // 21. Clear All Notifications
  async clearAllNotifications(): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase.from('notificacoes_sistema').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      console.warn('[Supabase Notice: clearAllNotifications]', error.message);
    }
    return true;
  }
};
