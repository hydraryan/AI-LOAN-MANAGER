export interface Borrower {
    id: string;
    firstName: string;
    lastName: string;
    businessName: string;
    mobile: string;
    email: string;
    status: 'Active' | 'Pending' | 'Closed';
    balance: number;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    title?: string;
    gender?: 'Male' | 'Female' | 'Other';
    uniqueId?: string;
    description?: string;
}

export interface Loan {
    id: string;
    borrowerId: string;
    borrowerName: string;
    amount: number;
    releaseDate: string;
    maturityDate: string;
    status: 'Pending' | 'Open' | 'Fully Paid' | 'Defaulted' | 'Restructured';
    interestRate: number;
    duration: number; // in months
}

export interface Repayment {
    id: string;
    loanId: string;
    amount: number;
    date: string;
    method: 'Cash' | 'Bank Transfer' | 'M-Pesa' | 'UPI' | 'GPay';
    status: 'Pending' | 'Approved';
}
