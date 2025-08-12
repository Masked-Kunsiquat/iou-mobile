// src/services/errors.ts
export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessError';

    // Ensure instanceof works in ES5/transpiled environments
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, BusinessError.prototype);
    } else {
      /* istanbul ignore next */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).__proto__ = BusinessError.prototype;
    }

    // Preserve a useful stack trace
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const capture = (Error as any).captureStackTrace;
    if (typeof capture === 'function') {
      capture(this, BusinessError);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}
