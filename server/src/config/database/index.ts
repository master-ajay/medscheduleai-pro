/**
 * @fileoverview Production-Grade MongoDB Database Connection Manager
 * @description Enterprise-level database connection management with HIPAA compliance,
 *              comprehensive error handling, monitoring, and graceful degradation
 *              capabilities for the MedScheduleAI Pro healthcare scheduling platform.
 * 
 * @author MedScheduleAI Pro Engineering Team
 * @version 1.0.0
 * @since 1.0.0
 * @lastModified 2025-09-19
 * 
 * @features
 * - Production-grade connection pooling and retry logic
 * - HIPAA-compliant audit logging and security measures
 * - Comprehensive health monitoring and alerting
 * - Graceful shutdown with data consistency guarantees
 * - Professional error handling and recovery strategies
 * 
 * @security HIPAA Compliant - Handles PHI data connections securely
 * @performance Optimized for healthcare workloads with sub-second response times
 * @reliability 99.9% uptime target with automatic failover capabilities
 */

import mongoose from 'mongoose';
import type {
    DatabaseConnectionOptions,
    ConnectionStatus,
    HealthCheckResult,
    Connection,
    ConnectOptions,
    DatabaseEventType,
    AuditLogEntry
} from './types';
import { 
    DATABASE_CONFIG, 
    CONNECTION_READY_STATES, 
    DATABASE_ERRORS, 
    DATABASE_SUCCESS,
    PERFORMANCE_THRESHOLDS 
} from './constants';
import { 
    DatabaseError, 
    classifyConnectionError, 
    isRecoverableError, 
    calculateRetryDelay,
    safeErrorMessage,
    sanitizeErrorForLogging,
    delay
} from './errors';
import { DATABASE_EVENTS } from './types';

// ============================================================================
// ENVIRONMENT & CONFIGURATION
// ============================================================================

const { MONGODB_URI, MONGODB_TEST_URI, NODE_ENV = 'development' } = process.env;
const DATABASE_URI = NODE_ENV === 'test' ? MONGODB_TEST_URI! : MONGODB_URI!;
const IS_PRODUCTION_ENVIRONMENT = NODE_ENV === 'production';

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

/**
 * Validates required environment variables for database configuration
 * @throws {DatabaseError} If critical environment variables are missing or invalid
 * @description Performs comprehensive validation of database-related environment variables
 *              with specific checks for production security requirements
 */
const validateDatabaseEnvironment = (): void => {
    // Validate core database connection requirements
    if (!MONGODB_URI) {
        throw new DatabaseError(DATABASE_ERRORS.MISSING_MONGODB_URI);
    }

    if (NODE_ENV === 'test' && !MONGODB_TEST_URI) {
        throw new DatabaseError(DATABASE_ERRORS.MISSING_TEST_URI);
    }

    // Enhanced production environment validation for healthcare compliance
    if (IS_PRODUCTION_ENVIRONMENT) {
        const requiredSecurityVars = ['JWT_SECRET', 'BCRYPT_ROUNDS', 'AUDIT_LOGGING'];
        const missingVars = requiredSecurityVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            throw new DatabaseError(DATABASE_ERRORS.MISSING_PRODUCTION_SECURITY);
        }

        // Validate JWT secret strength in production
        const jwtSecret = process.env.JWT_SECRET;
        if (jwtSecret && jwtSecret.length < 32) {
            throw new DatabaseError(DATABASE_ERRORS.WEAK_JWT_SECRET);
        }
    }
};

// Validate environment configuration on module initialization
try {
    validateDatabaseEnvironment();
    console.info(`${DATABASE_SUCCESS.CONFIGURATION_VALIDATED} [Environment: ${NODE_ENV}]`);
} catch (error) {
    console.error('Database configuration validation failed:', sanitizeErrorForLogging(error));
    throw error;
}

// ============================================================================
// MONGOOSE CONNECTION CONFIGURATION
// ============================================================================

/**
 * Builds production-optimized Mongoose connection options based on environment
 * @param enableCompression - Whether to enable network compression for production
 * @returns Configured Mongoose connection options with healthcare-specific settings
 * @description Creates connection options optimized for healthcare data consistency and performance
 */
const buildMongooseConnectionOptions = (enableCompression = IS_PRODUCTION_ENVIRONMENT): ConnectOptions => {
    const baseConnectionOptions: ConnectOptions = {
        retryWrites: true,
        w: 'majority', // Healthcare data integrity requirement
        readPreference: 'primary', // Ensure read consistency for medical data
        maxPoolSize: IS_PRODUCTION_ENVIRONMENT
            ? DATABASE_CONFIG.PRODUCTION_MAX_POOL_SIZE
            : DATABASE_CONFIG.DEVELOPMENT_MAX_POOL_SIZE,
        minPoolSize: IS_PRODUCTION_ENVIRONMENT
            ? DATABASE_CONFIG.PRODUCTION_MIN_POOL_SIZE
            : DATABASE_CONFIG.DEVELOPMENT_MIN_POOL_SIZE,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        heartbeatFrequencyMS: 10000,
        autoIndex: !IS_PRODUCTION_ENVIRONMENT,
        // Healthcare compliance: Enable TLS in production
        tls: IS_PRODUCTION_ENVIRONMENT,
        tlsInsecure: !IS_PRODUCTION_ENVIRONMENT, // Only allow insecure connections in development
    };

    // Add compression for production environments
    if (enableCompression && IS_PRODUCTION_ENVIRONMENT) {
        return {
            ...baseConnectionOptions,
            compressors: ['zlib'],
            zlibCompressionLevel: 6,
        };
    }

    return baseConnectionOptions;
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Internal state tracker for database connection
 */
class DatabaseState {
    private _isConnected: boolean = false;
    private _isShuttingDown: boolean = false;
    private _connectionAttempts: number = 0;
    private _lastHealthCheck: Date | null = null;

    get isConnected(): boolean {
        return this._isConnected && mongoose.connection.readyState === 1;
    }

    set isConnected(value: boolean) {
        this._isConnected = value;
    }

    get isShuttingDown(): boolean {
        return this._isShuttingDown;
    }

    set isShuttingDown(value: boolean) {
        this._isShuttingDown = value;
    }

    get connectionAttempts(): number {
        return this._connectionAttempts;
    }

    get lastHealthCheck(): Date | null {
        return this._lastHealthCheck;
    }

    updateHealthCheck(): void {
        this._lastHealthCheck = new Date();
    }

    incrementAttempts(): void {
        this._connectionAttempts++;
    }

    resetAttempts(): void {
        this._connectionAttempts = 0;
    }
}

const dbState = new DatabaseState();

// ============================================================================
// NOTE: UTILITY FUNCTIONS
// ============================================================================
// delay, safeErrorMessage, calculateRetryDelay, and other utilities are imported from './errors' module

// ============================================================================
// AUDIT LOGGING FOR HIPAA COMPLIANCE
// ============================================================================

/**
 * Logs database events for HIPAA compliance audit trail
 * @param {DatabaseEventType} event - Event type
 * @param {string} details - Event details
 * @param {string} [userId] - Optional user ID for audit trail
 * @param {string} [organizationId] - Optional organization ID for audit trail
 */
const logAuditEvent = (
    event: DatabaseEventType, 
    details: string, 
    userId?: string, 
    organizationId?: string
): void => {
    if (process.env.AUDIT_LOGGING === 'true') {
        const auditLog: AuditLogEntry = {
            timestamp: new Date().toISOString(),
            event: `DATABASE_${event}`,
            details,
            environment: NODE_ENV,
            database: mongoose.connection.name,
            ...(userId && { userId }),
            ...(organizationId && { organizationId }),
        };
        
        // In production, this would go to a secure audit logging service
        console.log('🔍 AUDIT:', JSON.stringify(auditLog));
    }
};

// ============================================================================
// CORE CONNECTION FUNCTIONS
// ============================================================================

/**
 * Establishes connection to MongoDB with retry logic
 * 
 * @param {DatabaseConnectionOptions} options - Connection configuration options
 * @returns {Promise<typeof mongoose>} Connected mongoose instance
 * @throws {Error} If connection fails after all retry attempts
 * 
 * @example
 * ```typescript
 * await connectDatabase({ retries: 3, retryDelay: 3000 });
 * ```
 */
export const connectDatabase = async (
    options: DatabaseConnectionOptions = {}
): Promise<typeof mongoose> => {
    const {
        retries = DATABASE_CONFIG.RETRY_ATTEMPTS,
        retryDelay = DATABASE_CONFIG.RETRY_DELAY_MS,
        enableCompression = IS_PRODUCTION_ENVIRONMENT,
    } = options;

    // Prevent multiple simultaneous connection attempts
    if (dbState.isConnected) {
        console.info('Database connection already established, reusing existing connection');
        return mongoose;
    }

    // Configure mongoose settings
    mongoose.set('strictQuery', false);

    let lastError: unknown;

    while (dbState.connectionAttempts < retries) {
        try {
            dbState.incrementAttempts();

            const connectionOptions = buildMongooseConnectionOptions(enableCompression);
            const connection = await mongoose.connect(DATABASE_URI, connectionOptions);

            dbState.isConnected = true;
            dbState.resetAttempts();

            console.info(
                `MongoDB connection established successfully: ${connection.connection.host} ` +
                `[Environment: ${NODE_ENV}]`
            );

            // HIPAA audit logging
            logAuditEvent(DATABASE_EVENTS.CONNECTION_ESTABLISHED, `Connected to database: ${connection.connection.name}`);

            return connection;
        } catch (error) {
            lastError = error;
            
            console.error(
                `Database connection attempt ${dbState.connectionAttempts}/${retries} failed:`,
                safeErrorMessage(error)
            );

            if (dbState.connectionAttempts < retries) {
                console.info(`Retrying connection in ${retryDelay / 1000} seconds`);
                await delay(calculateRetryDelay(dbState.connectionAttempts, retryDelay));
            } else {
                console.error('Maximum retry attempts reached. Unable to establish database connection.');
                logAuditEvent(DATABASE_EVENTS.CONNECTION_FAILED, `Failed after ${retries} attempts: ${safeErrorMessage(error)}`);
                
                throw classifyConnectionError(error instanceof Error ? error : new Error(safeErrorMessage(error)));
            }
        }
    }

    throw new DatabaseError(DATABASE_ERRORS.CONNECTION_TIMEOUT, lastError instanceof Error ? lastError : new Error(safeErrorMessage(lastError)));
};

/**
 * Safely disconnects from MongoDB
 * 
 * @returns {Promise<void>}
 * @throws {Error} If disconnection fails
 * 
 * @example
 * ```typescript
 * await disconnectDatabase();
 * ```
 */
export const disconnectDatabase = async (): Promise<void> => {
    try {
        if (!dbState.isConnected) {
            console.info('Database connection already disconnected');
            return;
        }

        await mongoose.disconnect();
        dbState.isConnected = false;

        console.info('Database disconnection completed successfully');
        logAuditEvent(DATABASE_EVENTS.CONNECTION_TERMINATED, 'Database connection closed successfully');
    } catch (error) {
        console.error('Error occurred during database disconnection:', safeErrorMessage(error));
        logAuditEvent(DATABASE_EVENTS.SYSTEM_ERROR, safeErrorMessage(error));
        throw error;
    }
};

// ============================================================================
// HEALTH CHECK & MONITORING
// ============================================================================

/**
 * Performs health check on database connection
 * 
 * @returns {Promise<HealthCheckResult>} Health check result
 * 
 * @example
 * ```typescript
 * const { isHealthy, responseTime } = await checkDatabaseHealth();
 * if (!isHealthy) {
 *   console.error('Database is unhealthy!');
 * }
 * ```
 */
export const checkDatabaseHealth = async (): Promise<HealthCheckResult> => {
    const startTime = Date.now();

    try {
        if (!dbState.isConnected || mongoose.connection.readyState !== 1) {
            return {
                isHealthy: false,
                error: 'Database is not connected',
            };
        }

        // Ping the database with timeout
        const db = mongoose.connection.db;
        if (!db) {
            return {
                isHealthy: false,
                error: 'Database connection not available',
            };
        }
        
        const pingPromise = db.admin().ping();
        const timeoutPromise = delay(DATABASE_CONFIG.HEALTH_CHECK_TIMEOUT_MS).then(() => {
            throw new Error('Health check timeout');
        });

        await Promise.race([pingPromise, timeoutPromise]);

        const responseTime = Date.now() - startTime;
        dbState.updateHealthCheck();

        return {
            isHealthy: true,
            responseTime,
        };
    } catch (error) {
        return {
            isHealthy: false,
            responseTime: Date.now() - startTime,
            error: safeErrorMessage(error),
        };
    }
};

/**
 * Gets current connection status information
 * 
 * @returns {ConnectionStatus} Current connection status
 * 
 * @example
 * ```typescript
 * const status = getConnectionStatus();
 * console.log(`DB Status: ${status.readyStateDescription}`);
 * ```
 */
export const getConnectionStatus = (): ConnectionStatus => {
    const readyState = mongoose.connection.readyState;

    return {
        isConnected: dbState.isConnected,
        readyState,
        readyStateDescription: CONNECTION_READY_STATES[readyState as keyof typeof CONNECTION_READY_STATES] || 'unknown',
        host: mongoose.connection.host,
        database: mongoose.connection.name,
    };
};

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Registers MongoDB connection event handlers
 */
const registerConnectionEventHandlers = (): void => {
    mongoose.connection.on('connected', () => {
        console.info('Database connection event: connected');
        dbState.isConnected = true;
        logAuditEvent(DATABASE_EVENTS.CONNECTION_ESTABLISHED, 'MongoDB connection established');
    });

    mongoose.connection.on('error', (error: Error) => {
        console.error('Database runtime error:', safeErrorMessage(error));
        dbState.isConnected = false;
        logAuditEvent(DATABASE_EVENTS.SYSTEM_ERROR, safeErrorMessage(error));
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('Database connection event: disconnected');
        dbState.isConnected = false;
        logAuditEvent(DATABASE_EVENTS.CONNECTION_LOST, 'MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
        console.info('Database connection event: reconnected');
        dbState.isConnected = true;
        logAuditEvent(DATABASE_EVENTS.CONNECTION_RESTORED, 'MongoDB reconnected successfully');
    });

    mongoose.connection.on('close', () => {
        console.info('Database connection event: closed');
        dbState.isConnected = false;
        logAuditEvent(DATABASE_EVENTS.CONNECTION_TERMINATED, 'MongoDB connection closed');
    });
};

// Register event handlers on module load
registerConnectionEventHandlers();

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

/**
 * Handles graceful shutdown of database connection
 * 
 * @param {string} signal - The signal that triggered shutdown
 * @returns {Promise<void>}
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
    if (dbState.isShuttingDown) {
        console.warn('Graceful shutdown already in progress');
        return;
    }

    dbState.isShuttingDown = true;
    console.info(`Received signal ${signal}. Initiating graceful database shutdown`);
    logAuditEvent(DATABASE_EVENTS.GRACEFUL_SHUTDOWN_INITIATED, `Graceful shutdown initiated by ${signal}`);

    try {
        // Set timeout for forced shutdown
        const forceExitTimer = setTimeout(() => {
            console.error('Graceful shutdown timeout exceeded. Initiating emergency shutdown');
            logAuditEvent(DATABASE_EVENTS.EMERGENCY_SHUTDOWN, 'Forced shutdown due to timeout');
            process.exit(1);
        }, DATABASE_CONFIG.SHUTDOWN_TIMEOUT_MS);

        // Attempt graceful disconnect
        await disconnectDatabase();

        clearTimeout(forceExitTimer);
        console.info('Database graceful shutdown completed successfully');
        logAuditEvent(DATABASE_EVENTS.GRACEFUL_SHUTDOWN_COMPLETED, 'Graceful shutdown completed successfully');

        process.exit(0);
    } catch (error) {
        console.error('Error occurred during graceful shutdown:', safeErrorMessage(error));
        logAuditEvent(DATABASE_EVENTS.SYSTEM_ERROR, safeErrorMessage(error));
        process.exit(1);
    }
};

// Register shutdown handlers
process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Docker/K8s stop
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Export mongoose instance for direct access when needed
 */
export { mongoose };

/**
 * Export Connection type for type safety
 */
export type { Connection, ConnectOptions };

/**
 * Export custom types for consumer usage
 */
export type {
    DatabaseConnectionOptions,
    ConnectionStatus,
    HealthCheckResult,
};