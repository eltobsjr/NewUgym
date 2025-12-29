
import type { UserRole } from "@/contexts/user-role-context";

export type DirectoryUser = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

// This acts as a mock database of all registered users in the Ugym system.
// In a real application, this would be a database query.
export const allUsers: DirectoryUser[] = [
    // Students
    { id: "stu-001", name: "Alice Johnson", email: "alice.j@email.com", role: "Student" },
    { id: "stu-002", name: "Bob Williams", email: "bob.w@email.com", role: "Student" },
    { id: "stu-003", name: "Charlie Brown", email: "charlie.b@email.com", role: "Student" },
    { id: "stu-004", name: "Diana Miller", email: "diana.m@email.com", role: "Student" },
    { id: "alex-johnson", name: "Alex Johnson", email: "alex.j@email.com", role: "Student" },
    { id: "maria-garcia", name: "Maria Garcia", email: "maria.g@email.com", role: "Student" },
    { id: "david-chen", name: "David Chen", email: "david.c@email.com", role: "Student" },
    { id: "sofia-davis", name: "Sofia Davis", email: "sofia.d@email.com", role: "Student" },
    { id: "emily-white", name: "Emily White", email: "emily.w@email.com", role: "Student" },
    { id: "olivia.martin", name: "Olivia Martin", email: "olivia.martin@email.com", role: "Student" },
    { id: "jackson.lee", name: "Jackson Lee", email: "jackson.lee@email.com", role: "Student" },
    { id: "isabella.nguyen", name: "Isabella Nguyen", email: "isabella.nguyen@email.com", role: "Student" },

    // Trainers
    { id: "trn-001", name: "Edward Carter", email: "edward.c@email.com", role: "Trainer" },
    { id: "trn-002", name: "Fiona Davis", email: "fiona.d@email.com", role: "Trainer" },
    { id: "trn-1", name: "John Carter", email: "john.carter@email.com", role: "Trainer" },
    { id: "trn-2", name: "Sophie Brown", email: "sophie.brown@email.com", role: "Trainer" },
];
