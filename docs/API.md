# MedScheduleAI Pro API Documentation

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://api.medscheduleai.com/api`

## Authentication
All API endpoints (except authentication) require a valid JWT token in the Authorization header: 

Authorization: Bearer <token>


## Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout

### Staff Management
- `GET /staff` - List all staff members
- `POST /staff` - Create new staff member
- `GET /staff/:id` - Get staff member details
- `PUT /staff/:id` - Update staff member
- `DELETE /staff/:id` - Delete staff member

### Schedule Management
- `GET /schedules` - List schedules
- `POST /schedules` - Create schedule
- `PUT /schedules/:id` - Update schedule
- `DELETE /schedules/:id` - Delete schedule
- `POST /schedules/generate` - AI generate schedule

### AI Services
- `POST /ai/chat` - Natural language queries
- `POST /ai/optimize` - Optimize existing schedule
- `GET /ai/insights` - Get AI insights

## Response Format
All responses follow this format:
```json
{
  "success": true,
  "data": {...},
  "meta": {...}
}