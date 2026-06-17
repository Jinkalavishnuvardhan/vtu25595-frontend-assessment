import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import './index.css';

const mountApp = () => {
	let container = document.getElementById('root');
	if (!container) {
		console.warn('Root container not found; creating one dynamically');
		container = document.createElement('div');
		container.id = 'root';
		document.body.appendChild(container);
	}
	const root = ReactDOM.createRoot(container);
	root.render(
		<ErrorBoundary>
			<App />
		</ErrorBoundary>
	);
	return true;
};

if (!mountApp()) {
	window.addEventListener('DOMContentLoaded', () => {
		if (!mountApp()) {
			console.error('Failed to mount app: #root element still missing after DOMContentLoaded');
		}
	});
}