import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Keep window.storage for backward compatibility with App's window.storage.xxx calls
window.storage={
  get:async k=>{const r=await fetch(`/api/store/${encodeURIComponent(k)}`);if(!r.ok)throw new Error("Key not found");return r.json();},
  set:async(k,v)=>{const s=typeof v==="string"?v:JSON.stringify(v);const r=await fetch(`/api/store/${encodeURIComponent(k)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({value:s})});return r.json();},
  delete:async k=>{const r=await fetch(`/api/store/${encodeURIComponent(k)}`,{method:"DELETE"});return r.json();},
  list:async p=>{const r=await fetch(`/api/store${p?`?prefix=${encodeURIComponent(p)}`:""}`);const d=await r.json();return d;}
};

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(App)
);
