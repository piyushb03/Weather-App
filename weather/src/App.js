import React, { useState, useEffect } from 'react';
import './App.css';
import { WiStrongWind, WiCloud, WiHumidity, WiBarometer, WiSunrise, WiSunset, WiThermometer } from 'react-icons/wi';

const WEATHER_API_KEY = 'bd609b3cfd4916b1f6cc5fc0deb678f2';

function App() {
  const [city, setCity] = useState('New Delhi');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [feedback, setFeedback] = useState({ name: '', email: '', message: '' });
  const [feedbackStatus, setFeedbackStatus] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('weather_search_history');
    if (stored) {
      setHistory(JSON.parse(stored));
    }
    // Fetch weather for default city on first load
    fetchWeather('New Delhi');
  }, []);

  useEffect(() => {
    localStorage.setItem('weather_search_history', JSON.stringify(history));
  }, [history]);

  const fetchWeather = async (cityName) => {
    setLoading(true);
    setError('');
    setWeather(null);
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${WEATHER_API_KEY}&units=metric`
      );
      if (!res.ok) throw new Error('City not found');
      const data = await res.json();
      const weatherData = {
        temp: data.main.temp,
        temp_min: data.main.temp_min,
        temp_max: data.main.temp_max,
        pressure: data.main.pressure,
        humidity: data.main.humidity,
        wind_speed: data.wind.speed,
        wind_deg: data.wind.deg,
        sunrise: data.sys.sunrise,
        sunset: data.sys.sunset,
        condition: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        city: data.name,
        country: data.sys.country,
      };
      setWeather(weatherData);
      setHistory(prev => {
        const exists = prev.find(item => item.city === weatherData.city && item.country === weatherData.country);
        if (exists) return prev;
        return [weatherData, ...prev].slice(0, 5);
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!city.trim()) return;
    await fetchWeather(city);
  };

  const handleHistoryClick = (item) => {
    setWeather(item);
    setCity(item.city);
  };

  const handleFeedbackChange = (e) => {
    const { name, value } = e.target;
    setFeedback(prev => ({ ...prev, [name]: value }));
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackStatus('');
    try {
      const res = await fetch('https://formspree.io/f/myzjqonw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: feedback.name,
          email: feedback.email,
          message: feedback.message
        })
      });
      if (res.ok) {
        setFeedback({ name: '', email: '', message: '' });
        setFeedbackStatus('Thank you for your feedback!');
      } else {
        setFeedbackStatus('Failed to send feedback. Please try again.');
      }
    } catch {
      setFeedbackStatus('Failed to send feedback. Please try again.');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to get emoji/icon for weather condition
  const getWeatherEmoji = (condition) => {
    const cond = condition.toLowerCase();
    if (cond.includes('clear')) return '☀️';
    if (cond.includes('cloud')) return '☁️';
    if (cond.includes('rain')) return '🌧️';
    if (cond.includes('drizzle')) return '🌦️';
    if (cond.includes('thunder')) return '⛈️';
    if (cond.includes('snow')) return '❄️';
    if (cond.includes('mist') || cond.includes('fog') || cond.includes('haze')) return '🌫️';
    if (cond.includes('smoke')) return '💨';
    if (cond.includes('tornado')) return '🌪️';
    return null;
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-title"><span className="weather-emoji">🌥️</span>Weather App</div>
      </nav>
      <header className="app-header">
        <div className="search-section">
          <input
            type="text"
            placeholder="Enter city name..."
            value={city}
            onChange={e => setCity(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>
      </header>
      <main className="main-content main-content-row">
        <section className="weather-section">
          <h2>Current Weather</h2>
          {error && <div style={{color: 'red', marginBottom: '1rem'}}>{error}</div>}
          {weather ? (
            <div className="weather-info">
              <h3>{weather.city}, {weather.country}</h3>
              <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                    <span style={{fontSize: '2.5rem', fontWeight: 'bold'}}>{Math.round(weather.temp)}°C</span>
                    {/* Show emoji if matched, else fallback to OpenWeatherMap icon */}
                    {getWeatherEmoji(weather.description) ? (
                      <span style={{fontSize: '3rem'}}>{getWeatherEmoji(weather.description)}</span>
                    ) : (
                      <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt={weather.condition} />
                    )}
                  </div>
                  {/* Min/Max below icon */}
                  <div style={{fontSize: '1.1rem', color: '#2193b0', fontWeight: 600, margin: '0.3rem 0 0.7rem 0'}}>
                    Min: {Math.round(weather.temp_min)}°C | Max: {Math.round(weather.temp_max)}°C
                  </div>
                  <div style={{textTransform: 'capitalize'}}>{weather.description}</div>
                  {/* Weather metrics row with icons */}
                  <div className="weather-metrics-row">
                    <div className="weather-metric">
                      <WiStrongWind className="weather-metric-icon" />
                      <div className="weather-metric-label">Wind</div>
                      <div className="weather-metric-value">{weather.wind_speed} m/s</div>
                    </div>
                    <div className="weather-metric">
                      <WiCloud className="weather-metric-icon" />
                      <div className="weather-metric-label">Clouds</div>
                      <div className="weather-metric-value">{weather.description.toLowerCase().includes('cloud') ? weather.humidity + ' %' : '--'}</div>
                    </div>
                    <div className="weather-metric">
                      <WiHumidity className="weather-metric-icon" />
                      <div className="weather-metric-label">Humidity</div>
                      <div className="weather-metric-value">{weather.humidity} %</div>
                    </div>
                  </div>
                  {/* Additional metrics row with icons, no Min/Max */}
                  <div className="weather-metrics-row">
                    <div className="weather-metric">
                      <WiBarometer className="weather-metric-icon" />
                      <div className="weather-metric-label">Pressure</div>
                      <div className="weather-metric-value">{weather.pressure} hPa</div>
                    </div>
                    <div className="weather-metric">
                      <WiSunrise className="weather-metric-icon" />
                      <div className="weather-metric-label">Sunrise</div>
                      <div className="weather-metric-value">{formatTime(weather.sunrise)}</div>
                    </div>
                    <div className="weather-metric">
                      <WiSunset className="weather-metric-icon" />
                      <div className="weather-metric-label">Sunset</div>
                      <div className="weather-metric-value">{formatTime(weather.sunset)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{color: '#888'}}>Search for a city to see the weather.</div>
          )}
        </section>
        {history.length > 0 && (
          <section className="history-section">
            <h2>Previous Searches</h2>
            <ul className="history-list">
              {history.map((item, idx) => (
                <li key={idx} className="history-item" onClick={() => handleHistoryClick(item)}>
                  <span>{item.city}, {item.country}</span>
                  <span style={{marginLeft: '1rem'}}>{Math.round(item.temp)}°C</span>
                  <img src={`https://openweathermap.org/img/wn/${item.icon}.png`} alt={item.condition} style={{verticalAlign: 'middle'}} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      {/* Feedback Form Section */}
      <section className="feedback-section">
        <h2>Submit your feedback!</h2>
        <form className="feedback-form" onSubmit={handleFeedbackSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={feedback.name}
            onChange={handleFeedbackChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={feedback.email}
            onChange={handleFeedbackChange}
            required
          />
          <textarea
            name="message"
            placeholder="Your Feedback"
            value={feedback.message}
            onChange={handleFeedbackChange}
            required
            rows={4}
          />
          <button type="submit">Send Feedback</button>
        </form>
        {feedbackStatus && <div className="feedback-status">{feedbackStatus}</div>}
      </section>
      <footer className="footer">
        <div className="footer-social">
          <a href="https://github.com/piyushb03" target="_blank" rel="noopener noreferrer">GitHub</a> |
          <a href="https://linkedin.com/in/piyush-baghel" target="_blank" rel="noopener noreferrer">LinkedIn</a> |
          <a href="https://instagram.com/piyushbaghel03" target="_blank" rel="noopener noreferrer">Instagram</a>
        </div>
        <div>
          &copy; 2025 Weather App. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default App;
