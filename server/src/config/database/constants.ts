/**
 * @fileoverview Database Configuration Constants
 * @description Production-grade database configuration constants and error messages
 *              for the MedScheduleAI Pro healthcare scheduling platform
 * 
 * @author MedScheduleAI Pro Engineering Team
 * @version 1.0.0
 * @since 1.0.0
 * @lastModified 2024-12-19
 * 
 * @security HIPAA Compliant - Production security configurations
 */

import type { DatabaseConfig, ReadyStatesMap } from './types';

// ============================================================================
// DATABASE CONFIGURATION CONSTANTS
// ============================================================================

/**
 * Production-grade database configuration with healthcare-specific optimizations
 * @description Tuned for healthcare workloads with emphasis on data consistency
 */
export const DATABASE_CONFIG: Readonly<DatabaseConfig> = {
    // Connection retry configuration
    RETRY_ATTEMPTS: 5,
    RETRY_DELAY_MS: 5000, // 5 seconds between retries
    
    // Graceful shutdown configuration
    SHUTDOWN_TIMEOUT_MS: 30000, // 30 seconds for graceful shutdown
    
    // Health monitoring configuration
    HEALTH_CHECK_TIMEOUT_MS: 5000, // 5 seconds for health checks
    
    // Production connection pool sizing (optimized for healthcare workloads)
    PRODUCTION_MAX_POOL_SIZE: 10, // Conservative for data consistency
    PRODUCTION_MIN_POOL_SIZE: 2,  // Always maintain minimum connections
    
    // Development connection pool sizing (optimized for developer productivity)
    DEVELOPMENT_MAX_POOL_SIZE: 20, // Higher for parallel development
    DEVELOPMENT_MIN_POOL_SIZE: 5,  // Higher minimum for faster responses
} as const;

/**
 * MongoDB connection state mappings for human-readable status reporting
 * @description Maps Mongoose connection ready states to descriptive strings
 */
export const CONNECTION_READY_STATES: Readonly<ReadyStatesMap> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
} as const;

// ============================================================================
// ERROR MESSAGES & CODES
// ============================================================================

/**
 * Standardized error messages for database operations
 * @description Professional error messages with actionable guidance
 */
export const DATABASE_ERRORS = {
    // Configuration errors
    MISSING_MONGODB_URI: {
        code: 'DB_CONFIG_001',
        message: 'MongoDB connection URI is not configured',
        description: 'MONGODB_URI environment variable is required but not set',
        action: 'Configure MONGODB_URI in your environment configuration file',
        severity: 'CRITICAL'
    },
    
    MISSING_TEST_URI: {
        code: 'DB_CONFIG_002',
        message: 'Test database URI is not configured for test environment',
        description: 'MONGODB_TEST_URI environment variable is required in test environment',
        action: 'Configure MONGODB_TEST_URI in your test environment configuration',
        severity: 'HIGH'
    },
    
    MISSING_PRODUCTION_SECURITY: {
        code: 'DB_SECURITY_001',
        message: 'Required security environment variables missing for production',
        description: 'Production environment requires enhanced security configuration',
        action: 'Configure JWT_SECRET, BCRYPT_ROUNDS, and other required security variables',
        severity: 'CRITICAL'
    },
    
    WEAK_JWT_SECRET: {
        code: 'DB_SECURITY_002',
        message: 'JWT secret must be at least 32 characters in production',
        description: 'Production environment requires strong JWT secrets for HIPAA compliance',
        action: 'Generate and configure a secure JWT secret with minimum 32 characters',
        severity: 'CRITICAL'
    },
    
    // Connection errors
    CONNECTION_TIMEOUT: {
        code: 'DB_CONN_001',
        message: 'Database connection attempt timed out',
        description: 'Unable to establish connection within the specified timeout period',
        action: 'Check database server availability and network connectivity',
        severity: 'HIGH'
    },
    
    CONNECTION_REFUSED: {
        code: 'DB_CONN_002',
        message: 'Database connection was refused',
        description: 'Database server actively refused the connection attempt',
        action: 'Verify database server is running and accepting connections',
        severity: 'HIGH'
    },
    
    AUTHENTICATION_FAILED: {
        code: 'DB_AUTH_001',
        message: 'Database authentication failed',
        description: 'Invalid credentials or insufficient permissions',
        action: 'Verify database username, password, and user permissions',
        severity: 'HIGH'
    },
    
    // Operational errors
    HEALTH_CHECK_TIMEOUT: {
        code: 'DB_HEALTH_001',
        message: 'Database health check timed out',
        description: 'Health check ping did not complete within the timeout period',
        action: 'Check database performance and network latency',
        severity: 'MEDIUM'
    },
    
    CONNECTION_UNAVAILABLE: {
        code: 'DB_HEALTH_002',
        message: 'Database connection is not available for health check',
        description: 'Attempted health check on disconnected or invalid connection',
        action: 'Ensure database connection is established before health check',
        severity: 'MEDIUM'
    },
    
    DISCONNECTION_ERROR: {
        code: 'DB_DISC_001',
        message: 'Error occurred during database disconnection',
        description: 'Failed to properly close database connection',
        action: 'Check for pending transactions or connection locks',
        severity: 'MEDIUM'
    },
    
    // System errors
    GRACEFUL_SHUTDOWN_TIMEOUT: {
        code: 'DB_SHUTDOWN_001',
        message: 'Graceful shutdown exceeded timeout threshold',
        description: 'Database did not shutdown cleanly within the allowed time',
        action: 'System will perform emergency shutdown - investigate pending operations',
        severity: 'HIGH'
    },
    
    EMERGENCY_SHUTDOWN: {
        code: 'DB_SHUTDOWN_002',
        message: 'Emergency database shutdown initiated',
        description: 'Forced shutdown due to graceful shutdown failure',
        action: 'Review system logs for potential data consistency issues',
        severity: 'CRITICAL'
    }
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

/**
 * Standardized success messages for database operations
 * @description Professional success messages for operations logging
 */
export const DATABASE_SUCCESS = {
    CONNECTION_ESTABLISHED: 'Database connection established successfully',
    CONNECTION_RESTORED: 'Database connection restored after interruption',
    HEALTH_CHECK_PASSED: 'Database health check completed successfully',
    GRACEFUL_SHUTDOWN: 'Database shutdown completed gracefully',
    CONFIGURATION_VALIDATED: 'Database configuration validated successfully',
    RETRY_SUCCESSFUL: 'Database connection retry attempt succeeded'
} as const;

// ============================================================================
// AUDIT LOG TEMPLATES
// ============================================================================

/**
 * Audit log message templates for HIPAA compliance
 * @description Structured templates for consistent audit logging
 */
export const AUDIT_TEMPLATES = {
    CONNECTION_EVENT: 'Database {event} - Environment: {environment}, Host: {host}',
    SECURITY_EVENT: 'Security event: {event} - User: {userId}, Organization: {organizationId}',
    OPERATIONAL_EVENT: 'Operational event: {event} - Details: {details}',
    ERROR_EVENT: 'Error occurred: {event} - Code: {errorCode}, Message: {message}'
} as const;

// ============================================================================
// PERFORMANCE THRESHOLDS
// ============================================================================

/**
 * Performance monitoring thresholds for healthcare applications
 * @description Response time thresholds for performance alerting
 */
export const PERFORMANCE_THRESHOLDS = {
    HEALTH_CHECK_WARNING_MS: 1000,    // Warn if health check > 1 second
    HEALTH_CHECK_CRITICAL_MS: 3000,   // Critical if health check > 3 seconds
    CONNECTION_WARNING_MS: 2000,      // Warn if connection > 2 seconds
    CONNECTION_CRITICAL_MS: 5000,     // Critical if connection > 5 seconds
    QUERY_WARNING_MS: 500,            // Warn if query > 500ms
    QUERY_CRITICAL_MS: 2000           // Critical if query > 2 seconds
} as const;