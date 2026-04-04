import { Bell, Sun, Moon, Home, BookOpen, Menu, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { logout } from '../../lib/api/auth';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const { setTheme, theme } = useTheme();
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [weather, setWeather] = useState<{ temp: number | null, city: string }>({ temp: null, city: 'Loading...' });

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      navigate('/login', { replace: true });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
           // Fetch Weather (Open-Meteo - Free, No Key)
           const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`);
           const weatherData = await weatherRes.json();
           
           // Fetch City (BigDataCloud - Free, No Key)
           const cityRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
           const cityData = await cityRes.json();
           
           setWeather({
             temp: Math.round(weatherData.current.temperature_2m),
             city: cityData.city || cityData.locality || cityData.principalSubdivision || 'Unknown'
           });
        } catch (error) {
           console.error("Error fetching weather", error);
           setWeather(prev => ({ ...prev, city: 'Weather Unavailable' }));
        }
      }, (error) => {
         console.error("Geolocation error", error);
         setWeather(prev => ({ ...prev, city: 'Loc. Denied' }));
      });
    }
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between shadow-sm transition-colors duration-300">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={toggleSidebar} 
          className="p-2 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-500"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Global Search - Moved to Sidebar */}
      </div>

      <div className="flex items-center gap-3">
        {/* Date & Weather Widget - Moved to Right */}
        <div className="hidden lg:flex items-center bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 font-medium mr-2">
            <span className="mr-2">{formatDate(date)}</span>
            <span className="mx-2 text-gray-300 dark:text-gray-500">|</span>
            <Sun className="w-4 h-4 text-orange-400 mr-1" />
            <span>
              {weather.temp !== null ? `${weather.temp}°C` : '--°C'} {weather.city}
            </span>
        </div>

        {/* Theme Toggle */}
        <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1 mr-2">
            <button 
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium shadow-sm transition-all ${
                    theme === 'light' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
                <Sun size={12} /> Light
            </button>
            <button 
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    theme === 'dark' ? 'bg-slate-700 text-white shadow' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
                <Moon size={12} /> Dark
            </button>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-4 mx-2 text-gray-500 dark:text-gray-400">
            <Home className="w-5 h-5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" />
            <Bell className="w-5 h-5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" />
            <BookOpen className="w-5 h-5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" />
            <div className="h-5 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
            <button onClick={handleLogout} aria-label="Logout" title="Logout">
              <LogOut className="w-5 h-5 cursor-pointer hover:text-rose-600 dark:hover:text-rose-400 transition-colors" />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
