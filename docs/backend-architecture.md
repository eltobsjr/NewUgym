# Backend Architecture - NewUgym

## 📋 Sumário Executivo

Este documento descreve a arquitetura backend completa para o aplicativo **NewUgym**, uma plataforma de gerenciamento de personal training que conecta personal trainers e seus alunos. O sistema foi projetado para ser escalável, seguro e facilitar a gestão de treinos, progresso físico, finanças e eventos.

---

## 🎯 Visão Geral do Sistema

### Atores do Sistema
1. **Personal Trainer**: Profissional que gerencia alunos, cria planos de treino, monitora progresso e administra finanças
2. **Aluno (Student)**: Usuário que segue planos de treino, registra execuções e acompanha seu próprio progresso

### Funcionalidades Principais
- Autenticação e autorização baseada em roles
- Gerenciamento de planos de treino (templates e personalizados)
- Registro e acompanhamento de progresso físico
- Sistema financeiro (mensalidades, pagamentos, planos)
- Calendário de eventos e aulas
- Sistema de tarefas (kanban)
- IA para geração e análise de treinos

---

## 🏗️ Arquitetura de Alto Nível - Monolito Next.js + Supabase

```
┌───────────────────────────────────────────────────────────────────┐
│                     Next.js Application (Monolito)                │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Frontend (App Router)                          │ │
│  │  - Server Components (RSC)                                  │ │
│  │  - Client Components                                        │ │
│  │  - Context API (Client State)                               │ │
│  └────────────────────┬────────────────────────────────────────┘ │
│                       │                                           │
│  ┌────────────────────▼────────────────────────────────────────┐ │
│  │          API Routes (/app/api/*)                            │ │
│  │  - /api/auth/*         - /api/workouts/*                    │ │
│  │  - /api/users/*        - /api/progress/*                    │ │
│  │  - /api/finance/*      - /api/events/*                      │ │
│  │  - /api/tasks/*        - /api/ai/*                          │ │
│  │                                                              │ │
│  │  Middleware:                                                 │ │
│  │  - Auth verification (Supabase)                              │ │
│  │  - Rate limiting                                             │ │
│  │  - Input validation (Zod)                                    │ │
│  └────────────────────┬────────────────────────────────────────┘ │
│                       │                                           │
│  ┌────────────────────▼────────────────────────────────────────┐ │
│  │              Server Actions (optional)                       │ │
│  │  - Form submissions                                          │ │
│  │  - Mutations                                                 │ │
│  └──────────────────────────────────────────────────────────────┘ │
└───────────────────────┬───────────────────────────────────────────┘
                        │
        ┌───────────────┴────────────────┬──────────────┐
        │                                │              │
┌───────▼─────────┐            ┌─────────▼─────┐  ┌────▼────────┐
│   Supabase      │            │  AI Service   │  │  Storage    │
│                 │            │   (Genkit)    │  │ (Supabase)  │
│ - Auth          │            │               │  │             │
│ - PostgreSQL    │            │ - Generate    │  │ - Avatars   │
│ - Row Level     │            │   Workout     │  │ - Progress  │
│   Security      │            │ - Analyze     │  │   Photos    │
│ - Realtime      │            │   Performance │  │ - Exercise  │
│ - Storage       │            │               │  │   Media     │
└─────────────────┘            └───────────────┘  └─────────────┘
```

### Por que Monolito Next.js + Supabase?

✅ **Vantagens:**
- **Simplicidade**: Um único codebase, deploy unificado
- **Desenvolvimento rápido**: Menos overhead de comunicação entre serviços
- **Type safety**: Tipos compartilhados entre frontend e backend
- **Custo reduzido**: Menos infraestrutura para gerenciar
- **DX melhorada**: Hot reload, debugging facilitado
- **Supabase**: Banco + Auth + Storage + Realtime em um único serviço

⚠️ **Considerações:**
- Escalar verticalmente primeiro, depois considerar microsserviços se necessário
- Usar Edge Functions do Supabase para operações específicas se precisar
- Modularizar bem o código para facilitar futura separação

---

## � Setup Supabase

### Configuração Inicial

```bash
# Instalar Supabase CLI
npm install -g supabase

# Inicializar projeto
supabase init

# Iniciar localmente (opcional para dev)
supabase start

# Link com projeto remoto
supabase link --project-ref your-project-ref
```

### Instalação no Next.js

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Client Setup

```typescript
// lib/supabase/client.ts (Client-side)
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// lib/supabase/server.ts (Server-side)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

// lib/supabase/middleware.ts (Middleware)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  await supabase.auth.getUser()
  return response
}
```

### Migrations com Supabase

```bash
# Criar nova migration
supabase migration new create_users_table

# Aplicar migrations localmente
supabase db reset

# Aplicar em produção
supabase db push

# Gerar types TypeScript do schema
supabase gen types typescript --local > lib/database.types.ts
```

---

## �💾 Modelo de Dados

### 1. Módulo de Usuários

#### **Table: users**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Student', 'Trainer')),
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Campos específicos de Student
    height_cm DECIMAL(5,2),
    birthdate DATE,
    
    -- Campos específicos de Trainer
    cref VARCHAR(50),
    specializations TEXT,
    bio TEXT,
    
    -- Metadata
    onboarding_completed BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{}'
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Trainers podem ver perfis de seus alunos
CREATE POLICY "Trainers can view their students" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_relationships ur
      WHERE ur.trainer_id = auth.uid()
      AND ur.student_id = users.id
      AND ur.status = 'active'
    )
  );

-- Policy: Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id);
```

#### **Table: user_relationships**
```sql
-- Relacionamento Trainer -> Student
CREATE TABLE user_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    
    UNIQUE(trainer_id, student_id)
);

CREATE INDEX idx_relationships_trainer ON user_relationships(trainer_id);
CREATE INDEX idx_relationships_student ON user_relationships(student_id);
```

---

### 2. Módulo de Treinos (Workouts)

#### **Table: workout_templates**
```sql
-- Templates de treino criados pelos trainers (reutilizáveis)
CREATE TABLE workout_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) CHECK (difficulty IN ('Iniciante', 'Intermediário', 'Avançado')),
    is_public BOOLEAN DEFAULT FALSE, -- Pode ser compartilhado com outros trainers
    tags JSONB DEFAULT '[]', -- ["Hipertrofia", "Força", "Pernas"]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_templates_creator ON workout_templates(created_by);
CREATE INDEX idx_templates_public ON workout_templates(is_public);
```

#### **Table: workout_plans**
```sql
-- Planos de treino atribuídos a alunos específicos (podem ser cópias de templates)
CREATE TABLE workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plans_student ON workout_plans(student_id);
CREATE INDEX idx_plans_template ON workout_plans(template_id);
CREATE INDEX idx_plans_active ON workout_plans(is_active);
```

#### **Table: workout_days**
```sql
-- Cada dia dentro de um plano/template
CREATE TABLE workout_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
    template_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
    day_name VARCHAR(50) NOT NULL, -- "Segunda-feira", "Dia 1", etc
    focus VARCHAR(255), -- "Peito e Tríceps"
    order_index INT NOT NULL,
    is_rest_day BOOLEAN DEFAULT FALSE,
    
    CHECK (
        (plan_id IS NOT NULL AND template_id IS NULL) OR
        (plan_id IS NULL AND template_id IS NOT NULL)
    )
);

CREATE INDEX idx_days_plan ON workout_days(plan_id);
CREATE INDEX idx_days_template ON workout_days(template_id);
```

#### **Table: exercises**
```sql
-- Biblioteca de exercícios
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    muscle_group VARCHAR(100), -- "Peito", "Costas", "Pernas"
    equipment VARCHAR(100), -- "Barra", "Halteres", "Máquina"
    difficulty VARCHAR(20),
    media_url TEXT, -- URL de vídeo/GIF demonstrativo
    created_by UUID REFERENCES users(id), -- NULL para exercícios padrão do sistema
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exercises_muscle ON exercises(muscle_group);
CREATE INDEX idx_exercises_name ON exercises(name);
```

#### **Table: workout_exercises**
```sql
-- Exercícios dentro de um dia de treino
CREATE TABLE workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id UUID NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    sets VARCHAR(20), -- "4", "3-4"
    reps VARCHAR(20), -- "8-12", "Até falha"
    rest_seconds INT,
    notes TEXT,
    order_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workout_exercises_day ON workout_exercises(day_id);
CREATE INDEX idx_workout_exercises_exercise ON workout_exercises(exercise_id);
```

#### **Table: workout_sessions**
```sql
-- Registro de uma sessão de treino realizada
CREATE TABLE workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id),
    plan_id UUID REFERENCES workout_plans(id),
    day_id UUID REFERENCES workout_days(id),
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    duration_minutes INT,
    notes TEXT,
    mood VARCHAR(20), -- "Excelente", "Bom", "Cansado"
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_student ON workout_sessions(student_id);
CREATE INDEX idx_sessions_plan ON workout_sessions(plan_id);
CREATE INDEX idx_sessions_date ON workout_sessions(started_at);
```

#### **Table: exercise_logs**
```sql
-- Registro de cada série executada
CREATE TABLE exercise_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id),
    set_number INT NOT NULL,
    weight_kg DECIMAL(6,2),
    reps INT,
    is_completed BOOLEAN DEFAULT TRUE,
    rpe DECIMAL(3,1), -- Rate of Perceived Exertion (1-10)
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logs_session ON exercise_logs(session_id);
CREATE INDEX idx_logs_exercise ON exercise_logs(workout_exercise_id);
CREATE INDEX idx_logs_date ON exercise_logs(created_at);
```

---

### 3. Módulo de Progresso Físico

#### **Table: body_measurements**
```sql
CREATE TABLE body_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    measured_at TIMESTAMP NOT NULL,
    
    -- Métricas principais
    weight_kg DECIMAL(5,2),
    body_fat_percentage DECIMAL(4,2),
    
    -- Circunferências (cm)
    arm_cm DECIMAL(5,2),
    chest_cm DECIMAL(5,2),
    waist_cm DECIMAL(5,2),
    hip_cm DECIMAL(5,2),
    thigh_cm DECIMAL(5,2),
    calf_cm DECIMAL(5,2),
    
    -- Outras métricas
    muscle_mass_kg DECIMAL(5,2),
    visceral_fat INT,
    
    -- Metadata
    notes TEXT,
    measured_by UUID REFERENCES users(id), -- Quem fez a medição
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_measurements_student ON body_measurements(student_id);
CREATE INDEX idx_measurements_date ON body_measurements(measured_at);
```

#### **Table: progress_photos**
```sql
CREATE TABLE progress_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    angle VARCHAR(20) CHECK (angle IN ('front', 'side', 'back')),
    taken_at TIMESTAMP NOT NULL,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_photos_student ON progress_photos(student_id);
CREATE INDEX idx_photos_date ON progress_photos(taken_at);
```

---

### 4. Módulo Financeiro

#### **Table: membership_plans**
```sql
-- Planos de assinatura oferecidos pelo trainer
CREATE TABLE membership_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_cents INT NOT NULL, -- Armazenar em centavos para evitar problemas de precisão
    currency VARCHAR(3) DEFAULT 'BRL',
    recurrence VARCHAR(20) CHECK (recurrence IN ('Mensal', 'Trimestral', 'Semestral', 'Anual')),
    is_active BOOLEAN DEFAULT TRUE,
    features JSONB DEFAULT '[]', -- ["Acompanhamento personalizado", "Plano nutricional"]
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plans_trainer ON membership_plans(trainer_id);
CREATE INDEX idx_plans_active ON membership_plans(is_active);
```

#### **Table: subscriptions**
```sql
-- Assinaturas dos alunos
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES users(id),
    plan_id UUID NOT NULL REFERENCES membership_plans(id),
    
    status VARCHAR(20) CHECK (status IN ('Ativo', 'Pendente', 'Atrasado', 'Cancelado', 'Pausado')),
    
    started_at TIMESTAMP NOT NULL,
    next_due_date DATE,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_student ON subscriptions(student_id);
CREATE INDEX idx_subscriptions_trainer ON subscriptions(trainer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_due_date ON subscriptions(next_due_date);
```

#### **Table: transactions**
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id),
    
    amount_cents INT NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    
    type VARCHAR(50) CHECK (type IN ('Primeiro Pagamento', 'Renovação', 'Ajuste', 'Reembolso')),
    status VARCHAR(20) CHECK (status IN ('Pago', 'Pendente', 'Atrasado', 'Cancelado', 'Reembolsado')),
    
    due_date DATE NOT NULL,
    paid_at TIMESTAMP,
    
    payment_method VARCHAR(50), -- "Pix", "Cartão", "Transferência"
    payment_gateway_id VARCHAR(255), -- ID da transação no gateway de pagamento
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_subscription ON transactions(subscription_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_due_date ON transactions(due_date);
CREATE INDEX idx_transactions_paid_at ON transactions(paid_at);
```

---

### 5. Módulo de Eventos e Calendário

#### **Table: events**
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES users(id),
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) CHECK (type IN ('class', 'event', 'seminar', 'personal_session')),
    
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    location VARCHAR(255),
    
    max_participants INT,
    is_public BOOLEAN DEFAULT TRUE, -- Visível para todos os alunos do trainer
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_creator ON events(created_by);
CREATE INDEX idx_events_start ON events(start_time);
CREATE INDEX idx_events_type ON events(type);
```

#### **Table: event_registrations**
```sql
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'waitlist')),
    
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    UNIQUE(event_id, user_id)
);

CREATE INDEX idx_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_registrations_user ON event_registrations(user_id);
```

---

### 6. Módulo de Tarefas

#### **Table: tasks**
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES users(id),
    assigned_to UUID NOT NULL REFERENCES users(id),
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'archived')),
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    due_date DATE,
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_creator ON tasks(created_by);
CREATE INDEX idx_tasks_assignee ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

---

### 7. Módulo de IA (Genkit Integration)

#### **Table: ai_generations**
```sql
-- Log de gerações de IA (para auditoria e analytics)
CREATE TABLE ai_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    type VARCHAR(50) CHECK (type IN ('workout_generation', 'performance_analysis', 'nutrition_suggestion')),
    
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    
    model_version VARCHAR(50),
    tokens_used INT,
    generation_time_ms INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_generations_user ON ai_generations(user_id);
CREATE INDEX idx_generations_type ON ai_generations(type);
CREATE INDEX idx_generations_date ON ai_generations(created_at);
```

---

## 🔐 Autenticação e Autorização com Supabase

### Estratégia de Auth

#### 1. **Autenticação com Supabase Auth**

Supabase Auth gerencia automaticamente JWT tokens, refresh tokens e sessions.

```typescript
// app/api/auth/signup/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, name, role } = await request.json()
  const supabase = createClient()

  // 1. Criar usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role, // Metadata customizado
      },
    },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // 2. Criar perfil na tabela users
  const { error: profileError } = await supabase.from('users').insert({
    id: authData.user!.id,
    email,
    name,
    role,
  })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ user: authData.user })
}

// app/api/auth/login/route.ts
export async function POST(request: Request) {
  const { email, password } = await request.json()
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  return NextResponse.json({ user: data.user, session: data.session })
}

// app/api/auth/logout/route.ts
export async function POST() {
  const supabase = createClient()
  await supabase.auth.signOut()
  return NextResponse.json({ message: 'Logged out' })
}

// Verificar usuário logado (Server Component)
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <div>Olá, {user.email}</div>
}
```

**JWT Payload (gerenciado pelo Supabase):**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "user_metadata": {
    "name": "John Doe",
    "role": "Trainer"
  },
  "iat": 1234567890,
  "exp": 1234571490
}
```

#### 2. **Autorização (Authorization)**

**Regras de Acesso por Role:**

| Recurso | Student | Trainer |
|---------|---------|---------|
| Ver próprio perfil | ✅ | ✅ |
| Editar próprio perfil | ✅ | ✅ |
| Ver perfil de outros alunos | ❌ | ✅ (apenas seus alunos) |
| Criar workout templates | ❌ | ✅ |
| Atribuir workout plans | ❌ | ✅ |
| Registrar execução de treino | ✅ | ❌ |
| Ver progresso físico | ✅ (próprio) | ✅ (seus alunos) |
| Gerenciar finanças | ❌ | ✅ |
| Criar eventos | ❌ | ✅ |
| Registrar-se em eventos | ✅ | ✅ |
| Gerenciar tarefas | ✅ | ✅ |

#### 3. **Middleware de Autorização no Next.js**

```typescript
// middleware.ts (root)
import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Atualiza session do Supabase
  const response = await updateSession(request)

  // Proteção de rotas
  const protectedPaths = ['/dashboard', '/api/workouts', '/api/finance']
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// lib/auth/requireRole.ts (Helper para API Routes)
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { UserRole } from '@/types'

export async function requireRole(allowedRoles: UserRole[]) {
  const supabase = createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  // Buscar role do usuário
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !allowedRoles.includes(profile.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { user, profile }
}

// Uso em API Route:
// app/api/students/route.ts
import { requireRole } from '@/lib/auth/requireRole'

export async function GET() {
  const auth = await requireRole(['Trainer'])
  if (auth.error) return auth.error

  const supabase = createClient()
  const { data } = await supabase.from('users').select('*').eq('role', 'Student')
  
  return NextResponse.json(data)
}
```

---

## 🔄 Fluxos de Dados Principais

### 1. Fluxo de Criação e Atribuição de Treino

```
┌──────────┐
│ Trainer  │
└────┬─────┘
     │
     │ 1. Cria Workout Template
     ▼
┌─────────────────────┐
│ workout_templates   │
│ - name             │
│ - description      │
│ - difficulty       │
└─────────┬───────────┘
          │
          │ 2. Adiciona Dias e Exercícios
          ▼
    ┌──────────────┐
    │ workout_days │
    │ + exercises  │
    └──────┬───────┘
           │
           │ 3. Atribui a Aluno(s)
           ▼
    ┌──────────────┐
    │ workout_plans│ ← Cópia personalizada para o aluno
    │ (student_id) │
    └──────┬───────┘
           │
           │ 4. Aluno acessa e executa
           ▼
    ┌─────────────────┐
    │ workout_sessions│
    │ + exercise_logs │
    └─────────────────┘
```

### 2. Fluxo de Registro de Treino Executado

```
1. Aluno inicia sessão de treino
   POST /api/workout-sessions
   {
     "plan_id": "uuid",
     "day_id": "uuid",
     "started_at": "2024-08-10T18:00:00Z"
   }

2. Para cada série executada:
   POST /api/exercise-logs
   {
     "session_id": "uuid",
     "workout_exercise_id": "uuid",
     "set_number": 1,
     "weight_kg": 80,
     "reps": 10,
     "is_completed": true
   }

3. Finaliza sessão:
   PATCH /api/workout-sessions/:id
   {
     "completed_at": "2024-08-10T19:15:00Z",
     "duration_minutes": 75,
     "notes": "Treino pesado mas produtivo"
   }
```

### 3. Fluxo de Análise de Progresso com IA

```
┌────────────┐
│ User       │
│ solicita   │
│ análise    │
└─────┬──────┘
      │
      │ GET /api/progress/:studentId
      ▼
┌─────────────────────────┐
│ Backend coleta dados:   │
│ - body_measurements     │
│ - exercise_logs         │
│ - workout_sessions      │
└──────────┬──────────────┘
           │
           │ Estrutura input
           ▼
┌──────────────────────┐
│ AI Service (Genkit)  │
│ analyzePerformance() │
└──────────┬───────────┘
           │
           │ Gera análise textual
           ▼
┌──────────────────────┐
│ ai_generations       │ ← Log para auditoria
└──────────┬───────────┘
           │
           │ Retorna ao Frontend
           ▼
┌──────────────────────┐
│ Exibe análise        │
│ com sugestões        │
└──────────────────────┘
```

### 4. Fluxo de Pagamento e Renovação

```
┌───────────────┐
│ Subscription  │
│ next_due_date │
└───────┬───────┘
        │
        │ Cron Job diário verifica due dates
        ▼
┌─────────────────────────┐
│ Para cada vencimento:   │
│ 1. Cria transaction     │
│ 2. Status = 'Pendente'  │
└────────┬────────────────┘
         │
         │ Integra com gateway de pagamento
         ▼
┌─────────────────────────┐
│ Payment Gateway         │
│ (Stripe, Mercado Pago)  │
└────────┬────────────────┘
         │
         │ Webhook: Pagamento confirmado
         ▼
┌─────────────────────────┐
│ Update transaction:     │
│ - status = 'Pago'       │
│ - paid_at = NOW()       │
└────────┬────────────────┘
         │
         │ Update subscription:
         ▼
┌─────────────────────────┐
│ - next_due_date += 30d  │
│ - status = 'Ativo'      │
└─────────────────────────┘
```

---

## 📡 API Endpoints (REST)

### Authentication (Supabase)

```
POST   /api/auth/signup           # Criar conta
POST   /api/auth/login            # Login com email/password
POST   /api/auth/logout           # Logout
POST   /api/auth/reset-password   # Solicitar reset de senha
POST   /api/auth/update-password  # Atualizar senha
GET    /api/auth/session          # Verificar sessão atual

# OAuth (via Supabase)
GET    /api/auth/google           # Login com Google
GET    /api/auth/callback         # Callback OAuth
```

### Users & Profiles

```
GET    /api/users/me
PATCH  /api/users/me
GET    /api/users/:id
PATCH  /api/users/:id                    [Trainer only]

GET    /api/trainers/:trainerId/students [Trainer only]
POST   /api/trainers/:trainerId/students [Trainer only]
DELETE /api/trainers/:trainerId/students/:studentId
```

### Workouts

```
# Templates (Trainer only)
GET    /api/workout-templates
POST   /api/workout-templates
GET    /api/workout-templates/:id
PATCH  /api/workout-templates/:id
DELETE /api/workout-templates/:id

# Plans
GET    /api/workout-plans                [Trainer: all, Student: own]
POST   /api/workout-plans                [Trainer only]
GET    /api/workout-plans/:id
PATCH  /api/workout-plans/:id
DELETE /api/workout-plans/:id

POST   /api/workout-plans/:id/assign     [Trainer only]

# Sessions & Logs
GET    /api/workout-sessions             [Filter by student_id, date range]
POST   /api/workout-sessions
PATCH  /api/workout-sessions/:id

POST   /api/exercise-logs
GET    /api/exercise-logs                [Query: session_id, exercise_id, date range]
```

### Progress

```
GET    /api/body-measurements/:studentId
POST   /api/body-measurements
GET    /api/body-measurements/:id
DELETE /api/body-measurements/:id

POST   /api/progress-photos
GET    /api/progress-photos/:studentId
DELETE /api/progress-photos/:id
```

### Finance

```
# Plans
GET    /api/membership-plans
POST   /api/membership-plans             [Trainer only]
PATCH  /api/membership-plans/:id         [Trainer only]

# Subscriptions
GET    /api/subscriptions                [Trainer: all, Student: own]
POST   /api/subscriptions                [Trainer only]
PATCH  /api/subscriptions/:id            [Trainer only]

# Transactions
GET    /api/transactions                 [Filter by subscription, status, date range]
POST   /api/transactions                 [Trainer only]
PATCH  /api/transactions/:id             [Trainer only]

# Reports
GET    /api/finance/revenue-report       [Trainer only]
GET    /api/finance/overdue-report       [Trainer only]
```

### Events

```
GET    /api/events                       [Query: date range, type]
POST   /api/events                       [Trainer only]
PATCH  /api/events/:id                   [Trainer only]
DELETE /api/events/:id                   [Trainer only]

POST   /api/events/:id/register
DELETE /api/events/:id/unregister
GET    /api/events/:id/participants      [Trainer only]
```

### Tasks

```
GET    /api/tasks                        [Filter by status, assignee]
POST   /api/tasks
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
```

### AI Services

```
POST   /api/ai/generate-workout
POST   /api/ai/analyze-performance
GET    /api/ai/generations               [History]
```

---

## 🤖 Integração com IA (Google Genkit)

### Arquitetura AI

```
Frontend Request
    │
    ▼
API Endpoint (/api/ai/*)
    │
    ▼
AI Service Layer
    │
    ├─→ generate-workout-flow.ts
    │   └─→ Genkit AI (Gemini)
    │       └─→ Returns structured JSON
    │
    ├─→ analyze-performance-flow.ts
    │   └─→ Genkit AI (Gemini)
    │       └─→ Returns markdown analysis
    │
    └─→ describe-exercise-flow.ts (futuro)
```

### Fluxos AI Existentes

#### 1. **Generate Workout Plan**
```typescript
// Input
{
  goal: "Hypertrophy",
  level: "Intermediate",
  daysPerWeek: 5,
  sessionDuration: 60,
  notes: "No knee issues, prefer dumbbells"
}

// Output (Structured)
{
  planName: "5-Day Hypertrophy Split",
  weeklySchedule: [
    {
      day: "Monday",
      focus: "Chest & Triceps",
      exercises: [
        { name: "Bench Press", sets: 4, reps: "8-12", rest: "90s" },
        // ...
      ]
    },
    // ... 7 days
  ]
}
```

#### 2. **Analyze Performance**
```typescript
// Input
{
  studentName: "Alex Johnson",
  metricHistory: [
    { date: "2024-05-01", weight: 90, bodyFat: 25 },
    { date: "2024-06-01", weight: 88, bodyFat: 23 },
    // ...
  ],
  workoutPlan: {
    name: "Strength 3x",
    schedule: [...]
  }
}

// Output (Markdown Text)
{
  analysis: `
    ## Análise de Desempenho - Alex Johnson
    
    ### Pontos Fortes
    - Redução consistente de peso (-5kg em 3 meses)
    - Boa aderência ao treino (85% dos exercícios completos)
    
    ### Áreas de Melhoria
    - Aumentar progressão de carga no supino
    - Incluir mais trabalho de mobilidade
    
    ### Sugestões
    1. Adicionar 2.5kg no supino na próxima semana
    2. Incluir alongamento pós-treino
  `
}
```

### Best Practices para IA

1. **Rate Limiting**: Limitar chamadas por usuário (ex: 10/dia para geração de treino)
2. **Caching**: Cachear resultados similares por 24h
3. **Fallback**: Sistema funcional mesmo se IA estiver offline
4. **Logging**: Todas as gerações devem ser logadas em `ai_generations`
5. **Cost Control**: Monitorar tokens usados e estabelecer budget
6. **Validation**: Sempre validar output da IA antes de retornar ao usuário

---

## 🔔 Notificações e Background Jobs

### Sistema de Notificações

#### **Table: notifications**
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL, -- 'workout_reminder', 'payment_due', 'new_message'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    action_url TEXT, -- Deep link para ação relacionada
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
```

### Background Jobs (Cron/Queue)

```typescript
// Usar: BullMQ, Agenda, ou similar

// 1. Verificar pagamentos vencidos (diário às 00:00)
async function checkOverduePayments() {
  const today = new Date();
  const overdueTransactions = await db.transactions.findMany({
    where: {
      status: 'Pendente',
      due_date: { lt: today }
    }
  });
  
  for (const transaction of overdueTransactions) {
    // Atualizar status
    await db.transactions.update({
      where: { id: transaction.id },
      data: { status: 'Atrasado' }
    });
    
    // Notificar aluno e trainer
    await sendNotification(transaction.subscription.student_id, {
      type: 'payment_overdue',
      title: 'Pagamento em Atraso',
      message: 'Sua mensalidade está vencida...'
    });
  }
}

// 2. Lembrete de treino (diário às 08:00)
async function sendWorkoutReminders() {
  const today = new Date();
  const dayName = getDayName(today); // "Segunda-feira"
  
  // Buscar alunos com treino agendado para hoje
  const studentsWithWorkout = await db.workoutPlans.findMany({
    where: {
      is_active: true,
      schedule: {
        some: {
          day_name: dayName,
          is_rest_day: false
        }
      }
    },
    include: { student: true }
  });
  
  for (const plan of studentsWithWorkout) {
    await sendNotification(plan.student_id, {
      type: 'workout_reminder',
      title: 'Hora do Treino!',
      message: `Hoje é dia de ${plan.focus}`
    });
  }
}

// 3. Renovação automática de assinaturas (diário)
async function processSubscriptionRenewals() {
  const today = new Date();
  
  const renewals = await db.subscriptions.findMany({
    where: {
      status: 'Ativo',
      next_due_date: today
    }
  });
  
  for (const subscription of renewals) {
    // Criar nova transação
    await db.transactions.create({
      data: {
        subscription_id: subscription.id,
        amount_cents: subscription.plan.price_cents,
        type: 'Renovação',
        status: 'Pendente',
        due_date: today
      }
    });
    
    // Atualizar próxima data de vencimento
    await db.subscriptions.update({
      where: { id: subscription.id },
      data: {
        next_due_date: addMonths(today, 1)
      }
    });
  }
}
```

---

## 📊 Analytics e Métricas

### Métricas de Negócio (Trainer Dashboard)

```typescript
// 1. MRR (Monthly Recurring Revenue)
SELECT 
    SUM(mp.price_cents) / 100 as mrr
FROM subscriptions s
JOIN membership_plans mp ON s.plan_id = mp.id
WHERE s.status = 'Ativo'
  AND s.trainer_id = :trainerId;

// 2. Churn Rate (mensal)
SELECT 
    COUNT(*) FILTER (WHERE cancelled_at >= :startOfMonth) * 100.0 / 
    COUNT(*) as churn_rate
FROM subscriptions
WHERE trainer_id = :trainerId
  AND started_at < :startOfMonth;

// 3. Taxa de Adesão ao Treino (Workout Compliance)
SELECT 
    COUNT(*) FILTER (WHERE ws.completed_at IS NOT NULL) * 100.0 / 
    COUNT(*) as completion_rate
FROM workout_sessions ws
JOIN workout_plans wp ON ws.plan_id = wp.id
WHERE wp.student_id = :studentId
  AND ws.started_at >= :startOfMonth;

// 4. Progressão Média de Carga (por exercício)
SELECT 
    we.exercise_id,
    e.name,
    AVG(el.weight_kg) as avg_weight,
    DATE_TRUNC('month', el.created_at) as month
FROM exercise_logs el
JOIN workout_exercises we ON el.workout_exercise_id = we.id
JOIN exercises e ON we.exercise_id = e.id
WHERE el.session_id IN (
    SELECT id FROM workout_sessions WHERE student_id = :studentId
)
GROUP BY we.exercise_id, e.name, month
ORDER BY month;
```

---

## 🚀 Deployment e Infraestrutura (Monolito)

### Stack Recomendado

```yaml
Monolito Next.js:
  Platform: Vercel (recomendado)
  Alternativas: Netlify, Cloudflare Pages, Railway
  
  Vantagens Vercel:
    - Deploy automático via Git
    - Edge Functions globais
    - Otimização automática de imagens
    - Preview deployments para PRs
    - Analytics integrado

Supabase (All-in-One):
  - Database: PostgreSQL (até 500MB free)
  - Auth: Email, OAuth (Google, GitHub, etc)
  - Storage: 1GB free para arquivos
  - Realtime: WebSockets para updates em tempo real
  - Edge Functions: Serverless functions (Deno)
  - Dashboard: Interface visual para gerenciar DB
  
  Pricing:
    - Free: $0/mês (ótimo para MVP)
    - Pro: $25/mês (8GB DB, 100GB bandwidth)

File Storage (dentro do Supabase):
  Buckets:
    - avatars: Fotos de perfil
    - progress-photos: Fotos de evolução
    - exercise-media: Vídeos/GIFs de exercícios
  
  Features:
    - CDN global
    - Image transformation
    - RLS para controle de acesso

AI:
  - Google Genkit (Firebase)
  - Deploy: Vercel Serverless Functions
  - Fallback: Supabase Edge Functions

Payment Gateway:
  - Brasil: Mercado Pago (recomendado)
  - Alternativa: Stripe
  - Webhooks: /api/webhooks/payment

Monitoring:
  - Vercel Analytics (performance)
  - Sentry (error tracking)
  - Supabase Dashboard (DB metrics)
```

### Arquitetura de Deploy

```
┌─────────────────────────────────────────────────┐
│              GitHub Repository                   │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  Push to main                              │ │
│  └──────────────┬─────────────────────────────┘ │
└─────────────────┼───────────────────────────────┘
                  │
                  │ Auto Deploy
                  ▼
┌─────────────────────────────────────────────────┐
│              Vercel Platform                     │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Next.js App                             │   │
│  │  - Frontend (React)                      │   │
│  │  - API Routes                            │   │
│  │  - Server Actions                        │   │
│  │  - Edge Middleware                       │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  Global Edge Network                             │
│  - CDN automático                                │
│  - Image Optimization                            │
└──────────────┬──────────────────┬────────────────┘
               │                  │
               │                  │
     ┌─────────▼──────┐    ┌─────▼──────────┐
     │   Supabase     │    │  AI Services   │
     │                │    │   (Genkit)     │
     │ - PostgreSQL   │    └────────────────┘
     │ - Auth         │
     │ - Storage      │
     │ - Realtime     │
     └────────────────┘
```

### Environment Variables

```env
# Supabase (obter em: https://supabase.com/dashboard/project/_/settings/api)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Admin access, NUNCA expor no client

# Supabase Database (opcional, para conexão direta)
DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres

# AI (Google Genkit)
GENKIT_API_KEY=AIzaSy...
GENKIT_PROJECT_ID=your-firebase-project

# Payment Gateway
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-xxx
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxx
MERCADOPAGO_WEBHOOK_SECRET=xxx

# App Config
NEXT_PUBLIC_APP_URL=https://newugym.com
NODE_ENV=production

# Email (opcional - Supabase já tem email transacional)
RESEND_API_KEY=re_xxx # Alternativa: Resend

# Analytics (opcional)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Setup Local (.env.local)

```bash
# 1. Criar projeto no Supabase: https://supabase.com
# 2. Copiar as credenciais
# 3. Criar arquivo .env.local

cp .env.example .env.local

# 4. Preencher com suas credenciais
# 5. Rodar migrations

npm run db:migrate # ou: supabase db push
```

---

## 🔒 Segurança

### Checklist de Segurança

- [ ] **HTTPS obrigatório** em produção
- [ ] **Rate Limiting** em todos os endpoints (ex: 100 req/min)
- [ ] **CORS configurado** para domínios específicos
- [ ] **Validação de input** com Zod/Yup em todos os endpoints
- [ ] **SQL Injection protegido** (usar ORM com prepared statements)
- [ ] **XSS protegido** (sanitizar HTML/markdown do usuário)
- [ ] **CSRF tokens** em forms
- [ ] **Helmet.js** para security headers
- [ ] **Passwords hasheadas** com bcrypt (cost factor 12+)
- [ ] **JWTs assinados** e com expiração curta
- [ ] **Logs de auditoria** para ações sensíveis (delete, finance)
- [ ] **Backup automático** do database (diário)
- [ ] **Princípio do menor privilégio** em queries SQL

### Proteção de Dados Sensíveis

```typescript
// NUNCA retornar password_hash na API
const sanitizeUser = (user: User) => {
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

// Criptografar dados médicos se necessário (LGPD compliance)
// Considerar field-level encryption para:
// - body_measurements (métricas corporais)
// - progress_photos (fotos de progresso)
// - notes (anotações pessoais)
```

---

## 📈 Escalabilidade

### Estratégia de Escalabilidade (Vercel + Supabase)

#### Fase 1: Vertical Scaling (0-10k usuários)
```
┌─────────────────────────────────────┐
│    Vercel (Auto-scaling)            │
│    - Serverless Functions           │
│    - Edge Network Global            │
│    - Automatic Caching              │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Supabase Pro Plan ($25/mês)      │
│    - 8GB Database                   │
│    - Connection Pooling             │
│    - Point-in-time Recovery         │
└─────────────────────────────────────┘
```

#### Fase 2: Horizontal + Caching (10k-100k usuários)
```
┌──────────────────────────────────────┐
│    Vercel Enterprise                  │
└──────────────┬───────────────────────┘
               │
     ┌─────────┴─────────┐
     │                   │
┌────▼────┐      ┌───────▼────────┐
│ Upstash │      │ Supabase Team  │
│ Redis   │      │ - 64GB DB      │
│ (Cache) │      │ - Read Replicas│
└─────────┘      └────────────────┘
```

#### Fase 3: Microsserviços (100k+ usuários)
- Separar AI Service em Cloud Run/Lambda
- Payment Service dedicado
- Background Jobs em separado (Inngest, QStash)

### Otimizações

**1. Database (Supabase)**
```sql
-- Indexes já definidos nos schemas

-- Connection Pooling (incluído no Supabase)
-- Supabase usa PgBouncer automaticamente

-- Evitar SELECT *
SELECT id, name, email FROM users WHERE id = $1;

-- Paginação
SELECT * FROM workouts 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 0;

-- N+1 Prevention
SELECT 
  users.*,
  json_agg(workout_plans.*) as plans
FROM users
LEFT JOIN workout_plans ON workout_plans.student_id = users.id
GROUP BY users.id;
```

**2. Caching Strategy**
```typescript
// Next.js Cache (API Routes)
export const revalidate = 60 // 60 segundos

// Server Components Cache
import { unstable_cache } from 'next/cache'

const getCachedUser = unstable_cache(
  async (userId: string) => {
    return await supabase.from('users').select('*').eq('id', userId).single()
  },
  ['user-profile'],
  { revalidate: 300 } // 5 minutos
)

// Redis para queries pesadas (opcional)
import { Redis } from '@upstash/redis'
const redis = new Redis({ url: process.env.UPSTASH_URL })

const cacheKey = `analytics:${trainerId}:${month}`
const cached = await redis.get(cacheKey)
if (cached) return cached

const data = await heavyQuery()
await redis.set(cacheKey, data, { ex: 3600 }) // 1 hora
```

**3. Image Optimization**
```typescript
// Next.js Image (automático)
import Image from 'next/image'

<Image
  src={supabaseUrl}
  width={400}
  height={300}
  alt="Progress photo"
/>

// Supabase Image Transformation
const imageUrl = supabase.storage
  .from('progress-photos')
  .getPublicUrl('photo.jpg', {
    transform: {
      width: 400,
      height: 300,
      resize: 'cover',
      quality: 80
    }
  })
```

**4. Serverless Optimization**
```typescript
// Route Handler com streaming
export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      const data = await fetchLargeDataset()
      for (const chunk of data) {
        controller.enqueue(JSON.stringify(chunk))
      }
      controller.close()
    }
  })
  
  return new Response(stream)
}

// Edge Runtime para respostas rápidas
export const runtime = 'edge'
```

**5. Supabase Realtime (para features futuras)**
```typescript
// Listen para mudanças em tempo real
const channel = supabase
  .channel('workout-updates')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'exercise_logs' },
    (payload) => console.log('New exercise logged!', payload)
  )
  .subscribe()
```

---

## 📝 Próximos Passos

### Fase 1: MVP (Mínimo Viável)
- [ ] Implementar autenticação básica
- [ ] CRUD de usuários e perfis
- [ ] Sistema de workout plans (sem templates ainda)
- [ ] Registro de execução de treino
- [ ] Dashboard básico de progresso

### Fase 2: Funcionalidades Principais
- [ ] Workout templates e biblioteca de exercícios
- [ ] Módulo financeiro completo
- [ ] Calendário de eventos
- [ ] Integração com gateway de pagamento
- [ ] Sistema de notificações

### Fase 3: IA e Analytics
- [ ] Integração completa com Genkit
- [ ] Análises automáticas de progresso
- [ ] Sugestões de exercícios personalizadas
- [ ] Dashboard analytics avançado

### Fase 4: Features Avançadas
- [ ] Chat entre trainer e aluno
- [ ] Vídeo chamadas integradas
- [ ] App mobile nativo
- [ ] Integração com wearables (Fitbit, Apple Watch)
- [ ] Marketplace de templates de treino

---

## 🤝 Contribuição e Manutenção

### Estrutura de Branches
```
main          → Produção
staging       → Testes pré-produção
develop       → Desenvolvimento ativo
feature/*     → Novas features
bugfix/*      → Correções
hotfix/*      → Correções urgentes em produção
```

### Code Review Guidelines
- Toda feature precisa de testes unitários
- PRs precisam de aprovação de pelo menos 1 dev
- CI/CD deve passar antes do merge
- Documentar mudanças no schema do DB

---

## 📚 Referências e Tecnologias

- **Next.js 14+**: Framework React com App Router
- **TypeScript**: Type safety
- **Prisma / Drizzle**: ORM para PostgreSQL
- **Zod**: Schema validation
- **Google Genkit**: AI workflows
- **NextAuth.js**: Authentication
- **Recharts**: Data visualization
- **TailwindCSS + shadcn/ui**: UI Components
- **date-fns**: Date manipulation

---

**Última Atualização**: Dezembro 2024  
**Versão do Documento**: 1.0  
**Autor**: Arquitetura NewUgym
