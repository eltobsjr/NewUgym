# NewUgym API Documentation

API completa criada com Next.js 14 App Router + Supabase.

## 🚀 Setup

1. Instalar dependências do Supabase:
```bash
npm install @supabase/supabase-js @supabase/ssr
```

2. Configurar variáveis de ambiente:
```bash
cp .env.example .env.local
```

3. Preencher credenciais do Supabase em `.env.local`

## 📡 Endpoints Disponíveis

### Authentication

```
POST   /api/auth/signup          # Criar conta
POST   /api/auth/login           # Login
POST   /api/auth/logout          # Logout
GET    /api/auth/session         # Verificar sessão
POST   /api/auth/reset-password  # Solicitar reset
```

### Users

```
GET    /api/users/me             # Perfil do usuário logado
PATCH  /api/users/me             # Atualizar perfil
GET    /api/users/:id            # Ver perfil de outro usuário
```

### Trainers & Students

```
GET    /api/trainers/:trainerId/students      # Listar alunos [Trainer]
POST   /api/trainers/:trainerId/students      # Adicionar aluno [Trainer]
```

### Workouts

```
GET    /api/workouts/plans                    # Listar planos
POST   /api/workouts/plans                    # Criar plano [Trainer]

GET    /api/workouts/sessions                 # Listar sessões
POST   /api/workouts/sessions                 # Iniciar treino [Student]
PATCH  /api/workouts/sessions/:id             # Completar treino [Student]

POST   /api/workouts/exercise-logs            # Registrar série [Student]
GET    /api/workouts/exercise-logs            # Listar logs
```

### Progress

```
GET    /api/progress/measurements             # Listar medições
POST   /api/progress/measurements             # Adicionar medição
```

### AI Services

```
POST   /api/ai/generate-workout               # Gerar treino com IA [Trainer]
POST   /api/ai/analyze-performance            # Analisar desempenho [Trainer]
```

## 🔐 Autenticação

Todas as rotas (exceto signup/login) requerem autenticação via Supabase Auth.

O token JWT é gerenciado automaticamente via cookies pelo Supabase SSR.

## 📝 Exemplos de Uso

### Signup
```typescript
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    name: 'John Doe',
    role: 'Student'
  })
})
```

### Login
```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
})
```

### Criar Plano de Treino
```typescript
const response = await fetch('/api/workouts/plans', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    student_id: 'uuid-do-aluno',
    name: 'Treino de Força',
    description: 'Plano focado em ganho de força',
    difficulty: 'Intermediário',
    schedule: [
      {
        day_name: 'Segunda-feira',
        focus: 'Peito e Tríceps',
        is_rest_day: false,
        exercises: [
          {
            exercise_id: 'uuid-do-exercicio',
            sets: '4',
            reps: '8-12',
            rest_seconds: 90
          }
        ]
      }
    ]
  })
})
```

## 🛠️ Próximos Passos

As seguintes APIs ainda precisam ser implementadas:

- [ ] Finance (subscriptions, transactions, plans)
- [ ] Events (calendar, registrations)
- [ ] Tasks (kanban board)
- [ ] Exercises Library (CRUD de exercícios)
- [ ] Notifications
- [ ] File Upload (avatars, progress photos)

## 📚 Documentação Completa

Ver `docs/backend-architecture.md` para arquitetura completa e modelo de dados.
