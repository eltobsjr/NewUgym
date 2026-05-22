-- ============================================================
-- UGYM — Schema Completo com RLS e Storage
-- Execute no Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ------------------------------------------------------------
-- EXTENSÕES
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- FUNÇÃO GENÉRICA: atualizar updated_at automaticamente
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. USUÁRIOS
-- ============================================================

-- Tabela de perfis vinculada ao auth.users do Supabase.
-- NÃO armazena senha — isso é responsabilidade do Supabase Auth.
CREATE TABLE public.users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT UNIQUE NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('Student', 'Trainer')),
  name         TEXT NOT NULL,
  avatar_url   TEXT,

  -- Campos de Student
  height_cm    NUMERIC(5,2),
  birthdate    DATE,

  -- Campos de Trainer
  cref             TEXT,
  specializations  TEXT,
  bio              TEXT,

  -- Metadata
  onboarding_completed BOOLEAN DEFAULT FALSE,
  preferences          JSONB   DEFAULT '{}'::jsonb,
  is_active            BOOLEAN DEFAULT TRUE,

  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_email  ON public.users(email);
CREATE INDEX idx_users_role   ON public.users(role);
CREATE INDEX idx_users_active ON public.users(is_active);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: cria perfil automaticamente quando um usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users: ver próprio perfil"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- NOTA: "users: trainer vê seus alunos" é criada após user_relationships (ver abaixo)

CREATE POLICY "users: atualizar próprio perfil"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users: inserir próprio perfil"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 2. RELACIONAMENTOS TRAINER ↔ STUDENT
-- ============================================================
CREATE TABLE public.user_relationships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
  started_at  TIMESTAMPTZ DEFAULT now(),
  ended_at    TIMESTAMPTZ,

  UNIQUE(trainer_id, student_id)
);

CREATE INDEX idx_rel_trainer ON public.user_relationships(trainer_id);
CREATE INDEX idx_rel_student ON public.user_relationships(student_id);
CREATE INDEX idx_rel_status  ON public.user_relationships(status);

ALTER TABLE public.user_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rel: trainer gerencia"
  ON public.user_relationships FOR ALL
  USING (auth.uid() = trainer_id);

CREATE POLICY "rel: aluno vê os seus"
  ON public.user_relationships FOR SELECT
  USING (auth.uid() = student_id);

-- Policy adiada: depende de user_relationships existir
CREATE POLICY "users: trainer vê seus alunos"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_relationships ur
      WHERE ur.trainer_id = auth.uid()
        AND ur.student_id = users.id
        AND ur.status = 'active'
    )
  );

-- ============================================================
-- 3. BIBLIOTECA DE EXERCÍCIOS
-- ============================================================
CREATE TABLE public.exercises (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  muscle_group  TEXT,
  equipment     TEXT,
  difficulty    TEXT CHECK (difficulty IN ('Iniciante', 'Intermediário', 'Avançado')),
  media_url     TEXT,
  created_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_public     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_exercises_muscle  ON public.exercises(muscle_group);
CREATE INDEX idx_exercises_name    ON public.exercises(name);
CREATE INDEX idx_exercises_public  ON public.exercises(is_public);
CREATE INDEX idx_exercises_creator ON public.exercises(created_by);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercises: exercícios públicos"
  ON public.exercises FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "exercises: ver próprios"
  ON public.exercises FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "exercises: criar autenticado"
  ON public.exercises FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "exercises: atualizar próprios"
  ON public.exercises FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "exercises: deletar próprios"
  ON public.exercises FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================================
-- 4. TEMPLATES DE TREINO (criados pelo trainer, reutilizáveis)
-- ============================================================
CREATE TABLE public.workout_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  difficulty  TEXT CHECK (difficulty IN ('Iniciante', 'Intermediário', 'Avançado')),
  is_public   BOOLEAN DEFAULT FALSE,
  tags        JSONB DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_templates_creator ON public.workout_templates(created_by);
CREATE INDEX idx_templates_public  ON public.workout_templates(is_public);

CREATE TRIGGER trg_workout_templates_updated_at
  BEFORE UPDATE ON public.workout_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates: ver próprios e públicos"
  ON public.workout_templates FOR SELECT
  USING (auth.uid() = created_by OR is_public = TRUE);

CREATE POLICY "templates: criar (somente trainer)"
  ON public.workout_templates FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Trainer')
  );

CREATE POLICY "templates: atualizar próprios"
  ON public.workout_templates FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "templates: deletar próprios"
  ON public.workout_templates FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================================
-- 5. PLANOS DE TREINO (atribuídos a alunos específicos)
-- ============================================================
CREATE TABLE public.workout_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_by  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  description TEXT,
  difficulty  TEXT CHECK (difficulty IN ('Iniciante', 'Intermediário', 'Avançado')),
  is_active   BOOLEAN DEFAULT TRUE,
  started_at  TIMESTAMPTZ DEFAULT now(),
  ends_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_plans_student    ON public.workout_plans(student_id);
CREATE INDEX idx_plans_creator    ON public.workout_plans(created_by);
CREATE INDEX idx_plans_template   ON public.workout_plans(template_id);
CREATE INDEX idx_plans_active     ON public.workout_plans(is_active);

CREATE TRIGGER trg_workout_plans_updated_at
  BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans: aluno vê os seus"
  ON public.workout_plans FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "plans: trainer vê de seus alunos"
  ON public.workout_plans FOR SELECT
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.user_relationships ur
      WHERE ur.trainer_id = auth.uid()
        AND ur.student_id = workout_plans.student_id
        AND ur.status = 'active'
    )
  );

CREATE POLICY "plans: criar (somente trainer)"
  ON public.workout_plans FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Trainer')
  );

CREATE POLICY "plans: atualizar (trainer responsável)"
  ON public.workout_plans FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.user_relationships ur
      WHERE ur.trainer_id = auth.uid()
        AND ur.student_id = workout_plans.student_id
        AND ur.status = 'active'
    )
  );

CREATE POLICY "plans: deletar próprios"
  ON public.workout_plans FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================================
-- 6. DIAS DE TREINO
-- (pertence a um workout_plan OU workout_template, nunca ambos)
-- ============================================================
CREATE TABLE public.workout_days (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     UUID REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  day_name    TEXT NOT NULL,
  focus       TEXT,
  order_index INT NOT NULL DEFAULT 0,
  is_rest_day BOOLEAN DEFAULT FALSE,

  CONSTRAINT workout_days_has_parent CHECK (
    (plan_id IS NOT NULL AND template_id IS NULL) OR
    (plan_id IS NULL AND template_id IS NOT NULL)
  )
);

CREATE INDEX idx_days_plan     ON public.workout_days(plan_id);
CREATE INDEX idx_days_template ON public.workout_days(template_id);

ALTER TABLE public.workout_days ENABLE ROW LEVEL SECURITY;

-- Aluno vê dias dos seus planos
CREATE POLICY "days: aluno vê dias do seu plano"
  ON public.workout_days FOR SELECT
  USING (
    (plan_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = workout_days.plan_id AND wp.student_id = auth.uid()
    ))
    OR
    (template_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.workout_templates wt
      WHERE wt.id = workout_days.template_id
        AND (wt.created_by = auth.uid() OR wt.is_public = TRUE)
    ))
  );

-- Trainer vê dias de templates/planos seus ou de seus alunos
CREATE POLICY "days: trainer vê seus dias"
  ON public.workout_days FOR SELECT
  USING (
    (plan_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.workout_plans wp
      JOIN public.user_relationships ur ON ur.student_id = wp.student_id
      WHERE wp.id = workout_days.plan_id
        AND ur.trainer_id = auth.uid()
        AND ur.status = 'active'
    ))
    OR
    (template_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.workout_templates wt
      WHERE wt.id = workout_days.template_id AND wt.created_by = auth.uid()
    ))
  );

CREATE POLICY "days: trainer insere"
  ON public.workout_days FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Trainer')
  );

CREATE POLICY "days: trainer atualiza"
  ON public.workout_days FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Trainer')
  );

CREATE POLICY "days: trainer deleta"
  ON public.workout_days FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Trainer')
  );

-- ============================================================
-- 7. EXERCÍCIOS DENTRO DE UM DIA
-- ============================================================
CREATE TABLE public.workout_exercises (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id              UUID NOT NULL REFERENCES public.workout_days(id) ON DELETE CASCADE,
  exercise_id         UUID NOT NULL REFERENCES public.exercises(id),
  sets                TEXT,
  reps                TEXT,
  rest_seconds        INT,
  notes               TEXT,
  order_index         INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_we_day      ON public.workout_exercises(day_id);
CREATE INDEX idx_we_exercise ON public.workout_exercises(exercise_id);

ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- Herda visibilidade do dia pai
CREATE POLICY "we: ver (aluno ou trainer)"
  ON public.workout_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_days wd
      WHERE wd.id = workout_exercises.day_id AND (
        -- via plano do aluno
        (wd.plan_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.workout_plans wp
          WHERE wp.id = wd.plan_id AND (
            wp.student_id = auth.uid() OR
            EXISTS (
              SELECT 1 FROM public.user_relationships ur
              WHERE ur.trainer_id = auth.uid()
                AND ur.student_id = wp.student_id
                AND ur.status = 'active'
            )
          )
        ))
        OR
        -- via template
        (wd.template_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.workout_templates wt
          WHERE wt.id = wd.template_id
            AND (wt.created_by = auth.uid() OR wt.is_public = TRUE)
        ))
      )
    )
  );

CREATE POLICY "we: trainer insere"
  ON public.workout_exercises FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Trainer')
  );

CREATE POLICY "we: trainer atualiza"
  ON public.workout_exercises FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Trainer')
  );

CREATE POLICY "we: trainer deleta"
  ON public.workout_exercises FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Trainer')
  );

-- ============================================================
-- 8. SESSÕES DE TREINO (execuções registradas pelo aluno)
-- ============================================================
CREATE TABLE public.workout_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id          UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  day_id           UUID REFERENCES public.workout_days(id) ON DELETE SET NULL,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at     TIMESTAMPTZ,
  duration_minutes INT,
  notes            TEXT,
  -- Enum sincronizado com completeSessionSchema do Zod
  mood             TEXT CHECK (mood IN ('Excelente', 'Bom', 'Normal', 'Cansado', 'Péssimo')),
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sessions_student      ON public.workout_sessions(student_id);
CREATE INDEX idx_sessions_plan         ON public.workout_sessions(plan_id);
CREATE INDEX idx_sessions_date         ON public.workout_sessions(started_at);
CREATE INDEX idx_sessions_student_date ON public.workout_sessions(student_id, started_at DESC);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions: aluno vê as suas"
  ON public.workout_sessions FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "sessions: trainer vê de seus alunos"
  ON public.workout_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_relationships ur
      WHERE ur.trainer_id = auth.uid()
        AND ur.student_id = workout_sessions.student_id
        AND ur.status = 'active'
    )
  );

CREATE POLICY "sessions: aluno insere (somente o seu)"
  ON public.workout_sessions FOR INSERT
  WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Student')
  );

CREATE POLICY "sessions: aluno atualiza (somente a sua)"
  ON public.workout_sessions FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "sessions: aluno deleta (somente a sua)"
  ON public.workout_sessions FOR DELETE
  USING (auth.uid() = student_id);

-- ============================================================
-- 9. LOGS DE SÉRIES (cada série executada)
-- ============================================================
CREATE TABLE public.exercise_logs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id           UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  workout_exercise_id  UUID NOT NULL REFERENCES public.workout_exercises(id),
  set_number           INT NOT NULL CHECK (set_number > 0),
  weight_kg            NUMERIC(6,2),
  reps                 INT,
  is_completed         BOOLEAN DEFAULT TRUE,
  rpe                  NUMERIC(3,1) CHECK (rpe BETWEEN 1 AND 10),
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_logs_session  ON public.exercise_logs(session_id);
CREATE INDEX idx_logs_exercise ON public.exercise_logs(workout_exercise_id);
CREATE INDEX idx_logs_date     ON public.exercise_logs(created_at);

ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

-- Aluno gerencia os seus próprios logs (via sessão)
CREATE POLICY "logs: aluno gerencia"
  ON public.exercise_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = exercise_logs.session_id AND ws.student_id = auth.uid()
    )
  );

-- Trainer lê os logs de seus alunos
CREATE POLICY "logs: trainer vê de seus alunos"
  ON public.exercise_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      JOIN public.user_relationships ur ON ur.student_id = ws.student_id
      WHERE ws.id = exercise_logs.session_id
        AND ur.trainer_id = auth.uid()
        AND ur.status = 'active'
    )
  );

-- ============================================================
-- 10. MEDIÇÕES CORPORAIS
-- ============================================================
CREATE TABLE public.body_measurements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  measured_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Métricas (sincronizado com createMeasurementSchema)
  weight_kg           NUMERIC(5,2),
  body_fat_percentage NUMERIC(4,2) CHECK (body_fat_percentage BETWEEN 0 AND 100),
  arm_cm              NUMERIC(5,2),
  chest_cm            NUMERIC(5,2),
  waist_cm            NUMERIC(5,2),
  hip_cm              NUMERIC(5,2),
  thigh_cm            NUMERIC(5,2),
  calf_cm             NUMERIC(5,2),
  muscle_mass_kg      NUMERIC(5,2),
  visceral_fat        INT,
  notes               TEXT,

  measured_by         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_measurements_student      ON public.body_measurements(student_id);
CREATE INDEX idx_measurements_date         ON public.body_measurements(measured_at);
CREATE INDEX idx_measurements_student_date ON public.body_measurements(student_id, measured_at DESC);

ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "measurements: aluno vê as suas"
  ON public.body_measurements FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "measurements: trainer vê de seus alunos"
  ON public.body_measurements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_relationships ur
      WHERE ur.trainer_id = auth.uid()
        AND ur.student_id = body_measurements.student_id
        AND ur.status = 'active'
    )
  );

CREATE POLICY "measurements: inserir (aluno próprio ou trainer)"
  ON public.body_measurements FOR INSERT
  WITH CHECK (
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM public.user_relationships ur
      WHERE ur.trainer_id = auth.uid()
        AND ur.student_id = body_measurements.student_id
        AND ur.status = 'active'
    )
  );

CREATE POLICY "measurements: atualizar (quem mediu ou trainer)"
  ON public.body_measurements FOR UPDATE
  USING (
    auth.uid() = measured_by OR
    EXISTS (
      SELECT 1 FROM public.user_relationships ur
      WHERE ur.trainer_id = auth.uid()
        AND ur.student_id = body_measurements.student_id
        AND ur.status = 'active'
    )
  );

CREATE POLICY "measurements: deletar (aluno ou trainer)"
  ON public.body_measurements FOR DELETE
  USING (
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM public.user_relationships ur
      WHERE ur.trainer_id = auth.uid()
        AND ur.student_id = body_measurements.student_id
        AND ur.status = 'active'
    )
  );

-- ============================================================
-- 11. FOTOS DE PROGRESSO
-- ============================================================
CREATE TABLE public.progress_photos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  photo_url  TEXT NOT NULL,
  angle      TEXT CHECK (angle IN ('front', 'side', 'back')),
  taken_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_photos_student ON public.progress_photos(student_id);
CREATE INDEX idx_photos_date    ON public.progress_photos(taken_at);

ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photos: aluno vê as suas"
  ON public.progress_photos FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "photos: trainer vê de seus alunos"
  ON public.progress_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_relationships ur
      WHERE ur.trainer_id = auth.uid()
        AND ur.student_id = progress_photos.student_id
        AND ur.status = 'active'
    )
  );

CREATE POLICY "photos: aluno insere"
  ON public.progress_photos FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "photos: aluno deleta"
  ON public.progress_photos FOR DELETE
  USING (auth.uid() = student_id);

-- ============================================================
-- 12. PLANOS DE MENSALIDADE
-- ============================================================
CREATE TABLE public.membership_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  -- Armazenado em centavos para evitar problemas de ponto flutuante
  price_cents INT NOT NULL CHECK (price_cents >= 0),
  currency    TEXT DEFAULT 'BRL',
  recurrence  TEXT CHECK (recurrence IN ('Mensal', 'Trimestral', 'Semestral', 'Anual')),
  is_active   BOOLEAN DEFAULT TRUE,
  features    JSONB DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_membership_trainer ON public.membership_plans(trainer_id);
CREATE INDEX idx_membership_active  ON public.membership_plans(is_active);

CREATE TRIGGER trg_membership_plans_updated_at
  BEFORE UPDATE ON public.membership_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "membership: trainer gerencia"
  ON public.membership_plans FOR ALL
  USING (auth.uid() = trainer_id);

CREATE POLICY "membership: aluno vê planos do seu trainer"
  ON public.membership_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_relationships ur
      WHERE ur.student_id = auth.uid()
        AND ur.trainer_id = membership_plans.trainer_id
        AND ur.status = 'active'
    )
  );

-- ============================================================
-- 13. ASSINATURAS
-- ============================================================
CREATE TABLE public.subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  trainer_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id             UUID NOT NULL REFERENCES public.membership_plans(id) ON DELETE RESTRICT,
  status              TEXT DEFAULT 'Ativo'
                        CHECK (status IN ('Ativo', 'Pendente', 'Atrasado', 'Cancelado', 'Pausado')),
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_due_date       DATE,
  cancelled_at        TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_student  ON public.subscriptions(student_id);
CREATE INDEX idx_subscriptions_trainer  ON public.subscriptions(trainer_id);
CREATE INDEX idx_subscriptions_status   ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_due_date ON public.subscriptions(next_due_date);

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions: trainer gerencia"
  ON public.subscriptions FOR ALL
  USING (auth.uid() = trainer_id);

CREATE POLICY "subscriptions: aluno vê a sua"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = student_id);

-- ============================================================
-- 14. TRANSAÇÕES FINANCEIRAS
-- ============================================================
CREATE TABLE public.transactions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id      UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  amount_cents         INT NOT NULL CHECK (amount_cents >= 0),
  currency             TEXT DEFAULT 'BRL',
  type                 TEXT CHECK (type IN ('Primeiro Pagamento', 'Renovação', 'Ajuste', 'Reembolso')),
  status               TEXT DEFAULT 'Pendente'
                         CHECK (status IN ('Pago', 'Pendente', 'Atrasado', 'Cancelado', 'Reembolsado')),
  due_date             DATE NOT NULL,
  paid_at              TIMESTAMPTZ,
  payment_method       TEXT,
  payment_gateway_id   TEXT,
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transactions_subscription ON public.transactions(subscription_id);
CREATE INDEX idx_transactions_status       ON public.transactions(status);
CREATE INDEX idx_transactions_due_date     ON public.transactions(due_date);
CREATE INDEX idx_transactions_paid_at      ON public.transactions(paid_at);

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions: trainer gerencia"
  ON public.transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.id = transactions.subscription_id AND s.trainer_id = auth.uid()
    )
  );

CREATE POLICY "transactions: aluno vê as suas"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.id = transactions.subscription_id AND s.student_id = auth.uid()
    )
  );

-- ============================================================
-- 15. EVENTOS E CALENDÁRIO
-- ============================================================
CREATE TABLE public.events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  type             TEXT CHECK (type IN ('class', 'event', 'seminar', 'personal_session')),
  start_time       TIMESTAMPTZ NOT NULL,
  end_time         TIMESTAMPTZ NOT NULL,
  location         TEXT,
  max_participants INT,
  is_public        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT events_end_after_start CHECK (end_time > start_time)
);

CREATE INDEX idx_events_creator ON public.events(created_by);
CREATE INDEX idx_events_start   ON public.events(start_time);
CREATE INDEX idx_events_type    ON public.events(type);

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events: trainer gerencia os seus"
  ON public.events FOR ALL
  USING (auth.uid() = created_by);

CREATE POLICY "events: aluno vê eventos públicos do seu trainer"
  ON public.events FOR SELECT
  USING (
    is_public = TRUE AND
    EXISTS (
      SELECT 1 FROM public.user_relationships ur
      WHERE ur.student_id = auth.uid()
        AND ur.trainer_id = events.created_by
        AND ur.status = 'active'
    )
  );

-- ============================================================
-- 16. INSCRIÇÕES EM EVENTOS
-- ============================================================
CREATE TABLE public.event_registrations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status       TEXT DEFAULT 'confirmed'
                 CHECK (status IN ('confirmed', 'cancelled', 'waitlist')),
  registered_at TIMESTAMPTZ DEFAULT now(),
  cancelled_at  TIMESTAMPTZ,

  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_reg_event ON public.event_registrations(event_id);
CREATE INDEX idx_event_reg_user  ON public.event_registrations(user_id);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_reg: usuário gerencia a sua"
  ON public.event_registrations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "event_reg: trainer vê inscritos nos seus eventos"
  ON public.event_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_registrations.event_id AND e.created_by = auth.uid()
    )
  );

-- ============================================================
-- 17. TAREFAS (KANBAN)
-- ============================================================
CREATE TABLE public.tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_to  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT DEFAULT 'todo'
                 CHECK (status IN ('todo', 'in_progress', 'done', 'archived')),
  priority     TEXT DEFAULT 'medium'
                 CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date     DATE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tasks_creator  ON public.tasks(created_by);
CREATE INDEX idx_tasks_assignee ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status   ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks: ver (criador ou assignee)"
  ON public.tasks FOR SELECT
  USING (auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "tasks: criar"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "tasks: atualizar (criador ou assignee)"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "tasks: deletar (somente criador)"
  ON public.tasks FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================================
-- 18. GERAÇÕES DE IA (auditoria e analytics)
-- ============================================================
CREATE TABLE public.ai_generations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type               TEXT CHECK (type IN ('workout_generation', 'performance_analysis', 'exercise_description')),
  input_data         JSONB NOT NULL,
  output_data        JSONB NOT NULL,
  model_version      TEXT,
  tokens_used        INT,
  generation_time_ms INT,
  created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_gen_user ON public.ai_generations(user_id);
CREATE INDEX idx_ai_gen_type ON public.ai_generations(type);
CREATE INDEX idx_ai_gen_date ON public.ai_generations(created_at);

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_gen: ver próprias"
  ON public.ai_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ai_gen: inserir autenticado"
  ON public.ai_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS
-- Arquivo: público = url direta acessível sem token
--          privado = exige token de sessão via signed URL
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'avatars',
    'avatars',
    TRUE,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'progress-photos',
    'progress-photos',
    FALSE,
    10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'exercise-media',
    'exercise-media',
    TRUE,
    52428800, -- 50 MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- Storage RLS: avatars
-- Estrutura de path esperado: {user_id}/avatar.{ext}
-- ------------------------------------------------------------
CREATE POLICY "avatars: leitura pública"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars: upload (somente próprio)"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars: atualizar (somente próprio)"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars: deletar (somente próprio)"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ------------------------------------------------------------
-- Storage RLS: progress-photos (privado)
-- Estrutura de path: {student_id}/{filename}
-- ------------------------------------------------------------
CREATE POLICY "progress-photos: aluno vê as suas"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'progress-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "progress-photos: trainer vê de seus alunos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'progress-photos' AND
    EXISTS (
      SELECT 1 FROM public.user_relationships ur
      WHERE ur.trainer_id = auth.uid()
        AND ur.student_id::text = (storage.foldername(name))[1]
        AND ur.status = 'active'
    )
  );

CREATE POLICY "progress-photos: aluno faz upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'progress-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "progress-photos: aluno deleta"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'progress-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ------------------------------------------------------------
-- Storage RLS: exercise-media (público para leitura, trainer para escrita)
-- Estrutura de path: {trainer_id}/{filename}
-- ------------------------------------------------------------
CREATE POLICY "exercise-media: leitura pública"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'exercise-media');

CREATE POLICY "exercise-media: trainer faz upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'exercise-media' AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Trainer')
  );

CREATE POLICY "exercise-media: trainer deleta próprios"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'exercise-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- SEED: Exercícios base do sistema (is_public = TRUE)
-- ============================================================
INSERT INTO public.exercises (name, description, muscle_group, equipment, difficulty, is_public)
VALUES
  ('Supino Reto com Barra',    'Exercício fundamental para peito, pressione a barra em linha reta.',           'Peito',     'Barra',    'Intermediário', TRUE),
  ('Supino Inclinado Halteres','Ativa a parte superior do peitoral.',                                           'Peito',     'Halteres', 'Intermediário', TRUE),
  ('Crucifixo',                'Isolamento do peitoral com arco amplo.',                                        'Peito',     'Halteres', 'Iniciante',     TRUE),
  ('Peck Deck',                'Máquina de isolamento para o peitoral.',                                        'Peito',     'Máquina',  'Iniciante',     TRUE),
  ('Barra Fixa',               'Tracion o corpo até a barra, excelente para costas e bíceps.',                  'Costas',    'Barra',    'Intermediário', TRUE),
  ('Remada Curvada',           'Remada com barra para espessura das costas.',                                   'Costas',    'Barra',    'Intermediário', TRUE),
  ('Puxada Frontal',           'Puxada na polia alta para largura das costas.',                                 'Costas',    'Máquina',  'Iniciante',     TRUE),
  ('Remada Unilateral',        'Remada com haltere em apoio no banco.',                                         'Costas',    'Halteres', 'Iniciante',     TRUE),
  ('Agachamento Livre',        'Movimento composto para membros inferiores.',                                   'Pernas',    'Barra',    'Intermediário', TRUE),
  ('Leg Press 45°',            'Pressa bimembral em máquina para quadríceps.',                                  'Pernas',    'Máquina',  'Iniciante',     TRUE),
  ('Cadeira Extensora',        'Isolamento do quadríceps.',                                                     'Pernas',    'Máquina',  'Iniciante',     TRUE),
  ('Mesa Flexora',             'Isolamento dos isquiotibiais.',                                                  'Pernas',    'Máquina',  'Iniciante',     TRUE),
  ('Stiff',                    'Agachamento romeno para posterior de coxa e glúteos.',                          'Pernas',    'Barra',    'Intermediário', TRUE),
  ('Panturrilha em Pé',        'Elevação de calcanhares para desenvolvimento da panturrilha.',                  'Pernas',    'Máquina',  'Iniciante',     TRUE),
  ('Desenvolvimento com Barra','Exercício para ombros, pressionando a barra acima da cabeça.',                 'Ombros',    'Barra',    'Intermediário', TRUE),
  ('Elevação Lateral',         'Isolamento da cabeça lateral do deltóide.',                                     'Ombros',    'Halteres', 'Iniciante',     TRUE),
  ('Elevação Frontal',         'Isolamento da cabeça anterior do deltóide.',                                    'Ombros',    'Halteres', 'Iniciante',     TRUE),
  ('Rosca Direta',             'Curl de bíceps clássico com barra.',                                            'Bíceps',    'Barra',    'Iniciante',     TRUE),
  ('Rosca Alternada',          'Curl alternado com halteres.',                                                  'Bíceps',    'Halteres', 'Iniciante',     TRUE),
  ('Tríceps Testa',            'Extensão de cotovelos deitado com barra EZ.',                                   'Tríceps',   'Barra',    'Intermediário', TRUE),
  ('Tríceps Corda',            'Extensão na polia com corda.',                                                  'Tríceps',   'Máquina',  'Iniciante',     TRUE),
  ('Tríceps Francês',          'Extensão unilateral acima da cabeça.',                                          'Tríceps',   'Halteres', 'Iniciante',     TRUE),
  ('Abdominal Crunch',         'Contração abdominal básica.',                                                   'Abdômen',   'Peso corporal', 'Iniciante', TRUE),
  ('Prancha',                  'Isometria de core, mantenha o corpo reto.',                                     'Abdômen',   'Peso corporal', 'Iniciante', TRUE),
  ('Abdominal com Roda',       'Rollout com roda para core avançado.',                                          'Abdômen',   'Acessório', 'Avançado',     TRUE),
  ('Corrida na Esteira',       'Cardio em esteira, varie velocidade e inclinação.',                             'Cardio',    'Equipamento', 'Iniciante',  TRUE),
  ('Bicicleta Ergométrica',    'Cardio de baixo impacto articular.',                                            'Cardio',    'Equipamento', 'Iniciante',  TRUE),
  ('Pular Corda',              'Cardio de alta intensidade com corda.',                                         'Cardio',    'Acessório', 'Intermediário', TRUE),
  ('Burpee',                   'Exercício funcional de corpo inteiro de alta intensidade.',                     'Cardio',    'Peso corporal', 'Avançado', TRUE),
  ('Deadlift',                 'Levantamento terra, exercício composto rei para força total.',                  'Costas',    'Barra',    'Avançado',      TRUE)
ON CONFLICT DO NOTHING;
