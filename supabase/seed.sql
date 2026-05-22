-- ============================================================
-- UGYM — Seed de Dados de Demonstração
-- ============================================================
-- Execute no Supabase SQL Editor (Dashboard → SQL Editor)
-- Pré-requisito: schema.sql já executado
--
-- CREDENCIAIS (todos usam a senha: Test@1234)
--   Trainer:  carlos@ugym.dev   (Carlos Almeida)
--   Student:  ana@ugym.dev      (Ana Lima — Ativo, Plano Mensal)
--   Student:  pedro@ugym.dev    (Pedro Costa — Ativo, Plano Trimestral)
--   Student:  mariana@ugym.dev  (Mariana Santos — Pendente)
--   Student:  rafael@ugym.dev   (Rafael Oliveira — Atrasado)
--   Student:  juliana@ugym.dev  (Juliana Ferreira — Cancelado)
--
-- IDs fixos usados (para referência cruzada):
--   Trainer Carlos : a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
--   Student Ana    : a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12
--   Student Pedro  : a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13
--   Student Mariana: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14
--   Student Rafael : a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15
--   Student Juliana: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16
-- ============================================================

BEGIN;

-- ============================================================
-- 0. LIMPEZA (remove dados de seed anteriores)
--    Identificados pelo domínio @ugym.dev — seguro para produção
-- ============================================================
DELETE FROM auth.users WHERE email LIKE '%@ugym.dev';
-- Cascata cuida de: auth.identities, public.users, todos os filhos


-- ============================================================
-- 1. USUÁRIOS AUTH
-- ============================================================
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, is_sso_user, is_anonymous,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES
  -- Trainer: Carlos Almeida
  (
    '00000000-0000-0000-0000-000000000000',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'authenticated', 'authenticated',
    'carlos@ugym.dev',
    crypt('Test@1234', gen_salt('bf')),
    NOW(), NOW() - INTERVAL '1 hour',
    '{"provider":"email","providers":["email"]}',
    '{"name":"Carlos Almeida","role":"Trainer"}',
    FALSE, FALSE, FALSE,
    NOW() - INTERVAL '180 days', NOW(),
    '', '', '', ''
  ),
  -- Student: Ana Lima
  (
    '00000000-0000-0000-0000-000000000000',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'authenticated', 'authenticated',
    'ana@ugym.dev',
    crypt('Test@1234', gen_salt('bf')),
    NOW(), NOW() - INTERVAL '2 hours',
    '{"provider":"email","providers":["email"]}',
    '{"name":"Ana Lima","role":"Student"}',
    FALSE, FALSE, FALSE,
    NOW() - INTERVAL '120 days', NOW(),
    '', '', '', ''
  ),
  -- Student: Pedro Costa
  (
    '00000000-0000-0000-0000-000000000000',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'authenticated', 'authenticated',
    'pedro@ugym.dev',
    crypt('Test@1234', gen_salt('bf')),
    NOW(), NOW() - INTERVAL '5 hours',
    '{"provider":"email","providers":["email"]}',
    '{"name":"Pedro Costa","role":"Student"}',
    FALSE, FALSE, FALSE,
    NOW() - INTERVAL '90 days', NOW(),
    '', '', '', ''
  ),
  -- Student: Mariana Santos
  (
    '00000000-0000-0000-0000-000000000000',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    'authenticated', 'authenticated',
    'mariana@ugym.dev',
    crypt('Test@1234', gen_salt('bf')),
    NOW(), NOW() - INTERVAL '3 days',
    '{"provider":"email","providers":["email"]}',
    '{"name":"Mariana Santos","role":"Student"}',
    FALSE, FALSE, FALSE,
    NOW() - INTERVAL '60 days', NOW(),
    '', '', '', ''
  ),
  -- Student: Rafael Oliveira
  (
    '00000000-0000-0000-0000-000000000000',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
    'authenticated', 'authenticated',
    'rafael@ugym.dev',
    crypt('Test@1234', gen_salt('bf')),
    NOW(), NOW() - INTERVAL '10 days',
    '{"provider":"email","providers":["email"]}',
    '{"name":"Rafael Oliveira","role":"Student"}',
    FALSE, FALSE, FALSE,
    NOW() - INTERVAL '45 days', NOW(),
    '', '', '', ''
  ),
  -- Student: Juliana Ferreira
  (
    '00000000-0000-0000-0000-000000000000',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
    'authenticated', 'authenticated',
    'juliana@ugym.dev',
    crypt('Test@1234', gen_salt('bf')),
    NOW(), NOW() - INTERVAL '20 days',
    '{"provider":"email","providers":["email"]}',
    '{"name":"Juliana Ferreira","role":"Student"}',
    FALSE, FALSE, FALSE,
    NOW() - INTERVAL '30 days', NOW(),
    '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;

-- Identidades para login via email
INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  ('carlos@ugym.dev',  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11","email":"carlos@ugym.dev"}',  'email', NOW(), NOW(), NOW()),
  ('ana@ugym.dev',     'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12","email":"ana@ugym.dev"}',     'email', NOW(), NOW(), NOW()),
  ('pedro@ugym.dev',   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13","email":"pedro@ugym.dev"}',   'email', NOW(), NOW(), NOW()),
  ('mariana@ugym.dev', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14","email":"mariana@ugym.dev"}', 'email', NOW(), NOW(), NOW()),
  ('rafael@ugym.dev',  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15","email":"rafael@ugym.dev"}',  'email', NOW(), NOW(), NOW()),
  ('juliana@ugym.dev', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16","email":"juliana@ugym.dev"}', 'email', NOW(), NOW(), NOW())
ON CONFLICT (provider_id, provider) DO NOTHING;

-- Enriquecer perfis (o trigger handle_new_auth_user criou o registro básico)
UPDATE public.users SET
  name = 'Carlos Almeida',
  role = 'Trainer',
  cref = '012345-G/SP',
  specializations = 'Hipertrofia, Emagrecimento, Funcional',
  bio = 'Personal trainer com 8 anos de experiência em São Paulo, especializado em hipertrofia e emagrecimento saudável. Formado em Educação Física pela USP.',
  onboarding_completed = TRUE,
  is_active = TRUE
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

UPDATE public.users SET
  name = 'Ana Lima',
  role = 'Student',
  height_cm = 165,
  birthdate = '1995-03-15',
  onboarding_completed = TRUE,
  is_active = TRUE
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';

UPDATE public.users SET
  name = 'Pedro Costa',
  role = 'Student',
  height_cm = 182,
  birthdate = '1992-07-22',
  onboarding_completed = TRUE,
  is_active = TRUE
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';

UPDATE public.users SET
  name = 'Mariana Santos',
  role = 'Student',
  height_cm = 162,
  birthdate = '1998-11-05',
  onboarding_completed = FALSE,
  is_active = TRUE
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';

UPDATE public.users SET
  name = 'Rafael Oliveira',
  role = 'Student',
  height_cm = 185,
  birthdate = '1990-01-10',
  onboarding_completed = TRUE,
  is_active = TRUE
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15';

UPDATE public.users SET
  name = 'Juliana Ferreira',
  role = 'Student',
  height_cm = 170,
  birthdate = '2000-06-18',
  onboarding_completed = TRUE,
  is_active = FALSE
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16';


-- ============================================================
-- 2. RELACIONAMENTOS TRAINER ↔ STUDENTS
-- ============================================================
INSERT INTO public.user_relationships (trainer_id, student_id, status, started_at)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'active',   NOW() - INTERVAL '120 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'active',   NOW() - INTERVAL '90 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'active',   NOW() - INTERVAL '60 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'active',   NOW() - INTERVAL '45 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'inactive', NOW() - INTERVAL '30 days')
ON CONFLICT (trainer_id, student_id) DO NOTHING;


-- ============================================================
-- 3. TEMPLATES DE TREINO
-- ============================================================
INSERT INTO public.workout_templates (id, created_by, name, description, difficulty, is_public, tags)
VALUES
  (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Hipertrofia — Push/Pull/Legs',
    'Divisão clássica PPL para ganho de massa muscular. Ideal para intermediários com frequência de 3 a 6x por semana. Progressão de carga semanal.',
    'Intermediário',
    TRUE,
    '["hipertrofia","ppl","intermediário","3x","6x"]'
  ),
  (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b02',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Iniciante Completo — Full Body',
    'Programa Full Body para iniciantes. 3 treinos por semana com foco em aprender os levantamentos fundamentais e criar consistência.',
    'Iniciante',
    TRUE,
    '["iniciante","full-body","3x","base"]'
  )
ON CONFLICT (id) DO NOTHING;

-- Dias do Template PPL
INSERT INTO public.workout_days (id, template_id, day_name, focus, order_index, is_rest_day)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01', 'Dia A — Push',    'Peito, Ombros e Tríceps',  1, FALSE),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f02', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01', 'Dia B — Pull',    'Costas e Bíceps',           2, FALSE),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f03', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01', 'Dia C — Legs',    'Pernas e Glúteos',          3, FALSE),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f04', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01', 'Dia D — Descanso','Recuperação ativa',         4, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Dias do Template Iniciante
INSERT INTO public.workout_days (id, template_id, day_name, focus, order_index, is_rest_day)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f05', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b02', 'Treino A',  'Full Body — Força Base',       1, FALSE),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f06', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b02', 'Descanso',  'Recuperação e mobilidade',     2, TRUE),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f07', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b02', 'Treino B',  'Full Body — Condicionamento',   3, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Exercícios Template PPL — Push
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01', (SELECT id FROM public.exercises WHERE name = 'Supino Reto com Barra' LIMIT 1),     '4', '8-12',  90, 1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01', (SELECT id FROM public.exercises WHERE name = 'Supino Inclinado Halteres' LIMIT 1), '3', '10-12', 75, 2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01', (SELECT id FROM public.exercises WHERE name = 'Crucifixo' LIMIT 1),                  '3', '12-15', 60, 3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01', (SELECT id FROM public.exercises WHERE name = 'Desenvolvimento com Barra' LIMIT 1),  '3', '10-12', 75, 4),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01', (SELECT id FROM public.exercises WHERE name = 'Elevação Lateral' LIMIT 1),           '4', '12-15', 60, 5),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01', (SELECT id FROM public.exercises WHERE name = 'Tríceps Corda' LIMIT 1),              '3', '12-15', 60, 6);

-- Exercícios Template PPL — Pull
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f02', (SELECT id FROM public.exercises WHERE name = 'Puxada Frontal' LIMIT 1),     '4', '8-12',  90, 1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f02', (SELECT id FROM public.exercises WHERE name = 'Remada Curvada' LIMIT 1),     '4', '8-12',  90, 2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f02', (SELECT id FROM public.exercises WHERE name = 'Remada Unilateral' LIMIT 1),  '3', '10-12', 75, 3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f02', (SELECT id FROM public.exercises WHERE name = 'Rosca Direta' LIMIT 1),       '3', '10-12', 60, 4),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f02', (SELECT id FROM public.exercises WHERE name = 'Rosca Alternada' LIMIT 1),    '3', '12-15', 60, 5);

-- Exercícios Template PPL — Legs
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f03', (SELECT id FROM public.exercises WHERE name = 'Agachamento Livre' LIMIT 1),  '4', '8-12',  120, 1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f03', (SELECT id FROM public.exercises WHERE name = 'Leg Press 45°' LIMIT 1),      '4', '12-15', 90,  2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f03', (SELECT id FROM public.exercises WHERE name = 'Cadeira Extensora' LIMIT 1),  '3', '12-15', 60,  3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f03', (SELECT id FROM public.exercises WHERE name = 'Mesa Flexora' LIMIT 1),       '3', '12-15', 60,  4),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f03', (SELECT id FROM public.exercises WHERE name = 'Stiff' LIMIT 1),              '3', '10-12', 75,  5),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f03', (SELECT id FROM public.exercises WHERE name = 'Panturrilha em Pé' LIMIT 1),  '4', '15-20', 45,  6);

-- Exercícios Template Iniciante — Treino A
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f05', (SELECT id FROM public.exercises WHERE name = 'Agachamento Livre' LIMIT 1),    '3', '10-12', 90, 1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f05', (SELECT id FROM public.exercises WHERE name = 'Supino Reto com Barra' LIMIT 1),'3', '10-12', 90, 2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f05', (SELECT id FROM public.exercises WHERE name = 'Remada Curvada' LIMIT 1),        '3', '10-12', 75, 3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f05', (SELECT id FROM public.exercises WHERE name = 'Desenvolvimento com Barra' LIMIT 1), '3', '12-15', 60, 4),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f05', (SELECT id FROM public.exercises WHERE name = 'Prancha' LIMIT 1),               '3', '30-60s', 60, 5);

-- Exercícios Template Iniciante — Treino B
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f07', (SELECT id FROM public.exercises WHERE name = 'Leg Press 45°' LIMIT 1),              '3', '12-15', 75, 1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f07', (SELECT id FROM public.exercises WHERE name = 'Supino Inclinado Halteres' LIMIT 1),   '3', '12-15', 75, 2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f07', (SELECT id FROM public.exercises WHERE name = 'Puxada Frontal' LIMIT 1),              '3', '12-15', 75, 3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f07', (SELECT id FROM public.exercises WHERE name = 'Elevação Lateral' LIMIT 1),            '3', '15-20', 45, 4),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f07', (SELECT id FROM public.exercises WHERE name = 'Abdominal Crunch' LIMIT 1),            '3', '15-20', 45, 5);


-- ============================================================
-- 4. PLANOS DE TREINO (atribuídos a alunos)
-- ============================================================
INSERT INTO public.workout_plans (id, student_id, created_by, template_id, name, description, difficulty, is_active, started_at)
VALUES
  -- Ana Lima — PPL adaptado
  (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01',
    'Hipertrofia Feminina — Ana',
    'Programa PPL com ênfase em glúteos e membros inferiores. Volume progressivo ao longo de 12 semanas.',
    'Intermediário', TRUE, NOW() - INTERVAL '90 days'
  ),
  -- Pedro Costa — Força
  (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01',
    'Ganho de Força — Pedro',
    'PPL com ênfase em força máxima nos levantamentos básicos. Progressão linear nas principais cargas.',
    'Intermediário', TRUE, NOW() - INTERVAL '60 days'
  ),
  -- Mariana Santos — Iniciante
  (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b02',
    'Condicionamento Inicial — Mariana',
    'Programa Full Body para adaptação ao exercício e emagrecimento. Foco em técnica e consistência.',
    'Iniciante', TRUE, NOW() - INTERVAL '30 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Dias do Plano da Ana (Segunda/Quarta/Sexta)
INSERT INTO public.workout_days (id, plan_id, day_name, focus, order_index, is_rest_day)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'Segunda — Push', 'Peito, Ombros e Tríceps',  1, FALSE),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'Quarta — Pull',  'Costas e Bíceps',           2, FALSE),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'Sexta — Legs',   'Pernas e Glúteos (foco)',   3, FALSE),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f14', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'Fim de Semana',  'Descanso e Mobilidade',     4, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Exercícios Plano Ana — Push
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', (SELECT id FROM public.exercises WHERE name = 'Supino Reto com Barra' LIMIT 1),     '4', '10-12', 90, 'Descer controlado até o peito',    1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', (SELECT id FROM public.exercises WHERE name = 'Supino Inclinado Halteres' LIMIT 1), '3', '12-15', 75, NULL,                               2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', (SELECT id FROM public.exercises WHERE name = 'Peck Deck' LIMIT 1),                  '3', '15-20', 60, 'Isolamento final do peito',        3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', (SELECT id FROM public.exercises WHERE name = 'Elevação Lateral' LIMIT 1),           '4', '15-20', 45, 'Peso leve, controle o movimento',  4),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', (SELECT id FROM public.exercises WHERE name = 'Tríceps Corda' LIMIT 1),              '3', '12-15', 60, NULL,                               5);

-- Exercícios Plano Ana — Pull
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', (SELECT id FROM public.exercises WHERE name = 'Puxada Frontal' LIMIT 1),    '4', '10-12', 90, NULL,                          1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', (SELECT id FROM public.exercises WHERE name = 'Remada Unilateral' LIMIT 1), '3', '12-15', 75, NULL,                          2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', (SELECT id FROM public.exercises WHERE name = 'Barra Fixa' LIMIT 1),        '3', 'máximo', 90, 'Usar elástico se necessário', 3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', (SELECT id FROM public.exercises WHERE name = 'Rosca Alternada' LIMIT 1),   '3', '12-15', 60, 'Cotovelo fixo',               4);

-- Exercícios Plano Ana — Legs
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', (SELECT id FROM public.exercises WHERE name = 'Agachamento Livre' LIMIT 1),  '4', '10-12', 120, 'Descer até paralelo',           1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', (SELECT id FROM public.exercises WHERE name = 'Leg Press 45°' LIMIT 1),      '4', '15-20', 90,  'Pés mais altos (foco glúteo)',  2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', (SELECT id FROM public.exercises WHERE name = 'Stiff' LIMIT 1),              '3', '12-15', 75,  NULL,                            3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', (SELECT id FROM public.exercises WHERE name = 'Mesa Flexora' LIMIT 1),       '3', '12-15', 60,  NULL,                            4),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', (SELECT id FROM public.exercises WHERE name = 'Cadeira Extensora' LIMIT 1),  '3', '15-20', 45,  'Peso moderado',                 5),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', (SELECT id FROM public.exercises WHERE name = 'Panturrilha em Pé' LIMIT 1),  '4', '20-25', 30,  NULL,                            6);

-- Dias do Plano do Pedro
INSERT INTO public.workout_days (id, plan_id, day_name, focus, order_index, is_rest_day)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f21', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 'Segunda — Push',  'Peito, Ombros, Tríceps', 1, FALSE),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 'Quarta — Pull',   'Costas, Bíceps',         2, FALSE),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f23', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 'Sexta — Legs',    'Pernas',                 3, FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f21', (SELECT id FROM public.exercises WHERE name = 'Supino Reto com Barra' LIMIT 1),     '5', '5',    180, 'Foco em carga máxima — progressão linear', 1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f21', (SELECT id FROM public.exercises WHERE name = 'Desenvolvimento com Barra' LIMIT 1),  '4', '6-8',  120, NULL,                                       2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f21', (SELECT id FROM public.exercises WHERE name = 'Tríceps Testa' LIMIT 1),              '4', '8-10', 90,  NULL,                                       3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f22', (SELECT id FROM public.exercises WHERE name = 'Deadlift' LIMIT 1),                   '5', '5',    180, 'Exercício principal — aquecer bem',        1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f22', (SELECT id FROM public.exercises WHERE name = 'Barra Fixa' LIMIT 1),                 '4', 'máximo', 120, NULL,                                     2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f22', (SELECT id FROM public.exercises WHERE name = 'Remada Curvada' LIMIT 1),             '4', '6-8',  120, 'Progressão linear',                        3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f22', (SELECT id FROM public.exercises WHERE name = 'Rosca Direta' LIMIT 1),               '3', '8-10', 75,  NULL,                                       4),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f23', (SELECT id FROM public.exercises WHERE name = 'Agachamento Livre' LIMIT 1),          '5', '5',    180, 'Principal do dia — progressão linear',     1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f23', (SELECT id FROM public.exercises WHERE name = 'Leg Press 45°' LIMIT 1),              '4', '8-10', 120, NULL,                                       2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f23', (SELECT id FROM public.exercises WHERE name = 'Stiff' LIMIT 1),                      '3', '8-10', 90,  NULL,                                       3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f23', (SELECT id FROM public.exercises WHERE name = 'Panturrilha em Pé' LIMIT 1),          '4', '15-20', 45, NULL,                                       4);

-- Dias do Plano da Mariana
INSERT INTO public.workout_days (id, plan_id, day_name, focus, order_index, is_rest_day)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f31', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 'Terça-Feira', 'Full Body A',  1, FALSE),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f32', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 'Quinta-Feira','Full Body B',  2, FALSE),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f33', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 'Sábado',      'Cardio Leve',  3, FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f31', (SELECT id FROM public.exercises WHERE name = 'Leg Press 45°' LIMIT 1),              '3', '15',   75,  'Peso leve, foco na técnica',  1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f31', (SELECT id FROM public.exercises WHERE name = 'Peck Deck' LIMIT 1),                   '3', '15',   60,  NULL,                          2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f31', (SELECT id FROM public.exercises WHERE name = 'Puxada Frontal' LIMIT 1),              '3', '15',   60,  NULL,                          3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f31', (SELECT id FROM public.exercises WHERE name = 'Prancha' LIMIT 1),                     '3', '30s',  60,  NULL,                          4),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f32', (SELECT id FROM public.exercises WHERE name = 'Cadeira Extensora' LIMIT 1),           '3', '15',   60,  NULL,                          1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f32', (SELECT id FROM public.exercises WHERE name = 'Supino Inclinado Halteres' LIMIT 1),   '3', '15',   60,  NULL,                          2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f32', (SELECT id FROM public.exercises WHERE name = 'Remada Unilateral' LIMIT 1),           '3', '15',   60,  NULL,                          3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f32', (SELECT id FROM public.exercises WHERE name = 'Abdominal Crunch' LIMIT 1),            '3', '20',   45,  NULL,                          4),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f33', (SELECT id FROM public.exercises WHERE name = 'Corrida na Esteira' LIMIT 1),          '1', '30min', NULL, 'Velocidade 6-8 km/h, inclinação 1%', 1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f33', (SELECT id FROM public.exercises WHERE name = 'Bicicleta Ergométrica' LIMIT 1),       '1', '15min', NULL, NULL,                         2);


-- ============================================================
-- 5. SESSÕES DE TREINO + LOGS DE EXERCÍCIOS
-- ============================================================

-- Sessões da Ana (últimos 30 dias)
INSERT INTO public.workout_sessions (id, student_id, plan_id, day_id, started_at, completed_at, duration_minutes, mood, notes)
VALUES
  ('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380901', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days' + INTERVAL '75 minutes',  75, 'Bom',       'Ótimo treino de Push! Aumentei o supino.'),
  ('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380902', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days' + INTERVAL '70 minutes',  70, 'Excelente', 'Bati PR na puxada!'),
  ('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380903', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days' + INTERVAL '80 minutes',  80, 'Bom',       'Dia de Legs pesado, mas valeu!'),
  ('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380904', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days' + INTERVAL '72 minutes',  72, 'Normal',    NULL),
  ('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380905', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days' + INTERVAL '68 minutes',  68, 'Bom',       NULL),
  ('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380906', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days' + INTERVAL '85 minutes',  85, 'Excelente', 'Senti evolução no stiff!'),
  ('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380907', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', NOW() - INTERVAL  '7 days', NOW() - INTERVAL  '7 days' + INTERVAL '70 minutes',  70, 'Cansado',   'Semana pesada no trabalho'),
  ('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380908', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', NOW() - INTERVAL  '5 days', NOW() - INTERVAL  '5 days' + INTERVAL '65 minutes',  65, 'Bom',       NULL)
ON CONFLICT (id) DO NOTHING;

-- Sessões do Pedro
INSERT INTO public.workout_sessions (id, student_id, plan_id, day_id, started_at, completed_at, duration_minutes, mood, notes)
VALUES
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380901', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f21', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days' + INTERVAL '90 minutes',  90, 'Excelente', 'Supino 100kg pela primeira vez!!!'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380902', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f22', NOW() - INTERVAL '23 days', NOW() - INTERVAL '23 days' + INTERVAL '95 minutes',  95, 'Bom',       'Deadlift 140kg. Foco na técnica.'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380903', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f23', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days' + INTERVAL '100 minutes', 100, 'Normal',    NULL),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380904', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f21', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days' + INTERVAL '88 minutes',  88, 'Excelente', '102.5kg no supino!'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380905', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f22', NOW() - INTERVAL  '4 days', NOW() - INTERVAL  '4 days' + INTERVAL '92 minutes',  92, 'Bom',       NULL)
ON CONFLICT (id) DO NOTHING;

-- Sessões da Mariana
INSERT INTO public.workout_sessions (id, student_id, plan_id, day_id, started_at, completed_at, duration_minutes, mood, notes)
VALUES
  ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380901', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f31', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days' + INTERVAL '60 minutes', 60, 'Normal', 'Primeiro treino! Bem cansativo mas gostei.'),
  ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380902', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f32', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days' + INTERVAL '55 minutes', 55, 'Bom',    NULL),
  ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380903', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f33', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days' + INTERVAL '45 minutes', 45, 'Bom',    'Cardio levinho, gostei!')
ON CONFLICT (id) DO NOTHING;

-- Logs de exercícios (sessões da Ana — Push, sessão s01)
INSERT INTO public.exercise_logs (session_id, workout_exercise_id, set_number, weight_kg, reps, is_completed, rpe)
SELECT
  'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380901',
  we.id,
  s.n,
  CASE ex.name
    WHEN 'Supino Reto com Barra'     THEN 45 + (s.n * 2.5)
    WHEN 'Supino Inclinado Halteres' THEN 14 + s.n
    WHEN 'Peck Deck'                 THEN 30
    WHEN 'Elevação Lateral'          THEN 8
    WHEN 'Tríceps Corda'             THEN 22
  END,
  CASE ex.name
    WHEN 'Supino Reto com Barra' THEN 10
    ELSE 12
  END,
  TRUE,
  CASE WHEN s.n = 4 THEN 8.5 ELSE 7.0 END
FROM public.workout_exercises we
JOIN public.exercises ex ON ex.id = we.exercise_id
CROSS JOIN (SELECT generate_series(1,4) AS n) s
WHERE we.day_id = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11'
  AND s.n <= CASE ex.name WHEN 'Supino Reto com Barra' THEN 4 ELSE 3 END;

-- Logs da sessão Ana — Pull (s02)
INSERT INTO public.exercise_logs (session_id, workout_exercise_id, set_number, weight_kg, reps, is_completed, rpe)
SELECT
  'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380902',
  we.id,
  s.n,
  CASE ex.name
    WHEN 'Puxada Frontal'     THEN 42 + s.n
    WHEN 'Remada Unilateral'  THEN 20 + s.n
    WHEN 'Barra Fixa'         THEN 0
    WHEN 'Rosca Alternada'    THEN 12
  END,
  CASE ex.name
    WHEN 'Barra Fixa' THEN 5
    ELSE 12
  END,
  TRUE,
  7.5
FROM public.workout_exercises we
JOIN public.exercises ex ON ex.id = we.exercise_id
CROSS JOIN (SELECT generate_series(1,4) AS n) s
WHERE we.day_id = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12'
  AND s.n <= CASE ex.name WHEN 'Puxada Frontal' THEN 4 ELSE 3 END;

-- Logs sessions Pedro Push (s01)
INSERT INTO public.exercise_logs (session_id, workout_exercise_id, set_number, weight_kg, reps, is_completed, rpe)
SELECT
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380901',
  we.id,
  s.n,
  CASE ex.name
    WHEN 'Supino Reto com Barra'      THEN 97.5 + (s.n * 2.5)
    WHEN 'Desenvolvimento com Barra'  THEN 60
    WHEN 'Tríceps Testa'              THEN 35
  END,
  5,
  TRUE,
  CASE WHEN s.n >= 4 THEN 9.0 ELSE 8.0 END
FROM public.workout_exercises we
JOIN public.exercises ex ON ex.id = we.exercise_id
CROSS JOIN (SELECT generate_series(1,5) AS n) s
WHERE we.day_id = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f21'
  AND s.n <= CASE ex.name WHEN 'Supino Reto com Barra' THEN 5 ELSE 4 END;


-- ============================================================
-- 6. MEDIÇÕES CORPORAIS
-- ============================================================
INSERT INTO public.body_measurements
  (student_id, measured_at, weight_kg, body_fat_percentage, arm_cm, chest_cm, waist_cm, hip_cm, thigh_cm, calf_cm, muscle_mass_kg, measured_by)
VALUES
  -- Ana Lima (emagrecimento + tônus — 4 medições, progresso consistente)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW() - INTERVAL '90 days',  68.5, 27.0, 30.5, 88.0, 76.0, 98.0, 57.0, 36.0, 44.0, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW() - INTERVAL '60 days',  67.2, 25.5, 31.0, 87.5, 74.5, 97.0, 57.5, 36.5, 44.8, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW() - INTERVAL '30 days',  65.8, 24.0, 31.5, 87.0, 72.0, 96.5, 58.0, 37.0, 45.5, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW() - INTERVAL  '3 days',  64.5, 22.5, 32.0, 86.5, 70.0, 95.5, 58.5, 37.5, 46.2, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),

  -- Pedro Costa (ganho de massa — 3 medições, progressão clara)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', NOW() - INTERVAL '60 days',  82.0, 15.0, 37.0, 104.0, 84.0, 102.0, 62.0, 40.0, 62.5, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', NOW() - INTERVAL '30 days',  84.5, 14.5, 38.0, 105.0, 83.0, 103.0, 63.0, 40.5, 65.0, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', NOW() - INTERVAL  '5 days',  86.0, 14.0, 39.0, 106.0, 82.5, 104.0, 64.0, 41.0, 67.0, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),

  -- Mariana Santos (início de programa — 2 medições)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', NOW() - INTERVAL '30 days',  72.0, 32.0, 29.0, 90.0, 80.0, 104.0, 59.0, 37.0, 43.0, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', NOW() - INTERVAL  '5 days',  71.0, 31.0, 29.5, 89.5, 79.0, 103.0, 59.5, 37.0, 43.5, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),

  -- Rafael Oliveira (emagrecimento leve — 2 medições)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', NOW() - INTERVAL '40 days',  90.0, 22.0, 38.5, 108.0, 92.0, 108.0, 65.0, 43.0, 60.0, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', NOW() - INTERVAL  '8 days',  88.5, 21.0, 39.0, 107.5, 91.0, 107.0, 65.5, 43.0, 61.0, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),

  -- Juliana Ferreira (medição inicial antes do cancelamento)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', NOW() - INTERVAL '25 days',  58.0, 24.0, 27.0, 84.0, 68.0, 90.0, 54.0, 34.0, 38.0, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');


-- ============================================================
-- 7. PLANOS DE MENSALIDADE
-- ============================================================
INSERT INTO public.membership_plans (id, trainer_id, name, description, price_cents, recurrence, is_active, features)
VALUES
  (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Plano Mensal',
    'Acompanhamento completo por 1 mês. Ideal para quem quer conhecer o método.',
    29900, 'Mensal', TRUE,
    '["Treino personalizado","Check-in semanal","Ajuste de dieta básico","Suporte via WhatsApp"]'
  ),
  (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Plano Trimestral',
    'Acompanhamento por 3 meses com desconto. Melhor para quem já tem compromisso.',
    79900, 'Trimestral', TRUE,
    '["Treino personalizado","Check-in semanal","Ajuste de dieta completo","Suporte via WhatsApp","Avaliação física mensal"]'
  ),
  (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d03',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Plano Semestral',
    'O melhor custo-benefício para resultados consistentes e transformação real.',
    149900, 'Semestral', TRUE,
    '["Treino personalizado","Check-in semanal","Nutrição completa","Suporte prioritário","Avaliação física mensal","Materiais exclusivos"]'
  ),
  (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d04',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Plano Anual',
    'Transformação completa em 12 meses. Máximo suporte e o melhor preço por mês.',
    249900, 'Anual', TRUE,
    '["Tudo do Semestral","Check-in presencial optativo","Plano nutricional detalhado","Feedback mensal gravado","Desconto em produtos parceiros"]'
  )
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8. ASSINATURAS
-- ============================================================
INSERT INTO public.subscriptions (id, student_id, trainer_id, plan_id, status, started_at, next_due_date)
VALUES
  -- Ana: Ativo — Plano Mensal
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e01',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
   'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
   'Ativo', NOW() - INTERVAL '120 days', (CURRENT_DATE + INTERVAL '12 days')),

  -- Pedro: Ativo — Plano Trimestral
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e02',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
   'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02',
   'Ativo', NOW() - INTERVAL '90 days', (CURRENT_DATE + INTERVAL '2 days')),

  -- Mariana: Pendente — Plano Mensal
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e03',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
   'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
   'Pendente', NOW() - INTERVAL '60 days', CURRENT_DATE),

  -- Rafael: Atrasado — Plano Mensal
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e04',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
   'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
   'Atrasado', NOW() - INTERVAL '45 days', (CURRENT_DATE - INTERVAL '15 days')),

  -- Juliana: Cancelado — Plano Mensal
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e05',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
   'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
   'Cancelado', NOW() - INTERVAL '30 days', NULL)
ON CONFLICT (id) DO NOTHING;

-- Registrar cancelamento da Juliana
UPDATE public.subscriptions
SET cancelled_at = NOW() - INTERVAL '10 days',
    cancellation_reason = 'Mudança de cidade'
WHERE id = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e05';


-- ============================================================
-- 9. TRANSAÇÕES FINANCEIRAS
-- ============================================================
INSERT INTO public.transactions (subscription_id, amount_cents, type, status, due_date, paid_at, notes)
VALUES
  -- Ana — 4 meses pagos + 1 pendente próximo
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e01', 29900, 'Primeiro Pagamento', 'Pago',    (CURRENT_DATE - INTERVAL '120 days'), NOW() - INTERVAL '120 days', 'Bem-vinda! Primeiro pagamento confirmado.'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e01', 29900, 'Renovação',          'Pago',    (CURRENT_DATE -  INTERVAL '90 days'), NOW() -  INTERVAL '89 days', NULL),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e01', 29900, 'Renovação',          'Pago',    (CURRENT_DATE -  INTERVAL '60 days'), NOW() -  INTERVAL '60 days', NULL),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e01', 29900, 'Renovação',          'Pago',    (CURRENT_DATE -  INTERVAL '30 days'), NOW() -  INTERVAL '29 days', NULL),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e01', 29900, 'Renovação',          'Pendente',(CURRENT_DATE +  INTERVAL '12 days'), NULL,                        'Próximo vencimento'),

  -- Pedro — 3 meses pagos + vencendo hoje
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e02', 79900, 'Primeiro Pagamento', 'Pago',    (CURRENT_DATE -  INTERVAL '90 days'), NOW() -  INTERVAL '90 days', 'Início do trimestral'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e02', 79900, 'Renovação',          'Pago',    (CURRENT_DATE -  INTERVAL '30 days'), NOW() -  INTERVAL '29 days', NULL),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e02', 79900, 'Renovação',          'Pendente', CURRENT_DATE,                        NULL,                        'Vencendo hoje — aguardando pagamento'),

  -- Mariana — 1 pago + pendente
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e03', 29900, 'Primeiro Pagamento', 'Pago',    (CURRENT_DATE -  INTERVAL '60 days'), NOW() -  INTERVAL '58 days', NULL),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e03', 29900, 'Renovação',          'Pendente', CURRENT_DATE,                        NULL,                        'Aguardando confirmação de pagamento'),

  -- Rafael — 1 pago + 1 atrasado
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e04', 29900, 'Primeiro Pagamento', 'Pago',    (CURRENT_DATE -  INTERVAL '45 days'), NOW() -  INTERVAL '44 days', NULL),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e04', 29900, 'Renovação',          'Atrasado',(CURRENT_DATE -  INTERVAL '15 days'), NULL,                        'Tentar contato — WhatsApp e email'),

  -- Juliana — 1 pago + cancelado
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e05', 29900, 'Primeiro Pagamento', 'Pago',    (CURRENT_DATE -  INTERVAL '30 days'), NOW() -  INTERVAL '29 days', NULL),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e05', 29900, 'Renovação',          'Cancelado', CURRENT_DATE,                       NULL,                        'Assinatura cancelada pelo aluno');


-- ============================================================
-- 10. EVENTOS E CALENDÁRIO
-- ============================================================
INSERT INTO public.events (id, created_by, title, description, type, start_time, end_time, location, max_participants, is_public)
VALUES
  -- Evento futuro: Aula em grupo
  (
    'a4eebc99-9c0b-4ef8-bb6d-6bb9bd380001',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Aula Funcional em Grupo',
    'Treino funcional em grupo com exercícios variados e alta intensidade. Traga roupa confortável e garrafinha d''água!',
    'class',
    date_trunc('day', NOW() + INTERVAL '2 days') + INTERVAL '8 hours',
    date_trunc('day', NOW() + INTERVAL '2 days') + INTERVAL '9 hours',
    'Academia Carlos Fitness — Sala 2',
    12, TRUE
  ),
  -- Evento futuro: Palestra
  (
    'a4eebc99-9c0b-4ef8-bb6d-6bb9bd380002',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Palestra: Nutrição para Hipertrofia',
    'Estratégias nutricionais práticas para maximizar o ganho de massa muscular sem acumular gordura excessiva.',
    'seminar',
    date_trunc('day', NOW() + INTERVAL '5 days') + INTERVAL '19 hours',
    date_trunc('day', NOW() + INTERVAL '5 days') + INTERVAL '21 hours',
    'Sala de Reuniões — Academia Carlos Fitness',
    20, TRUE
  ),
  -- Evento futuro: Desafio
  (
    'a4eebc99-9c0b-4ef8-bb6d-6bb9bd380003',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Desafio 30 Dias Fit — Abertura',
    'Kickoff do Desafio 30 Dias! Apresentação das regras, metas e times. Check-in semanal obrigatório. Premiação para os melhores resultados.',
    'event',
    date_trunc('day', NOW() + INTERVAL '7 days') + INTERVAL '7 hours',
    date_trunc('day', NOW() + INTERVAL '7 days') + INTERVAL '8 hours',
    'Online (Google Meet — link enviado por WhatsApp)',
    50, TRUE
  ),
  -- Sessão pessoal com Ana
  (
    'a4eebc99-9c0b-4ef8-bb6d-6bb9bd380004',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Avaliação Física — Ana Lima',
    'Avaliação física mensal com medições corporais completas e ajuste de programa.',
    'personal_session',
    date_trunc('day', NOW() + INTERVAL '3 days') + INTERVAL '10 hours',
    date_trunc('day', NOW() + INTERVAL '3 days') + INTERVAL '11 hours',
    'Academia Carlos Fitness — Sala de Avaliação',
    1, FALSE
  ),
  -- Evento passado: Workshop (para ter histórico no calendário)
  (
    'a4eebc99-9c0b-4ef8-bb6d-6bb9bd380005',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Workshop: Técnica dos Levantamentos Básicos',
    'Workshop prático sobre execução correta de Agachamento, Supino e Levantamento Terra. Muito conteúdo de qualidade!',
    'seminar',
    date_trunc('day', NOW() - INTERVAL '5 days') + INTERVAL '10 hours',
    date_trunc('day', NOW() - INTERVAL '5 days') + INTERVAL '13 hours',
    'Academia Carlos Fitness — Sala Principal',
    15, TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- Inscrições em eventos
INSERT INTO public.event_registrations (event_id, user_id, status)
VALUES
  ('a4eebc99-9c0b-4ef8-bb6d-6bb9bd380001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'confirmed'), -- Ana → Funcional
  ('a4eebc99-9c0b-4ef8-bb6d-6bb9bd380001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'confirmed'), -- Pedro → Funcional
  ('a4eebc99-9c0b-4ef8-bb6d-6bb9bd380001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'confirmed'), -- Mariana → Funcional
  ('a4eebc99-9c0b-4ef8-bb6d-6bb9bd380002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'confirmed'), -- Ana → Palestra
  ('a4eebc99-9c0b-4ef8-bb6d-6bb9bd380002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'confirmed'), -- Pedro → Palestra
  ('a4eebc99-9c0b-4ef8-bb6d-6bb9bd380002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'confirmed'), -- Rafael → Palestra
  ('a4eebc99-9c0b-4ef8-bb6d-6bb9bd380003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'confirmed'), -- Ana → Desafio
  ('a4eebc99-9c0b-4ef8-bb6d-6bb9bd380003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'confirmed'), -- Pedro → Desafio
  ('a4eebc99-9c0b-4ef8-bb6d-6bb9bd380003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'confirmed'), -- Mariana → Desafio
  ('a4eebc99-9c0b-4ef8-bb6d-6bb9bd380005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'confirmed'), -- Ana → Workshop (passado)
  ('a4eebc99-9c0b-4ef8-bb6d-6bb9bd380005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'confirmed'), -- Pedro → Workshop (passado)
  ('a4eebc99-9c0b-4ef8-bb6d-6bb9bd380005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'cancelled')  -- Rafael → Workshop (não foi)
ON CONFLICT (event_id, user_id) DO NOTHING;


-- ============================================================
-- 11. TAREFAS (KANBAN)
-- ============================================================
INSERT INTO public.tasks (created_by, assigned_to, title, description, status, priority, due_date)
VALUES
  -- TODO
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'Atualizar plano de treino da Ana',
    'Revisar o PPL com novos exercícios de glúteo. Aumentar volume no dia Legs conforme evolução recente.',
    'todo', 'high', (CURRENT_DATE + INTERVAL '5 days')
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    'Completar onboarding — Mariana',
    'Mariana não completou o onboarding. Guiar pelo aplicativo e garantir que o perfil esteja preenchido.',
    'todo', 'medium', (CURRENT_DATE + INTERVAL '3 days')
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'Preencher diário alimentar (tarefa — Ana)',
    'Registrar pelo menos 5 dias de alimentação no app de nutrição e compartilhar foto com o trainer.',
    'todo', 'medium', (CURRENT_DATE + INTERVAL '7 days')
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    'Regularizar pagamento (Mariana)',
    'Verificar pendência financeira no aplicativo e confirmar pagamento via PIX ou cartão.',
    'todo', 'urgent', CURRENT_DATE
  ),
  -- IN PROGRESS
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'Agendar avaliação física — Pedro',
    'Pedro solicitou avaliação para ajuste de carga nos levantamentos básicos. Agendar para a próxima semana.',
    'in_progress', 'medium', (CURRENT_DATE + INTERVAL '7 days')
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
    'Cobrar pagamento atrasado — Rafael',
    'Rafael está com 15 dias de atraso. Entrar em contato por WhatsApp e email. Se não responder, suspender acesso.',
    'in_progress', 'urgent', (CURRENT_DATE - INTERVAL '2 days')
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Preparar slides da palestra de nutrição',
    'Montar apresentação de ~30 slides sobre estratégias de nutrição para hipertrofia. Incluir referências científicas.',
    'in_progress', 'high', (CURRENT_DATE + INTERVAL '4 days')
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'Gravar execução do deadlift — Pedro',
    'Pedro deve gravar vídeo do levantamento terra (150kg) para análise técnica. Enviar via WhatsApp.',
    'in_progress', 'low', (CURRENT_DATE + INTERVAL '10 days')
  ),
  -- DONE
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'Análise de progresso mensal — Ana',
    'Comparar medições: -4kg em 90 dias. Redução de gordura corporal de 27% para 22.5%. Excelente evolução!',
    'done', 'medium', (CURRENT_DATE - INTERVAL '3 days')
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'Plano de periodização Q2 — Pedro',
    'Criar periodização para próximo trimestre focando em pontos fracos: desenvolvimento e leg curl.',
    'done', 'high', (CURRENT_DATE - INTERVAL '7 days')
  );

-- Marcar tarefas done com completed_at
UPDATE public.tasks
SET completed_at = NOW() - INTERVAL '3 days'
WHERE title =  'Análise de progresso mensal — Ana'
  AND created_by = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

UPDATE public.tasks
SET completed_at = NOW() - INTERVAL '7 days'
WHERE title = 'Plano de periodização Q2 — Pedro'
  AND created_by = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';


-- ============================================================
-- 12. GERAÇÕES DE IA (histórico de auditoria)
-- ============================================================
INSERT INTO public.ai_generations (user_id, type, input_data, output_data, model_version, tokens_used, generation_time_ms)
VALUES
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'workout_generation',
    '{"studentName":"Ana Lima","goal":"Hipertrofia com foco em glúteos","level":"Intermediário","daysPerWeek":3,"equipment":["barra","halteres","máquinas"]}',
    '{"planName":"Hipertrofia Feminina — Ana","days":[{"day":"Segunda","focus":"Push"},{"day":"Quarta","focus":"Pull"},{"day":"Sexta","focus":"Legs/Glúteos"}],"observations":"Aumentei o volume no dia Legs com mais exercícios de cadeia posterior"}',
    'gemini-2.0-flash', 1250, 3200
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'performance_analysis',
    '{"studentName":"Pedro Costa","measurements":[{"date":"2024-03-01","weight":82,"bodyFat":15},{"date":"2024-05-22","weight":86,"bodyFat":14}],"workoutPlan":{"name":"Ganho de Força","focus":"Levantamentos básicos"}}',
    '{"analysis":"Pedro apresenta excelente progressão de força e massa muscular. Ganho de 4kg com redução de 1% de gordura corporal em 82 dias. Recomendações: 1) Manter progressão linear; 2) Adicionar deload a cada 4 semanas; 3) Priorizar sono e recuperação."}',
    'gemini-2.0-flash', 980, 2800
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'exercise_description',
    '{"exerciseName":"Stiff","targetMuscles":["isquiotibiais","glúteos"],"level":"Intermediário"}',
    '{"description":"O Stiff (ou Levantamento Terra Romeno) é um excelente exercício para o desenvolvimento da cadeia posterior. Mantenha a barra próxima ao corpo durante toda a execução, pés na largura dos ombros e joelhos levemente flexionados.","tips":["Não arredonde a lombar","Desça até sentir o alongamento nos isquiotibiais","Retorne de forma controlada"]}',
    'gemini-2.0-flash', 620, 1900
  );


COMMIT;


-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
DO $$
DECLARE
  n_users       INT;
  n_trainers    INT;
  n_students    INT;
  n_plans       INT;
  n_templates   INT;
  n_sessions    INT;
  n_meas        INT;
  n_membership  INT;
  n_subs        INT;
  n_transactions INT;
  n_events      INT;
  n_tasks       INT;
BEGIN
  SELECT COUNT(*) INTO n_users       FROM public.users           WHERE email LIKE '%@ugym.dev';
  SELECT COUNT(*) INTO n_trainers    FROM public.users           WHERE email LIKE '%@ugym.dev' AND role = 'Trainer';
  SELECT COUNT(*) INTO n_students    FROM public.users           WHERE email LIKE '%@ugym.dev' AND role = 'Student';
  SELECT COUNT(*) INTO n_plans       FROM public.workout_plans;
  SELECT COUNT(*) INTO n_templates   FROM public.workout_templates;
  SELECT COUNT(*) INTO n_sessions    FROM public.workout_sessions;
  SELECT COUNT(*) INTO n_meas        FROM public.body_measurements;
  SELECT COUNT(*) INTO n_membership  FROM public.membership_plans;
  SELECT COUNT(*) INTO n_subs        FROM public.subscriptions;
  SELECT COUNT(*) INTO n_transactions FROM public.transactions;
  SELECT COUNT(*) INTO n_events      FROM public.events;
  SELECT COUNT(*) INTO n_tasks       FROM public.tasks;

  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════╗';
  RAISE NOTICE '║       UGYM — SEED CONCLUÍDO ✓            ║';
  RAISE NOTICE '╠══════════════════════════════════════════╣';
  RAISE NOTICE '║  Usuários seed: %  (% Trainer, % Students)', n_users, n_trainers, n_students;
  RAISE NOTICE '║  Templates de treino : %', n_templates;
  RAISE NOTICE '║  Planos de treino    : %', n_plans;
  RAISE NOTICE '║  Sessões registradas : %', n_sessions;
  RAISE NOTICE '║  Medições corporais  : %', n_meas;
  RAISE NOTICE '║  Planos de assinatura: %', n_membership;
  RAISE NOTICE '║  Assinaturas         : %', n_subs;
  RAISE NOTICE '║  Transações          : %', n_transactions;
  RAISE NOTICE '║  Eventos             : %', n_events;
  RAISE NOTICE '║  Tarefas (kanban)    : %', n_tasks;
  RAISE NOTICE '╠══════════════════════════════════════════╣';
  RAISE NOTICE '║  CREDENCIAIS — senha: Test@1234           ║';
  RAISE NOTICE '║  Trainer : carlos@ugym.dev               ║';
  RAISE NOTICE '║  Student : ana@ugym.dev     (Ativo)       ║';
  RAISE NOTICE '║  Student : pedro@ugym.dev   (Ativo)       ║';
  RAISE NOTICE '║  Student : mariana@ugym.dev (Pendente)    ║';
  RAISE NOTICE '║  Student : rafael@ugym.dev  (Atrasado)    ║';
  RAISE NOTICE '║  Student : juliana@ugym.dev (Cancelado)   ║';
  RAISE NOTICE '╚══════════════════════════════════════════╝';
END $$;
