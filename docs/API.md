# MedScheduleAI Pro - API Documentation

## 📋 Table of Contents
- [API Overview](#api-overview)
- [Authentication](#authentication)
- [Request/Response Format](#requestresponse-format)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Authentication Endpoints](#authentication-endpoints)
- [User Management](#user-management)
- [Organization Management](#organization-management)
- [Staff Management](#staff-management)
- [Schedule Management](#schedule-management)
- [AI Services](#ai-services)
- [Analytics & Reporting](#analytics--reporting)
- [Notification Services](#notification-services)
- [WebSocket Events](#websocket-events)
- [Webhooks](#webhooks)
- [SDK & Code Examples](#sdk--code-examples)

---

## 🌐 API Overview

The MedScheduleAI Pro API is a RESTful web service that enables healthcare organizations to manage staff scheduling with AI-powered optimization. All endpoints return JSON and require HTTPS in production.

### Base URLs
- **Development**: `http://localhost:5000/api/v1`
- **Staging**: `https://staging-api.medscheduleai.com/api/v1`
- **Production**: `https://api.medscheduleai.com/api/v1`

### API Versioning
- Current version: `v1`
- Version specified in URL path: `/api/v1/`
- Backward compatibility maintained for 12 months

### Content Types
- **Request**: `application/json`
- **Response**: `application/json`
- **File uploads**: `multipart/form-data`

---

## 🔐 Authentication

### JWT Token-Based Authentication
All API endpoints (except authentication) require a valid JWT token in the Authorization header.

```http
Authorization: Bearer <access_token>
```

### Token Structure
```typescript
interface JWTPayload {
  userId: string;
  organizationId: string;
  role: 'admin' | 'manager' | 'staff';
  permissions: string[];
  iat: number;  // Issued at
  exp: number;  // Expires at (15 minutes)
}
```

### Token Refresh Flow
```typescript
// Access token expires in 15 minutes
// Refresh token expires in 7 days
// Use refresh token to get new access token
POST /api/v1/auth/refresh
{
  "refreshToken": "refresh_token_here"
}
```

---

## 📝 Request/Response Format

### Standard Request Format
```json
{
  "data": {
    // Request payload
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2024-01-20T10:30:00Z"
  }
}
```

### Standard Response Format
```json
{
  "success": true,
  "data": {
    // Response payload
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2024-01-20T10:30:00Z",
    "version": "1.0.0",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed for the request",
    "details": {
      "field": "email",
      "constraint": "Must be a valid email address"
    }
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2024-01-20T10:30:00Z"
  }
}
```

---

## 🚦 Rate Limiting

### Rate Limits by Endpoint Type
- **Authentication**: 5 requests/minute per IP
- **Standard API**: 100 requests/minute per user
- **AI Services**: 10 requests/minute per organization
- **File Upload**: 20 requests/hour per user
- **Webhooks**: 1000 requests/hour per organization

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642681200
X-RateLimit-Window: 60
```

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Try again later.",
    "details": {
      "retryAfter": 30
    }
  }
}
```

---

## ❌ Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

### Error Codes
| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_ERROR` | Invalid or expired token |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist |
| `CONFLICT_ERROR` | Resource conflict (e.g., scheduling conflict) |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `AI_SERVICE_ERROR` | AI service unavailable |
| `DATABASE_ERROR` | Database operation failed |
| `EXTERNAL_SERVICE_ERROR` | Third-party service error |

---

## 🔑 Authentication Endpoints

### POST /auth/register
Register a new user and organization.

**Request:**
```json
{
  "user": {
    "email": "admin@clinic.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  },
  "organization": {
    "name": "Downtown Medical Clinic",
    "type": "clinic",
    "timezone": "America/New_York"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "admin@clinic.com",
      "role": "admin",
      "organizationId": "org_456"
    },
    "organization": {
      "id": "org_456",
      "name": "Downtown Medical Clinic"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "refresh_token_here",
      "expiresIn": 900
    }
  }
}
```

### POST /auth/login
Authenticate user and get access tokens.

**Request:**
```json
{
  "email": "admin@clinic.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "admin@clinic.com",
      "role": "admin",
      "organizationId": "org_456",
      "profile": {
        "firstName": "John",
        "lastName": "Doe"
      }
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "refresh_token_here",
      "expiresIn": 900
    }
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token",
    "expiresIn": 900
  }
}
```

### POST /auth/logout
Logout user and invalidate tokens.

**Request:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Successfully logged out"
  }
}
```

### POST /auth/forgot-password
Request password reset.

**Request:**
```json
{
  "email": "admin@clinic.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent"
  }
}
```

### POST /auth/reset-password
Reset password with token.

**Request:**
```json
{
  "token": "reset_token_here",
  "newPassword": "NewSecurePass123!"
}
```

---

## 👤 User Management

### GET /users/profile
Get current user profile.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "admin@clinic.com",
    "role": "admin",
    "organizationId": "org_456",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "timezone": "America/New_York"
    },
    "preferences": {
      "notifications": {
        "email": true,
        "sms": false,
        "push": true
      },
      "theme": "light",
      "language": "en"
    },
    "lastLogin": "2024-01-20T10:30:00Z"
  }
}
```

### PUT /users/profile
Update user profile.

**Request:**
```json
{
  "profile": {
    "firstName": "John",
    "lastName": "Smith",
    "phone": "+1234567890",
    "timezone": "America/New_York"
  },
  "preferences": {
    "notifications": {
      "email": true,
      "sms": true,
      "push": true
    }
  }
}
```

### GET /users
List organization users (admin/manager only).

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `role` (string): Filter by role
- `search` (string): Search by name or email

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_123",
      "email": "admin@clinic.com",
      "role": "admin",
      "profile": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "isActive": true,
      "lastLogin": "2024-01-20T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "totalPages": 2
    }
  }
}
```

### POST /users
Create new user (admin only).

**Request:**
```json
{
  "email": "nurse@clinic.com",
  "password": "TempPass123!",
  "role": "staff",
  "profile": {
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+1234567891"
  },
  "sendWelcomeEmail": true
}
```

---

## 🏢 Organization Management

### GET /organizations/current
Get current organization details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "org_456",
    "name": "Downtown Medical Clinic",
    "type": "clinic",
    "settings": {
      "timezone": "America/New_York",
      "businessHours": {
        "monday": {"start": "08:00", "end": "18:00"},
        "tuesday": {"start": "08:00", "end": "18:00"},
        "wednesday": {"start": "08:00", "end": "18:00"},
        "thursday": {"start": "08:00", "end": "18:00"},
        "friday": {"start": "08:00", "end": "18:00"},
        "saturday": {"start": "09:00", "end": "14:00"},
        "sunday": {"closed": true}
      },
      "schedulingRules": {
        "minShiftHours": 4,
        "maxShiftHours": 12,
        "minRestBetweenShifts": 8,
        "maxConsecutiveDays": 6
      }
    },
    "subscription": {
      "plan": "pro",
      "status": "active",
      "expiresAt": "2024-12-31T23:59:59Z"
    },
    "stats": {
      "totalStaff": 25,
      "activeUsers": 20,
      "schedulesThisMonth": 156
    }
  }
}
```

### PUT /organizations/current
Update organization settings (admin only).

**Request:**
```json
{
  "name": "Downtown Medical Clinic Updated",
  "settings": {
    "timezone": "America/New_York",
    "businessHours": {
      "monday": {"start": "07:00", "end": "19:00"}
    },
    "schedulingRules": {
      "minShiftHours": 6,
      "maxShiftHours": 12
    }
  }
}
```

---

## 👥 Staff Management

### GET /staff
List all staff members.

**Query Parameters:**
- `page`, `limit`: Pagination
- `department`: Filter by department
- `role`: Filter by role
- `search`: Search by name
- `includeInactive`: Include inactive staff (default: false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "staff_789",
      "employeeId": "EMP001",
      "personalInfo": {
        "firstName": "Dr. Sarah",
        "lastName": "Johnson",
        "email": "sarah.johnson@clinic.com",
        "phone": "+1234567892"
      },
      "employment": {
        "role": "doctor",
        "department": "emergency",
        "hireDate": "2023-06-01",
        "employmentType": "full_time",
        "maxHoursPerWeek": 40
      },
      "availability": {
        "weeklySchedule": {
          "monday": {"available": true, "start": "08:00", "end": "18:00"},
          "tuesday": {"available": true, "start": "08:00", "end": "18:00"},
          "wednesday": {"available": false},
          "thursday": {"available": true, "start": "08:00", "end": "18:00"},
          "friday": {"available": true, "start": "08:00", "end": "18:00"},
          "saturday": {"available": false},
          "sunday": {"available": false}
        },
        "blackoutDates": ["2024-02-15", "2024-02-16"],
        "preferredShifts": ["morning", "day"]
      },
      "qualifications": {
        "certifications": ["MD", "Emergency Medicine Board Certification"],
        "specializations": ["Emergency Medicine", "Trauma Care"],
        "languages": ["English", "Spanish"]
      },
      "isActive": true,
      "createdAt": "2023-06-01T00:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "totalPages": 2
    }
  }
}
```

### GET /staff/:id
Get staff member details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "staff_789",
    "employeeId": "EMP001",
    "personalInfo": {
      "firstName": "Dr. Sarah",
      "lastName": "Johnson",
      "email": "sarah.johnson@clinic.com",
      "phone": "+1234567892",
      "emergencyContact": {
        "name": "John Johnson",
        "relationship": "spouse",
        "phone": "+1234567893"
      }
    },
    "employment": {
      "role": "doctor",
      "department": "emergency",
      "hireDate": "2023-06-01",
      "employmentType": "full_time",
      "maxHoursPerWeek": 40,
      "hourlyRate": 85.00
    },
    "availability": {
      "weeklySchedule": {
        // ... weekly availability
      },
      "blackoutDates": ["2024-02-15", "2024-02-16"],
      "preferredShifts": ["morning", "day"],
      "maxConsecutiveDays": 5
    },
    "qualifications": {
      "certifications": [
        {
          "name": "MD",
          "issuer": "Medical Board",
          "expiryDate": "2025-12-31"
        }
      ],
      "specializations": ["Emergency Medicine"],
      "languages": ["English", "Spanish"]
    },
    "aiPreferences": {
      "autoSchedule": true,
      "workloadPreference": "moderate",
      "notificationPreferences": {
        "scheduleChanges": true,
        "shiftReminders": true
      }
    },
    "stats": {
      "hoursThisMonth": 160,
      "overtimeThisMonth": 8,
      "schedulesCompleted": 45,
      "averageRating": 4.8
    }
  }
}
```

### POST /staff
Create new staff member (admin/manager only).

**Request:**
```json
{
  "employeeId": "EMP002",
  "personalInfo": {
    "firstName": "Nurse",
    "lastName": "Williams",
    "email": "williams@clinic.com",
    "phone": "+1234567894"
  },
  "employment": {
    "role": "nurse",
    "department": "icu",
    "hireDate": "2024-01-15",
    "employmentType": "full_time",
    "maxHoursPerWeek": 36
  },
  "availability": {
    "weeklySchedule": {
      "monday": {"available": true, "start": "07:00", "end": "19:00"},
      "tuesday": {"available": true, "start": "07:00", "end": "19:00"},
      "wednesday": {"available": true, "start": "07:00", "end": "19:00"},
      "thursday": {"available": false},
      "friday": {"available": false},
      "saturday": {"available": true, "start": "07:00", "end": "19:00"},
      "sunday": {"available": true, "start": "07:00", "end": "19:00"}
    }
  },
  "qualifications": {
    "certifications": ["RN", "BLS", "ACLS"],
    "specializations": ["Critical Care"],
    "languages": ["English"]
  }
}
```

### PUT /staff/:id
Update staff member (admin/manager or self).

**Request:**
```json
{
  "personalInfo": {
    "phone": "+1234567895"
  },
  "availability": {
    "blackoutDates": ["2024-02-20", "2024-02-21"]
  },
  "aiPreferences": {
    "autoSchedule": false
  }
}
```

### DELETE /staff/:id
Deactivate staff member (admin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Staff member deactivated successfully"
  }
}
```

---

## 📅 Schedule Management

### GET /schedules
List schedules with filters.

**Query Parameters:**
- `startDate` (date): Filter from date (ISO format)
- `endDate` (date): Filter to date (ISO format)
- `staffId` (string): Filter by staff member
- `department` (string): Filter by department
- `status` (string): Filter by status
- `page`, `limit`: Pagination

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "schedule_101",
      "staffId": "staff_789",
      "staff": {
        "id": "staff_789",
        "name": "Dr. Sarah Johnson",
        "role": "doctor",
        "department": "emergency"
      },
      "shiftDetails": {
        "date": "2024-01-22",
        "startTime": "08:00",
        "endTime": "18:00",
        "shiftType": "regular",
        "department": "emergency",
        "location": "Main Campus"
      },
      "status": "confirmed",
      "assignedBy": {
        "userId": "user_123",
        "method": "ai_generated",
        "timestamp": "2024-01-20T10:30:00Z"
      },
      "aiMetadata": {
        "confidenceScore": 0.92,
        "optimizationFactors": ["workload_balance", "staff_preference"],
        "alternatives": 2
      },
      "approvals": {
        "staffApproved": true,
        "managerApproved": true,
        "approvedAt": "2024-01-20T14:30:00Z"
      },
      "notes": "Covering for Dr. Smith",
      "createdAt": "2024-01-20T10:30:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 156,
      "totalPages": 4
    },
    "summary": {
      "totalHours": 1248,
      "overtimeHours": 64,
      "conflictsDetected": 2,
      "staffCoverage": 0.95
    }
  }
}
```

### GET /schedules/:id
Get schedule details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "schedule_101",
    "staffId": "staff_789",
    "staff": {
      "id": "staff_789",
      "name": "Dr. Sarah Johnson",
      "role": "doctor",
      "department": "emergency",
      "qualifications": ["MD", "Emergency Medicine"]
    },
    "shiftDetails": {
      "date": "2024-01-22",
      "startTime": "08:00",
      "endTime": "18:00",
      "shiftType": "regular",
      "department": "emergency",
      "location": "Main Campus",
      "estimatedPatientLoad": "high"
    },
    "status": "confirmed",
    "assignedBy": {
      "userId": "user_123",
      "userName": "John Doe",
      "method": "ai_generated",
      "timestamp": "2024-01-20T10:30:00Z"
    },
    "aiMetadata": {
      "confidenceScore": 0.92,
      "optimizationFactors": [
        "staff_availability",
        "workload_balance",
        "department_coverage",
        "cost_optimization"
      ],
      "alternatives": [
        {
          "staffId": "staff_790",
          "confidenceScore": 0.87,
          "reason": "Less experience with trauma cases"
        }
      ],
      "reasoning": "Dr. Johnson selected due to availability, expertise in emergency medicine, and balanced weekly workload."
    },
    "approvals": {
      "staffApproved": true,
      "staffApprovedAt": "2024-01-20T12:00:00Z",
      "managerApproved": true,
      "managerApprovedAt": "2024-01-20T14:30:00Z",
      "managerApprovedBy": "user_124"
    },
    "changeHistory": [
      {
        "timestamp": "2024-01-20T10:30:00Z",
        "userId": "user_123",
        "action": "created",
        "changes": "Initial AI-generated schedule"
      }
    ],
    "notes": "Covering for Dr. Smith who is on vacation"
  }
}
```

### POST /schedules
Create new schedule.

**Request:**
```json
{
  "staffId": "staff_789",
  "shiftDetails": {
    "date": "2024-01-25",
    "startTime": "08:00",
    "endTime": "18:00",
    "shiftType": "regular",
    "department": "emergency"
  },
  "notes": "Requested by staff member",
  "requireApproval": true
}
```

### PUT /schedules/:id
Update schedule.

**Request:**
```json
{
  "shiftDetails": {
    "startTime": "09:00",
    "endTime": "19:00"
  },
  "notes": "Updated due to patient load",
  "reasonForChange": "Increased patient volume expected"
}
```

### DELETE /schedules/:id
Cancel schedule.

**Request:**
```json
{
  "reason": "Staff called in sick",
  "findReplacement": true
}
```

### POST /schedules/bulk
Create multiple schedules.

**Request:**
```json
{
  "schedules": [
    {
      "staffId": "staff_789",
      "shiftDetails": {
        "date": "2024-01-25",
        "startTime": "08:00",
        "endTime": "16:00",
        "department": "emergency"
      }
    },
    {
      "staffId": "staff_790",
      "shiftDetails": {
        "date": "2024-01-25",
        "startTime": "16:00",
        "endTime": "00:00",
        "department": "emergency"
      }
    }
  ],
  "validateConflicts": true
}
```

---

## 🤖 AI Services

### POST /ai/generate-schedule
Generate AI-optimized schedule for a date range.

**Request:**
```json
{
  "dateRange": {
    "startDate": "2024-02-01",
    "endDate": "2024-02-07"
  },
  "constraints": {
    "departments": ["emergency", "icu"],
    "minStaffPerShift": {
      "emergency": 2,
      "icu": 3
    },
    "preferredShiftLength": 12,
    "allowOvertime": true,
    "prioritizeStaffPreferences": true
  },
  "options": {
    "optimizationGoal": "balanced", // "cost", "quality", "balanced"
    "includeAlternatives": true,
    "validateCompliance": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "schedules": [
      {
        "staffId": "staff_789",
        "shiftDetails": {
          "date": "2024-02-01",
          "startTime": "08:00",
          "endTime": "20:00",
          "department": "emergency"
        },
        "aiMetadata": {
          "confidenceScore": 0.95,
          "optimizationFactors": ["availability", "workload_balance"]
        }
      }
    ],
    "optimization": {
      "totalSchedules": 42,
      "coverageAchieved": 0.98,
      "workloadBalance": 0.92,
      "costEfficiency": 0.88,
      "conflictsResolved": 5,
      "alternativesGenerated": 12
    },
    "insights": [
      "Optimal staff distribution achieved across all departments",
      "2 potential overtime situations identified and optimized",
      "Staff preferences satisfied for 85% of assignments"
    ],
    "warnings": [
      "ICU may be understaffed on Sunday evening",
      "Dr. Johnson approaching weekly hour limit"
    ]
  }
}
```

### POST /ai/optimize-schedule
Optimize existing schedule.

**Request:**
```json
{
  "scheduleIds": ["schedule_101", "schedule_102", "schedule_103"],
  "optimizationGoals": ["reduce_overtime", "improve_coverage", "balance_workload"],
  "constraints": {
    "maintainMinimumCoverage": true,
    "respectStaffPreferences": true,
    "maxChanges": 5
  }
}
```

### POST /ai/chat
Natural language scheduling queries and commands.

**Request:**
```json
{
  "message": "Show me who is scheduled for the ICU night shift this weekend",
  "context": {
    "currentDate": "2024-01-22",
    "userRole": "manager",
    "department": "icu"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Here are the ICU night shift assignments for this weekend:\n\n**Saturday Night (Jan 27)**:\n- Nurse Williams (11 PM - 7 AM)\n- Nurse Davis (11 PM - 7 AM)\n\n**Sunday Night (Jan 28)**:\n- Nurse Johnson (11 PM - 7 AM)\n- Nurse Smith (11 PM - 7 AM)",
    "intent": "query_schedule",
    "entities": {
      "department": "icu",
      "shiftType": "night",
      "dateRange": {
        "start": "2024-01-27",
        "end": "2024-01-28"
      }
    },
    "confidence": 0.94,
    "suggestedActions": [
      {
        "label": "View Full Weekend Schedule",
        "action": "navigate",
        "target": "/schedules?department=icu&date=2024-01-27"
      },
      {
        "label": "Check Coverage Gaps",
        "action": "api_call",
        "endpoint": "/ai/analyze-coverage"
      }
    ],
    "relatedQueries": [
      "Who has backup coverage for ICU this weekend?",
      "What is the patient to nurse ratio for these shifts?",
      "Are there any overtime concerns?"
    ]
  }
}
```

### POST /ai/analyze-workload
Analyze staff workload and identify optimization opportunities.

**Request:**
```json
{
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "departments": ["emergency", "icu", "surgery"],
  "analysisType": "comprehensive", // "quick", "comprehensive", "predictive"
  "includePredictions": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalHours": 2480,
      "overtimeHours": 156,
      "averageHoursPerStaff": 35.2,
      "workloadVariance": 0.23,
      "burnoutRiskStaff": 3
    },
    "staffAnalysis": [
      {
        "staffId": "staff_789",
        "name": "Dr. Sarah Johnson",
        "department": "emergency",
        "metrics": {
          "totalHours": 168,
          "overtimeHours": 12,
          "averageShiftLength": 10.5,
          "consecutiveDaysWorked": 5,
          "workloadScore": 0.85,
          "burnoutRisk": "medium"
        },
        "insights": [
          "Working 5% above department average",
          "Consistently taking longer shifts",
          "May benefit from lighter schedule next week"
        ],
        "recommendations": [
          "Reduce to 4 consecutive days maximum",
          "Schedule 2-day break after current stretch",
          "Consider shifting some responsibilities to junior staff"
        ]
      }
    ],
    "departmentAnalysis": {
      "emergency": {
        "totalStaff": 8,
        "averageHours": 36.4,
        "coverageRating": 0.92,
        "overtimePercentage": 0.08,
        "recommendations": [
          "Consider hiring 1 additional part-time staff",
          "Redistribute weekend shifts more evenly"
        ]
      }
    },
    "predictions": {
      "nextMonth": {
        "projectedBurnoutRisk": "low",
        "recommendedStaffing": 9,
        "expectedOvertimeHours": 120
      }
    },
    "actionItems": [
      {
        "priority": "high",
        "action": "Schedule mandatory rest period for Dr. Johnson",
        "dueDate": "2024-02-01",
        "department": "emergency"
      }
    ]
  }
}
```

### POST /ai/predict-demand
Predict staffing needs based on historical data and trends.

**Request:**
```json
{
  "dateRange": {
    "startDate": "2024-02-01",
    "endDate": "2024-02-29"
  },
  "factors": [
    "historical_patterns",
    "seasonal_trends",
    "local_events",
    "weather_impact"
  ],
  "departments": ["emergency", "icu"],
  "includeRecommendations": true
}
```

---

## 📊 Analytics & Reporting

### GET /analytics/dashboard
Get dashboard analytics data.

**Query Parameters:**
- `period`: "week", "month", "quarter", "year"
- `startDate`, `endDate`: Custom date range
- `department`: Filter by department

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalSchedules": 156,
      "totalHours": 2480,
      "overtimeHours": 156,
      "costSavings": 12500.00,
      "staffUtilization": 0.87,
      "scheduleEfficiency": 0.92
    },
    "trends": {
      "schedulingTime": {
        "current": 15,  // minutes
        "previous": 180, // minutes
        "improvement": 0.92
      },
      "conflicts": {
        "current": 2,
        "previous": 18,
        "improvement": 0.89
      },
      "staffSatisfaction": {
        "current": 4.6,
        "previous": 3.8,
        "scale": 5
      }
    },
    "chartData": {
      "hoursPerWeek": [
        {"week": "2024-W03", "regular": 320, "overtime": 24},
        {"week": "2024-W04", "regular": 336, "overtime": 18}
      ],
      "departmentUtilization": [
        {"department": "emergency", "utilization": 0.92},
        {"department": "icu", "utilization": 0.88}
      ]
    },
    "alerts": [
      {
        "type": "warning",
        "message": "ICU projected to be understaffed next weekend",
        "action": "Consider scheduling additional staff"
      }
    ]
  }
}
```

### GET /analytics/reports/:reportType
Generate specific reports.

**Report Types:**
- `workload-analysis`
- `cost-analysis`
- `compliance-report`
- `efficiency-report`
- `staff-performance`

**Query Parameters:**
- `startDate`, `endDate`: Date range
- `format`: "json", "pdf", "excel"
- `department`: Filter by department

**Response (workload-analysis):**
```json
{
  "success": true,
  "data": {
    "reportId": "report_456",
    "generatedAt": "2024-01-22T10:30:00Z",
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    },
    "summary": {
      "totalStaff": 25,
      "totalHoursScheduled": 3200,
      "averageHoursPerStaff": 35.2,
      "overtimeHours": 180,
      "overtimePercentage": 0.056
    },
    "workloadDistribution": [
      {
        "staffId": "staff_789",
        "name": "Dr. Sarah Johnson",
        "hoursScheduled": 168,
        "overtimeHours": 12,
        "utilizationRate": 0.95,
        "burnoutRisk": "medium"
      }
    ],
    "recommendations": [
      "Redistribute shifts to balance workload more evenly",
      "Consider hiring additional part-time staff for peak periods",
      "Implement mandatory rest periods between long shifts"
    ]
  }
}
```

### POST /analytics/custom-query
Run custom analytics queries.

**Request:**
```json
{
  "query": {
    "type": "aggregation",
    "collection": "schedules",
    "filters": {
      "department": "emergency",
      "dateRange": {
        "start": "2024-01-01",
        "end": "2024-01-31"
      }
    },
    "groupBy": ["staff.role", "shiftType"],
    "metrics": ["totalHours", "averageHours", "count"]
  },
  "visualization": {
    "type": "bar_chart",
    "xAxis": "staff.role",
    "yAxis": "totalHours"
  }
}
```

---

## 📱 Notification Services

### GET /notifications
Get user notifications.

**Query Parameters:**
- `unreadOnly`: boolean (default: false)
- `type`: Filter by notification type
- `limit`: Number of notifications (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_123",
      "type": "schedule_change",
      "title": "Schedule Updated",
      "message": "Your shift on Jan 25 has been moved from 8 AM to 9 AM",
      "priority": "medium",
      "data": {
        "scheduleId": "schedule_101",
        "changes": {
          "startTime": {"from": "08:00", "to": "09:00"}
        }
      },
      "isRead": false,
      "createdAt": "2024-01-22T10:30:00Z"
    }
  ],
  "meta": {
    "unreadCount": 3,
    "totalCount": 15
  }
}
```

### PUT /notifications/:id/read
Mark notification as read.

### POST /notifications/preferences
Update notification preferences.

**Request:**
```json
{
  "email": {
    "scheduleChanges": true,
    "newSchedules": true,
    "reminders": true,
    "systemUpdates": false
  },
  "sms": {
    "urgentChanges": true,
    "shiftReminders": false
  },
  "push": {
    "allNotifications": true
  },
  "frequency": {
    "digest": "daily" // "never", "daily", "weekly"
  }
}
```

---

## 🔌 WebSocket Events

### Connection
```javascript
const socket = io('wss://api.medscheduleai.com', {
  auth: {
    token: 'your_access_token'
  }
});
```

### Server-to-Client Events

#### `schedule_created`
```json
{
  "type": "schedule_created",
  "data": {
    "scheduleId": "schedule_101",
    "staffId": "staff_789",
    "date": "2024-01-25",
    "department": "emergency"
  }
}
```

#### `schedule_updated`
```json
{
  "type": "schedule_updated",
  "data": {
    "scheduleId": "schedule_101",
    "changes": {
      "startTime": {"from": "08:00", "to": "09:00"}
    },
    "updatedBy": "user_123"
  }
}
```

#### `schedule_conflict`
```json
{
  "type": "schedule_conflict",
  "data": {
    "conflictId": "conflict_456",
    "scheduleIds": ["schedule_101", "schedule_102"],
    "type": "double_booking",
    "severity": "high",
    "affectedStaff": ["staff_789"],
    "suggestedResolution": {
      "action": "reschedule",
      "alternatives": ["staff_790", "staff_791"]
    }
  }
}
```

#### `ai_schedule_generated`
```json
{
  "type": "ai_schedule_generated",
  "data": {
    "jobId": "ai_job_789",
    "status": "completed",
    "scheduleCount": 42,
    "optimization": {
      "efficiency": 0.94,
      "coverage": 0.98
    }
  }
}
```

### Client-to-Server Events

#### `join_organization`
```json
{
  "organizationId": "org_456"
}
```

#### `subscribe_department`
```json
{
  "department": "emergency"
}
```

#### `typing_start` / `typing_stop`
```json
{
  "conversationId": "chat_123"
}
```

---

## 🪝 Webhooks

### Webhook Configuration

#### POST /webhooks
Create webhook endpoint.

**Request:**
```json
{
  "url": "https://yourapp.com/webhooks/medschedule",
  "events": [
    "schedule.created",
    "schedule.updated",
    "schedule.conflict",
    "ai.schedule_generated"
  ],
  "secret": "webhook_secret_key",
  "active": true
}
```

### Webhook Payload Format
```json
{
  "id": "webhook_delivery_123",
  "event": "schedule.created",
  "timestamp": "2024-01-22T10:30:00Z",
  "data": {
    "scheduleId": "schedule_101",
    "staffId": "staff_789",
    "organizationId": "org_456",
    "shiftDetails": {
      "date": "2024-01-25",
      "startTime": "08:00",
      "endTime": "18:00",
      "department": "emergency"
    }
  }
}
```

### Webhook Security
- **Signature Verification**: HMAC-SHA256 signature in `X-MedSchedule-Signature` header
- **Retry Logic**: Failed webhooks retried with exponential backoff
- **Timeout**: 10 second timeout for webhook responses

---

## 📚 SDK & Code Examples

### JavaScript/TypeScript SDK

#### Installation
```bash
npm install @medscheduleai/sdk
```

#### Basic Usage
```typescript
import { MedScheduleAI } from '@medscheduleai/sdk';

const client = new MedScheduleAI({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.medscheduleai.com/api/v1'
});

// Get staff list
const staff = await client.staff.list({
  department: 'emergency',
  limit: 50
});

// Create schedule
const schedule = await client.schedules.create({
  staffId: 'staff_789',
  shiftDetails: {
    date: '2024-01-25',
    startTime: '08:00',
    endTime: '18:00',
    department: 'emergency'
  }
});

// Generate AI schedule
const aiSchedule = await client.ai.generateSchedule({
  dateRange: {
    startDate: '2024-02-01',
    endDate: '2024-02-07'
  },
  departments: ['emergency', 'icu']
});
```

### Python SDK

#### Installation
```bash
pip install medscheduleai
```

#### Basic Usage
```python
from medscheduleai import MedScheduleAI

client = MedScheduleAI(
    api_key='your_api_key',
    base_url='https://api.medscheduleai.com/api/v1'
)

# Get staff list
staff = client.staff.list(
    department='emergency',
    limit=50
)

# Create schedule
schedule = client.schedules.create({
    'staffId': 'staff_789',
    'shiftDetails': {
        'date': '2024-01-25',
        'startTime': '08:00',
        'endTime': '18:00',
        'department': 'emergency'
    }
})
```

### cURL Examples

#### Authentication
```bash
curl -X POST https://api.medscheduleai.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clinic.com",
    "password": "SecurePass123!"
  }'
```

#### Get Staff List
```bash
curl -X GET https://api.medscheduleai.com/api/v1/staff \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

#### Create Schedule
```bash
curl -X POST https://api.medscheduleai.com/api/v1/schedules \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "staffId": "staff_789",
    "shiftDetails": {
      "date": "2024-01-25",
      "startTime": "08:00",
      "endTime": "18:00",
      "department": "emergency"
    }
  }'
```

#### Generate AI Schedule
```bash
curl -X POST https://api.medscheduleai.com/api/v1/ai/generate-schedule \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateRange": {
      "startDate": "2024-02-01",
      "endDate": "2024-02-07"
    },
    "departments": ["emergency", "icu"]
  }'
```

---

## 📝 Changelog & Versioning

### Version 1.0.0 (Current)
- Initial API release
- Full CRUD operations for staff and schedules
- AI-powered schedule generation
- Real-time WebSocket updates
- Analytics and reporting endpoints

### Upcoming Features (v1.1.0)
- Advanced AI chat capabilities
- Bulk operations for schedules
- Enhanced reporting with custom queries
- Mobile-specific endpoints
- Integration webhooks

---

## 💡 Best Practices

### API Usage Guidelines
1. **Authentication**: Always use HTTPS and secure token storage
2. **Rate Limiting**: Implement proper retry logic with exponential backoff
3. **Pagination**: Use pagination for list endpoints to avoid large responses
4. **Error Handling**: Handle all error codes gracefully
5. **Webhooks**: Implement idempotency for webhook processing

### Healthcare Compliance
1. **Data Privacy**: Never log sensitive patient information
2. **Audit Trail**: Maintain logs of all data access for HIPAA compliance
3. **Encryption**: Use TLS 1.2+ for all API communications
4. **Access Control**: Implement proper role-based access controls

### Performance Optimization
1. **Caching**: Cache frequently accessed data with appropriate TTL
2. **Batch Operations**: Use bulk endpoints when possible
3. **WebSockets**: Use for real-time updates instead of polling
4. **Compression**: Enable gzip compression for large responses

---

This API documentation provides comprehensive coverage of all MedScheduleAI Pro endpoints, making it easy for developers to integrate healthcare scheduling functionality into their applications.