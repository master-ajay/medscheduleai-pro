/**
 * @fileoverview Database Type Definitions for MedScheduleAI Pro
 * @description Centralized type definitions for database operations, configurations,
 *              and HIPAA-compliant audit logging for healthcare scheduling platform
 * 
 * @author MedScheduleAI Pro Engineering Team
 * @version 1.0.0
 * @since 1.0.0
 * @lastModified 2024-12-19
 * 
 * @security HIPAA Compliant - Contains PHI handling types
 * @compliance Healthcare data requires special handling per HIPAA guidelines
 */

import { Connection, ConnectOptions } from 'mongoose';

// ============================================================================
// CONNECTION TYPES
// ============================================================================

/**
 * Database connection options interface
 */
export interface DatabaseConnectionOptions {
    retries?: number;
    retryDelay?: number;
    enableCompression?: boolean;
}

/**
 * Connection status response interface
 */
export interface ConnectionStatus {
    isConnected: boolean;
    readyState: number;
    readyStateDescription: string;
    host: string | undefined;
    database: string | undefined;
}

/**
 * Health check response interface
 */
export interface HealthCheckResult {
    isHealthy: boolean;
    responseTime?: number;
    error?: string;
}

// ============================================================================
// AUDIT & COMPLIANCE TYPES
// ============================================================================

/**
 * HIPAA-compliant audit log entry
 */
export interface AuditLogEntry {
    timestamp: string;
    event: string;
    details: string;
    environment: string;
    database: string | undefined;
    userId?: string;
    organizationId?: string;
}

/**
 * Database event types for HIPAA-compliant audit logging
 * @description These events are logged for regulatory compliance and security monitoring
 */
export const DATABASE_EVENTS = {
    // Connection lifecycle events
    CONNECTION_ESTABLISHED: 'CONNECTION_ESTABLISHED',
    CONNECTION_FAILED: 'CONNECTION_FAILED',
    CONNECTION_LOST: 'CONNECTION_LOST',
    CONNECTION_RESTORED: 'CONNECTION_RESTORED',
    CONNECTION_TERMINATED: 'CONNECTION_TERMINATED',
    
    // Operational events
    HEALTH_CHECK_PASSED: 'HEALTH_CHECK_PASSED',
    HEALTH_CHECK_FAILED: 'HEALTH_CHECK_FAILED',
    CONFIGURATION_LOADED: 'CONFIGURATION_LOADED',
    
    // Security & compliance events
    UNAUTHORIZED_ACCESS_ATTEMPT: 'UNAUTHORIZED_ACCESS_ATTEMPT',
    DATA_ACCESS_AUDIT: 'DATA_ACCESS_AUDIT',
    
    // System events
    GRACEFUL_SHUTDOWN_INITIATED: 'GRACEFUL_SHUTDOWN_INITIATED',
    GRACEFUL_SHUTDOWN_COMPLETED: 'GRACEFUL_SHUTDOWN_COMPLETED',
    EMERGENCY_SHUTDOWN: 'EMERGENCY_SHUTDOWN',
    SYSTEM_ERROR: 'SYSTEM_ERROR',
} as const;

export type DatabaseEventType = typeof DATABASE_EVENTS[keyof typeof DATABASE_EVENTS];

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Database configuration constants
 */
export interface DatabaseConfig {
    RETRY_ATTEMPTS: number;
    RETRY_DELAY_MS: number;
    SHUTDOWN_TIMEOUT_MS: number;
    HEALTH_CHECK_TIMEOUT_MS: number;
    PRODUCTION_MAX_POOL_SIZE: number;
    PRODUCTION_MIN_POOL_SIZE: number;
    DEVELOPMENT_MAX_POOL_SIZE: number;
    DEVELOPMENT_MIN_POOL_SIZE: number;
}

/**
 * Connection ready states mapping
 */
export interface ReadyStatesMap {
    readonly 0: 'disconnected';
    readonly 1: 'connected';
    readonly 2: 'connecting';
    readonly 3: 'disconnecting';
    readonly 99: 'uninitialized';
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

/**
 * Re-export Mongoose types for convenience
 */
export type { Connection, ConnectOptions } from 'mongoose';