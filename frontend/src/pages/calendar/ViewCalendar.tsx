import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Clock, CreditCard, Package, Plus, TrendingDown, X, Filter, Download, Pencil, Trash2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/Shared/PageHeader';
import {
  bulkDeleteCustomCalendarEvents,
  bulkUpdateCustomCalendarEventMeta,
  createCustomCalendarEventsBulk,
  deleteCustomCalendarEvent,
  getCalendarEvents,
  getCustomCalendarEvents,
  ICalendarEvent,
  CalendarEventType,
  updateCustomCalendarEvent,
  CustomCalendarEventPayload,
} from '../../lib/api/calendar';
import API from '../../lib/api/api';

type Borrower = {
  _id: string;
  name: string;
  userId?: {
    name?: string;
  };
};

type CustomEventMeta = {
  category?: string;
  tags?: string[];
};

type CustomCalendarEvent = ICalendarEvent & {
  customMeta?: CustomEventMeta;
};

type BulkUndoSnapshot = {
  customEvents: CustomCalendarEvent[];
  dismissedReminderIds: string[];
  message: string;
};

const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  upcomingEmi: 'Upcoming EMI',
  overdueEmi: 'Overdue EMI',
  loanMaturity: 'Loan Maturity',
  statusApprovalDeadline: 'Approval Deadline',
  repaymentDue: 'Repayment Due',
  bulkRepaymentSession: 'Bulk Repayment',
  csvUploadBatch: 'CSV Upload',
  collateralDeposit: 'Collateral Deposit',
  collateralReturnSale: 'Collateral Return/Sale',
  borrowerActionItem: 'Borrower Action',
  portfolioAtRisk: 'Portfolio at Risk',
  collateralLinkExpiry: 'Link Expiry',
};

const DISMISSED_REMINDERS_STORAGE_KEY = 'calendar.dismissedReminders.v1';
const REMINDER_WINDOW_HOURS_STORAGE_KEY = 'calendar.reminderWindowHours.v1';

const ViewCalendar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryBorrowerId = searchParams.get('borrowerId') || '';
  const queryLoanId = searchParams.get('loanId') || '';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [apiEvents, setApiEvents] = useState<ICalendarEvent[]>([]);
  const [customEvents, setCustomEvents] = useState<CustomCalendarEvent[]>([]);
  const [dismissedReminderIds, setDismissedReminderIds] = useState<string[]>([]);
  const [reminderWindowHours, setReminderWindowHours] = useState<24 | 48 | 168>(48);
  const [borrowersList, setBorrowersList] = useState<Borrower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [customSeverity, setCustomSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [customRecurrence, setCustomRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [customRecurrenceCount, setCustomRecurrenceCount] = useState(4);
  const [customCategory, setCustomCategory] = useState('');
  const [customTagsInput, setCustomTagsInput] = useState('');
  const [editingCustomEventId, setEditingCustomEventId] = useState<string | null>(null);
  const [selectedCustomCategory, setSelectedCustomCategory] = useState('');
  const [selectedCustomTag, setSelectedCustomTag] = useState('');
  const [selectedCustomEventIds, setSelectedCustomEventIds] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkTagsInput, setBulkTagsInput] = useState('');
  const [bulkUndoSnapshot, setBulkUndoSnapshot] = useState<BulkUndoSnapshot | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  
  // Filter state
  const [selectedEventTypes, setSelectedEventTypes] = useState<CalendarEventType[]>([]);
  const [selectedBorrower, setSelectedBorrower] = useState(queryBorrowerId);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);

  const events = useMemo(() => {
    const merged = [...apiEvents, ...customEvents];
    return merged.sort(
      (a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime()
    );
  }, [apiEvents, customEvents]);

  const customEventIdSet = useMemo(
    () => new Set(customEvents.map((event) => event.id)),
    [customEvents]
  );

  const availableCustomCategories = useMemo(() => {
    const set = new Set(
      customEvents
        .map((event) => event.customMeta?.category?.trim())
        .filter((value): value is string => Boolean(value))
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [customEvents]);

  const availableCustomTags = useMemo(() => {
    const set = new Set<string>();
    customEvents.forEach((event) => {
      (event.customMeta?.tags || []).forEach((tag) => {
        const normalized = String(tag || '').trim();
        if (normalized) set.add(normalized);
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [customEvents]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesEventType =
        selectedEventTypes.length === 0 || selectedEventTypes.includes(event.type);
      if (!matchesEventType) return false;

      const matchesSeverity =
        selectedSeverities.length === 0 || selectedSeverities.includes(event.severity);
      if (!matchesSeverity) return false;

      const eventBorrowerId = event.sourceEntityData?.borrowerId || '';
      const matchesBorrower =
        !selectedBorrower || eventBorrowerId === selectedBorrower || event.sourceEntityId === selectedBorrower;
      if (!matchesBorrower) return false;

      if (queryLoanId) {
        const eventLoanId = event.sourceEntityData?.loanId || '';
        if (eventLoanId !== queryLoanId) return false;
      }

      if (!customEventIdSet.has(event.id)) {
        if (selectedCustomCategory || selectedCustomTag) {
          return false;
        }
        return true;
      }

      const customEvent = event as CustomCalendarEvent;
      const category = customEvent.customMeta?.category || '';
      const tags = customEvent.customMeta?.tags || [];

      const matchesCategory =
        !selectedCustomCategory || category.toLowerCase() === selectedCustomCategory.toLowerCase();
      const matchesTag =
        !selectedCustomTag || tags.some((tag) => tag.toLowerCase() === selectedCustomTag.toLowerCase());

      return matchesCategory && matchesTag;
    });
  }, [
    events,
    selectedEventTypes,
    selectedSeverities,
    selectedBorrower,
    queryLoanId,
    selectedCustomCategory,
    selectedCustomTag,
    customEventIdSet,
  ]);

  const reminders = useMemo(() => {
    const now = new Date();
    const reminderCutoff = new Date(now.getTime() + reminderWindowHours * 60 * 60 * 1000);
    return filteredEvents
      .filter((event) => {
        const when = new Date(event.dateStart);
        return when >= now && when <= reminderCutoff && !dismissedReminderIds.includes(event.id);
      })
      .slice(0, 5);
  }, [filteredEvents, dismissedReminderIds, reminderWindowHours]);

  const visibleCustomEventIds = useMemo(
    () =>
      filteredEvents
        .filter((event) => customEventIdSet.has(event.id))
        .map((event) => event.id),
    [filteredEvents, customEventIdSet]
  );

  // Fetch borrowers on mount
  useEffect(() => {
    const fetchBorrowers = async () => {
      try {
        const res = await API.get<Borrower[]>('/borrowers');
        setBorrowersList(res.data || []);
      } catch (err) {
        console.error('Failed to fetch borrowers:', err);
      }
    };
    fetchBorrowers();
  }, []);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(DISMISSED_REMINDERS_STORAGE_KEY);
      if (dismissed) {
        const parsedDismissed = JSON.parse(dismissed);
        if (Array.isArray(parsedDismissed)) {
          setDismissedReminderIds(parsedDismissed as string[]);
        }
      }
      const reminderWindow = localStorage.getItem(REMINDER_WINDOW_HOURS_STORAGE_KEY);
      if (reminderWindow) {
        const parsedWindow = Number(reminderWindow);
        if ([24, 48, 168].includes(parsedWindow)) {
          setReminderWindowHours(parsedWindow as 24 | 48 | 168);
        }
      }
    } catch (err) {
      console.error('Failed to load saved calendar preferences:', err);
    }
  }, []);

  const fetchServerCustomEvents = async (
    date: Date,
    borrowerId?: string,
    loanId?: string
  ) => {
    try {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const rows = await getCustomCalendarEvents({
        startDate: firstDay,
        endDate: lastDay,
        borrowerId,
        loanId,
      });

      setCustomEvents(rows as CustomCalendarEvent[]);
    } catch (err) {
      console.error('Failed to fetch server custom events:', err);
      setError('Failed to load custom events');
    }
  };

  useEffect(() => {
    if (queryBorrowerId) {
      setSelectedBorrower(queryBorrowerId);
    }
  }, [queryBorrowerId]);

  const fetchCalendarEvents = async (
    date: Date,
    borrowerId?: string,
    eventTypes?: CalendarEventType[],
    severities?: string[],
    loanId?: string
  ) => {
    try {
      setLoading(true);
      setError('');

      const year = date.getFullYear();
      const month = date.getMonth();

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];

      const calendarEvents = await getCalendarEvents({
        startDate,
        endDate,
        borrowerId,
        loanId,
        eventTypes,
        severity: severities,
      });

      setApiEvents(calendarEvents);
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
      setError('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarEvents(
      currentDate,
      selectedBorrower || undefined,
      selectedEventTypes.length > 0 ? selectedEventTypes : undefined,
      selectedSeverities.length > 0 ? selectedSeverities : undefined,
      queryLoanId || undefined
    );
    fetchServerCustomEvents(
      currentDate,
      selectedBorrower || undefined,
      queryLoanId || undefined
    );
  }, [currentDate, selectedBorrower, selectedEventTypes, selectedSeverities, queryLoanId]);

  // Utility functions
  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatWeekRange = (date: Date): string => {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getEventsForDate = (day: number): ICalendarEvent[] => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0];
    return filteredEvents.filter((e) => e.dateStart.split('T')[0] === dateStr);
  };

  const getEventsForDateObj = (date: Date): ICalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredEvents.filter((e) => e.dateStart.split('T')[0] === dateStr);
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700';
    }
  };

  const getEventIcon = (iconName: string) => {
    const iconProps = { size: 16, className: 'flex-shrink-0' };
    switch (iconName) {
      case 'alertCircle':
        return <AlertCircle {...iconProps} />;
      case 'checkCircle':
        return <CheckCircle {...iconProps} />;
      case 'clock':
        return <Clock {...iconProps} />;
      case 'creditCard':
        return <CreditCard {...iconProps} />;
      case 'package':
        return <Package {...iconProps} />;
      case 'plus':
        return <Plus {...iconProps} />;
      case 'trending':
        return <TrendingDown {...iconProps} />;
      default:
        return <Clock {...iconProps} />;
    }
  };

  // EventCard component
  const EventCard = ({ event, onClick }: { event: ICalendarEvent; onClick: () => void }) => (
    <div
      className={`p-3 rounded-lg border-l-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer`}
      style={{
        borderLeftColor:
          event.displayColor === 'red'
            ? '#ef4444'
            : event.displayColor === 'orange'
            ? '#f97316'
            : event.displayColor === 'yellow'
            ? '#eab308'
            : event.displayColor === 'green'
            ? '#22c55e'
            : '#3b82f6',
      }}
      onClick={onClick}
    >
      <div className="flex items-start gap-2 mb-2">
        <div className={`p-1.5 rounded-lg flex-shrink-0 ${getSeverityColor(event.severity)}`}>
          {getEventIcon(event.displayIcon)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {event.title}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {event.description}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={`px-2 py-1 rounded ${getSeverityColor(event.severity)}`}>
          {event.severity}
        </span>
        <span className="text-gray-500 dark:text-gray-400">{formatDate(event.dateStart)}</span>
      </div>
    </div>
  );

  // Month view
  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="h-24 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        ></div>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDate(day);
      const isToday =
        day === new Date().getDate() &&
        currentDate.getMonth() === new Date().getMonth() &&
        currentDate.getFullYear() === new Date().getFullYear();

      days.push(
        <div
          key={day}
          className={`min-h-24 border border-gray-200 dark:border-gray-700 p-2 cursor-pointer transition-colors ${
            isToday
              ? 'bg-blue-50 dark:bg-blue-900/20'
              : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className={`text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80 ${getSeverityColor(event.severity)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(event.deepLinkPath);
                }}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-7 gap-0 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {days}
        </div>
      </div>
    );
  };

  // Week view
  const renderWeekView = () => {
    const weekStart = getStartOfWeek(selectedDate || currentDate);
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      weekDays.push(d);
    }

    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dayEvents = getEventsForDateObj(day);
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div
                  key={day.toISOString()}
                  className={`rounded-lg p-3 min-h-96 ${
                    isToday
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <h4 className={`font-semibold mb-3 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </h4>
                  <div className="space-y-2">
                    {dayEvents.length === 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400">No events</p>
                    ) : (
                      dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs p-2 rounded cursor-pointer ${getSeverityColor(event.severity)}`}
                          onClick={() => navigate(event.deepLinkPath)}
                        >
                          {event.title}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Day agenda view
  const renderDayAgendaView = () => {
    const dayEvents = getEventsForDateObj(selectedDate || currentDate);
    const displayDate = selectedDate || currentDate;

    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {displayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </h3>

        {dayEvents.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-12">No events scheduled for this day</p>
        ) : (
          <div className="space-y-4">
            {dayEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => navigate(event.deepLinkPath)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // List view
  const renderListView = () => {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No events found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {visibleCustomEventIds.length > 0 && (
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/70 border-b border-gray-200 dark:border-gray-700">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={
                      visibleCustomEventIds.length > 0 &&
                      visibleCustomEventIds.every((id) => selectedCustomEventIds.includes(id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCustomEventIds(visibleCustomEventIds);
                      } else {
                        setSelectedCustomEventIds([]);
                      }
                    }}
                  />
                  Select all visible custom events
                </label>
              </div>
            )}
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => navigate(event.deepLinkPath)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {customEventIdSet.has(event.id) && (
                      <label
                        className="inline-flex items-center gap-2 mb-2 text-xs text-gray-600 dark:text-gray-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCustomEventIds.includes(event.id)}
                          onChange={() => toggleCustomEventSelection(event.id)}
                        />
                        Select for bulk actions
                      </label>
                    )}
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {event.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className={`px-2 py-1 text-xs rounded ${getSeverityColor(event.severity)}`}>
                        {event.severity}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300`}>
                        {EVENT_TYPE_LABELS[event.type]}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(event.dateStart)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center gap-2">
                      {customEventIdSet.has(event.id) && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              editCustomEvent(event);
                            }}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                            title="Edit custom event"
                          >
                            <Pencil size={14} className="text-blue-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCustomEvent(event.id);
                            }}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                            title="Delete custom event"
                          >
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        </>
                      )}
                      {getEventIcon(event.displayIcon)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render appropriate view
  const renderView = () => {
    switch (viewMode) {
      case 'week':
        return renderWeekView();
      case 'day':
        return renderDayAgendaView();
      case 'list':
        return renderListView();
      default:
        return renderMonthView();
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handlePrevWeek = () => {
    const d = new Date(selectedDate || currentDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(d);
    setCurrentDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(selectedDate || currentDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(d);
    setCurrentDate(d);
  };

  const toggleEventType = (type: CalendarEventType) => {
    setSelectedEventTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleSeverity = (severity: string) => {
    setSelectedSeverities((prev) =>
      prev.includes(severity) ? prev.filter((s) => s !== severity) : [...prev, severity]
    );
  };

  const clearFilters = () => {
    setSelectedEventTypes([]);
    setSelectedBorrower(queryBorrowerId || '');
    setSelectedSeverities([]);
    setSelectedCustomCategory('');
    setSelectedCustomTag('');
  };

  const saveCustomEvents = (nextEvents: CustomCalendarEvent[]) => {
    setCustomEvents(nextEvents);
  };

  const showUndoToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 4000);
  };

  const undoLastBulkAction = () => {
    if (!bulkUndoSnapshot) return;
    setCustomEvents(bulkUndoSnapshot.customEvents);
    setDismissedReminderIds(bulkUndoSnapshot.dismissedReminderIds);
    localStorage.setItem(
      DISMISSED_REMINDERS_STORAGE_KEY,
      JSON.stringify(bulkUndoSnapshot.dismissedReminderIds)
    );
    setToastMessage('Changes reverted.');
    setBulkUndoSnapshot(null);
  };

  const toDisplayColor = (severity: 'low' | 'medium' | 'high' | 'critical'): ICalendarEvent['displayColor'] => {
    if (severity === 'critical') return 'red';
    if (severity === 'high') return 'orange';
    if (severity === 'medium') return 'yellow';
    return 'green';
  };

  const resetCustomEventForm = () => {
    setShowCreateEvent(false);
    setEditingCustomEventId(null);
    setCustomTitle('');
    setCustomDescription('');
    setCustomDate(new Date().toISOString().split('T')[0]);
    setCustomSeverity('medium');
    setCustomRecurrence('none');
    setCustomRecurrenceCount(4);
    setCustomCategory('');
    setCustomTagsInput('');
  };

  const buildRecurringDates = (baseDate: Date): Date[] => {
    if (customRecurrence === 'none') {
      return [baseDate];
    }

    const safeCount = Math.max(1, Math.min(24, customRecurrenceCount));
    const dates: Date[] = [];
    for (let i = 0; i < safeCount; i++) {
      const next = new Date(baseDate);
      if (customRecurrence === 'daily') {
        next.setDate(baseDate.getDate() + i);
      }
      if (customRecurrence === 'weekly') {
        next.setDate(baseDate.getDate() + i * 7);
      }
      if (customRecurrence === 'monthly') {
        next.setMonth(baseDate.getMonth() + i);
      }
      dates.push(next);
    }
    return dates;
  };

  const createCustomEvent = async () => {
    if (!customTitle.trim() || !customDate) {
      return;
    }

    const borrower = borrowersList.find((b) => b._id === selectedBorrower);
    const baseDate = new Date(`${customDate}T09:00:00`);
    const recurringDates = buildRecurringDates(baseDate);

    if (editingCustomEventId) {
      const customTags = customTagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const nextStart = new Date(`${customDate}T09:00:00`);
      const nextEnd = new Date(`${customDate}T18:00:00`);
      const updated = await updateCustomCalendarEvent(editingCustomEventId, {
        title: customTitle.trim(),
        description: customDescription.trim() || 'Custom calendar reminder',
        dateStart: nextStart.toISOString(),
        dateEnd: nextEnd.toISOString(),
        severity: customSeverity,
        displayColor: toDisplayColor(customSeverity),
        sourceEntityId: selectedBorrower || 'custom',
        sourceEntityData: {
          ...(selectedBorrower ? { borrowerId: selectedBorrower } : {}),
          ...(borrower ? { borrowerName: borrower.name } : {}),
        },
        customMeta: {
          ...(customCategory.trim() ? { category: customCategory.trim() } : {}),
          ...(customTags.length > 0 ? { tags: customTags } : {}),
        },
      });

      saveCustomEvents(
        customEvents.map((event) =>
          event.id === editingCustomEventId ? (updated as CustomCalendarEvent) : event
        )
      );
      resetCustomEventForm();
      return;
    }

    const customTags = customTagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payloads: CustomCalendarEventPayload[] = recurringDates.map((dateStart) => {
      const dateEnd = new Date(dateStart);
      dateEnd.setHours(18, 0, 0, 0);

      return {
        type: 'borrowerActionItem',
        title: customTitle.trim(),
        description: customDescription.trim() || 'Custom calendar reminder',
        dateStart: dateStart.toISOString(),
        dateEnd: dateEnd.toISOString(),
        severity: customSeverity,
        sourceEntityType: 'borrower',
        sourceEntityId: selectedBorrower || 'custom',
        sourceEntityData: {
          ...(selectedBorrower ? { borrowerId: selectedBorrower } : {}),
          ...(borrower ? { borrowerName: borrower.name } : {}),
        },
        deepLinkPath: '/calendar',
        displayColor: toDisplayColor(customSeverity),
        displayIcon: 'plus',
        customMeta: {
          ...(customCategory.trim() ? { category: customCategory.trim() } : {}),
          ...(customTags.length > 0 ? { tags: customTags } : {}),
        },
      };
    });

    const createdRows = await createCustomCalendarEventsBulk(payloads);
    saveCustomEvents([...customEvents, ...(createdRows as CustomCalendarEvent[])]);
    resetCustomEventForm();
  };

  const editCustomEvent = (event: ICalendarEvent) => {
    const customEvent = event as CustomCalendarEvent;
    setEditingCustomEventId(event.id);
    setCustomTitle(event.title);
    setCustomDescription(event.description || '');
    setCustomDate(new Date(event.dateStart).toISOString().split('T')[0]);
    setCustomSeverity(event.severity);
    setCustomCategory(customEvent.customMeta?.category || '');
    setCustomTagsInput((customEvent.customMeta?.tags || []).join(', '));
    setCustomRecurrence('none');
    setCustomRecurrenceCount(1);
    setShowCreateEvent(true);
  };

  const deleteCustomEvent = async (eventId: string) => {
    await deleteCustomCalendarEvent(eventId);
    const nextEvents = customEvents.filter((event) => event.id !== eventId);
    saveCustomEvents(nextEvents);
    setSelectedCustomEventIds((prev) => prev.filter((id) => id !== eventId));
    const nextDismissed = dismissedReminderIds.filter((id) => id !== eventId);
    setDismissedReminderIds(nextDismissed);
    localStorage.setItem(DISMISSED_REMINDERS_STORAGE_KEY, JSON.stringify(nextDismissed));
  };

  const exportVisibleEventsCsv = () => {
    const rows = [
      ['Title', 'Description', 'Severity', 'Type', 'Start', 'End'],
      ...filteredEvents.map((event) => [
        event.title,
        event.description || '',
        event.severity,
        EVENT_TYPE_LABELS[event.type] || event.type,
        new Date(event.dateStart).toISOString(),
        new Date(event.dateEnd).toISOString(),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendar-events-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleCustomEventSelection = (eventId: string) => {
    setSelectedCustomEventIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const deleteSelectedCustomEvents = async () => {
    if (selectedCustomEventIds.length === 0) return;
    const confirmed = window.confirm(
      `Delete ${selectedCustomEventIds.length} selected custom event(s)? This cannot be undone unless you click Undo.`
    );
    if (!confirmed) return;

    setBulkUndoSnapshot(null);

    await bulkDeleteCustomCalendarEvents(selectedCustomEventIds);
    const nextEvents = customEvents.filter((event) => !selectedCustomEventIds.includes(event.id));
    saveCustomEvents(nextEvents);
    const nextDismissed = dismissedReminderIds.filter((id) => !selectedCustomEventIds.includes(id));
    setDismissedReminderIds(nextDismissed);
    localStorage.setItem(DISMISSED_REMINDERS_STORAGE_KEY, JSON.stringify(nextDismissed));
    setSelectedCustomEventIds([]);
    showUndoToast('Selected events deleted.');
  };

  const selectAllVisibleCustomEvents = () => {
    setSelectedCustomEventIds(visibleCustomEventIds);
  };

  const clearSelectedCustomEvents = () => {
    setSelectedCustomEventIds([]);
  };

  const applyBulkCustomMetaUpdate = async () => {
    if (selectedCustomEventIds.length === 0) return;

    const confirmed = window.confirm(
      `Apply category/tags updates to ${selectedCustomEventIds.length} selected custom event(s)?`
    );
    if (!confirmed) return;

    setBulkUndoSnapshot(null);

    const parsedTags = bulkTagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    await bulkUpdateCustomCalendarEventMeta(selectedCustomEventIds, {
      category: bulkCategory.trim() || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
    });

    const nextEvents = customEvents.map((event) => {
      if (!selectedCustomEventIds.includes(event.id)) return event;

      const existingCategory = event.customMeta?.category || '';
      const existingTags = event.customMeta?.tags || [];

      return {
        ...event,
        customMeta: {
          category: bulkCategory.trim() ? bulkCategory.trim() : existingCategory,
          tags: parsedTags.length > 0 ? parsedTags : existingTags,
        },
      };
    });

    saveCustomEvents(nextEvents);
    setBulkCategory('');
    setBulkTagsInput('');
    showUndoToast('Bulk metadata updated.');
  };

  const updateReminderWindow = (hours: 24 | 48 | 168) => {
    setReminderWindowHours(hours);
    localStorage.setItem(REMINDER_WINDOW_HOURS_STORAGE_KEY, String(hours));
  };

  const dismissReminder = (eventId: string) => {
    const next = [...dismissedReminderIds, eventId];
    setDismissedReminderIds(next);
    localStorage.setItem(DISMISSED_REMINDERS_STORAGE_KEY, JSON.stringify(next));
  };

  const dismissAllVisibleReminders = () => {
    const reminderIds = reminders.map((event) => event.id);
    if (reminderIds.length === 0) return;
    const confirmed = window.confirm(
      `Dismiss all ${reminderIds.length} visible reminder(s)?`
    );
    if (!confirmed) return;

    setBulkUndoSnapshot({
      customEvents: [...customEvents],
      dismissedReminderIds: [...dismissedReminderIds],
      message: 'Dismiss all reminders completed',
    });

    const merged = Array.from(new Set([...dismissedReminderIds, ...reminderIds]));
    setDismissedReminderIds(merged);
    localStorage.setItem(DISMISSED_REMINDERS_STORAGE_KEY, JSON.stringify(merged));
    showUndoToast('Visible reminders dismissed.');
  };

  const restoreDismissedReminders = () => {
    const confirmed = window.confirm('Restore all dismissed reminders?');
    if (!confirmed) return;

    setBulkUndoSnapshot({
      customEvents: [...customEvents],
      dismissedReminderIds: [...dismissedReminderIds],
      message: 'Restore reminders completed',
    });

    setDismissedReminderIds([]);
    localStorage.setItem(DISMISSED_REMINDERS_STORAGE_KEY, JSON.stringify([]));
    showUndoToast('Dismissed reminders restored.');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PageHeader
        title="Calendar"
        description="View upcoming events, due dates, and action items"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {(queryLoanId || queryBorrowerId) && (
          <div className="mb-6 flex flex-wrap gap-2">
            {queryLoanId && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                Focused Loan: {queryLoanId.slice(-6)}
              </span>
            )}
            {queryBorrowerId && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                Focused Borrower
              </span>
            )}
            <button
              onClick={() => navigate('/calendar')}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Clear Context
            </button>
          </div>
        )}

        <div className="mb-6 bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Upcoming Reminders ({reminderWindowHours}h)
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={dismissAllVisibleReminders}
                className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Dismiss All
              </button>
              <button
                onClick={restoreDismissedReminders}
                className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Restore
              </button>
              <select
                value={String(reminderWindowHours)}
                onChange={(e) => updateReminderWindow(Number(e.target.value) as 24 | 48 | 168)}
                className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                <option value="24">24h</option>
                <option value="48">48h</option>
                <option value="168">7d</option>
              </select>
            </div>
          </div>
          {reminders.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No reminders in the selected window.</p>
          ) : (
            <div className="space-y-2">
              {reminders.map((event) => (
                <div key={`reminder-${event.id}`} className="flex items-center justify-between gap-4 p-2 rounded bg-gray-50 dark:bg-gray-800">
                  <button
                    onClick={() => navigate(event.deepLinkPath)}
                    className="text-left flex-1"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{event.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(event.dateStart)} at {formatTime(event.dateStart)}</p>
                  </button>
                  <button
                    onClick={() => dismissReminder(event.id)}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    title="Dismiss reminder"
                  >
                    <X size={14} className="text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Controls */}
        <div className="mb-6 bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (viewMode === 'month') handlePrevMonth();
                  if (viewMode === 'week') handlePrevWeek();
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronLeft size={20} className="text-gray-700 dark:text-gray-300" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white min-w-64">
                {viewMode === 'month' && formatMonthYear(currentDate)}
                {viewMode === 'week' && ('Week: ' + formatWeekRange(selectedDate || currentDate))}
                {viewMode === 'day' && (selectedDate || currentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                {viewMode === 'list' && formatMonthYear(currentDate)}
              </h2>
              <button
                onClick={() => {
                  if (viewMode === 'month') handleNextMonth();
                  if (viewMode === 'week') handleNextWeek();
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronRight size={20} className="text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            <div className="flex gap-2">
              {visibleCustomEventIds.length > 0 && (
                <button
                  onClick={selectAllVisibleCustomEvents}
                  className="px-3 py-2 rounded-lg font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Select All Custom ({visibleCustomEventIds.length})
                </button>
              )}
              {selectedCustomEventIds.length > 0 && (
                <button
                  onClick={clearSelectedCustomEvents}
                  className="px-3 py-2 rounded-lg font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Clear Selection
                </button>
              )}
              {selectedCustomEventIds.length > 0 && (
                <button
                  onClick={deleteSelectedCustomEvents}
                  className="px-3 py-2 rounded-lg font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  Delete Selected ({selectedCustomEventIds.length})
                </button>
              )}
              {selectedCustomEventIds.length > 0 && (
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <input
                    value={bulkCategory}
                    onChange={(e) => setBulkCategory(e.target.value)}
                    placeholder="Bulk category"
                    className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <input
                    value={bulkTagsInput}
                    onChange={(e) => setBulkTagsInput(e.target.value)}
                    placeholder="Bulk tags"
                    className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={applyBulkCustomMetaUpdate}
                    className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Apply
                  </button>
                </div>
              )}
              <button
                onClick={exportVisibleEventsCsv}
                className="px-3 py-2 rounded-lg font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                Export CSV
              </button>
              <button
                onClick={() => setShowCreateEvent(true)}
                className="px-3 py-2 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                + Custom Event
              </button>
              {(['month', 'week', 'day', 'list'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setViewMode(mode);
                    if (!selectedDate && (mode === 'day' || mode === 'week')) {
                      setSelectedDate(new Date());
                    }
                  }}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {mode === 'day' ? 'Agenda' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter size={16} />
            Filters {selectedEventTypes.length + (selectedBorrower ? 1 : 0) + selectedSeverities.length > 0 && `(${selectedEventTypes.length + (selectedBorrower ? 1 : 0) + selectedSeverities.length})`}
          </button>
        </div>

        {showCreateEvent && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
            <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingCustomEventId ? 'Edit Custom Event' : 'Create Custom Event'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                  <input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Example: Follow-up call"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Optional details"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Severity</label>
                    <select
                      value={customSeverity}
                      onChange={(e) => setCustomSeverity(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <input
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Example: Field Visit"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma separated)</label>
                    <input
                      value={customTagsInput}
                      onChange={(e) => setCustomTagsInput(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="follow-up, urgent"
                    />
                  </div>
                </div>
                {!editingCustomEventId && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recurrence</label>
                      <select
                        value={customRecurrence}
                        onChange={(e) => setCustomRecurrence(e.target.value as 'none' | 'daily' | 'weekly' | 'monthly')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="none">One-time</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Occurrences</label>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={customRecurrenceCount}
                        onChange={(e) => setCustomRecurrenceCount(Number(e.target.value || 1))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={resetCustomEventForm}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={createCustomEvent}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  {editingCustomEventId ? 'Update Event' : 'Save Event'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Event Type Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Event Type
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEventTypes.includes(key as CalendarEventType)}
                        onChange={() => toggleEventType(key as CalendarEventType)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Borrower Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Borrower
                </label>
                <select
                  value={selectedBorrower}
                  onChange={(e) => setSelectedBorrower(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">All Borrowers</option>
                  {borrowersList.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Severity
                </label>
                <div className="space-y-2">
                  {['critical', 'high', 'medium', 'low'].map((sev) => (
                    <label key={sev} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSeverities.includes(sev)}
                        onChange={() => toggleSeverity(sev)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{sev}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Presets */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Presets
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="block w-full text-left px-3 py-2 rounded text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 30);
                      setCurrentDate(d);
                    }}
                    className="block w-full text-left px-3 py-2 rounded text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    Next 30 Days
                  </button>
                </div>
              </div>

              {/* Custom Event Filters */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Custom Filters
                </label>
                <div className="space-y-2">
                  <select
                    value={selectedCustomCategory}
                    onChange={(e) => setSelectedCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">All Categories</option>
                    {availableCustomCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <select
                    value={selectedCustomTag}
                    onChange={(e) => setSelectedCustomTag(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">All Tags</option>
                    {availableCustomTags.map((tag) => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading calendar events...</p>
          </div>
        ) : (
          <>
            {/* Main View */}
            {renderView()}

            {/* Event Summary Stats */}
            {filteredEvents.length > 0 && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Critical Events',
                    count: filteredEvents.filter((e) => e.severity === 'critical').length,
                    color: 'red',
                  },
                  {
                    label: 'High Priority',
                    count: filteredEvents.filter((e) => e.severity === 'high').length,
                    color: 'orange',
                  },
                  {
                    label: 'Medium Priority',
                    count: filteredEvents.filter((e) => e.severity === 'medium').length,
                    color: 'yellow',
                  },
                  {
                    label: 'Total Events',
                    count: filteredEvents.length,
                    color: 'blue',
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm"
                  >
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{stat.label}</p>
                    <p
                      className={`text-3xl font-bold ${
                        stat.color === 'red'
                          ? 'text-red-600 dark:text-red-400'
                          : stat.color === 'orange'
                          ? 'text-orange-600 dark:text-orange-400'
                          : stat.color === 'yellow'
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {stat.count}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg px-4 py-3">
              <p className="text-sm text-gray-800 dark:text-gray-200">{toastMessage}</p>
              {bulkUndoSnapshot && (
                <button
                  onClick={undoLastBulkAction}
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Undo
                </button>
              )}
              <button
                onClick={() => setToastMessage('')}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Dismiss"
              >
                <X size={14} className="text-gray-500" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewCalendar;
