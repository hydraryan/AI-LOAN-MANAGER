import { 
  PiggyBank,
  ChevronDown, ChevronRight,
  X, LayoutDashboard, Users, 
  BarChart3, Settings, Search,
  Scale, Banknote, ScrollText, Calendar, FileText,
  ArrowLeftRight, Briefcase, Wallet
} from 'lucide-react';
import { cn } from '../../lib/utils';
import React, { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';


interface SubMenuItem {
  title: string;
  path: string;
}

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path?: string;
  submenu?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/'
  },
  {
      title: 'Borrowers',
      icon: Users,
      submenu: [
          { title: 'View Borrowers', path: '/borrowers/view' },
          { title: 'Add Borrower', path: '/borrowers/add' },
          { title: 'Borrower Groups', path: '/borrowers/groups' },
          { title: 'Add Borrowers Group', path: '/borrowers/groups/add' },
          { title: 'Send SMS to All', path: '/borrowers/sms' },
          { title: 'Send Email to All', path: '/borrowers/email' },
          { title: 'Invite Borrowers', path: '/borrowers/invite' },
      ]
  },
  {
      title: 'Loans',
      icon: Scale,
      submenu: [
          { title: 'View All Loans', path: '/loans/view' },
          { title: 'Add Loan', path: '/loans/add' },
          { title: 'Approve Loans', path: '/loans/approve' },
          { title: 'Due Loans', path: '/loans/due' },
          { title: 'Missed Repayments', path: '/loans/missed' },
          { title: 'Loans in Arrears', path: '/loans/arrears' },
          { title: 'No Repayments', path: '/loans/no-repayments' },
          { title: 'Past Maturity Date', path: '/loans/past-maturity' },
          { title: 'Principal Outstanding', path: '/loans/principal-outstanding' },
          { title: '1 Month Late Loans', path: '/loans/late-1-month' },
          { title: '3 Months Late Loans', path: '/loans/late-3-months' },
          { title: 'Loan Calculator', path: '/loans/calculator' },
          { title: 'Guarantors', path: '/loans/guarantors' },
          { title: 'Loan Comments', path: '/loans/comments' },
      ]
  },
  {
      title: 'Repayments',
      icon: Banknote,
      submenu: [
          { title: 'View Repayments', path: '/repayments/view' },
          { title: 'Add Bulk Repayments', path: '/repayments/bulk-add' },
          { title: 'Upload Repayments (CSV)', path: '/repayments/upload' },
          { title: 'Repayment Charts', path: '/repayments/charts' },
          { title: 'Approve Repayments', path: '/repayments/approve' },
      ]
  },
  {
      title: 'Collateral Register',
      icon: ScrollText,
      path: '/collateral/register'
  },
  {
      title: 'Calendar',
      icon: Calendar,
      path: '/calendar'
  },
  {
      title: 'Collection Sheets',
      icon: FileText,
      submenu: [
          { title: 'Daily Collection Sheet', path: '/collections/daily' },
          { title: 'Missed Repayment Sheet', path: '/collections/missed' },
          { title: 'Past Maturity Date Loans', path: '/collections/past-maturity' },
          { title: 'Send SMS', path: '/collections/sms' },
          { title: 'Send Email', path: '/collections/email' },
      ]
  },
  {
     title: 'Savings',
     icon: PiggyBank,
     submenu: [
         { title: 'View Savings Accounts', path: '/savings/view' },
         { title: 'Add Savings Account', path: '/savings/add' },
         { title: 'View Term Deposits', path: '/savings/term-deposits' },
         { title: 'Add Term Deposit', path: '/savings/term-deposits/add' },
         { title: 'Savings Charts', path: '/savings/charts' },
         { title: 'Savings Report', path: '/savings/report' },
         { title: 'Savings Products Report', path: '/savings/products-report' },
         { title: 'Savings Fee Report', path: '/savings/fee-report' },
         { title: 'Cash Safe Management', path: '/savings/cash-safe' },
     ]
  },
  {
      title: 'Savings Transactions',
      icon: ArrowLeftRight,
      submenu: [
          { title: 'View Transactions', path: '/savings-transactions/view' },
          { title: 'Add Bulk Transactions', path: '/savings-transactions/bulk-add' },
          { title: 'Upload Transactions (CSV)', path: '/savings-transactions/upload' },
          { title: 'Staff Transactions Report', path: '/savings-transactions/staff-report' },
          { title: 'Approve Transactions', path: '/savings-transactions/approve' },
      ]
  },
  {
     title: 'Investors',
     icon: Briefcase,
     submenu: [
         { title: 'View Investors', path: '/investors/view' },
         { title: 'Add Investor', path: '/investors/add' },
         { title: 'Invite Investors', path: '/investors/invite' },
         { title: 'Send SMS to All', path: '/investors/sms' },
         { title: 'Send Email to All', path: '/investors/email' },
     ]
  },
  {
      title: 'Investor Accounts',
      icon: Wallet,
      submenu: [
          { title: 'View All Investor Accounts', path: '/investor-accounts/view' },
          { title: 'Add Investor Account', path: '/investor-accounts/add' },
          { title: 'View Loan Investments', path: '/investor-accounts/investments' },
          { title: 'View Investor Transactions', path: '/investor-accounts/transactions' },
          { title: 'Approve Loan Investments', path: '/investor-accounts/approve' },
      ]
  },
  {
     title: 'Reports',
     icon: BarChart3,
     submenu: [
          { title: 'Borrowers Report', path: '/reports/borrowers' },
          { title: 'Loan Report', path: '/reports/loans' },
          { title: 'Loan Arrears Aging', path: '/reports/arrears-aging' },
          { title: 'Collections Report', path: '/reports/collections' },
          { title: 'Collector Report', path: '/reports/collector' },
          { title: 'Deferred Income', path: '/reports/deferred-income' },
          { title: 'Pro-Rata Collections', path: '/reports/pro-rata' },
          { title: 'Disbursement Report', path: '/reports/disbursement' },
          { title: 'Fees Report', path: '/reports/fees' },
          { title: 'Loan Officer Report', path: '/reports/loan-officer' },
          { title: 'Loan Products Report', path: '/reports/loan-products' },
          { title: 'MFRS Ratios', path: '/reports/mfrs-ratios' },
          { title: 'Daily Report', path: '/reports/daily' },
          { title: 'Monthly Report', path: '/reports/monthly' },
          { title: 'Outstanding Report', path: '/reports/outstanding' },
          { title: 'Portfolio at Risk (PAR)', path: '/reports/par' },
          { title: 'At-a-Glance Report', path: '/reports/at-a-glance' },
          { title: 'Fully Paid Loans', path: '/reports/fully-paid' },
          { title: 'Defaulted Loans', path: '/reports/defaulted' },
          { title: 'All Entries', path: '/reports/all-entries' },
     ]
  },
  {
    title: 'Account',
    icon: Settings,
    path: '/users'
  },
];

const allSearchableItems = menuItems.reduce((acc, item) => {
  if (item.path) {
      acc.push({ title: item.title, path: item.path, icon: item.icon, group: 'Main' });
  }
  if (item.submenu) {
      item.submenu.forEach(sub => {
          acc.push({ title: sub.title, path: sub.path, icon: item.icon, group: item.title });
      });
  }
  return acc;
}, [] as { title: string; path: string; icon: React.ElementType; group: string }[]);

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return [];
    return allSearchableItems.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.group.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleSearchNavigation = (path: string) => {
      navigate(path);
      setSearchTerm('');
      setShowResults(false);
  };

  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [hoveredItem, setHoveredItem] = useState<{ item: MenuItem; top: number; bottom: number; windowHeight: number } | null>(null);
  const hoverTimeoutRef = React.useRef<any>(null);

  const toggleSubmenu = (title: string) => {
    setExpandedMenus(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title) 
        : [...prev, title]
    );
  };

  const handleMouseEnter = (item: MenuItem, event: React.MouseEvent) => {
    if (isOpen) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredItem({
        item,
        top: rect.top,
        bottom: rect.bottom,
        windowHeight: window.innerHeight
    });
  };

  const handleMouseLeave = () => {
    if (isOpen) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
    }, 200);
  };

  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 bg-gray-800 bg-opacity-50 z-20 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={toggleSidebar}
      />

      <div className={cn(
        "fixed inset-y-0 left-0 z-30 bg-white dark:bg-gray-800 shadow-xl transform transition-all duration-300 ease-in-out flex flex-col border-r border-gray-100 dark:border-gray-700",
        isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0 lg:w-20"
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center h-16 border-b border-gray-100 dark:border-gray-700 transition-all duration-300",
          isOpen ? "justify-between px-6" : "justify-center px-2 lg:px-0"
        )}>
          <div className="flex items-center gap-3">
             <div className="bg-slate-900 text-white p-2 rounded-lg dark:bg-slate-800">
                <span className="font-bold text-xl">LM</span>
             </div>
             <span className={cn(
               "text-xl font-bold text-slate-900 dark:text-white transition-opacity duration-300 whitespace-nowrap",
               !isOpen && "lg:hidden opacity-0"
             )}>Loan Manager</span>
          </div>
          <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 lg:hidden">
            <X size={24} />
          </button>
        </div>

        {/* Search */}
        <div className={cn("px-4 py-4 z-50", !isOpen && "lg:px-2 lg:flex lg:justify-center")}>
             {isOpen ? (
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                      value={searchTerm}
                      onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setShowResults(true);
                      }}
                      onFocus={() => setShowResults(true)}
                      onBlur={() => setTimeout(() => setShowResults(false), 200)}
                    />
                    
                    {/* Search Results Dropdown */}
                    {showResults && searchTerm && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto z-50 custom-scrollbar">
                            {filteredItems.length > 0 ? (
                                <div className="py-1">
                                    {filteredItems.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSearchNavigation(item.path)}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                                        >
                                           {item.icon && <item.icon size={14} className="text-gray-400 shrink-0" />}
                                           <div className="overflow-hidden">
                                               <div className="font-medium truncate">{item.title}</div>
                                               <div className="text-[10px] text-gray-400 truncate">{item.group}</div>
                                           </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                                    No results found
                                </div>
                            )}
                        </div>
                    )}
                 </div>
             ) : (
                <button 
                    onClick={toggleSidebar}
                    className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                    title="Search"
                >
                    <Search size={20} />
                </button>
             )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] overflow-x-hidden">
          
          <div className={cn("px-3 mb-2 transition-opacity duration-300", !isOpen && "lg:hidden opacity-0")}>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Main</span>
          </div>

          {menuItems.map((item) => (
            <div key={item.title}>
              {item.submenu ? (
                <div>
                  <button
                    onClick={() => toggleSubmenu(item.title)}
                    onMouseEnter={(e) => handleMouseEnter(item, e)}
                    onMouseLeave={handleMouseLeave}
                    className={cn(
                      "w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                      !isOpen ? "lg:justify-center" : "justify-between",
                      expandedMenus.includes(item.title) 
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-200/50 dark:shadow-none dark:bg-slate-800" 
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} className={cn("transition-colors", expandedMenus.includes(item.title) ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white")} />
                      <span className={cn("transition-all duration-200 whitespace-nowrap", !isOpen && "lg:hidden lg:w-0 lg:opacity-0")}>{item.title}</span>
                    </div>
                    {isOpen && (
                        expandedMenus.includes(item.title) ? (
                        <ChevronDown size={16} />
                        ) : (
                        <ChevronRight size={16} />
                        )
                    )}
                  </button>
                  
                  {expandedMenus.includes(item.title) && isOpen && (
                    <div className="relative ml-5 mt-1 space-y-1">
                      {/* Vertical Line for the group */}
                      <div className="absolute left-0 top-0 bottom-3 w-px bg-gray-200 dark:bg-gray-700"></div>

                      {item.submenu.map((subItem) => (
                        <div key={subItem.path} className="relative">
                            {/* Curve Connector */}
                            <div className="absolute left-0 top-3.5 w-4 h-px bg-gray-200 dark:bg-gray-700"></div> 
                            
                            <Link
                              to={subItem.path}
                              className={cn(
                                "relative block ml-4 pl-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap",
                                location.pathname === subItem.path
                                  ? "text-slate-900 font-bold bg-slate-100 dark:bg-slate-700 dark:text-white"
                                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/30"
                              )}
                            >
                              {subItem.title}
                            </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.path!}
                  onMouseEnter={(e) => handleMouseEnter(item, e)}
                  onMouseLeave={handleMouseLeave}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                    !isOpen && "lg:justify-center",
                    location.pathname === item.path
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-200/50 dark:shadow-none dark:bg-slate-800"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <item.icon size={20} className={cn("transition-colors", location.pathname === item.path ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white")} />

                  <span className={cn("transition-all duration-200 whitespace-nowrap", !isOpen && "lg:hidden lg:w-0 lg:opacity-0")}>{item.title}</span>
                </Link>
              )}
            </div>
          ))}

          {!isOpen && hoveredItem && (
            <div 
              className={cn(
                  "fixed left-20 z-50 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 animate-in fade-in slide-in-from-left-2 duration-200 ml-4 max-h-[80vh] overflow-y-auto custom-scrollbar"
              )}
              style={
                  hoveredItem.top > hoveredItem.windowHeight / 2 // If in bottom half of screen
                  ? { bottom:  hoveredItem.windowHeight - hoveredItem.bottom } // Align bottom of tooltip with bottom of icon
                  : { top: hoveredItem.top } // Align top of tooltip with top of icon
              }
              onMouseEnter={() => {
                  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
              }}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex items-center gap-2 mb-2 px-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                  <hoveredItem.item.icon size={16} className="text-slate-900 dark:text-white" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{hoveredItem.item.title}</span>
              </div>
              {hoveredItem.item.submenu ? (
                <div className="space-y-1">
                  {hoveredItem.item.submenu.map((sub, idx) => (
                      <Link 
                        key={idx} 
                        to={sub.path}
                        className="block px-2 py-1.5 text-sm text-gray-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                      >
                        {sub.title}
                      </Link>
                  ))}
                </div>
              ) : (
                  <div className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400">
                    Click to open {hoveredItem.item.title} page
                  </div>
              )}
            </div>
          )}
        </nav>

        {/* User Profile */}
        <div className={cn(
            "border-t border-gray-100 dark:border-gray-700 p-4 transition-all duration-300",
            !isOpen && "lg:p-2 lg:flex lg:justify-center"
        )}>
            <div className={cn(
                "flex items-center gap-3",
                !isOpen && "lg:justify-center"
            )}>
                <div className="relative">
                    <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-white dark:border-gray-600 shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-gray-500 transition-colors">
                        <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Profile" className="h-full w-full object-cover" />
                    </div>
                     {/* Online Status Indicator */}
                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-800"></div>
                </div>
                
                <div className={cn(
                    "flex flex-col text-left transition-opacity duration-200",
                    !isOpen && "lg:hidden opacity-0 w-0 overflow-hidden"
                )}>
                    <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">Aryan Rajput</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">E19593</span>
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
