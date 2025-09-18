# Contributing to MedScheduleAI Pro

## Development Setup

### Prerequisites
- Node.js 18+ and npm 8+
- MongoDB 5.0+
- Redis 7+
- Git

### Quick Start
1. Clone the repository
2. Run `npm run setup` to install dependencies and set up environment
3. Update environment variables in `.env.development` files
4. Run `npm run dev` to start development servers

## Project Structure
medscheduleai-pro/
├── client/          # React frontend with Vite
├── server/          # Node.js Express backend
├── shared/          # Shared TypeScript types
├── docs/           # Documentation
└── scripts/        # Build and deployment scripts

## Development Workflow
1. Create feature branch from `develop`
2. Make changes following code standards
3. Write tests for new functionality
4. Run `npm run lint` and `npm test`
5. Create pull request to `develop` branch

## Code Standards
- Use TypeScript for all code
- Follow ESLint and Prettier configurations
- Write unit tests for business logic
- Document API endpoints
- Follow healthcare data security practices