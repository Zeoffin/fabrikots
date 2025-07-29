# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a real-time quiz application called "Fabrikots" built with:
- **Backend**: Django 5.0.3 with Django Channels for WebSocket support
- **Frontend**: React 18 with TypeScript and Vite
- **Database**: SQLite3 
- **Real-time**: WebSocket connections via Django Channels with Redis backend
- **Authentication**: Django session-based authentication

The application allows an admin to present quiz questions to multiple users in real-time, with live scoring and timer functionality.

## User Roles
- The user 'markuss' is the admin and has some additional things to control the quizz show

## Development Commands

### Backend (Django)
```bash
# Start development server
python manage.py runserver

# Run database migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start Redis server (required for WebSocket functionality)
redis-server

# Install Python dependencies
pip install -r requirements.txt
```

### Frontend (React/TypeScript)
```bash
cd frontend

# Install dependencies
npm install

# Start development server (runs on localhost:5173)
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

## Architecture Overview

### Backend Structure
- **fabrikots/**: Main Django project configuration
  - `settings.py`: Contains CORS settings for frontend (localhost:5173), Redis configuration for channels
  - `asgi.py`: ASGI configuration for WebSocket support
- **fbkquizz/**: Core quiz application
  - `models.py`: Question, GlobalSettings, UserSettings models
  - `consumers.py`: WebSocket consumer for real-time quiz functionality 
  - `views.py`: REST API endpoints for question data and user info
  - `routing.py`: WebSocket URL routing
- **user_api/**: User authentication and management

### Frontend Structure
- **src/pages/**: Main application pages (Home, Join, Admin, Terms)
- **src/components/**: Reusable components (UserPoints, TopBar, Loading, Logout)
- **src/questions/**: Question type components (Info, MultipleChoice)
- **WebSockets.tsx**: WebSocket endpoint configuration
- **AxiosInstance.tsx**: Axios configuration for API calls

### Key Models
- **Question**: Stores quiz questions with types ('info', 'multipleChoice'), answers (JSON), time limits
- **GlobalSettings**: Manages current active question and timer state
- **UserSettings**: Tracks user points, activity status, and answers

### WebSocket Communication
- Endpoint: `ws://127.0.0.1:8000/ws/game`
- Handles: Point updates, question navigation, timer synchronization
- Real-time updates for all connected clients when questions change or timer ticks

## Development Notes

- Frontend development server runs on port 5173
- Backend API runs on port 8000
- Redis must be running on 127.0.0.1:6379 for WebSocket functionality
- CORS is configured to allow frontend at localhost:5173 and 127.0.0.1:5173
- Session-based authentication is used - users must be logged in
- Admin users have additional controls for question navigation and timer management

## Common Development Tasks

### Adding New Question Types
1. Add new type to `Question.TYPES` in `fbkquizz/models.py`
2. Create corresponding React component in `frontend/src/questions/`
3. Update `renderQuestion()` switch statement in `Home.tsx`

### Database Changes
Always create and run migrations after model changes:
```bash
python manage.py makemigrations
python manage.py migrate
```

### WebSocket Debugging
- Check Redis connection in Django settings
- Verify WebSocket URL in `frontend/WebSockets.tsx`
- Monitor WebSocket messages in browser developer tools