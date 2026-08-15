export type ServiceType = 'limpeza' | 'organizacao' | 'ambos';
export type OrgFormat = 'personalizada' | 'padrao_empresa';
export type RequestStatus = 'pendente' | 'alocado' | 'a_caminho' | 'em_execucao' | 'pausado' | 'concluido' | 'cancelado';
export type StaffRole = 'Diarista Profissional' | 'Personal Organizer' | 'Especialista em Higienização' | 'Líder de Equipe / Supervisora';
export type StaffStatus = 'ativo' | 'em_servico' | 'ferias' | 'inativo';
export type FeedbackType = 'elogio' | 'sugestao' | 'reclamacao';
export type FeedbackStatus = 'pendente' | 'em_analise' | 'resolvido';
export type ClientStatus = 'ativo' | 'inativo' | 'vip' | 'bloqueado';
export type DocumentType = 'CPF' | 'RG';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  companyName: string;
  role: string;
  avatar?: string;
  pin: string;
  createdAt: string;
  lastLogin: string;
}

export interface ClientOperationalEvaluation {
  id: string;
  date: string;
  authorName: string;
  authorRole: string; // 'Staff' | 'Supervisora' | 'Gestor'
  staffId?: string;
  staffName?: string;
  aspect?: 'comportamento' | 'condicoes_imovel' | 'pontualidade_acesso' | 'geral';
  rating?: number; // 1 to 5
  clientBehaviorRating?: number; // 1 to 5
  propertyConditionRating?: number; // 1 to 5
  behaviorEvaluation?: 'excelente' | 'bom' | 'neutro' | 'dificil' | 'critico';
  propertyCondition?: 'impecavel' | 'adequado' | 'desafiador' | 'precario';
  comment: string;
  tags?: string[];
}

export interface Client {
  id: string;
  name: string;
  documentType: DocumentType;
  documentNumber: string;
  email: string;
  phone: string;
  whatsapp: string;
  preferredContact?: 'whatsapp' | 'telefone' | 'email';
  address: Address;
  status: ClientStatus;
  createdAt: string;
  notes?: string;
  preferredServiceType?: ServiceType;
  preferredOrgFormat?: OrgFormat;
  operationalNotes: ClientOperationalEvaluation[];
  emergencyContact?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  photoUrl: string;
  role: StaffRole;
  status: StaffStatus;
  rating: number;
  completedServicesCount: number;
  hireDate: string;
  specialties: string[];
  notes?: string;
  allowAppAccess: boolean;
  emergencyContact?: string;
}

export interface PropertyDetails {
  rooms: number;
  bathrooms: number;
  approxAreaM2: number;
  hasPets: boolean;
  petDetails?: string;
  allergyAlerts?: string;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  referencePoint?: string;
}

export interface OrgDetails {
  methodology: string; // ex: 'Padrão Ouro 5S' ou 'Personalizado por Hábitos e Rotinas'
  selectedZones: string[]; // ex: ['Closet Master', 'Cozinha & Despensa', 'Armários Infantis', 'Lavanderia']
  customNotes?: string;
  organizerProductsNeeded?: string[]; // ex: ['Colmeias organizadoras M e G', 'Cestos acrílicos', 'Etiquetas de identificação']
}

export interface ChecklistItem {
  id: string;
  task: string;
  category: 'limpeza' | 'organizacao' | 'geral';
  completed: boolean;
}

export interface ExecutionTracking {
  startedAt?: string;
  endedAt?: string;
  elapsedSeconds: number;
  isRunning: boolean;
  lastTickTimestamp?: number;
  checklist: ChecklistItem[];
  executionNotes?: string;
  beforeAfterPhotos?: Array<{
    id: string;
    label: string;
    stage: 'antes' | 'depois';
    url: string;
    time: string;
  }>;
}

export interface CustomerRequest {
  id: string;
  code: string;
  clientId?: string;
  clientName: string;
  clientDocument?: string;
  clientDocumentType?: DocumentType;
  clientEmail: string;
  clientPhone: string;
  clientWhatsapp: string;
  address: Address;
  serviceType: ServiceType;
  organizationFormat: OrgFormat;
  orgDetails?: OrgDetails;
  propertyDetails: PropertyDetails;
  scheduleDate: string;
  scheduleTime: string;
  estimatedDurationHours: number;
  price: number;
  status: RequestStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  createdAt: string;
  priority: 'baixa' | 'media' | 'alta';
  clientNotes?: string;
  confirmationCode?: string; // 4-digit numeric identity confirmation code
  codeValidatedAt?: string;
  codeValidatedByStaffId?: string;
  executionTracking?: ExecutionTracking;
}

export interface CustomerFeedback {
  id: string;
  requestId: string;
  requestCode: string;
  clientName: string;
  clientEmail: string;
  staffId?: string;
  staffName?: string;
  serviceType: ServiceType;
  rating: number; // 1 to 5
  type: FeedbackType;
  title: string;
  comment: string;
  date: string;
  status: FeedbackStatus;
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}
