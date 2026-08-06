import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

console.log('🚀 main.tsx is executing...');

const rootElement = document.getElementById('root');
console.log('📦 Root element:', rootElement);

if (rootElement) {
    console.log('✅ Root element found, rendering App...');
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
    console.log('✅ App rendered!');
} else {
    console.error('❌ Root element NOT found!');
}