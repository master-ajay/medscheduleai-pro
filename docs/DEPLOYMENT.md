# MedScheduleAI Pro - Deployment Guide

## 📋 Table of Contents
- [Deployment Overview](#deployment-overview)
- [Environment Setup](#environment-setup)
- [Development Deployment](#development-deployment)
- [Staging Deployment](#staging-deployment)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [Cloud Platform Deployments](#cloud-platform-deployments)
- [Database Setup](#database-setup)
- [Monitoring & Logging](#monitoring--logging)
- [Backup & Recovery](#backup--recovery)
- [Security Configuration](#security-configuration)
- [Troubleshooting](#troubleshooting)

---

## 🌐 Deployment Overview

MedScheduleAI Pro uses a modern, containerized deployment strategy with multiple environment support. The application is designed for cloud-native deployment with healthcare-grade security and compliance.

### Deployment Architecture
```
Internet → CDN → Load Balancer → Application Servers → Database Cluster
                     │
                     ├── Frontend (Static Files)
                     ├── Backend API (Node.js)
                     ├── WebSocket Server
                     └── Background Jobs
```

### Supported Deployment Platforms
- **Development**: Local Docker Compose
- **Staging**: Railway, Render, or AWS ECS
- **Production**: AWS ECS, Google Cloud Run, Azure Container Instances
- **Enterprise**: Kubernetes clusters (EKS, GKE, AKS)

---

## 🔧 Environment Setup

### Prerequisites
- **Node.js**: 18.x or higher
- **Docker**: 20.x or higher
- **Docker Compose**: 2.x or higher
- **Git**: Latest version
- **Cloud CLI**: AWS CLI, gcloud, or Azure CLI (for cloud deployments)

### Environment Variables
Each deployment environment requires specific configuration:

```bash
# Core Application
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
APP_VERSION=1.0.0

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/medschedule_prod
REDIS_URL=redis://redis-cluster:6379

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AI Services
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=4000

# Email & SMS
SENDGRID_API_KEY=your-sendgrid-api-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# File Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=medschedule-uploads
AWS_REGION=us-east-1

# Monitoring
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key

# Security
CORS_ORIGIN=https://app.medscheduleai.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
BCRYPT_ROUNDS=12

# Healthcare Compliance
HIPAA_COMPLIANT=true
AUDIT_LOGGING=true
DATA_RETENTION_DAYS=2555
ENCRYPTION_KEY=your-32-character-encryption-key
```

---

## 💻 Development Deployment

### Local Development Setup
```bash
# Clone repository
git clone https://github.com/yourusername/medscheduleai-pro.git
cd medscheduleai-pro

# Install dependencies
npm install

# Set up environment files
npm run setup:env

# Start development services
docker-compose -f docker-compose.dev.yml up -d

# Start development servers
npm run dev
```

### Development Docker Compose
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    container_name: medschedule-mongo-dev
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: medschedule_dev
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_dev_data:/data/db
      - ./scripts/database/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro

  redis:
    image: redis:7-alpine
    container_name: medschedule-redis-dev
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data
    command: redis-server --appendonly yes

  mailhog:
    image: mailhog/mailhog:latest
    container_name: medschedule-mailhog-dev
    restart: unless-stopped
    ports:
      - "1025:1025"  # SMTP server
      - "8025:8025"  # Web interface

volumes:
  mongodb_dev_data:
  redis_dev_data:

networks:
  default:
    name: medschedule-dev
```

### Development Environment Verification
```bash
# Health check script
./scripts/development/health-check.sh

# Expected output:
# ✅ MongoDB connection successful
# ✅ Redis connection successful
# ✅ Frontend server responding (port 3000)
# ✅ Backend server responding (port 5000)
# ✅ WebSocket connection working
# ✅ AI service configuration valid
```

---

## 🚀 Staging Deployment

### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init medschedule-staging

# Set environment variables
railway variables:set NODE_ENV=staging
railway variables:set MONGODB_URI=$MONGODB_STAGING_URI
railway variables:set OPENAI_API_KEY=$OPENAI_API_KEY
# ... set all required variables

# Deploy
railway up
```

### Railway Configuration
```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build",
    "watchPatterns": ["**/*.ts", "**/*.js", "**/*.json"]
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ALWAYS"
  }
}
```

### Render Deployment
```yaml
# render.yaml
services:
  - type: web
    name: medschedule-api
    env: node
    repo: https://github.com/yourusername/medscheduleai-pro
    rootDir: server
    buildCommand: npm ci && npm run build
    startCommand: npm start
    plan: standard
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: staging
      - key: MONGODB_URI
        fromDatabase:
          name: medschedule-staging-db
          property: connectionString

  - type: static
    name: medschedule-frontend
    repo: https://github.com/yourusername/medscheduleai-pro
    rootDir: client
    buildCommand: npm ci && npm run build
    staticPublishPath: dist
    buildFilter:
      paths:
        - client/**
      ignoredPaths:
        - server/**

databases:
  - name: medschedule-staging-db
    databaseName: medschedule_staging
    user: medschedule_user
```

---

## 🏭 Production Deployment

### AWS ECS Deployment

#### ECS Task Definition
```json
{
  "family": "medschedule-prod",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "medschedule-backend",
      "image": "your-ecr-repo/medschedule-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/medschedule-prod",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "backend"
        }
      },
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:account:secret:medschedule/mongodb"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:account:secret:medschedule/jwt"
        }
      ],
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:5000/api/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

#### ECS Service Definition
```json
{
  "serviceName": "medschedule-prod-service",
  "cluster": "medschedule-prod-cluster",
  "taskDefinition": "medschedule-prod:1",
  "desiredCount": 3,
  "launchType": "FARGATE",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": [
        "subnet-12345678",
        "subnet-87654321"
      ],
      "securityGroups": [
        "sg-medschedule-backend"
      ],
      "assignPublicIp": "ENABLED"
    }
  },
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:us-east-1:account:targetgroup/medschedule-backend",
      "containerName": "medschedule-backend",
      "containerPort": 5000
    }
  ],
  "deploymentConfiguration": {
    "minimumHealthyPercent": 50,
    "maximumPercent": 200,
    "deploymentCircuitBreaker": {
      "enable": true,
      "rollback": true
    }
  }
}
```

### CloudFormation Infrastructure
```yaml
# infrastructure/cloudformation/production.yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'MedScheduleAI Pro Production Infrastructure'

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues: [staging, production]

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-medschedule-vpc

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub ${Environment}-medschedule-alb
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2

  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub ${Environment}-medschedule-cluster
      CapacityProviders:
        - FARGATE
        - FARGATE_SPOT
      DefaultCapacityProviderStrategy:
        - CapacityProvider: FARGATE
          Weight: 1
        - CapacityProvider: FARGATE_SPOT
          Weight: 4

  # RDS Database
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for MedSchedule database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-medschedule-db-subnet-group

  # ElastiCache Redis
  RedisSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      Description: Subnet group for MedSchedule Redis cache
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  RedisCluster:
    Type: AWS::ElastiCache::ReplicationGroup
    Properties:
      ReplicationGroupDescription: MedSchedule Redis cluster
      NodeType: cache.t3.micro
      Engine: redis
      NumCacheClusters: 2
      Port: 6379
      SecurityGroupIds:
        - !Ref RedisSecurityGroup
      CacheSubnetGroupName: !Ref RedisSubnetGroup

Outputs:
  LoadBalancerDNS:
    Description: DNS name of the load balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub ${Environment}-medschedule-alb-dns

  ECSClusterArn:
    Description: ARN of the ECS cluster
    Value: !Ref ECSCluster
    Export:
      Name: !Sub ${Environment}-medschedule-cluster-arn
```

---

## 🐳 Docker Deployment

### Production Dockerfiles

#### Backend Dockerfile
```dockerfile
# server/Dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY ../shared/package*.json ../shared/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .
COPY ../shared ../shared

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Set user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

#### Frontend Dockerfile
```dockerfile
# client/Dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY ../shared/package*.json ../shared/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .
COPY ../shared ../shared

# Build application
ARG VITE_API_BASE_URL
ARG VITE_SOCKET_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create nginx user
RUN adduser -D -S -h /var/cache/nginx -s /sbin/nologin -G nginx nginx

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    build:
      context: ./client
      dockerfile: Dockerfile
      args:
        VITE_API_BASE_URL: https://api.medscheduleai.com/api
        VITE_SOCKET_URL: https://api.medscheduleai.com
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - medschedule-network

  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      MONGODB_URI: ${MONGODB_URI}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      - mongodb
      - redis
    restart: unless-stopped
    networks:
      - medschedule-network
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  mongodb:
    image: mongo:5.0
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: medschedule_prod
    volumes:
      - mongodb_data:/data/db
      - ./scripts/database/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
      - ./backup:/backup
    restart: unless-stopped
    networks:
      - medschedule-network

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - medschedule-network

volumes:
  mongodb_data:
  redis_data:

networks:
  medschedule-network:
    driver: bridge
```

---

## ☁️ Cloud Platform Deployments

### Google Cloud Run Deployment
```yaml
# cloudbuild.yaml
steps:
  # Build backend image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/medschedule-backend:$COMMIT_SHA'
      - './server'

  # Build frontend image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/medschedule-frontend:$COMMIT_SHA'
      - '--build-arg'
      - 'VITE_API_BASE_URL=https://api.medscheduleai.com/api'
      - './client'

  # Push images
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/medschedule-backend:$COMMIT_SHA']

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/medschedule-frontend:$COMMIT_SHA']

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'medschedule-backend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/medschedule-backend:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--max-instances'
      - '100'
      - '--memory'
      - '1Gi'
      - '--cpu'
      - '1'
      - '--port'
      - '5000'

options:
  logging: CLOUD_LOGGING_ONLY
```

### Azure Container Instances
```yaml
# azure-pipelines.yml
trigger:
- main

variables:
  dockerRegistryServiceConnection: 'medschedule-acr'
  imageRepository: 'medschedule'
  containerRegistry: 'medscheduleacr.azurecr.io'
  dockerfilePath: '$(Build.SourcesDirectory)/server/Dockerfile'
  tag: '$(Build.BuildId)'

stages:
- stage: Build
  displayName: Build and push stage
  jobs:
  - job: Build
    displayName: Build
    pool:
      vmImage: 'ubuntu-latest'
    steps:
    - task: Docker@2
      displayName: Build and push backend image
      inputs:
        command: buildAndPush
        repository: $(imageRepository)-backend
        dockerfile: $(dockerfilePath)
        containerRegistry: $(dockerRegistryServiceConnection)
        tags: |
          $(tag)
          latest

    - task: Docker@2
      displayName: Build and push frontend image
      inputs:
        command: buildAndPush
        repository: $(imageRepository)-frontend
        dockerfile: '$(Build.SourcesDirectory)/client/Dockerfile'
        containerRegistry: $(dockerRegistryServiceConnection)
        tags: |
          $(tag)
          latest

- stage: Deploy
  displayName: Deploy stage
  dependsOn: Build
  jobs:
  - deployment: Deploy
    displayName: Deploy to Azure Container Instances
    pool:
      vmImage: 'ubuntu-latest'
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureResourceManagerTemplateDeployment@3
            displayName: Deploy ARM template
            inputs:
              deploymentScope: 'Resource Group'
              azureResourceManagerConnection: 'Azure-ARM'
              subscriptionId: '$(subscriptionId)'
              action: 'Create Or Update Resource Group'
              resourceGroupName: '$(resourceGroupName)'
              location: 'East US'
              templateLocation: 'Linked artifact'
              csmFile: '$(Pipeline.Workspace)/drop/azuredeploy.json'
              overrideParameters: '-containerImage $(containerRegistry)/$(imageRepository)-backend:$(tag)'
```

---

## 🗄️ Database Setup

### MongoDB Atlas Production Setup
```bash
# Create MongoDB Atlas cluster
# Via MongoDB Atlas UI or CLI

# Configure connection string
export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/medschedule_prod?retryWrites=true&w=majority"

# Database initialization script
./scripts/database/init-production.sh
```

### Database Migration Scripts
```javascript
// scripts/database/migrations/001-create-indexes.js
db = db.getSiblingDB('medschedule_prod');

// Create indexes for performance
db.users.createIndex({ "organizationId": 1, "email": 1 }, { unique: true });
db.staff.createIndex({ "organizationId": 1, "employment.department": 1 });
db.schedules.createIndex({ "organizationId": 1, "shiftDetails.date": 1 });
db.schedules.createIndex({ "organizationId": 1, "staffId": 1, "shiftDetails.date": 1 });

// Create text indexes for search
db.staff.createIndex({
  "personalInfo.firstName": "text",
  "personalInfo.lastName": "text",
  "employment.department": "text"
});

print("Database indexes created successfully");
```

### Database Backup Script
```bash
#!/bin/bash
# scripts/database/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backup"
DB_NAME="medschedule_prod"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create MongoDB dump
mongodump --uri="$MONGODB_URI" --db="$DB_NAME" --out="$BACKUP_DIR/mongodb_backup_$DATE"

# Compress backup
tar -czf "$BACKUP_DIR/mongodb_backup_$DATE.tar.gz" -C "$BACKUP_DIR" "mongodb_backup_$DATE"

# Remove uncompressed backup
rm -rf "$BACKUP_DIR/mongodb_backup_$DATE"

# Upload to S3 (optional)
if [ ! -z "$AWS_S3_BACKUP_BUCKET" ]; then
  aws s3 cp "$BACKUP_DIR/mongodb_backup_$DATE.tar.gz" "s3://$AWS_S3_BACKUP_BUCKET/database-backups/"
  echo "Backup uploaded to S3"
fi

# Keep only last 7 backups locally
find $BACKUP_DIR -name "mongodb_backup_*.tar.gz" -mtime +7 -delete

echo "Database backup completed: mongodb_backup_$DATE.tar.gz"
```

### Database Restoration Script
```bash
#!/bin/bash
# scripts/database/restore.sh

BACKUP_FILE=$1
DB_NAME="medschedule_prod"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore.sh <backup-file>"
  exit 1
fi

# Extract backup
tar -xzf "$BACKUP_FILE"

# Get backup directory name
BACKUP_DIR=$(basename "$BACKUP_FILE" .tar.gz)

# Restore database
mongorestore --uri="$MONGODB_URI" --db="$DB_NAME" --drop "$BACKUP_DIR/$DB_NAME"

# Cleanup
rm -rf "$BACKUP_DIR"

echo "Database restoration completed from: $BACKUP_FILE"
```

---

## 📊 Monitoring & Logging

### Application Monitoring Setup

#### DataDog Configuration
```javascript
// server/src/config/monitoring.ts
import { StatsD } from 'node-statsd';
import tracer from 'dd-trace';

// Initialize DataDog APM
tracer.init({
  service: 'medschedule-backend',
  env: process.env.NODE_ENV,
  version: process.env.APP_VERSION,
  logInjection: true,
  runtimeMetrics: true,
  profiling: true
});

// Initialize StatsD client
export const statsd = new StatsD({
  host: process.env.DATADOG_AGENT_HOST || 'localhost',
  port: 8125,
  prefix: 'medschedule.',
  tags: {
    env: process.env.NODE_ENV,
    service: 'backend'
  }
});

// Custom metrics tracking
export class MetricsTracker {
  static trackAPICall(endpoint: string, method: string, statusCode: number, duration: number) {
    statsd.histogram('api.request.duration', duration, {
      endpoint,
      method,
      status: statusCode.toString()
    });
    
    statsd.increment('api.request.count', 1, {
      endpoint,
      method,
      status: statusCode.toString()
    });
  }
  
  static trackAIRequest(operation: string, tokens: number, duration: number) {
    statsd.histogram('ai.request.duration', duration, { operation });
    statsd.histogram('ai.tokens.used', tokens, { operation });
    statsd.increment('ai.request.count', 1, { operation });
  }
  
  static trackBusinessMetric(metric: string, value: number, tags?: Record<string, string>) {
    statsd.gauge(`business.${metric}`, value, tags);
  }
}
```

#### Prometheus Metrics (Alternative)
```javascript
// server/src/config/prometheus.ts
import prometheus from 'prom-client';

// Create a Registry
const register = new prometheus.Registry();

// Add default metrics
prometheus.collectDefaultMetrics({
  register,
  prefix: 'medschedule_'
});

// Custom metrics
export const httpRequestDuration = new prometheus.Histogram({
  name: 'medschedule_http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 5, 15, 50, 100, 500, 1000]
});

export const schedulesGenerated = new prometheus.Counter({
  name: 'medschedule_schedules_generated_total',
  help: 'Total number of schedules generated',
  labelNames: ['method', 'organization']
});

export const activeUsers = new prometheus.Gauge({
  name: 'medschedule_active_users',
  help: 'Number of active users',
  labelNames: ['organization']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(schedulesGenerated);
register.registerMetric(activeUsers);

// Metrics endpoint
export const metricsHandler = (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
};
```

### Centralized Logging

#### Winston Logger Configuration
```javascript
// server/src/utils/logger.ts
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

const logLevel = process.env.LOG_LEVEL || 'info';
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error'
  }),
  new winston.transports.File({
    filename: 'logs/combined.log'
  })
];

// Add Elasticsearch transport for production
if (process.env.NODE_ENV === 'production' && process.env.ELASTICSEARCH_URL) {
  transports.push(
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: {
        node: process.env.ELASTICSEARCH_URL,
        auth: {
          username: process.env.ELASTICSEARCH_USERNAME!,
          password: process.env.ELASTICSEARCH_PASSWORD!
        }
      },
      index: 'medschedule-logs',
      source: 'backend'
    })
  );
}

export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: {
    service: 'medschedule-backend',
    version: process.env.APP_VERSION
  },
  transports
});

// Healthcare-specific logging utilities
export class HealthcareLogger {
  static logDataAccess(userId: string, action: string, resource: string, patientId?: string) {
    logger.info('Data access event', {
      type: 'AUDIT',
      userId,
      action,
      resource,
      patientId,
      timestamp: new Date().toISOString(),
      compliance: 'HIPAA'
    });
  }
  
  static logSecurityEvent(event: string, details: any, severity: 'low' | 'medium' | 'high' | 'critical') {
    logger.warn('Security event', {
      type: 'SECURITY',
      event,
      details,
      severity,
      timestamp: new Date().toISOString()
    });
  }
  
  static logAIDecision(userId: string, operation: string, input: any, output: any, confidence: number) {
    logger.info('AI decision', {
      type: 'AI_AUDIT',
      userId,
      operation,
      input: this.sanitizeForLog(input),
      output: this.sanitizeForLog(output),
      confidence,
      timestamp: new Date().toISOString()
    });
  }
  
  private static sanitizeForLog(data: any): any {
    // Remove sensitive information before logging
    const sanitized = { ...data };
    delete sanitized.ssn;
    delete sanitized.password;
    delete sanitized.creditCard;
    return sanitized;
  }
}
```

### Health Check Endpoints
```javascript
// server/src/controllers/healthController.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { redis } from '../config/redis';
import { OpenAI } from 'openai';

export class HealthController {
  async basicHealth(req: Request, res: Response) {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION,
      uptime: process.uptime()
    });
  }
  
  async detailedHealth(req: Request, res: Response) {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION,
      uptime: process.uptime(),
      dependencies: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        openai: await this.checkOpenAI(),
        memory: this.checkMemory(),
        disk: await this.checkDisk()
      }
    };
    
    const isHealthy = Object.values(health.dependencies)
      .every(dep => dep.status === 'healthy');
    
    res.status(isHealthy ? 200 : 503).json(health);
  }
  
  private async checkDatabase() {
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime,
        connectionState: mongoose.connection.readyState
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
  
  private async checkRedis() {
    try {
      const start = Date.now();
      await redis.ping();
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime,
        connectionState: redis.status
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
  
  private async checkOpenAI() {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const start = Date.now();
      
      // Simple test request
      await openai.models.list();
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime
      };
    } catch (error) {
      return {
        status: 'degraded',
        error: 'OpenAI API unavailable'
      };
    }
  }
  
  private checkMemory() {
    const usage = process.memoryUsage();
    const totalMem = usage.heapTotal / 1024 / 1024; // MB
    const usedMem = usage.heapUsed / 1024 / 1024; // MB
    const memoryUsage = (usedMem / totalMem) * 100;
    
    return {
      status: memoryUsage > 85 ? 'warning' : 'healthy',
      usage: {
        total: `${totalMem.toFixed(2)} MB`,
        used: `${usedMem.toFixed(2)} MB`,
        percentage: `${memoryUsage.toFixed(2)}%`
      }
    };
  }
  
  private async checkDisk() {
    try {
      const stats = await import('fs').then(fs => fs.promises.stat('.'));
      return {
        status: 'healthy',
        available: true
      };
    } catch (error) {
      return {
        status: 'warning',
        error: 'Unable to check disk space'
      };
    }
  }
}
```

---

## 🔐 Security Configuration

### SSL/TLS Certificate Setup

#### Let's Encrypt with Certbot
```bash
#!/bin/bash
# scripts/security/setup-ssl.sh

# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d api.medscheduleai.com -d app.medscheduleai.com

# Set up automatic renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -

echo "SSL certificates configured and auto-renewal set up"
```

#### Nginx SSL Configuration
```nginx
# nginx/nginx.conf
server {
    listen 80;
    server_name app.medscheduleai.com api.medscheduleai.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.medscheduleai.com;
    
    ssl_certificate /etc/letsencrypt/live/app.medscheduleai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.medscheduleai.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;";
    
    # Frontend static files
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}

server {
    listen 443 ssl http2;
    server_name api.medscheduleai.com;
    
    ssl_certificate /etc/letsencrypt/live/api.medscheduleai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.medscheduleai.com/privkey.pem;
    
    # Same SSL configuration as above
    
    # API backend
    location / {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Security Hardening Script
```bash
#!/bin/bash
# scripts/security/harden-server.sh

echo "Starting server security hardening..."

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install fail2ban for intrusion prevention
sudo apt-get install fail2ban -y

# Configure fail2ban
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-req-limit]
enabled = true
filter = nginx-req-limit
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

# Start fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Secure SSH
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Install and configure ClamAV antivirus
sudo apt-get install clamav clamav-daemon -y
sudo systemctl enable clamav-freshclam
sudo systemctl start clamav-freshclam

echo "Server security hardening completed"
```

---

## 📋 Backup & Recovery

### Automated Backup Strategy
```bash
#!/bin/bash
# scripts/backup/full-backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_BASE="/backup"
S3_BUCKET="medschedule-backups"

echo "Starting full backup at $(date)"

# Create backup directories
mkdir -p $BACKUP_BASE/{database,files,config}

# Database backup
echo "Backing up MongoDB..."
mongodump --uri="$MONGODB_URI" --out="$BACKUP_BASE/database/mongodb_$DATE"

# Application files backup
echo "Backing up application files..."
tar -czf "$BACKUP_BASE/files/app_files_$DATE.tar.gz" \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  /app

# Configuration backup
echo "Backing up configuration..."
cp -r /app/config "$BACKUP_BASE/config/config_$DATE"
cp /app/.env.production "$BACKUP_BASE/config/env_$DATE"

# Compress everything
echo "Compressing backups..."
tar -czf "$BACKUP_BASE/full_backup_$DATE.tar.gz" \
  -C "$BACKUP_BASE" database files config

# Upload to S3
echo "Uploading to S3..."
aws s3 cp "$BACKUP_BASE/full_backup_$DATE.tar.gz" \
  "s3://$S3_BUCKET/full-backups/"

# Cleanup local files older than 7 days
find $BACKUP_BASE -name "*.tar.gz" -mtime +7 -delete
rm -rf $BACKUP_BASE/database $BACKUP_BASE/files $BACKUP_BASE/config

echo "Full backup completed at $(date)"
```

### Disaster Recovery Plan
```bash
#!/bin/bash
# scripts/recovery/disaster-recovery.sh

BACKUP_FILE=$1
RECOVERY_MODE=$2  # full, database-only, files-only

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./disaster-recovery.sh <backup-file> [recovery-mode]"
  exit 1
fi

echo "Starting disaster recovery with backup: $BACKUP_FILE"
echo "Recovery mode: ${RECOVERY_MODE:-full}"

# Download backup from S3 if needed
if [[ $BACKUP_FILE == s3://* ]]; then
  echo "Downloading backup from S3..."
  aws s3 cp "$BACKUP_FILE" ./recovery_backup.tar.gz
  BACKUP_FILE="./recovery_backup.tar.gz"
fi

# Extract backup
echo "Extracting backup..."
tar -xzf "$BACKUP_FILE" -C /tmp/recovery

case $RECOVERY_MODE in
  "database-only")
    echo "Recovering database only..."
    mongorestore --uri="$MONGODB_URI" --drop /tmp/recovery/database/mongodb_*
    ;;
  "files-only")
    echo "Recovering application files only..."
    tar -xzf /tmp/recovery/files/app_files_*.tar.gz -C /
    ;;
  *)
    echo "Performing full recovery..."
    # Restore database
    mongorestore --uri="$MONGODB_URI" --drop /tmp/recovery/database/mongodb_*
    
    # Restore application files
    tar -xzf /tmp/recovery/files/app_files_*.tar.gz -C /
    
    # Restore configuration
    cp /tmp/recovery/config/env_* /app/.env.production
    
    # Restart services
    docker-compose restart
    ;;
esac

# Cleanup
rm -rf /tmp/recovery
rm -f ./recovery_backup.tar.gz

echo "Disaster recovery completed successfully"
```

---

## 🐛 Troubleshooting

### Common Deployment Issues

#### Issue: Container fails to start
```bash
# Check container logs
docker logs medschedule-backend

# Check resource usage
docker stats

# Verify environment variables
docker exec medschedule-backend printenv

# Solution: Usually missing environment variables or resource constraints
```

#### Issue: Database connection fails
```bash
# Test MongoDB connection
mongosh "$MONGODB_URI"

# Check network connectivity
docker network ls
docker network inspect medschedule-network

# Verify credentials and connection string format
echo $MONGODB_URI | grep -E "mongodb(\+srv)?://.*"
```

#### Issue: High memory usage
```bash
# Check memory usage
free -h
docker stats

# Analyze Node.js heap
node --inspect server.js
# Connect Chrome DevTools for heap analysis

# Solution: Implement proper garbage collection and memory limits
```

### Deployment Verification Checklist
```bash
#!/bin/bash
# scripts/deployment/verify-deployment.sh

echo "🔍 Verifying deployment..."

# Test basic connectivity
echo "Testing basic connectivity..."
curl -f http://localhost:5000/api/health || echo "❌ Backend health check failed"
curl -f http://localhost:3000 || echo "❌ Frontend not accessible"

# Test database connectivity
echo "Testing database connectivity..."
mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')" || echo "❌ Database connection failed"

# Test Redis connectivity
echo "Testing Redis connectivity..."
redis-cli -u "$REDIS_URL" ping || echo "❌ Redis connection failed"

# Test AI service
echo "Testing AI service..."
curl -X POST http://localhost:5000/api/ai/test \
  -H "Content-Type: application/json" \
  -d '{"test": true}' || echo "❌ AI service not responding"

# Test WebSocket connection
echo "Testing WebSocket connection..."
node -e "
const io = require('socket.io-client');
const socket = io('http://localhost:5000');
socket.on('connect', () => {
  console.log('✅ WebSocket connection successful');
  process.exit(0);
});
socket.on('connect_error', () => {
  console.log('❌ WebSocket connection failed');
  process.exit(1);
});
"

# Test SSL certificate (production)
if [ "$NODE_ENV" = "production" ]; then
  echo "Testing SSL certificate..."
  echo | openssl s_client -connect api.medscheduleai.com:443 -servername api.medscheduleai.com 2>/dev/null | openssl x509 -noout -dates || echo "❌ SSL certificate issues"
fi

echo "✅ Deployment verification completed"
```

### Performance Monitoring Commands
```bash
# Monitor application performance
htop

# Monitor Docker containers
docker stats

# Monitor database performance
mongotop
mongostat

# Monitor network connections
netstat -tulnp

# Monitor disk usage
df -h
du -sh /var/log

# Monitor application logs
tail -f logs/combined.log

# Monitor specific service
journalctl -u medschedule-backend -f
```

### Emergency Recovery Commands
```bash
# Stop all services
docker-compose down

# Start in safe mode (database only)
docker-compose up -d mongodb redis

# Rebuild and restart specific service
docker-compose build backend
docker-compose up -d backend

# Scale services
docker-compose up -d --scale backend=3

# Emergency database backup
mongodump --uri="$MONGODB_URI" --out="/emergency-backup/$(date +%Y%m%d_%H%M%S)"
```

---

## 📞 Support & Maintenance

### Maintenance Windows
- **Scheduled Maintenance**: First Sunday of each month, 2:00-4:00 AM EST
- **Emergency Maintenance**: As needed with 30-minute notice to users
- **Security Updates**: Applied within 24 hours of release

### Support Contacts
- **Technical Issues**: tech-support@medscheduleai.com
- **Security Issues**: security@medscheduleai.com
- **Emergency**: +1-800-MED-HELP (24/7)

### SLA Commitments
- **Uptime**: 99.9% (excluding scheduled maintenance)
- **Response Time**: < 200ms API response (95th percentile)
- **Support Response**: < 2 hours for critical issues
- **Data Recovery**: < 4 hours RTO, < 1 hour RPO

This deployment guide provides comprehensive instructions for deploying MedScheduleAI Pro across all environments while maintaining healthcare compliance and security standards.