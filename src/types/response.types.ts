//Base ────────────────────────────────────────────────────────────────────
export interface IBaseApiResponse {
  ok: boolean;
  mensaje: string;
  timestamp: Date;
}

//Éxito ───────────────────────────────────────────────────────────────────
export interface ISuccessResponse<T> extends IBaseApiResponse {
  ok: true;
  datos: T;
}

//Error ───────────────────────────────────────────────────────────────────
export interface IErrorResponse extends IBaseApiResponse {
  ok: false;
  errores?: string[];
  errorCode?: string;
}
