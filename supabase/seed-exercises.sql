-- ============================================================
-- UGYM — Seed Complementar: Exercícios + Workout Exercises + Logs
-- ============================================================
-- Execute APÓS seed.sql ter rodado com sucesso.
--
-- Por quê este arquivo existe:
--   O seed.sql referencia exercises via SELECT id ... WHERE name = '...'
--   mas a tabela public.exercises estava vazia, fazendo os INSERTs de
--   workout_exercises falharem (exercise_id NOT NULL).
--   Este script: (1) popula exercises, (2) limpa e reinicia workout_exercises
--   e exercise_logs que dependem deles.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. EXERCÍCIOS (catálogo público com IDs fixos)
-- ============================================================
INSERT INTO public.exercises (id, name, description, muscle_group, equipment, difficulty, is_public)
VALUES
  -- Peito
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e001', 'Supino Reto com Barra',     'Exercício fundamental para peitoral maior, ombros e tríceps.',         'Peito',   'Barra',         'Intermediário', TRUE),
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e002', 'Supino Inclinado Halteres', 'Foca na porção superior (clavicular) do peitoral.',                    'Peito',   'Halteres',      'Intermediário', TRUE),
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e003', 'Crucifixo',                 'Isolamento de peitoral com alongamento e contração.',                  'Peito',   'Halteres',      'Iniciante',     TRUE),
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e004', 'Peck Deck',                 'Isolamento de peitoral em máquina.',                                   'Peito',   'Máquina',       'Iniciante',     TRUE),
  -- Ombros
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e005', 'Desenvolvimento com Barra', 'Exercício composto para deltoides e tríceps.',                         'Ombros',  'Barra',         'Intermediário', TRUE),
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e006', 'Elevação Lateral',          'Isolamento para a cabeça medial do deltoide.',                         'Ombros',  'Halteres',      'Iniciante',     TRUE),
  -- Tríceps
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e007', 'Tríceps Corda',             'Isolamento de tríceps no cabo com corda.',                             'Tríceps', 'Cabo',          'Iniciante',     TRUE),
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e008', 'Tríceps Testa',             'Trabalha as três cabeças do tríceps com barra.',                       'Tríceps', 'Barra',         'Intermediário', TRUE),
  -- Costas
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e009', 'Puxada Frontal',            'Trabalha o latíssimo do dorso para largura das costas.',               'Costas',  'Máquina',       'Iniciante',     TRUE),
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e010', 'Barra Fixa',                'Largura das costas com peso corporal.',                                'Costas',  'Barra Fixa',    'Intermediário', TRUE),
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e011', 'Remada Curvada',            'Espessura das costas, romboides e trapézio.',                          'Costas',  'Barra',         'Intermediário', TRUE),
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e012', 'Remada Unilateral',         'Remada com haltere unilateral para espessura das costas.',             'Costas',  'Halteres',      'Iniciante',     TRUE),
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e013', 'Deadlift',                  'Levantamento terra — levantamento básico fundamental.',                'Costas',  'Barra',         'Avançado',      TRUE),
  -- Bíceps
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e014', 'Rosca Direta',              'Construção de massa no bíceps com barra.',                             'Bíceps',  'Barra',         'Iniciante',     TRUE),
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e015', 'Rosca Alternada',           'Rosca com halteres de forma alternada.',                               'Bíceps',  'Halteres',      'Iniciante',     TRUE),
  -- Pernas
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e016', 'Agachamento Livre',         'O rei dos exercícios de perna — quadríceps, glúteos e posteriores.',   'Pernas',  'Barra',         'Intermediário', TRUE),
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e017', 'Leg Press 45°',             'Desenvolvimento das pernas em máquina a 45 graus.',                    'Pernas',  'Máquina',       'Iniciante',     TRUE),
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e018', 'Cadeira Extensora',         'Isolamento do quadríceps em máquina.',                                 'Pernas',  'Máquina',       'Iniciante',     TRUE),
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e019', 'Mesa Flexora',              'Isolamento dos isquiotibiais em máquina.',                             'Pernas',  'Máquina',       'Iniciante',     TRUE),
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e020', 'Stiff',                     'Focado nos posteriores da coxa e glúteos com barra.',                  'Pernas',  'Barra',         'Intermediário', TRUE),
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e021', 'Panturrilha em Pé',         'Desenvolvimento da panturrilha em máquina ou livre.',                  'Pernas',  'Máquina',       'Iniciante',     TRUE),
  -- Abdômen / Core
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e022', 'Prancha',                   'Exercício isométrico para core e estabilização.',                      'Abdômen', 'Peso Corporal', 'Iniciante',     TRUE),
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e023', 'Abdominal Crunch',          'Flexão de tronco básica para fortalecimento abdominal.',               'Abdômen', 'Peso Corporal', 'Iniciante',     TRUE),
  -- Cardio
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e024', 'Corrida na Esteira',        'Cardio clássico para queima calórica e resistência cardiovascular.',   'Cardio',  'Esteira',       'Iniciante',     TRUE),
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e025', 'Bicicleta Ergométrica',     'Cardio de baixo impacto para condicionamento cardiovascular.',         'Cardio',  'Bicicleta',     'Iniciante',     TRUE)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 2. LIMPAR workout_exercises E exercise_logs (dependem dos exercícios)
--    Apenas para os dias criados pelo seed.sql — seguro para outros dados
-- ============================================================
DELETE FROM public.exercise_logs
WHERE session_id IN (
  'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380901',
  'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380902',
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380901'
);

DELETE FROM public.workout_exercises
WHERE day_id IN (
  -- Template PPL
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01',
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f02',
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f03',
  -- Template Iniciante
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f05',
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f07',
  -- Plano Ana
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11',
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12',
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f13',
  -- Plano Pedro
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f21',
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f22',
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f23',
  -- Plano Mariana
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f31',
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f32',
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f33'
);


-- ============================================================
-- 3. WORKOUT_EXERCISES — Template PPL
-- ============================================================

-- PPL — Push (f01)
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e001', '4', '8-12',  90, 1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e002', '3', '10-12', 75, 2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e003', '3', '12-15', 60, 3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e005', '3', '10-12', 75, 4),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e006', '4', '12-15', 60, 5),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e007', '3', '12-15', 60, 6);

-- PPL — Pull (f02)
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f02', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e009', '4', '8-12',  90, 1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f02', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e011', '4', '8-12',  90, 2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f02', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e012', '3', '10-12', 75, 3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f02', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e014', '3', '10-12', 60, 4),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f02', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e015', '3', '12-15', 60, 5);

-- PPL — Legs (f03)
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f03', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e016', '4', '8-12',  120, 1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f03', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e017', '4', '12-15', 90,  2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f03', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e018', '3', '12-15', 60,  3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f03', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e019', '3', '12-15', 60,  4),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f03', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e020', '3', '10-12', 75,  5),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f03', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e021', '4', '15-20', 45,  6);

-- Iniciante — Treino A (f05)
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f05', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e016', '3', '10-12', 90, 1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f05', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e001', '3', '10-12', 90, 2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f05', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e011', '3', '10-12', 75, 3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f05', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e005', '3', '12-15', 60, 4),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f05', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e022', '3', '30-60s', 60, 5);

-- Iniciante — Treino B (f07)
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f07', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e017', '3', '12-15', 75, 1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f07', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e002', '3', '12-15', 75, 2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f07', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e009', '3', '12-15', 75, 3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f07', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e006', '3', '15-20', 45, 4),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f07', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e023', '3', '15-20', 45, 5);


-- ============================================================
-- 4. WORKOUT_EXERCISES — Plano da Ana
-- ============================================================

-- Ana — Push (f11)
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e001', '4', '10-12', 90, 'Descer controlado até o peito',   1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e002', '3', '12-15', 75, NULL,                              2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e004', '3', '15-20', 60, 'Isolamento final do peito',       3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e006', '4', '15-20', 45, 'Peso leve, controle o movimento', 4),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e007', '3', '12-15', 60, NULL,                              5);

-- Ana — Pull (f12)
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e009', '4', '10-12', 90, NULL,                          1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e012', '3', '12-15', 75, NULL,                          2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e010', '3', 'máximo', 90, 'Usar elástico se necessário', 3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e015', '3', '12-15', 60, 'Cotovelo fixo',               4);

-- Ana — Legs (f13)
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e016', '4', '10-12', 120, 'Descer até paralelo',          1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e017', '4', '15-20', 90,  'Pés mais altos (foco glúteo)', 2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e020', '3', '12-15', 75,  NULL,                           3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e019', '3', '12-15', 60,  NULL,                           4),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e018', '3', '15-20', 45,  'Peso moderado',                5),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e021', '4', '20-25', 30,  NULL,                           6);


-- ============================================================
-- 5. WORKOUT_EXERCISES — Plano do Pedro
-- ============================================================

-- Pedro — Push (f21)
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f21', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e001', '5', '5',    180, 'Foco em carga máxima — progressão linear', 1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f21', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e005', '4', '6-8',  120, NULL,                                       2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f21', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e008', '4', '8-10', 90,  NULL,                                       3);

-- Pedro — Pull (f22)
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f22', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e013', '5', '5',      180, 'Exercício principal — aquecer bem', 1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f22', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e010', '4', 'máximo', 120, NULL,                                2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f22', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e011', '4', '6-8',   120, 'Progressão linear',                 3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f22', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e014', '3', '8-10',  75,  NULL,                                4);

-- Pedro — Legs (f23)
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f23', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e016', '5', '5',     180, 'Principal do dia — progressão linear', 1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f23', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e017', '4', '8-10',  120, NULL,                                   2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f23', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e020', '3', '8-10',  90,  NULL,                                   3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f23', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e021', '4', '15-20', 45,  NULL,                                   4);


-- ============================================================
-- 6. WORKOUT_EXERCISES — Plano da Mariana
-- ============================================================

-- Mariana — Full Body A (f31)
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f31', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e017', '3', '15',  75,  'Peso leve, foco na técnica', 1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f31', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e004', '3', '15',  60,  NULL,                         2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f31', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e009', '3', '15',  60,  NULL,                         3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f31', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e022', '3', '30s', 60,  NULL,                         4);

-- Mariana — Full Body B (f32)
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f32', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e018', '3', '15', 60, NULL, 1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f32', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e002', '3', '15', 60, NULL, 2),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f32', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e012', '3', '15', 60, NULL, 3),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f32', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e023', '3', '20', 45, NULL, 4);

-- Mariana — Cardio Leve (f33)
INSERT INTO public.workout_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f33', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e024', '1', '30min', NULL, 'Velocidade 6-8 km/h, inclinação 1%', 1),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f33', 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e025', '1', '15min', NULL, NULL,                                 2);


-- ============================================================
-- 7. EXERCISE_LOGS — Sessão Ana Push (s01 = 380901)
-- ============================================================
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

-- ============================================================
-- 8. EXERCISE_LOGS — Sessão Ana Pull (s02 = 380902)
-- ============================================================
INSERT INTO public.exercise_logs (session_id, workout_exercise_id, set_number, weight_kg, reps, is_completed, rpe)
SELECT
  'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380902',
  we.id,
  s.n,
  CASE ex.name
    WHEN 'Puxada Frontal'    THEN 42 + s.n
    WHEN 'Remada Unilateral' THEN 20 + s.n
    WHEN 'Barra Fixa'        THEN 0
    WHEN 'Rosca Alternada'   THEN 12
  END,
  CASE ex.name WHEN 'Barra Fixa' THEN 5 ELSE 12 END,
  TRUE,
  7.5
FROM public.workout_exercises we
JOIN public.exercises ex ON ex.id = we.exercise_id
CROSS JOIN (SELECT generate_series(1,4) AS n) s
WHERE we.day_id = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12'
  AND s.n <= CASE ex.name WHEN 'Puxada Frontal' THEN 4 ELSE 3 END;

-- ============================================================
-- 9. EXERCISE_LOGS — Sessão Pedro Push (s01 = b...380901)
-- ============================================================
INSERT INTO public.exercise_logs (session_id, workout_exercise_id, set_number, weight_kg, reps, is_completed, rpe)
SELECT
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380901',
  we.id,
  s.n,
  CASE ex.name
    WHEN 'Supino Reto com Barra'     THEN 97.5 + (s.n * 2.5)
    WHEN 'Desenvolvimento com Barra' THEN 60
    WHEN 'Tríceps Testa'             THEN 35
  END,
  5,
  TRUE,
  CASE WHEN s.n >= 4 THEN 9.0 ELSE 8.0 END
FROM public.workout_exercises we
JOIN public.exercises ex ON ex.id = we.exercise_id
CROSS JOIN (SELECT generate_series(1,5) AS n) s
WHERE we.day_id = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f21'
  AND s.n <= CASE ex.name WHEN 'Supino Reto com Barra' THEN 5 ELSE 4 END;


COMMIT;

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
DO $$
DECLARE
  n_exercises INT;
  n_we        INT;
  n_logs      INT;
BEGIN
  SELECT COUNT(*) INTO n_exercises FROM public.exercises;
  SELECT COUNT(*) INTO n_we        FROM public.workout_exercises;
  SELECT COUNT(*) INTO n_logs      FROM public.exercise_logs;
  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════╗';
  RAISE NOTICE '║  seed-exercises.sql concluído ✓      ║';
  RAISE NOTICE '╠══════════════════════════════════════╣';
  RAISE NOTICE '║  Exercícios no catálogo : %', n_exercises;
  RAISE NOTICE '║  Workout exercises      : %', n_we;
  RAISE NOTICE '║  Exercise logs          : %', n_logs;
  RAISE NOTICE '╚══════════════════════════════════════╝';
END $$;
