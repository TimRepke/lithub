/* eslint-disable max-classes-per-file, no-underscore-dangle, lines-between-class-members */
import type { AxiosResponse } from "axios";

export class CancelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CancelError";
  }

  public get isCancelled(): boolean {
    return true;
  }
}

export interface OnCancel {
  readonly isResolved: boolean;
  readonly isRejected: boolean;
  readonly isCancelled: boolean;

  (cancelHandler: () => void): void;
}

export enum ErrorLevel {
  WARNING = "WARNING",
  ERROR = "ERROR",
}

export type ErrorDetails = {
  level: ErrorLevel;
  type: string;
  message: string;
  args?: unknown[];
  error?: Error;
};

type ApiResponseBase = {
  readonly ok: boolean;
  readonly status: number;
  readonly response?: AxiosResponse;
};

export type ApiResponse<T> = ApiResponseBase & { data: T };
export type ApiResponseReject = ApiResponseBase & { error: ErrorDetails };

export function ignore() {}

export function logReject(reason: ApiResponseReject) {
  console.error(reason);
}

export class CancelablePromise<T> implements Promise<ApiResponse<T>> {
  readonly [Symbol.toStringTag]!: string;

  private _isResolved: boolean;

  private _isRejected: boolean;

  private _isCancelled: boolean;

  private readonly _cancelHandlers: (() => void)[];

  private readonly _promise: Promise<ApiResponse<T>>;

  private _resolve?: (value: ApiResponse<T> | PromiseLike<ApiResponse<T>>) => void;

  private _reject?: (reason?: ApiResponseReject) => void;

  constructor(
    executor: (
      resolve: (value: ApiResponse<T> | PromiseLike<ApiResponse<T>>) => void,
      reject: (reason?: ApiResponseReject) => void,
      onCancel: OnCancel
    ) => void
  ) {
    this._isResolved = false;
    this._isRejected = false;
    this._isCancelled = false;
    this._cancelHandlers = [];
    this._promise = new Promise<ApiResponse<T>>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;

      const onResolve = (value: ApiResponse<T> | PromiseLike<ApiResponse<T>>): void => {
        if (this._isResolved || this._isRejected || this._isCancelled) {
          return;
        }
        this._isResolved = true;
        this._resolve?.(value);
      };

      const onReject = (reason?: ApiResponseReject): void => {
        if (this._isResolved || this._isRejected || this._isCancelled) {
          return;
        }
        this._isRejected = true;
        this._reject?.(reason);
      };

      const onCancel = (cancelHandler: () => void): void => {
        if (this._isResolved || this._isRejected || this._isCancelled) {
          return;
        }
        this._cancelHandlers.push(cancelHandler);
      };

      Object.defineProperty(onCancel, "isResolved", {
        get: (): boolean => this._isResolved,
      });

      Object.defineProperty(onCancel, "isRejected", {
        get: (): boolean => this._isRejected,
      });

      Object.defineProperty(onCancel, "isCancelled", {
        get: (): boolean => this._isCancelled,
      });

      // eslint-disable-next-line no-promise-executor-return
      return executor(onResolve, onReject, onCancel as OnCancel);
    });
  }

  public then<TResult1 = ApiResponse<T>, TResult2 = ApiResponseReject>(
    onFulfilled?: ((value: ApiResponse<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onRejected?: ((reason: ApiResponseReject) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this._promise.then(onFulfilled, onRejected);
  }

  public catch<TResult = ApiResponseReject>(
    onRejected?: ((reason: ApiResponseReject) => TResult | PromiseLike<TResult>) | null
  ): Promise<ApiResponse<T> | TResult> {
    return this._promise.catch(onRejected);
  }

  public finally(onFinally?: (() => void) | null): Promise<ApiResponse<T>> {
    return this._promise.finally(onFinally);
  }

  public cancel(): void {
    if (this._isResolved || this._isRejected || this._isCancelled) {
      return;
    }
    this._isCancelled = true;
    if (this._cancelHandlers.length) {
      try {
        // eslint-disable-next-line no-restricted-syntax
        for (const cancelHandler of this._cancelHandlers) {
          cancelHandler();
        }
      } catch (error) {
        console.warn("Cancellation threw an error", error);
        return;
      }
    }
    this._cancelHandlers.length = 0;
    this._reject?.({
      // new CancelError('Request aborted')
      ok: false,
      status: -1,
      response: undefined,
      error: {
        level: ErrorLevel.WARNING,
        message: "Request aborted",
        type: "CancelError",
      },
    });
  }

  public get isCancelled(): boolean {
    return this._isCancelled;
  }
}
