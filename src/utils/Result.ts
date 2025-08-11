/**
 * Result pattern implementation for consistent error handling
 * Replaces scattered try-catch blocks and console.log statements
 */

/**
 * Result type that represents either success with data or failure with error
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * Create a successful result
 */
export function success<T>(data: T): Result<T, never> {
  return { success: true, data }
}

/**
 * Create a failed result
 */
export function failure<E>(error: E): Result<never, E> {
  return { success: false, error }
}

/**
 * Utility functions for working with Results
 */
export namespace Result {
  
  /**
   * Check if result is successful
   */
  export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
    return result.success
  }

  /**
   * Check if result is a failure
   */
  export function isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E } {
    return !result.success
  }

  /**
   * Map the data of a successful result
   */
  export function map<T, U, E>(
    result: Result<T, E>,
    mapper: (data: T) => U
  ): Result<U, E> {
    if (isSuccess(result)) {
      return success(mapper(result.data))
    }
    return result
  }

  /**
   * Map the error of a failed result
   */
  export function mapError<T, E, F>(
    result: Result<T, E>,
    mapper: (error: E) => F
  ): Result<T, F> {
    if (isFailure(result)) {
      return failure(mapper(result.error))
    }
    return result
  }

  /**
   * Chain operations that return Results
   */
  export function flatMap<T, U, E>(
    result: Result<T, E>,
    mapper: (data: T) => Result<U, E>
  ): Result<U, E> {
    if (isSuccess(result)) {
      return mapper(result.data)
    }
    return result
  }

  /**
   * Get data from result or provide default value
   */
  export function getOrElse<T, E>(result: Result<T, E>, defaultValue: T): T {
    return isSuccess(result) ? result.data : defaultValue
  }

  /**
   * Get data from result or throw error
   */
  export function unwrap<T, E>(result: Result<T, E>): T {
    if (isSuccess(result)) {
      return result.data
    }
    throw result.error
  }

  /**
   * Combine multiple results - all must succeed
   */
  export function combine<T extends readonly unknown[]>(
    results: { [K in keyof T]: Result<T[K], any> }
  ): Result<T, any> {
    const data: any[] = []
    
    for (const result of results) {
      if (isFailure(result)) {
        return result
      }
      data.push(result.data)
    }
    
    return success(data as T)
  }

  /**
   * Run async operation and wrap in Result
   */
  export async function fromAsync<T>(
    operation: () => Promise<T>
  ): Promise<Result<T, Error>> {
    try {
      const data = await operation()
      return success(data)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Run sync operation and wrap in Result
   */
  export function fromSync<T>(operation: () => T): Result<T, Error> {
    try {
      const data = operation()
      return success(data)
    } catch (error) {
      return failure(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Match on Result type for pattern matching
   */
  export function match<T, E, U>(
    result: Result<T, E>,
    onSuccess: (data: T) => U,
    onFailure: (error: E) => U
  ): U {
    return isSuccess(result) ? onSuccess(result.data) : onFailure(result.error)
  }
}

/**
 * Domain-specific error types
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class CoordinateTransformError extends Error {
  constructor(message: string, public transform?: any) {
    super(message)
    this.name = 'CoordinateTransformError'
  }
}

export class RenderingError extends Error {
  constructor(message: string, public context?: any) {
    super(message)
    this.name = 'RenderingError'
  }
}

export class ConfigurationError extends Error {
  constructor(message: string, public config?: any) {
    super(message)
    this.name = 'ConfigurationError'
  }
}

export class ExportError extends Error {
  constructor(message: string, public format?: string) {
    super(message)
    this.name = 'ExportError'
  }
}

export class AnnotationError extends Error {
  constructor(message: string, public annotationId?: string) {
    super(message)
    this.name = 'AnnotationError'
  }
}

export class ContourProcessingError extends Error {
  constructor(message: string, public contourData?: any) {
    super(message)
    this.name = 'ContourProcessingError'
  }
}

/**
 * Utility for safe JSON parsing
 */
export function safeJsonParse<T>(json: string): Result<T, Error> {
  return Result.fromSync(() => JSON.parse(json))
}

/**
 * Utility for safe number parsing
 */
export function safeParseNumber(value: string): Result<number, ValidationError> {
  const num = Number(value)
  if (isNaN(num)) {
    return failure(new ValidationError(`Invalid number: ${value}`))
  }
  return success(num)
}

/**
 * Utility for safe array access
 */
export function safeArrayAccess<T>(array: T[], index: number): Result<T, Error> {
  if (index < 0 || index >= array.length) {
    return failure(new Error(`Array index ${index} out of bounds (length: ${array.length})`))
  }
  return success(array[index])
}

/**
 * Utility for safe object property access
 */
export function safeProp<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K
): Result<T[K], Error> {
  if (obj == null) {
    return failure(new Error(`Cannot access property '${String(key)}' of null or undefined`))
  }
  
  if (!(key in obj)) {
    return failure(new Error(`Property '${String(key)}' not found in object`))
  }
  
  return success(obj[key])
}

/**
 * Logger interface for Result-based logging
 */
export interface Logger {
  info(message: string, data?: any): void
  warn(message: string, data?: any): void
  error(message: string, error?: Error): void
  debug(message: string, data?: any): void
}

/**
 * Default console logger implementation
 */
export class ConsoleLogger implements Logger {
  private shouldLog(level: string): boolean {
    // Only log errors and warnings in production
    if (process.env.NODE_ENV === 'production') {
      return level === 'error' || level === 'warn'
    }
    return true
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, data || '')
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, data || '')
    }
  }

  error(message: string, error?: Error): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, error || '')
    }
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, data || '')
    }
  }
}

/**
 * No-op logger for testing
 */
export class NoOpLogger implements Logger {
  info(): void {}
  warn(): void {}
  error(): void {}
  debug(): void {}
}

/**
 * Global logger instance
 */
export const logger: Logger = new ConsoleLogger()

/**
 * Set global logger
 */
export function setLogger(newLogger: Logger): void {
  (globalThis as any).logger = newLogger
}

/**
 * Utility to log and return result
 */
export function logResult<T, E>(
  result: Result<T, E>,
  operation: string,
  logger: Logger = (globalThis as any).logger || new ConsoleLogger()
): Result<T, E> {
  if (Result.isSuccess(result)) {
    logger.debug(`${operation} succeeded`)
  } else {
    logger.error(`${operation} failed`, result.error as any)
  }
  
  return result
}