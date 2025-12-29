
import { allUsers } from './user-directory';
import { subDays, addMonths, format, parseISO } from 'date-fns';

export type TransactionStatus = "Pago" | "Pendente" | "Atrasado" | "Cancelado";
export type TransactionType = "Primeiro Pagamento" | "Renovação";

export type Transaction = {
  id: string;
  studentName: string;
  studentId: string;
  amount: number;
  status: TransactionStatus;
  type: TransactionType;
  date: string; // ISO String YYYY-MM-DD
  plan: string; // Plan name
};

export type MembershipPlan = {
  id: string;
  name: string;
  price: number;
  recurrence: "Mensal" | "Anual";
};

export type StudentSubscriptionStatus = 'Ativo' | 'Pendente' | 'Atrasado' | 'Cancelado' | 'Inativo';

export type StudentSubscription = {
    studentId: string;
    planName: string;
    status: StudentSubscriptionStatus;
    joinDate: Date;
    nextDueDate: Date;
}

export type StudentStatusInfo = {
    status: 'Ativo' | 'Inativo' | 'Pendente' | 'Atrasado';
    plan: string;
    joinDate: Date | null;
}

const initialMembers = allUsers.filter(u => u.role === 'Student');

let plans: MembershipPlan[] = [
    { id: 'plan-1', name: 'Consultoria Premium', price: 250.00, recurrence: 'Mensal' },
    { id: 'plan-2', name: 'Plano Trimestral', price: 600.00, recurrence: 'Mensal' },
    { id: 'plan-3', name: 'Acompanhamento Básico', price: 120.00, recurrence: 'Mensal' },
];

let transactions: Transaction[] = [];
let subscriptions: Record<string, { planId: string, joinDate: Date, isCancelled: boolean }> = {};

export const generateMockTransactions = () => {
    if (transactions.length > 0) return; // Only generate once

    const today = new Date();
    initialMembers.forEach((member, index) => {
        const plan = plans[index % plans.length];
        const joinDate = subDays(today, (index % 6) * 30 + 60); // Join date 2-8 months ago
        subscriptions[member.id] = { planId: plan.id, joinDate, isCancelled: index % 7 === 0 }; // Some are cancelled

        for (let i = 0; i < 12; i++) {
            const date = addMonths(joinDate, i);
            if (date > today) break;

            let status: TransactionStatus = "Pago";
            const isLastPayment = addMonths(date, 1) > today;

            if (isLastPayment && subscriptions[member.id].isCancelled) {
                 status = "Cancelado";
            } else if (isLastPayment && index % 5 === 1) {
                status = "Pendente";
            } else if (isLastPayment && index % 5 === 2) {
                status = "Atrasado";
            }

            transactions.push({
                id: `TRN-${member.id}-${i}`,
                studentId: member.id,
                studentName: member.name,
                amount: plan.price,
                status: status,
                type: i === 0 ? "Primeiro Pagamento" : "Renovação",
                date: format(date, 'yyyy-MM-dd'),
                plan: plan.name,
            });
        }
    });
};

// --- API ---

export const getAllTransactions = (): Transaction[] => {
    return transactions.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
};

export const getAllPlans = (): MembershipPlan[] => {
    return plans;
}

export const addTransaction = (transactionData: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
        ...transactionData,
        id: `TRN-${Date.now()}`
    };
    transactions.unshift(newTransaction);
    // Also update subscription if it's the first payment
    if (transactionData.type === 'Primeiro Pagamento' && !subscriptions[transactionData.studentId]) {
        const plan = plans.find(p => p.name === transactionData.plan);
        if (plan) {
            subscriptions[transactionData.studentId] = {
                planId: plan.id,
                joinDate: parseISO(transactionData.date),
                isCancelled: false
            };
        }
    }
    return newTransaction;
}

export const addPlan = (planData: Omit<MembershipPlan, 'id'>) => {
    const newPlan: MembershipPlan = {
        ...planData,
        id: `plan-${Date.now()}`
    };
    plans.push(newPlan);
    return newPlan;
}

export const cancelSubscription = (studentId: string) => {
    if (subscriptions[studentId]) {
        subscriptions[studentId].isCancelled = true;
        // Find last transaction and mark it as cancelled for future reference
        const lastTransaction = transactions
            .filter(t => t.studentId === studentId)
            .sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())[0];
        
        if (lastTransaction && lastTransaction.status !== 'Pago') {
            lastTransaction.status = 'Cancelado';
        }
    }
}

// For student billing page
export const getStudentTransactions = (studentId: string): Transaction[] => {
    return getAllTransactions().filter(t => t.studentId === studentId);
}

export const getStudentSubscription = (studentId: string): StudentSubscription | null => {
    const subInfo = subscriptions[studentId];
    if (!subInfo) return null;

    const plan = plans.find(p => p.id === subInfo.planId);
    if (!plan) return null;

    const studentTransactions = getStudentTransactions(studentId);
    const lastTransaction = studentTransactions[0];
    let status: StudentSubscription['status'] = 'Ativo';
    
    if(subInfo.isCancelled) {
        status = 'Cancelado';
    } else if (lastTransaction) {
        if (lastTransaction.status === 'Pendente') status = 'Pendente';
        if (lastTransaction.status === 'Atrasado') status = 'Atrasado';
    } else {
        // No transactions, but subscription object exists. Could be a new user.
        status = 'Inativo';
    }

    const recurrenceMonths = plan.recurrence === 'Anual' ? 12 : 1;
    const lastPaymentDate = lastTransaction ? parseISO(lastTransaction.date) : subInfo.joinDate;
    const nextDueDate = addMonths(lastPaymentDate, recurrenceMonths);

    return {
        studentId,
        planName: plan.name,
        status,
        joinDate: subInfo.joinDate,
        nextDueDate,
    };
}

// For trainer member lists
export const getStudentStatus = (studentId: string): StudentStatusInfo => {
    const subscription = getStudentSubscription(studentId);

    if (!subscription) {
        return {
            status: 'Inativo',
            plan: 'Nenhum',
            joinDate: null,
        };
    }
    
    let status: StudentStatusInfo['status'];
    switch (subscription.status) {
        case 'Ativo':
            status = 'Ativo';
            break;
        case 'Pendente':
            status = 'Pendente';
            break;
        case 'Atrasado':
            status = 'Atrasado';
            break;
        case 'Cancelado':
        case 'Inativo':
        default:
            status = 'Inativo';
            break;
    }

    return {
        status: status,
        plan: subscription.planName,
        joinDate: subscription.joinDate,
    };
};
