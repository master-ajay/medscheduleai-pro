/**
 * @fileoverview Database Error Handling Utilities
 * @description Professional error handling, classification, and recovery strategies
 *              for database operations in healthcare environment
 * 
 * @author MedScheduleAI Pro Engineering Team
 * @version 1.0.0
 * @since 1.0.0
 * @lastModified 2024-12-19
 * 
 * @security HIPAA Compliant - Secure error handling without PHI exposure
 */

import { DATABASE_ERRORS } from './constants';

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

/**
 * Custom database error class with enhanced error information
 * @description Provides structured error handling with actionable information
 */
export class DatabaseError extends Error {
    public readonly code: string;
    public readonly severity: string;
    public readonly action: string;
    public readonly timestamp: Date;
    public readonly originalError?: Error;

    constructor(
        errorConfig: typeof DATABASE_ERRORS[keyof typeof DATABASE_ERRORS],
        originalError?: Error
    ) {
        super(errorConfig.message);
        
        this.name = 'DatabaseError';
        this.code = errorConfig.code;
        this.severity = errorConfig.severity;
        this.action = errorConfig.action;
        this.timestamp = new Date();
        this.originalError = originalError;

        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DatabaseError);
        }
    }

    /**
     * Returns a sanitized error object safe for logging
     * @description Removes sensitive information while preserving debugging data
     */
    public toSafeObject(): Record<string, unknown> {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            severity: this.severity,
            action: this.action,
            timestamp: this.timestamp.toISOString(),
            stack: this.stack,
            // Exclude originalError to prevent sensitive data leakage
        };
    }

    /**
     * Returns a user-friendly error message
     * @description Provides non-technical error message for end users
     */
    public getUserMessage(): string {
        switch (this.severity) {
            case 'CRITICAL':
                return 'A critical system error occurred. Please contact support immediately.';
            case 'HIGH':
                return 'A system error occurred. Please try again or contact support if the problem persists.';
            case 'MEDIUM':
                return 'A temporary issue occurred. Please try again in a few moments.';
            default:
                return 'An error occurred. Please try again.';
        }
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a delay promise for retry logic and health checks
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the specified delay
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// ERROR CLASSIFICATION UTILITIES
// ============================================================================

/**
 * Classifies MongoDB connection errors into standardized categories
 * @param error - The original MongoDB error
 * @returns Classified DatabaseError with appropriate error configuration
 */
export function classifyConnectionError(error: Error): DatabaseError {
    const errorMessage = error.message.toLowerCase();
    
    // Connection timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        return new DatabaseError(DATABASE_ERRORS.CONNECTION_TIMEOUT, error);
    }
    
    // Connection refused errors
    if (errorMessage.includes('econnrefused') || errorMessage.includes('connection refused')) {
        return new DatabaseError(DATABASE_ERRORS.CONNECTION_REFUSED, error);
    }
    
    // Authentication errors
    if (errorMessage.includes('authentication failed') || 
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('invalid credentials')) {
        return new DatabaseError(DATABASE_ERRORS.AUTHENTICATION_FAILED, error);
    }
    
    // Generic connection error
    return new DatabaseError(DATABASE_ERRORS.CONNECTION_TIMEOUT, error);
}

/**
 * Determines if an error is recoverable through retry
 * @param error - The error to evaluate
 * @returns True if the error might be resolved by retrying
 */
export function isRecoverableError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    
    // Network-related errors that might be temporary
    const recoverablePatterns = [
        'timeout',
        'network',
        'temporary',
        'connection reset',
        'connection lost',
        'server selection',
        'dns'
    ];
    
    // Authentication and configuration errors are generally not recoverable
    const nonRecoverablePatterns = [
        'authentication failed',
        'unauthorized',
        'invalid credentials',
        'access denied',
        'bad auth',
        'authentication error'
    ];
    
    // Check for non-recoverable patterns first
    if (nonRecoverablePatterns.some(pattern => errorMessage.includes(pattern))) {
        return false;
    }
    
    // Check for recoverable patterns
    return recoverablePatterns.some(pattern => errorMessage.includes(pattern));
}

/**
 * Calculates retry delay with exponential backoff
 * @param attempt - Current retry attempt number (1-based)
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay in milliseconds
 * @returns Calculated delay in milliseconds
 */
export function calculateRetryDelay(
    attempt: number, 
    baseDelay: number = 1000, 
    maxDelay: number = 30000
): number {
    // Exponential backoff with jitter
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    
    // Add jitter (±25% randomization) to prevent thundering herd
    const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
    
    return Math.floor(exponentialDelay + jitter);
}

// ============================================================================
// ERROR LOGGING UTILITIES
// ============================================================================

/**
 * Safely extracts error message from unknown error types
 * @param error - Error of unknown type
 * @returns Safe string representation of the error
 */
export function safeErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    
    if (typeof error === 'string') {
        return error;
    }
    
    if (error && typeof error === 'object') {
        // Handle error-like objects
        const errorObj = error as Record<string, unknown>;
        if (typeof errorObj.message === 'string') {
            return errorObj.message;
        }
        if (typeof errorObj.error === 'string') {
            return errorObj.error;
        }
    }
    
    return 'Unknown error occurred';
}

/**
 * Sanitizes error for secure logging (removes sensitive information)
 * @param error - Error to sanitize
 * @returns Sanitized error information safe for logging
 */
export function sanitizeErrorForLogging(error: unknown): Record<string, unknown> {
    if (error instanceof DatabaseError) {
        return error.toSafeObject();
    }
    
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
        };
    }
    
    return {
        error: safeErrorMessage(error),
        timestamp: new Date().toISOString(),
        type: typeof error,
    };
}

// ============================================================================
// RECOVERY STRATEGIES
// ============================================================================

/**
 * Error recovery strategy interface
 */
export interface RecoveryStrategy {
    canRecover: (error: Error) => boolean;
    recover: (error: Error) => Promise<boolean>;
    description: string;
}

/**
 * Built-in recovery strategies for common database issues
 */
export const RECOVERY_STRATEGIES: Record<string, RecoveryStrategy> = {
    CONNECTION_RETRY: {
        canRecover: isRecoverableError,
        recover: async (): Promise<boolean> => {
            // Recovery handled by connection retry logic
            return true;
        },
        description: 'Retry connection with exponential backoff'
    },
    
    HEALTH_CHECK_RETRY: {
        canRecover: (error: Error): boolean => {
            return error.message.includes('timeout') || error.message.includes('health check');
        },
        recover: async (): Promise<boolean> => {
            // Health check recovery handled by monitoring system
            return true;
        },
        description: 'Retry health check with extended timeout'
    }
};