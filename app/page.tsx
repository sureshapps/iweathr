import React, { useState, useEffect } from 'react';
import { Button } from '/components/ui/button';
import { Card, CardContent, CardHeader } from '/components/ui/card';
import { Input } from '/components/ui/input';
import { MapPin, Droplets, Wind, Eye, Sun, Cloud, CloudRain, CloudSnow, Zap, ChevronLeft, Plus, MoreVertical, Info, Code, Heart, Globe, Mail, Github } from 'lucide-react';

interface WeatherData {
  location: string;
  country: string;
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  icon: string;
}

interface HourlyForecast {
  time: string;
  temperature: number;
  icon: string;
  condition: string;
}

interface DailyForecast {
  day: string;
  date: string;
  high: number;
  low: number;
  icon: string;
  condition: string;
  humidity: number;
  windSpeed: number;
}

const API_KEY = '281f8de2a7ba0e67d0a1b4291c7e12f6';

const WeatherApp: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'dashboard' | 'forecast' | 'about'>('welcome');
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [dailyForecast, setDailyForecast] = useState<DailyForecast[]>([]);
  const [otherCities, setOtherCities] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied' | 'unavailable'>('pending');
  const [locationError, setLocationError] = useState<string>('');
  const [showMenu, setShowMenu] = useState(false);

  const getWeatherIcon = (iconCode: string, condition: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      '01d': <Sun className="w-6 h-6 text-yellow-400" />,
      '01n': <Sun className="w-6 h-6 text-yellow-300" />,
      '02d': <Cloud className="w-6 h-6 text-gray-300" />,
      '02n': <Cloud className="w-6 h-6 text-gray-400" />,
      '03d': <Cloud className="w-6 h-6 text-gray-400" />,
      '03n': <Cloud className="w-6 h-6 text-gray-500" />,
      '04d': <Cloud className="w-6 h-6 text-gray-500" />,
      '04n': <Cloud className="w-6 h-6 text-gray-600" />,
      '09d': <CloudRain className="w-6 h-6 text-blue-400" />,
      '09n': <CloudRain className="w-6 h-6 text-blue-500" />,
      '10d': <CloudRain className="w-6 h-6 text-blue-400" />,
      '10n': <CloudRain className="w-6 h-6 text-blue-500" />,
      '11d': <Zap className="w-6 h-6 text-yellow-500" />,
      '11n': <Zap className="w-6 h-6 text-yellow-600" />,
      '13d': <CloudSnow className="w-6 h-6 text-blue-200" />,
      '13n': <CloudSnow className="w-6 h-6 text-blue-300" />,
    };
    
    return iconMap[iconCode] || <Sun className="w-6 h-6 text-yellow-400" />;
  };

  const fetchWeatherData = async (city?: string, lat?: number, lon?: number) => {
    setLoading(true);
    try {
      let currentUrl = '';
      let forecastUrl = '';
      
      if (city) {
        currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
        forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;
      } else if (lat && lon) {
        currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
      }

      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(currentUrl),
        fetch(forecastUrl)
      ]);

      const currentData = await currentResponse.json();
      const forecastData = await forecastResponse.json();

      const weather: WeatherData = {
        location: currentData.name,
        country: currentData.sys.country,
        temperature: Math.round(currentData.main.temp),
        condition: currentData.weather[0].main,
        description: currentData.weather[0].description,
        humidity: currentData.main.humidity,
        windSpeed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
        visibility: Math.round(currentData.visibility / 1000), // Convert m to km
        icon: currentData.weather[0].icon
      };

      setCurrentWeather(weather);

      // Process hourly forecast (next 24 hours)
      const hourly = forecastData.list.slice(0, 8).map((item: any) => ({
        time: new Date(item.dt * 1000).getHours() + ':00',
        temperature: Math.round(item.main.temp),
        icon: item.weather[0].icon,
        condition: item.weather[0].main
      }));

      setHourlyForecast(hourly);

      // Process daily forecast (next 7 days)
      const dailyMap = new Map();
      forecastData.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000);
        const day = date.toDateString();
        
        if (!dailyMap.has(day)) {
          dailyMap.set(day, {
            day: date.toLocaleDateString('en', { weekday: 'short' }),
            date: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            high: Math.round(item.main.temp_max),
            low: Math.round(item.main.temp_min),
            icon: item.weather[0].icon,
            condition: item.weather[0].main,
            humidity: item.main.humidity,
            windSpeed: Math.round(item.wind.speed * 3.6)
          });
        } else {
          const existing = dailyMap.get(day);
          existing.high = Math.max(existing.high, Math.round(item.main.temp_max));
          existing.low = Math.min(existing.low, Math.round(item.main.temp_min));
        }
      });

      setDailyForecast(Array.from(dailyMap.values()).slice(0, 7));

    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    setLocationError('');
    setLoading(true);

    if (!navigator.geolocation) {
      setLocationPermission('unavailable');
      setLocationError('Geolocation is not supported by this browser');
      fetchWeatherData('Kuala Lumpur'); // Fallback
      return;
    }

    // Check if permission is already granted
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        
        if (permission.state === 'granted') {
          setLocationPermission('granted');
          getCurrentLocation();
          return;
        } else if (permission.state === 'denied') {
          setLocationPermission('denied');
          setLocationError('Location access denied. Using default location.');
          fetchWeatherData('Kuala Lumpur');
          return;
        }
      } catch (error) {
        console.log('Permissions API not supported, trying direct geolocation');
      }
    }

    // Request location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationPermission('granted');
        fetchWeatherData(undefined, position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setLocationPermission('denied');
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied by user. Using default location.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable. Using default location.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timeout. Using default location.');
            break;
          default:
            setLocationError('An unknown error occurred. Using default location.');
            break;
        }
        fetchWeatherData('Kuala Lumpur'); // Fallback
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherData(undefined, position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Fallback to a default city
          fetchWeatherData('Kuala Lumpur');
        }
      );
    } else {
      fetchWeatherData('Kuala Lumpur');
    }
  };

  const addOtherCity = async () => {
    if (!searchCity.trim()) return;
    
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${searchCity}&appid=${API_KEY}&units=metric`
      );
      const data = await response.json();
      
      const cityWeather: WeatherData = {
        location: data.name,
        country: data.sys.country,
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6),
        visibility: Math.round(data.visibility / 1000),
        icon: data.weather[0].icon
      };

      setOtherCities(prev => [...prev, cityWeather]);
      setSearchCity('');
    } catch (error) {
      console.error('Error adding city:', error);
    }
  };

  useEffect(() => {
    if (currentScreen === 'dashboard' && !currentWeather) {
      requestLocationPermission();
    }
  }, [currentScreen]);

  useEffect(() => {
    // Add some default cities
    const defaultCities = ['New York', 'Tokyo', 'Paris'];
    defaultCities.forEach(city => {
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`)
        .then(res => res.json())
        .then(data => {
          const cityWeather: WeatherData = {
            location: data.name,
            country: data.sys.country,
            temperature: Math.round(data.main.temp),
            condition: data.weather[0].main,
            description: data.weather[0].description,
            humidity: data.main.humidity,
            windSpeed: Math.round(data.wind.speed * 3.6),
            visibility: Math.round(data.visibility / 1000),
            icon: data.weather[0].icon
          };
          setOtherCities(prev => {
            if (!prev.find(c => c.location === cityWeather.location)) {
              return [...prev, cityWeather];
            }
            return prev;
          });
        })
        .catch(err => console.error('Error loading default city:', err));
    });
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showMenu && !target.closest('.menu-container')) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  if (currentScreen === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm bg-gradient-to-br from-purple-500 to-blue-600 border-0 text-white overflow-hidden">
          <CardContent className="p-8 text-center">
            <div className="mb-8">
              <div className="relative mx-auto w-32 h-32 mb-6">
                <Cloud className="absolute inset-0 w-full h-full text-white/80" />
                <Sun className="absolute top-4 right-4 w-16 h-16 text-yellow-300" />
                <div className="absolute bottom-6 left-6">
                  <CloudRain className="w-8 h-8 text-blue-200" />
                </div>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold mb-2">Weather</h1>
            <h2 className="text-3xl font-bold mb-6">Forecasts</h2>
            
            <p className="text-white/80 mb-8 leading-relaxed">
              Get to know your weather maps and<br/>
              radar precipitation forecasts<br/>
              in the most updated way over here.
            </p>
            
            <Button
              onClick={() => {
                setCurrentScreen('dashboard');
                requestLocationPermission();
              }}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-full text-lg"
            >
              Get Start
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentScreen === 'forecast') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 p-4">
        <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentScreen('dashboard')}
              className="p-2"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">7-Day Forecasts</h2>
            <div className="relative menu-container">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-40">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentScreen('about');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-sm"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    About & Credits
                  </button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            <Card className="bg-gradient-to-r from-blue-400 to-purple-500 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">Tomorrow</p>
                    <div className="flex items-center mt-2">
                      <CloudRain className="w-8 h-8 mr-3" />
                      <div>
                        <div className="text-2xl font-bold">21Â°<span className="text-sm font-normal">/17Â°</span></div>
                        <p className="text-sm opacity-80">Thunderstorms</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="flex items-center mb-1">
                      <Droplets className="w-4 h-4 mr-1" />
                      <span>30%</span>
                    </div>
                    <div className="flex items-center mb-1">
                      <Wind className="w-4 h-4 mr-1" />
                      <span>20%</span>
                    </div>
                    <div className="flex items-center">
                      <Wind className="w-4 h-4 mr-1" />
                      <span>12 km/h</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {dailyForecast.map((day, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center flex-1">
                    <div className="w-12 text-sm text-gray-600 font-medium">
                      {index === 0 ? 'Today' : day.day}
                    </div>
                    <div className="flex items-center ml-4">
                      {getWeatherIcon(day.icon, day.condition)}
                      <span className="ml-2 text-sm text-gray-600">{day.condition}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{day.high}Â°/{day.low}Â°</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentScreen === 'about') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 p-4">
        <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentScreen('dashboard')}
              className="p-2"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">About & Credits</h2>
            <div className="w-8"></div>
          </CardHeader>

          <CardContent className="p-4 space-y-6">
            {/* App Info */}
            <Card className="bg-gradient-to-r from-blue-400 to-purple-500 text-white border-0">
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <Cloud className="w-16 h-16 mx-auto mb-2 text-white/90" />
                  <h3 className="text-xl font-bold">Weather Forecasts</h3>
                  <p className="text-sm opacity-80 mt-1">Version 1.0.0</p>
                </div>
                <p className="text-sm opacity-90 leading-relaxed">
                  A beautiful and intuitive weather app providing accurate forecasts 
                  and real-time weather information for locations worldwide.
                </p>
              </CardContent>
            </Card>

            {/* Developer Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Code className="w-5 h-5 mr-2" />
                Developer
              </h3>
              
              <Card className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      AI
                    </div>
                    <div className="ml-3">
                      <h4 className="font-semibold text-gray-800">Together AI Assistant</h4>
                      <p className="text-sm text-gray-600">Full-Stack Developer</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Crafted with modern web technologies to deliver an exceptional user experience.
                  </p>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex items-center">
                      <Github className="w-4 h-4 mr-1" />
                      GitHub
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Credits & Acknowledgments */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Heart className="w-5 h-5 mr-2 text-red-500" />
                Credits & Thanks
              </h3>

              <div className="space-y-3">
                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Globe className="w-8 h-8 mr-3 text-blue-500" />
                        <div>
                          <h4 className="font-medium text-gray-800">OpenWeatherMap</h4>
                          <p className="text-xs text-gray-500">Weather Data Provider</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-blue-500">
                        Visit
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Code className="w-8 h-8 mr-3 text-green-500" />
                        <div>
                          <h4 className="font-medium text-gray-800">Lucide React</h4>
                          <p className="text-xs text-gray-500">Beautiful Icons</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-blue-500">
                        Visit
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Wind className="w-8 h-8 mr-3 text-purple-500" />
                        <div>
                          <h4 className="font-medium text-gray-800">Tailwind CSS</h4>
                          <p className="text-xs text-gray-500">Styling Framework</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-blue-500">
                        Visit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Technical Details */}
            <Card className="bg-gray-50 border border-gray-200">
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-800 mb-3">Technical Stack</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-gray-600">React + TypeScript</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    <span className="text-gray-600">Tailwind CSS</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-600">Shadcn/ui</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-gray-600">OpenWeather API</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">
                Made with <Heart className="w-4 h-4 inline text-red-500" /> for weather enthusiasts
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Â© 2024 Weather Forecasts App. All rights reserved.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 p-4">
      <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm border-0">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <div className="flex items-center">
            <div className="relative">
              <MapPin className={`w-5 h-5 mr-2 ${
                locationPermission === 'granted' ? 'text-green-600' : 
                locationPermission === 'denied' ? 'text-red-500' : 
                'text-gray-600'
              }`} />
              {locationPermission === 'granted' && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </div>
            <div>
              <div className="flex items-center">
                <h2 className="font-semibold">{currentWeather?.location || 'Loading...'}</h2>
                {locationPermission === 'granted' && (
                  <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                    Live
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {currentWeather?.country || (locationPermission === 'denied' ? 'Default Location' : '')}
              </p>
            </div>
          </div>
          <div className="relative menu-container">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
            {showMenu && (
              <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-40">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentScreen('about');
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-sm"
                >
                  <Info className="w-4 h-4 mr-2" />
                  About & Credits
                </button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse mb-4">Loading weather data...</div>
              {locationPermission === 'pending' && (
                <p className="text-sm text-gray-500">Requesting location permission...</p>
              )}
            </div>
          ) : locationError ? (
            <div className="text-center py-4 mb-4">
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg mb-4">
                <p className="text-sm">{locationError}</p>
              </div>
              <div className="flex justify-center space-x-2">
                <Button onClick={requestLocationPermission} variant="outline" size="sm">
                  <MapPin className="w-4 h-4 mr-1" />
                  Try Again
                </Button>
                <Button onClick={() => setLocationError('')} variant="ghost" size="sm">
                  Dismiss
                </Button>
              </div>
            </div>
          ) : null}
          
          {currentWeather ? (
            <>
              {/* Main Weather Display */}
              <Card className="bg-gradient-to-br from-blue-400 to-purple-500 text-white border-0 mb-4">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Sun className="w-12 h-12 mr-4 text-yellow-300" />
                      <Cloud className="w-8 h-8 text-white/80" />
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold">{currentWeather.temperature}Â°</div>
                      <p className="text-sm opacity-80">Mostly</p>
                      <p className="text-sm opacity-80">{currentWeather.condition}</p>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div className="flex items-center">
                      <Droplets className="w-4 h-4 mr-1" />
                      <span>{currentWeather.humidity}%</span>
                      <span className="ml-1 opacity-60">Humidity</span>
                    </div>
                    <div className="flex items-center">
                      <Droplets className="w-4 h-4 mr-1" />
                      <span>20%</span>
                      <span className="ml-1 opacity-60">Rain</span>
                    </div>
                    <div className="flex items-center">
                      <Wind className="w-4 h-4 mr-1" />
                      <span>{currentWeather.windSpeed} km/h</span>
                      <span className="ml-1 opacity-60">Wind</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Today's Forecast */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">Today</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentScreen('forecast')}
                    className="text-blue-500 text-sm"
                  >
                    7-Day Forecasts â†’
                  </Button>
                </div>
                
                <div className="flex space-x-3 overflow-x-auto pb-2">
                  {hourlyForecast.map((hour, index) => (
                    <Card key={index} className="min-w-16 bg-blue-500 text-white border-0">
                      <CardContent className="p-3 text-center">
                        <p className="text-xs mb-2">{hour.time}</p>
                        {getWeatherIcon(hour.icon, hour.condition)}
                        <p className="text-sm font-semibold mt-1">{hour.temperature}Â°</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Other Cities */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">Other Cities</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addOtherCity}
                    className="p-2"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="mb-3">
                  <Input
                    placeholder="Search city..."
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addOtherCity()}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  {otherCities.map((city, index) => (
                    <Card key={index} className="bg-gradient-to-r from-blue-400 to-purple-400 text-white border-0">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getWeatherIcon(city.icon, city.condition)}
                            <div className="ml-3">
                              <h4 className="font-semibold">{city.location}</h4>
                              <p className="text-xs opacity-80">{city.condition}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{city.temperature}Â°</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Unable to load weather data</p>
              <div className="flex justify-center space-x-2">
                <Button onClick={requestLocationPermission} variant="outline">
                  <MapPin className="w-4 h-4 mr-2" />
                  Enable Location
                </Button>
                <Button onClick={() => fetchWeatherData('Kuala Lumpur')} variant="ghost">
                  Use Default
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WeatherApp;