import { FirestoreError } from 'firebase/firestore';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 segundo
  maxDelay: 10000, // 10 segundos
  backoffMultiplier: 2
};

export class FirestoreErrorHandler {
  private static instance: FirestoreErrorHandler;
  private retryConfig: RetryConfig;

  private constructor(config: RetryConfig = DEFAULT_RETRY_CONFIG) {
    this.retryConfig = config;
  }

  public static getInstance(config?: RetryConfig): FirestoreErrorHandler {
    if (!FirestoreErrorHandler.instance) {
      FirestoreErrorHandler.instance = new FirestoreErrorHandler(config);
    }
    return FirestoreErrorHandler.instance;
  }

  /**
   * Determina si un error es recuperable y debe reintentarse
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof FirestoreError) {
      // Errores que pueden ser temporales y vale la pena reintentar
      const retryableCodes = [
        'unavailable',
        'deadline-exceeded',
        'resource-exhausted',
        'aborted',
        'internal',
        'cancelled'
      ];
      return retryableCodes.includes(error.code);
    }

    // Errores de red genéricos
    if (error.message) {
      const networkErrors = [
        'network error',
        'connection error',
        'timeout',
        'transport errored',
        'WebChannelConnection',
        'stream transport errored'
      ];
      return networkErrors.some(errorType => 
        error.message.toLowerCase().includes(errorType.toLowerCase())
      );
    }

    return false;
  }

  /**
   * Calcula el delay para el siguiente intento usando backoff exponencial
   */
  private calculateDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Espera un tiempo determinado
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Ejecuta una operación con reintentos automáticos
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'Firestore operation',
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.retryConfig, ...customConfig };
    let lastError: any;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Si es el último intento o el error no es recuperable, lanzar el error
        if (attempt === config.maxRetries || !this.isRetryableError(error)) {
          console.error(`${operationName} failed after ${attempt + 1} attempts:`, error);
          throw error;
        }

        // Calcular delay y esperar antes del siguiente intento
        const delayMs = this.calculateDelay(attempt);
        console.warn(
          `${operationName} failed (attempt ${attempt + 1}/${config.maxRetries + 1}). ` +
          `Retrying in ${delayMs}ms...`,
          error
        );
        
        await this.delay(delayMs);
      }
    }

    throw lastError;
  }

  /**
   * Maneja errores específicos de Firestore y proporciona mensajes amigables
   */
  public handleFirestoreError(error: any, context: string = ''): string {
    console.error(`Firestore error in ${context}:`, error);

    if (error instanceof FirestoreError) {
      switch (error.code) {
        case 'permission-denied':
          return 'No tienes permisos para realizar esta acción.';
        case 'not-found':
          return 'El recurso solicitado no fue encontrado.';
        case 'already-exists':
          return 'El recurso ya existe.';
        case 'resource-exhausted':
          return 'Se ha excedido el límite de recursos. Intenta nuevamente en unos momentos.';
        case 'failed-precondition':
          return 'La operación no se puede completar en el estado actual.';
        case 'aborted':
          return 'La operación fue cancelada debido a un conflicto. Intenta nuevamente.';
        case 'out-of-range':
          return 'Los parámetros están fuera del rango válido.';
        case 'unimplemented':
          return 'Esta funcionalidad no está implementada.';
        case 'internal':
          return 'Error interno del servidor. Intenta nuevamente.';
        case 'unavailable':
          return 'El servicio no está disponible temporalmente. Intenta nuevamente.';
        case 'deadline-exceeded':
          return 'La operación tardó demasiado tiempo. Intenta nuevamente.';
        case 'cancelled':
          return 'La operación fue cancelada.';
        case 'invalid-argument':
          return 'Los datos proporcionados no son válidos.';
        case 'unauthenticated':
          return 'Debes iniciar sesión para realizar esta acción.';
        default:
          return 'Ocurrió un error inesperado. Intenta nuevamente.';
      }
    }

    // Errores de conexión de red
    if (error.message && error.message.includes('transport errored')) {
      return 'Problemas de conexión. Verifica tu conexión a internet e intenta nuevamente.';
    }

    return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }

  /**
   * Wrapper para operaciones de lectura con manejo de errores
   */
  public async safeRead<T>(
    operation: () => Promise<T>,
    fallbackValue: T,
    context: string = 'read operation'
  ): Promise<T> {
    try {
      return await this.executeWithRetry(operation, context);
    } catch (error) {
      console.error(`Safe read failed in ${context}:`, error);
      return fallbackValue;
    }
  }

  /**
   * Wrapper para operaciones de escritura con manejo de errores
   */
  public async safeWrite<T>(
    operation: () => Promise<T>,
    context: string = 'write operation'
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const data = await this.executeWithRetry(operation, context);
      return { success: true, data };
    } catch (error) {
      const errorMessage = this.handleFirestoreError(error, context);
      return { success: false, error: errorMessage };
    }
  }
}

// Instancia singleton para uso global
export const firestoreErrorHandler = FirestoreErrorHandler.getInstance();

// Funciones de utilidad para uso directo
export const withRetry = <T>(
  operation: () => Promise<T>,
  operationName?: string,
  config?: Partial<RetryConfig>
): Promise<T> => {
  return firestoreErrorHandler.executeWithRetry(operation, operationName, config);
};

export const safeFirestoreRead = <T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  context?: string
): Promise<T> => {
  return firestoreErrorHandler.safeRead(operation, fallbackValue, context);
};

export const safeFirestoreWrite = <T>(
  operation: () => Promise<T>,
  context?: string
): Promise<{ success: boolean; data?: T; error?: string }> => {
  return firestoreErrorHandler.safeWrite(operation, context);
};

// Funciones de ayuda más simples que devuelven valores directamente
export const safeFirestoreWriteSimple = async <T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> => {
  const result = await firestoreErrorHandler.safeWrite(operation, context);
  if (result.success) {
    // Para operaciones que no retornan datos (como updateDoc), data puede ser undefined
    // pero la operación sigue siendo exitosa
    return result.data as T;
  }
  throw new Error(result.error || 'Operation failed');
};

export const safeFirestoreReadSimple = async <T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  context?: string
): Promise<T> => {
  return firestoreErrorHandler.safeRead(operation, fallbackValue, context);
};