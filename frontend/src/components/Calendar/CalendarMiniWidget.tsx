import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getUpcomingCriticalEvents, ICalendarEvent } from '../../lib/api/calendar';

const CalendarMiniWidget = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ICalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const upcomingEvents = await getUpcomingCriticalEvents();
        // Limit to 5 most critical events
        setEvents(upcomingEvents.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch upcoming events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Actions</h3>
        <div className="flex justify-center py-4">
          <div className="w-4 h-4 border-2 border-blue-200 dark:border-blue-800 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Actions</h3>
        <button
          onClick={() => navigate('/calendar')}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1"
        >
          View All
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Events List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {events.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            No critical events in the next 7 days
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              onClick={() => navigate(event.deepLinkPath)}
            >
              <div className="flex items-start gap-3">
                {/* Severity Indicator */}
                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${
                  event.severity === 'critical' ? 'bg-red-500' :
                  event.severity === 'high' ? 'bg-orange-500' :
                  'bg-yellow-500'
                }`}></div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {event.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                    {event.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(event.dateStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>

                {/* Severity Badge */}
                <div className="flex-shrink-0">
                  <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${
                    event.severity === 'critical'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      : event.severity === 'high'
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                  }`}>
                    {event.severity}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {events.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
          <button
            onClick={() => navigate('/calendar')}
            className="w-full px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            View Calendar →
          </button>
        </div>
      )}
    </div>
  );
};

export default CalendarMiniWidget;
