# Ugym - Documentação Funcional

Este documento descreve as funcionalidades, entidades e relacionamentos do aplicativo Ugym.

## 1. Entidades Principais

O sistema possui dois tipos de usuários (entidades) com diferentes permissões e capacidades:

-   **Aluno (Student)**: O usuário final que realiza os treinos e acompanha seu progresso.
-   **Personal (Trainer)**: O profissional que gerencia alunos, cria e atribui planos de treino, e administra seu próprio negócio.

---

## 2. Funcionalidades por Entidade

###  Aluno (Student)

-   **Dashboard**: Visualiza um resumo de suas atividades, como treinos concluídos, série de dias ativos e tarefas pendentes.
-   **Gerenciamento de Treinos**:
    -   Ativa um plano de treino atribuído por um personal ou um plano criado por ele mesmo.
    -   Cria planos de treino personalizados manualmente ou com assistência de IA.
    -   Edita qualquer plano de treino em sua lista (atribuído ou pessoal).
    -   Exclui planos de treino que criou.
-   **Execução de Treino**:
    -   Visualiza o plano semanal ativo com os exercícios de cada dia.
    -   Marca exercícios e séries como concluídos.
    -   Registra cargas (peso) e repetições para cada série de um exercício.
-   **Acompanhamento de Progresso**:
    -   Registra métricas corporais (peso, altura, % de gordura, medidas).
    -   Visualiza gráficos da evolução de suas métricas ao longo do tempo.
-   **Biblioteca de Exercícios**:
    -   Pesquisa exercícios para ver descrições detalhadas, músculos trabalhados, dicas de segurança e um GIF demonstrativo gerado por IA.
-   **Gerenciador de Tarefas**:
    -   Visualiza e gerencia suas tarefas pessoais ou aquelas atribuídas por um personal em um quadro Kanban.
-   **Calendário de Eventos**:
    -   Visualiza eventos (aulas, seminários).
    -   Inscreve-se nos eventos.
-   **Mensalidade**:
    -   Visualiza o status atual de sua assinatura (plano, valor, vencimento).
    -   Vê o histórico de pagamentos.
    -   Pode cancelar a própria assinatura.
-   **Configurações**:
    -   Edita suas informações de perfil (nome, altura, peso, etc.).
    -   Personaliza a aparência do aplicativo (tema claro/escuro e paleta de cores).

###  Personal (Trainer)

-   **Dashboard**: Visualiza um resumo do engajamento de seus alunos, identificando quem precisa de mais atenção.
-   **Gerenciamento de Alunos**:
    -   Adiciona/vincula alunos existentes na plataforma à sua lista de clientes.
    -   Visualiza a lista de todos os seus alunos.
    -   Acessa a página de progresso detalhado de cada aluno.
-   **Gerenciamento de Treinos**:
    -   Cria modelos (templates) de planos de treino reutilizáveis, manualmente ou com IA.
    -   Atribui seus modelos de treino para um ou mais alunos de uma só vez. O aluno recebe uma cópia do plano para seguir.
    -   Visualiza e edita os planos de treino ativos de cada um de seus alunos.
-   **Financeiro**:
    -   Visualiza um dashboard financeiro com faturamento, inadimplência e crescimento.
    -   Registra transações de pagamento manualmente.
    -   Cria e gerencia os planos de assinatura (ex: Plano Mensal, Anual).
    -   Cancela a assinatura de um aluno, o que o torna 'Inativo'.
-   **Gerenciador de Tarefas**:
    -   Cria e atribui tarefas para seus alunos ou para si mesmo.
    -   Acompanha o andamento das tarefas em um quadro Kanban compartilhado.
-   **Calendário de Eventos**:
    -   Adiciona novos eventos e aulas ao calendário compartilhado.

---

## 3. Relacionamentos e Interações

-   Personal -> Aluno: Um personal tem uma lista de alunos que são seus clientes. O personal pode ver o progresso detalhado de seus alunos e gerenciar seus planos de treino.
-   Personal -> Plano de Treino -> Aluno: Um personal cria um **modelo** de plano de treino. Ao atribuí-lo a um aluno, uma **cópia** desse plano é criada para o aluno. O aluno pode então seguir e modificar essa cópia, e o personal pode visualizar e editar essa cópia específica.
-   Aluno -> Plano de Treino: O aluno pode criar seus próprios planos de treino do zero, que só são visíveis para ele e seu personal.
-   Calendário e Tarefas: São funcionalidades compartilhadas. Um personal pode criar um evento/tarefa e um aluno pode visualizá-lo ou ser o responsável por ele.
