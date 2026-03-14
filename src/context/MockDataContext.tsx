import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Borrower, Loan } from '../types';

// Extend Loan type to include display fields used in ViewLoans.tsx
export interface LoanExtended extends Loan {
    productName: string;
    nextRepayment: string;
    amountPaid: number;
}

interface MockDataContextType {
    borrowers: Borrower[];
    loans: LoanExtended[];
    setBorrowers: React.Dispatch<React.SetStateAction<Borrower[]>>;
    setLoans: React.Dispatch<React.SetStateAction<LoanExtended[]>>;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

export const MockDataProvider = ({ children }: { children: ReactNode }) => {
    const [borrowers, setBorrowers] = useState<Borrower[]>([
        { id: '1001', firstName: 'Rajesh', lastName: 'Kumar', businessName: 'Kumar Electronics', mobile: '+91 98765 43210', email: 'rajesh.k@gmail.com', status: 'Active', balance: 50000 },
        { id: '1002', firstName: 'Priya', lastName: 'Sharma', businessName: 'Priya Boutique', mobile: '+91 91234 56789', email: 'priya.sharma@yahoo.com', status: 'Active', balance: 120000 },
        { id: '1003', firstName: 'Amit', lastName: 'Patel', businessName: '-', mobile: '+91 88888 77777', email: 'amit.patel@gmail.com', status: 'Pending', balance: 0 },
        { id: '1004', firstName: 'Sunita', lastName: 'Verma', businessName: 'Verma Textiles', mobile: '+91 77777 66666', email: 'sunita.v@gmail.com', status: 'Closed', balance: 0 },
        { id: '1005', firstName: 'Vikram', lastName: 'Singh', businessName: 'Singh Consultancies', mobile: '+91 99999 00000', email: 'vikram.singh@outlook.com', status: 'Active', balance: 75000 },
    ]);

    const [loans, setLoans] = useState<LoanExtended[]>([
        { 
            id: 'LN-2025-001', 
            borrowerId: '1001', 
            borrowerName: 'Rajesh Kumar', 
            amount: 50000, 
            releaseDate: '2025-01-15', 
            maturityDate: '2025-07-15', 
            status: 'Open', 
            interestRate: 10, 
            duration: 6,
            productName: 'Business Loan',
            nextRepayment: '2025-02-15',
            amountPaid: 8500
        },
        { 
            id: 'LN-2025-002', 
            borrowerId: '1002', 
            borrowerName: 'Priya Sharma', 
            amount: 150000, 
            releaseDate: '2025-02-01', 
            maturityDate: '2025-05-01', 
            status: 'Pending', 
            interestRate: 8, 
            duration: 3,
            productName: 'Working Capital',
            nextRepayment: '-',
            amountPaid: 0
        },
        { 
            id: 'LN-2024-089', 
            borrowerId: '1005', 
            borrowerName: 'Vikram Singh', 
            amount: 20000, 
            releaseDate: '2024-12-01', 
            maturityDate: '2025-03-01', 
            status: 'Defaulted', 
            interestRate: 12, 
            duration: 3,
            productName: 'Emergency Loan',
            nextRepayment: '2025-01-01 (Overdue)',
            amountPaid: 5000
        },
        { 
            id: 'LN-2024-055', 
            borrowerId: '1005', 
            borrowerName: 'Vikram Singh', 
            amount: 100000, 
            releaseDate: '2024-06-01', 
            maturityDate: '2024-12-01', 
            status: 'Fully Paid', 
            interestRate: 10, 
            duration: 6,
            productName: 'Business Loan',
            nextRepayment: '-',
            amountPaid: 110000
        },
    ]);

    return (
        <MockDataContext.Provider value={{ borrowers, loans, setBorrowers, setLoans }}>
            {children}
        </MockDataContext.Provider>
    );
};

export const useMockData = () => {
    const context = useContext(MockDataContext);
    if (context === undefined) {
        throw new Error('useMockData must be used within a MockDataProvider');
    }
    return context;
};