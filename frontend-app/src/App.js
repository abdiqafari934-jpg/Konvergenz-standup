import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

// This is your live Render backend link
const API_BASE = "https://konvergenz-backend.onrender.com";

function App() {
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState([]);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({ author: '', yesterday: '', today: '', blockers: '', has_blocker: false });
  const [weather, setWeather] = useState({ temp: '--' });
  const [error, setError] = useState(null);

  const fetchData = () => {
    axios.get(`${API_BASE}/standups`)
      .then(res => { setPosts(res.data); setError(null); })
      .catch(() => setError("The server is waking up or offline. Please wait..."));
    
    axios.get(`${API_BASE}/standups/stats`)
      .then(res => setStats(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    axios.get('https://api.open-meteo.com/v1/forecast?latitude=-1.28&longitude=36.82&current_weather=true')
      .then(res => setWeather({ temp: res.data.current_weather.temperature }))
      .catch(() => console.log("Weather API failed"));
    
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('author', formData.author);
    data.append('yesterday', formData.yesterday);
    data.append('today', formData.today);
    data.append('blockers', formData.blockers);
    data.append('has_blocker', formData.has_blocker);
    data.append('weather', weather.temp + "°C");
    if (file) data.append('file', file);

    axios.post(`${API_BASE}/standups`, data)
      .then(() => {
        fetchData();
        setFormData({ author: '', yesterday: '', today: '', blockers: '', has_blocker: false });
        setFile(null);
        alert("Standup Submitted Successfully!");
      })
      .catch(() => alert("Failed to submit. Please check your connection."));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <header style={{ background: '#0056b3', color: 'white', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
        <h1 style={{margin: 0}}>Konvergenz Standup Portal | Nairobi: {weather.temp}°C ☀️</h1>
      </header>

      {error && (
        <div style={{ background: '#ff4d4d', color: 'white', padding: '10px', borderRadius: '5px', marginBottom: '20px', textAlign: 'center' }}>
          <strong>⚠️ {error}</strong>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* SUBMISSION FORM */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3 style={{marginTop: 0}}>Submit Daily Update</h3>
          <form onSubmit={handleSubmit}>
            <input style={s} placeholder="Your Name" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} required />
            <textarea style={s} rows="3" placeholder="Yesterday: What did you do?" value={formData.yesterday} onChange={e => setFormData({...formData, yesterday: e.target.value})} required />
            <textarea style={s} rows="3" placeholder="Today: What are you working on?" value={formData.today} onChange={e => setFormData({...formData, today: e.target.value})} required />
            <textarea style={s} rows="2" placeholder="Blockers: Any issues?" value={formData.blockers} onChange={e => setFormData({...formData, blockers: e.target.value})} />
            
            <label style={{ color: formData.has_blocker ? 'red' : 'black', fontWeight: 'bold' }}>
                <input type="checkbox" checked={formData.has_blocker} onChange={e => setFormData({...formData, has_blocker: e.target.checked})} /> 
                I have a blocker
            </label><br/><br/>
            
            <label style={{ fontSize: '12px' }}>Attach file/screenshot:</label><br/>
            <input type="file" onChange={e => setFile(e.target.files[0])} style={{ marginBottom: '15px' }} /><br/>
            
            <button type="submit" style={{ width: '100%', padding: '12px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                Submit Standup
            </button>
          </form>
        </div>

        {/* CHART SECTION */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3 style={{marginTop: 0}}>Team Productivity Chart</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer>
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="posts" name="Total Updates" fill="#0056b3" />
                <Bar dataKey="blockers" name="Blockers Flagged" fill="#ff4d4d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ACTIVITY FEED */}
      <div style={{ marginTop: '30px' }}>
        <h3>Live Activity Feed</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '15px' }}>
            {posts.map((p, i) => (
              <div key={i} style={{ background: 'white', padding: '15px', borderRadius: '8px', borderLeft: p.has_blocker ? '10px solid #ff4d4d' : '10px solid #28a745', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                    <strong style={{ color: '#0056b3' }}>{p.author}</strong>
                    <small style={{ color: '#666' }}>{p.timestamp} | {p.weather}</small>
                </div>
                <div style={{ marginTop: '10px' }}>
                    <p style={{ fontSize: '14px', margin: '5px 0' }}><strong>Yesterday:</strong> {p.yesterday}</p>
                    <p style={{ fontSize: '14px', margin: '5px 0' }}><strong>Today:</strong> {p.today}</p>
                    {p.has_blocker && (
                        <p style={{ fontSize: '14px', color: '#ff4d4d', margin: '8px 0 0 0', fontWeight: 'bold' }}>
                            ⚠️ Blocker: {p.blockers || "Assistance required"}
                        </p>
                    )}
                </div>
                {p.file && (
                    <div style={{ marginTop: '12px' }}>
                        <a href={`${API_BASE}/uploads/${p.file}`} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#0056b3', textDecoration: 'underline' }}>
                            View Attachment
                        </a>
                    </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

const s = { width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box', fontFamily: 'inherit' };

export default App;
