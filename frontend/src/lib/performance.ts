/**
 * Performance measurement utilities
 */

interface PerformanceResult {
  duration: number;
  startTime: number;
  endTime: number;
}

/**
 * Measures the execution time of an asynchronous function
 * @param fn The function to measure
 * @param label A label for the measurement
 * @returns The result of the function and performance metrics
 */
export const measurePerformance = async <T>(
  fn: () => Promise<T>,
  _label: string = 'Operation'
): Promise<PerformanceResult & { result: T }> => {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  // Log performance in development
  if (process.env.NODE_ENV === 'development') {

  }

  return {
    duration,
    startTime,
    endTime,
    result
  };
};

/**
 * Measures the execution time of a synchronous function
 * @param fn The function to measure
 * @param label A label for the measurement
 * @returns The result of the function and performance metrics
 */
export const measureSyncPerformance = <T>(
  fn: () => T,
  _label: string = 'Operation'
): PerformanceResult & { result: T } => {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  // Log performance in development
  if (process.env.NODE_ENV === 'development') {

  }

  return {
    duration,
    startTime,
    endTime,
    result
  };
};

/**
 * Performance monitoring decorator
 * Can be used to wrap components or functions for performance tracking
 */
export class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();

  /**
   * Records a performance measurement
   * @param label The label for the measurement
   * @param duration The duration of the operation
   */
  record(label: string, duration: number) {
    if (!this.measurements.has(label)) {
      this.measurements.set(label, []);
    }
    this.measurements.get(label)?.push(duration);
  }

  /**
   * Gets average performance for a label
   * @param label The label to get average for
   * @returns The average duration
   */
  getAverage(label: string): number | null {
    const durations = this.measurements.get(label);
    if (!durations || durations.length === 0) {
      return null;
    }
    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }

  /**
   * Gets all recorded measurements
   */
  getAllMeasurements() {
    return new Map(this.measurements);
  }

  /**
   * Clears all measurements
   */
  clear() {
    this.measurements.clear();
  }
}

// Global performance monitor instance
export const globalPerformanceMonitor = new PerformanceMonitor();