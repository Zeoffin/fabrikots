// WebSocket URL configuration for development and production
const getWebSocketURL = () => {
    if (import.meta.env.PROD) {
        // In production, use wss:// for HTTPS and construct from current host
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/ws/game`;
    } else {
        // Development
        return "ws://127.0.0.1:8000/ws/game";
    }
};

export const pointsSocket = getWebSocketURL();