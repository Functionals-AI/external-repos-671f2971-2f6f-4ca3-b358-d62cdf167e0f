export class ApiRequestError extends Error {
  public code: string;
  public trace?: string;
  public extra?: any;

  constructor(message: string, code: string, trace?: string, extra?: any) {
    super(message);
    this.code = code;
    this.trace = trace;
    this.extra = extra;
  }
}

export class DeveloperError extends Error {
  public type = 'DEVELOPER_ERROR';
}
