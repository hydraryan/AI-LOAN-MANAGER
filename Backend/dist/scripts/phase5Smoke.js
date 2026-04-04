"use strict";
const API = "http://localhost:5000/api";
async function request(path, options = {}, token) {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(`${API}${path}`, {
        ...options,
        headers
    });
    const text = await res.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    }
    catch {
        data = text;
    }
    return { ok: res.ok, status: res.status, data };
}
async function run() {
    const stamp = Date.now();
    const login = await request("/auth/signin", {
        method: "POST",
        body: JSON.stringify({
            email: "r.aryanraj96@gmail.com",
            password: "Aryan@123"
        })
    });
    if (!login.ok || !login.data?.token) {
        throw new Error(`Login failed: ${login.status} ${JSON.stringify(login.data)}`);
    }
    const token = login.data.token;
    const report = [];
    const track = (feature, passed, detail) => {
        report.push({ feature, status: passed ? "PASS" : "FAIL", detail });
    };
    // Create borrower
    const signup = await request("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
            name: `Phase5 Borrower ${stamp}`,
            email: `phase5.borrower.${stamp}@example.com`,
            password: "123456"
        })
    });
    const borrowerUserId = signup.data?.user?.id;
    const createBorrower = await request("/borrowers", {
        method: "POST",
        body: JSON.stringify({
            userId: borrowerUserId,
            phone: "9999999999",
            address: "Phase 5 Test Address"
        })
    }, token);
    const borrowerId = createBorrower.data?._id;
    track("Borrower Create", createBorrower.ok && !!borrowerId, createBorrower.ok ? `borrowerId=${borrowerId}` : JSON.stringify(createBorrower.data));
    const borrowerList = await request("/borrowers", { method: "GET" }, token);
    const borrowerReadOk = Array.isArray(borrowerList.data) && borrowerList.data.some((b) => b._id === borrowerId);
    track("Borrower Read", borrowerList.ok && borrowerReadOk, borrowerList.ok ? "Found created borrower in list" : JSON.stringify(borrowerList.data));
    // Create loan
    const createLoan = await request("/loans", {
        method: "POST",
        body: JSON.stringify({
            borrowerId,
            principal: 12000,
            interestRate: 12,
            tenureMonths: 6
        })
    }, token);
    const loanId = createLoan.data?._id;
    track("Loan Create", createLoan.ok && !!loanId, createLoan.ok ? `loanId=${loanId}` : JSON.stringify(createLoan.data));
    const loans = await request("/loans", { method: "GET" }, token);
    const loanReadOk = Array.isArray(loans.data) && loans.data.some((l) => l._id === loanId);
    track("Loan Read", loans.ok && loanReadOk, loans.ok ? "Found created loan in list" : JSON.stringify(loans.data));
    // Repayment
    const repay = await request("/repayments/bulk", {
        method: "POST",
        body: JSON.stringify({
            entries: [{ loanId, amount: 1000, date: new Date().toISOString(), method: "Cash" }]
        })
    }, token);
    track("Repayment Bulk", repay.ok && repay.data?.success === true, repay.ok ? "Repayment processed" : JSON.stringify(repay.data));
    const repayments = await request("/repayments", { method: "GET" }, token);
    const repayReadOk = Array.isArray(repayments.data) && repayments.data.some((r) => String(r.loanId) === String(loanId));
    track("Repayment Read", repayments.ok && repayReadOk, repayments.ok ? "Found repayment transaction" : JSON.stringify(repayments.data));
    // Savings
    const accountNumber = `SAV-${stamp}`;
    const createSavings = await request("/savings", {
        method: "POST",
        body: JSON.stringify({
            borrowerId,
            accountNumber,
            productName: "Phase 5 Savings",
            balance: 500,
            interestRate: 4.5
        })
    }, token);
    track("Savings Create", createSavings.ok && !!createSavings.data?._id, createSavings.ok ? `account=${accountNumber}` : JSON.stringify(createSavings.data));
    const savings = await request("/savings", { method: "GET" }, token);
    const savingsReadOk = Array.isArray(savings.data) && savings.data.some((s) => s.accountNumber === accountNumber);
    track("Savings Read", savings.ok && savingsReadOk, savings.ok ? "Found savings account" : JSON.stringify(savings.data));
    // Groups
    const createGroup = await request("/groups", {
        method: "POST",
        body: JSON.stringify({
            name: `Phase5 Group ${stamp}`,
            description: "Phase 5 smoke test group",
            leaderId: borrowerId,
            collectorId: "collector-1",
            members: [borrowerId]
        })
    }, token);
    const groupId = createGroup.data?._id;
    track("Group Create", createGroup.ok && !!groupId, createGroup.ok ? `groupId=${groupId}` : JSON.stringify(createGroup.data));
    const groups = await request("/groups", { method: "GET" }, token);
    const groupReadOk = Array.isArray(groups.data) && groups.data.some((g) => g._id === groupId);
    track("Group Read", groups.ok && groupReadOk, groups.ok ? "Found created group" : JSON.stringify(groups.data));
    // Accounts
    const accountCode = `A-${stamp}`;
    const createAccount = await request("/accounts", {
        method: "POST",
        body: JSON.stringify({
            code: accountCode,
            name: `Phase5 Account ${stamp}`,
            type: "Asset",
            balance: 0
        })
    }, token);
    track("Account Create", createAccount.ok && !!createAccount.data?._id, createAccount.ok ? `code=${accountCode}` : JSON.stringify(createAccount.data));
    const accounts = await request("/accounts", { method: "GET" }, token);
    const accountReadOk = Array.isArray(accounts.data) && accounts.data.some((a) => a.code === accountCode);
    track("Account Read", accounts.ok && accountReadOk, accounts.ok ? "Found created account" : JSON.stringify(accounts.data));
    // Investor
    const investorEmail = `phase5.investor.${stamp}@example.com`;
    const createInvestor = await request("/investors", {
        method: "POST",
        body: JSON.stringify({
            name: `Phase5 Investor ${stamp}`,
            email: investorEmail,
            totalInvested: 10000,
            activeLoans: 1,
            status: "Active"
        })
    }, token);
    track("Investor Create", createInvestor.ok && !!createInvestor.data?._id, createInvestor.ok ? `email=${investorEmail}` : JSON.stringify(createInvestor.data));
    const investors = await request("/investors", { method: "GET" }, token);
    const investorReadOk = Array.isArray(investors.data) && investors.data.some((i) => i.email === investorEmail);
    track("Investor Read", investors.ok && investorReadOk, investors.ok ? "Found created investor" : JSON.stringify(investors.data));
    // Collateral
    const serialNumber = `COL-${stamp}`;
    const createCollateral = await request("/collateral", {
        method: "POST",
        body: JSON.stringify({
            borrowerId,
            type: "Vehicle",
            productName: "Bike",
            value: 45000,
            serialNumber,
            status: "Deposited"
        })
    }, token);
    track("Collateral Create", createCollateral.ok && !!createCollateral.data?._id, createCollateral.ok ? `serial=${serialNumber}` : JSON.stringify(createCollateral.data));
    const collateral = await request("/collateral", { method: "GET" }, token);
    const collateralReadOk = Array.isArray(collateral.data) && collateral.data.some((c) => c.serialNumber === serialNumber);
    track("Collateral Read", collateral.ok && collateralReadOk, collateral.ok ? "Found created collateral" : JSON.stringify(collateral.data));
    // Users
    const userEmail = `phase5.user.${stamp}@example.com`;
    const createUser = await request("/users", {
        method: "POST",
        body: JSON.stringify({
            name: `Phase5 User ${stamp}`,
            email: userEmail,
            password: "Pass@123",
            role: "officer"
        })
    }, token);
    track("User Create", createUser.ok && !!createUser.data?.id, createUser.ok ? `email=${userEmail}` : JSON.stringify(createUser.data));
    const users = await request("/users", { method: "GET" }, token);
    const userReadOk = Array.isArray(users.data) && users.data.some((u) => u.email === userEmail);
    track("User Read", users.ok && userReadOk, users.ok ? "Found created user" : JSON.stringify(users.data));
    // Reports
    const reports = await request("/reports/dashboard", { method: "GET" }, token);
    const reportOk = reports.ok && typeof reports.data?.totalDisbursement === "number";
    track("Reports Dashboard", reportOk, reportOk ? "Dashboard stats returned" : JSON.stringify(reports.data));
    const failed = report.filter((r) => r.status === "FAIL");
    console.log("\n=== PHASE 5 SMOKE REPORT ===");
    for (const row of report) {
        console.log(`${row.status} | ${row.feature} | ${row.detail}`);
    }
    if (failed.length > 0) {
        process.exitCode = 1;
    }
}
run().catch((err) => {
    console.error("Phase 5 smoke test failed:", err);
    process.exitCode = 1;
});
//# sourceMappingURL=phase5Smoke.js.map