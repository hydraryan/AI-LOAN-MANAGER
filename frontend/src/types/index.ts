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

export interface Investor {
    _id: string;
    name: string;
    email: string;
    investorType: 'Individual' | 'Corporate' | 'Bank' | 'MutualFund';
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    accountNumber?: string;
    accountHolderName?: string;
    ifscCode?: string;
    kycStatus: 'Pending' | 'Verified' | 'Rejected';
    status: 'Active' | 'Inactive' | 'Suspended';
    createdAt?: string;
    updatedAt?: string;
}

export interface InvestorAccount {
    _id: string;
    investorId: string;
    accountNumber: string;
    accountType: 'savings' | 'checking' | 'investment' | 'other';
    bank: string;
    balance: number;
    currency: string;
    status: 'active' | 'inactive' | 'suspended';
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
    investorDetails?: Investor;
}

export interface Investment {
    _id: string;
    investorId: string;
    loanId: string;
    amount: number;
    interestRate: number;
    investmentDate: string;
    expectedReturnDate: string;
    status: 'pending' | 'active' | 'completed' | 'defaulted';
    totalReturned: number;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
    investorDetails?: Investor;
    loanDetails?: any;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
