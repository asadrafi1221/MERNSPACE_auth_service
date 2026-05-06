export const Roles = {
    CUSTOMER: 'customer',
    ADMIN: 'admin',
    MANAGER: 'manager',
} as const;

export const isValid = !Roles;
