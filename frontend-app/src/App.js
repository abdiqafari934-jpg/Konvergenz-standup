import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState([]);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({ author: '', yesterday: '', today: '', blockers: '', has_blocker: false });
  const [weather, setWeather] = useState({ temp: '--' });

  const fetchData = () => {
    axios.get(`${API_BASE}/standups`).then(res => setPosts(res.data)).catch(() => {});
    axios.get(`${API_BASE}/standups/stats`).then(res => setStats(res.data)).catch(() => {});
  };

  useEffect(() => {
    axios.get('https://api.open-meteo.com/v1/forecast?latitude=-1.28&longitude=36.82&current_weather=true')
      .then(res => setWeather({ temp: res.data.current_weather.temperature }));
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append('weather', weather.temp + "°C"); // Sending the weather
    if (file) data.append('file', file);

    axios.post(`${API_BASE}/standups`, data).then(() => {
      fetchData();
      setFormData({ author: '', yesterday: '', today: '', blockers: '', has_blocker: false });
      setFile(null);
      alert("Submitted!");
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f0f2f5' }}>
      <header style={{ background: '#0056b3', color: 'white', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
        <h1>Konvergenz Standup Portal | Nairobi: {weather.temp}°C</h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px' }}>
          <h3>Submit Standup</h3>
          <form onSubmit={handleSubmit}>
            <input style={s} placeholder="Name" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} required />
            <textarea style={s} placeholder="Yesterday" value={formData.yesterday} onChange={e => setFormData({...formData, yesterday: e.target.value})} />
            <textarea style={s} placeholder="Today" value={formData.today} onChange={e => setFormData({...formData, today: e.target.value})} />
            <textarea style={s} placeholder="Blockers" value={formData.blockers} onChange={e => setFormData({...formData, blockers: e.target.value})} />
            <label><input type="checkbox" checked={formData.has_blocker} onChange={e => setFormData({...formData, has_blocker: e.target.checked})} /> I am blocked</label><br/><br/>
            <input type="file" onChange={e => setFile(e.target.files[0])} /><br/><br/>
            <button type="submit" style={{width:'100%', padding:'10px', background:'#0056b3', color:'white', border:'none'}}>Submit</button>
          </form>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '10px' }}>
          <h3>Productivity Chart</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer><BarChart data={stats}><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="posts" fill="#0056b3"/><Bar dataKey="blockers" fill="red"/></BarChart></ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Activity Feed</h3>
        {posts.map((p, i) => (
          <div key={i} style={{ background: 'white', margin: '10px 0', padding: '15px', borderLeft: p.has_blocker ? '5px solid red' : '5px solid green' }}>
            <strong>{p.author}</strong> - <small>{p.timestamp} | {p.weather}</small>
            <p>Today: {p.today}</p>
            {p.file && <a href={`${API_BASE}/uploads/${p.file}`} target="_blank" rel="noreferrer">View File</a>}
          </div>
        ))}
      </div>
    </div>
  );
}
const s = { width: '100%', padding: '8px', marginBottom: '10px' };
export default App;