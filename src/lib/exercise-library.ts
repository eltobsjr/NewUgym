
export type Exercise = {
    id: string;
    name: string;
    category: 'Peito' | 'Costas' | 'Pernas' | 'Ombros' | 'Bíceps' | 'Tríceps' | 'Abdômen' | 'Cardio';
    description: string;
    mediaUrl: string;
    /** UUID real na tabela public.exercises (seed-exercises.sql) */
    exerciseDbId: string;
};

export const exerciseCategories: Exercise['category'][] = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Cardio'];

export const exerciseLibrary: Exercise[] = [
    // Peito
    {
        id: 'ex-lib-001',
        name: 'Supino Reto com Barra',
        category: 'Peito',
        description: 'Exercício fundamental para o desenvolvimento do peitoral maior, ombros e tríceps.',
        mediaUrl: 'https://placehold.co/100x100/EF4444/FFFFFF.gif?text=Supino',
        exerciseDbId: 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e001',
    },
    {
        id: 'ex-lib-002',
        name: 'Supino Inclinado com Halteres',
        category: 'Peito',
        description: 'Foca na porção superior (clavicular) do peitoral.',
        mediaUrl: 'https://placehold.co/100x100/EF4444/FFFFFF.gif?text=Inclinado',
        exerciseDbId: 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e002',
    },
    {
        id: 'ex-lib-003',
        name: 'Crucifixo',
        category: 'Peito',
        description: 'Exercício de isolamento para o peitoral, promovendo alongamento e contração.',
        mediaUrl: 'https://placehold.co/100x100/EF4444/FFFFFF.gif?text=Crucifixo',
        exerciseDbId: 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e003',
    },

    // Costas
    {
        id: 'ex-lib-004',
        name: 'Barra Fixa',
        category: 'Costas',
        description: 'Excelente para a largura das costas, trabalhando o latíssimo do dorso.',
        mediaUrl: 'https://placehold.co/100x100/3B82F6/FFFFFF.gif?text=Barra',
        exerciseDbId: 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e010',
    },
    {
        id: 'ex-lib-005',
        name: 'Remada Curvada',
        category: 'Costas',
        description: 'Trabalha a espessura das costas, incluindo romboides e trapézio.',
        mediaUrl: 'https://placehold.co/100x100/3B82F6/FFFFFF.gif?text=Remada',
        exerciseDbId: 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e011',
    },

    // Pernas
    {
        id: 'ex-lib-006',
        name: 'Agachamento Livre',
        category: 'Pernas',
        description: 'O rei dos exercícios de perna, trabalhando quadríceps, glúteos e posteriores.',
        mediaUrl: 'https://placehold.co/100x100/F97316/FFFFFF.gif?text=Agacho',
        exerciseDbId: 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e016',
    },
    {
        id: 'ex-lib-007',
        name: 'Leg Press',
        category: 'Pernas',
        description: 'Alternativa segura ao agachamento para focar no desenvolvimento das pernas.',
        mediaUrl: 'https://placehold.co/100x100/F97316/FFFFFF.gif?text=Leg',
        exerciseDbId: 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e017',
    },
    {
        id: 'ex-lib-008',
        name: 'Stiff',
        category: 'Pernas',
        description: 'Focado nos posteriores da coxa e glúteos.',
        mediaUrl: 'https://placehold.co/100x100/F97316/FFFFFF.gif?text=Stiff',
        exerciseDbId: 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e020',
    },

    // Ombros
    {
        id: 'ex-lib-009',
        name: 'Desenvolvimento Militar',
        category: 'Ombros',
        description: 'Exercício completo para ombros, com foco nos deltoides anteriores e mediais.',
        mediaUrl: 'https://placehold.co/100x100/8B5CF6/FFFFFF.gif?text=Desenvolv.',
        exerciseDbId: 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e005',
    },
    {
        id: 'ex-lib-010',
        name: 'Elevação Lateral',
        category: 'Ombros',
        description: 'Isolamento para a cabeça medial do deltoide, criando a aparência de ombros mais largos.',
        mediaUrl: 'https://placehold.co/100x100/8B5CF6/FFFFFF.gif?text=Elev.+Lat.',
        exerciseDbId: 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e006',
    },
    
    // Bíceps
    {
        id: 'ex-lib-011',
        name: 'Rosca Direta com Barra',
        category: 'Bíceps',
        description: 'Exercício básico para construção de massa no bíceps.',
        mediaUrl: 'https://placehold.co/100x100/10B981/FFFFFF.gif?text=Rosca',
        exerciseDbId: 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e014',
    },

    // Tríceps
    {
        id: 'ex-lib-012',
        name: 'Tríceps Testa',
        category: 'Tríceps',
        description: 'Excelente para trabalhar as três cabeças do tríceps.',
        mediaUrl: 'https://placehold.co/100x100/F472B6/FFFFFF.gif?text=Testa',
        exerciseDbId: 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e008',
    },

    // Cardio
    {
        id: 'ex-lib-013',
        name: 'Corrida na Esteira',
        category: 'Cardio',
        description: 'Exercício cardiovascular clássico para queima de calorias e melhora da resistência.',
        mediaUrl: 'https://placehold.co/100x100/64748B/FFFFFF.gif?text=Corrida',
        exerciseDbId: 'a5eebc99-9c0b-4ef8-bb6d-6bb9bd38e024',
    }
];
