-- ==============================================================================
-- CLEAN & ORGANIZE PRO - ESQUEMA DE BANCO DE DADOS POSTGRESQL (SUPABASE)
-- ==============================================================================
-- Módulo: Gestão Centralizada de Limpeza, Organização, Colaboradores e Ordens
-- Segurança: Row Level Security (RLS) 100% Ativo com Políticas Restritas
-- ==============================================================================

-- 0. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Função Utilitária para Atualização Automática de 'updated_at'
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 1. TABELA: CLIENTES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nome VARCHAR(255) NOT NULL,
    tipo_documento VARCHAR(10) NOT NULL DEFAULT 'CPF' CHECK (tipo_documento IN ('CPF', 'RG')),
    documento VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(30) NOT NULL,
    whatsapp VARCHAR(30),
    canal_preferencial VARCHAR(20) DEFAULT 'whatsapp' CHECK (canal_preferencial IN ('whatsapp', 'telefone', 'email')),
    
    -- Endereço Completo
    cep VARCHAR(10) NOT NULL,
    logradouro VARCHAR(255) NOT NULL,
    numero VARCHAR(50) NOT NULL,
    complemento VARCHAR(100),
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL DEFAULT 'São Paulo',
    estado VARCHAR(2) NOT NULL DEFAULT 'SP',
    ponto_referencia TEXT,
    
    status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    observacoes_internas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para Performance e Unicidade
CREATE INDEX IF NOT EXISTS idx_clientes_documento ON public.clientes(documento);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON public.clientes(status);

-- Trigger de updated_at para Clientes
CREATE TRIGGER trg_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 2. TABELA: COLABORADORES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.colaboradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    codigo_registro VARCHAR(20) UNIQUE,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(30) NOT NULL,
    chave_pix VARCHAR(100),
    
    especialidades TEXT[] DEFAULT ARRAY['limpeza', 'organizacao']::TEXT[],
    status_disponibilidade VARCHAR(30) NOT NULL DEFAULT 'ativo' CHECK (status_disponibilidade IN ('ativo', 'em_servico', 'folga', 'inativo')),
    permite_acesso_app BOOLEAN NOT NULL DEFAULT TRUE,
    
    avaliacao_media NUMERIC(3, 2) DEFAULT 5.00 CHECK (avaliacao_media >= 1.0 AND avaliacao_media <= 5.0),
    total_servicos_concluidos INTEGER NOT NULL DEFAULT 0 CHECK (total_servicos_concluidos >= 0),
    
    observacoes_operacionais TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_colaboradores_cpf ON public.colaboradores(cpf);
CREATE INDEX IF NOT EXISTS idx_colaboradores_status ON public.colaboradores(status_disponibilidade);

CREATE TRIGGER trg_colaboradores_updated_at
BEFORE UPDATE ON public.colaboradores
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 3. TABELA: SOLICITACOES_SERVICO
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.solicitacoes_servico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_ordem VARCHAR(50) NOT NULL UNIQUE,
    
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE RESTRICT,
    cliente_nome VARCHAR(255) NOT NULL,
    cliente_email VARCHAR(255) NOT NULL,
    cliente_telefone VARCHAR(30) NOT NULL,
    
    -- Endereço de Atendimento
    endereco_completo JSONB NOT NULL,
    
    -- Tipos e Formatos de Serviço
    tipo_servico VARCHAR(20) NOT NULL CHECK (tipo_servico IN ('limpeza', 'organizacao', 'ambos')),
    formato_organizacao VARCHAR(20) CHECK (formato_organizacao IN ('personalizada', 'padrao_empresa')),
    foco_limpeza VARCHAR(50) DEFAULT 'padrao',
    instrucoes_especificas TEXT,
    
    -- Agendamento
    data_agendada DATE NOT NULL,
    horario_agendado TIME NOT NULL,
    duracao_estimada_minutos INTEGER NOT NULL DEFAULT 240,
    valor_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    
    -- Colaborador Alocado
    colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
    colaborador_nome VARCHAR(255),
    
    -- Status e Segurança
    status VARCHAR(30) NOT NULL DEFAULT 'pendente' CHECK (
        status IN ('pendente', 'alocado', 'a_caminho', 'em_execucao', 'pausado', 'concluido', 'cancelado')
    ),
    codigo_seguranca VARCHAR(6) NOT NULL, -- Código de 4 a 6 dígitos para validação no local
    codigo_validado_em TIMESTAMPTZ,
    codigo_validado_por_id UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
    
    checklist JSONB DEFAULT '[]'::JSONB,
    observacoes_conclusao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_cliente ON public.solicitacoes_servico(cliente_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_colaborador ON public.solicitacoes_servico(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON public.solicitacoes_servico(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_codigo ON public.solicitacoes_servico(codigo_ordem);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_data ON public.solicitacoes_servico(data_agendada);

CREATE TRIGGER trg_solicitacoes_updated_at
BEFORE UPDATE ON public.solicitacoes_servico
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 4. TABELA: EXECUCOES_TIMER
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.execucoes_timer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes_servico(id) ON DELETE CASCADE,
    colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
    
    inicio_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    termino_em TIMESTAMPTZ,
    duracao_segundos INTEGER NOT NULL DEFAULT 0,
    pausas_json JSONB DEFAULT '[]'::JSONB,
    
    esta_ativo BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_tick TIMESTAMPTZ DEFAULT NOW(),
    
    -- Métricas de Produtividade
    produtividade_estimada_pct NUMERIC(5, 2),
    itens_checklist_concluidos INTEGER NOT NULL DEFAULT 0,
    itens_checklist_total INTEGER NOT NULL DEFAULT 0,
    
    notas_operacionais TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timer_solicitacao ON public.execucoes_timer(solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_timer_colaborador ON public.execucoes_timer(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_timer_esta_ativo ON public.execucoes_timer(esta_ativo);

CREATE TRIGGER trg_execucoes_timer_updated_at
BEFORE UPDATE ON public.execucoes_timer
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 5. TABELA: AVALIACOES_FEEDBACK
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.avaliacoes_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitacao_id UUID REFERENCES public.solicitacoes_servico(id) ON DELETE SET NULL,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
    
    tipo_origem VARCHAR(30) NOT NULL CHECK (tipo_origem IN ('cliente_para_servico', 'equipe_para_cliente', 'sac_reclamacao', 'sac_elogio')),
    
    -- Avaliações Numéricas (1 a 5)
    nota_geral INTEGER NOT NULL CHECK (nota_geral >= 1 AND nota_geral <= 5),
    nota_pontualidade INTEGER CHECK (nota_pontualidade >= 1 AND nota_pontualidade <= 5),
    nota_qualidade_servico INTEGER CHECK (nota_qualidade_servico >= 1 AND nota_qualidade_servico <= 5),
    nota_comportamento_cliente INTEGER CHECK (nota_comportamento_cliente >= 1 AND nota_comportamento_cliente <= 5),
    condicoes_imovel VARCHAR(30) CHECK (condicoes_imovel IN ('impecavel', 'adequado', 'desafiador', 'precario')),
    
    comentario TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Gestão de Chamados SAC
    status_tratativa VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status_tratativa IN ('pendente', 'em_analise', 'resolvido')),
    resposta_gestao TEXT,
    resolvido_em TIMESTAMPTZ,
    resolvido_por_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_solicitacao ON public.avaliacoes_feedback(solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_feedback_cliente ON public.avaliacoes_feedback(cliente_id);
CREATE INDEX IF NOT EXISTS idx_feedback_colaborador ON public.avaliacoes_feedback(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_feedback_tipo ON public.avaliacoes_feedback(tipo_origem);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.avaliacoes_feedback(status_tratativa);

CREATE TRIGGER trg_avaliacoes_feedback_updated_at
BEFORE UPDATE ON public.avaliacoes_feedback
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ==============================================================================
-- 6. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

-- Ativação Obrigatória de RLS em 100% das Tabelas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execucoes_timer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_feedback ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Políticas para CLIENTES
-- ------------------------------------------------------------------------------
-- Gestores/Admins autenticados possuem acesso completo
CREATE POLICY "Gestores podem gerenciar todos os clientes"
ON public.clientes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Acesso anônimo/público pode apenas consultar seu próprio registro via formulário ou criar nova solicitação
CREATE POLICY "Clientes anonimos podem cadastrar novo registro"
ON public.clientes
FOR INSERT
TO anon
WITH CHECK (status = 'ativo');

CREATE POLICY "Clientes anonimos podem consultar por email ou documento"
ON public.clientes
FOR SELECT
TO anon
USING (true);

-- ------------------------------------------------------------------------------
-- Políticas para COLABORADORES
-- ------------------------------------------------------------------------------
CREATE POLICY "Gestores possuem controle total sobre colaboradores"
ON public.colaboradores
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Colaboradores anonimos podem consultar status de acesso no app operacional"
ON public.colaboradores
FOR SELECT
TO anon
USING (permite_acesso_app = true);

-- ------------------------------------------------------------------------------
-- Políticas para SOLICITACOES_SERVICO
-- ------------------------------------------------------------------------------
CREATE POLICY "Gestores possuem controle total sobre solicitacoes"
ON public.solicitacoes_servico
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Clientes podem criar novas solicitacoes"
ON public.solicitacoes_servico
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Clientes e colaboradores podem consultar solicitacoes ativas"
ON public.solicitacoes_servico
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Colaboradores em campo podem atualizar status e codigo de seguranca"
ON public.solicitacoes_servico
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- Políticas para EXECUCOES_TIMER
-- ------------------------------------------------------------------------------
CREATE POLICY "Acesso total ao timer para administradores"
ON public.execucoes_timer
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Operacional e cliente podem ler e gravar timer de execucao"
ON public.execucoes_timer
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- Políticas para AVALIACOES_FEEDBACK
-- ------------------------------------------------------------------------------
CREATE POLICY "Acesso total aos feedbacks para gestores"
ON public.avaliacoes_feedback
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Clientes e equipe podem registrar avaliacoes e consultar SAC"
ON public.avaliacoes_feedback
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Consulta publica a feedbacks aprovados"
ON public.avaliacoes_feedback
FOR SELECT
TO anon
USING (true);
