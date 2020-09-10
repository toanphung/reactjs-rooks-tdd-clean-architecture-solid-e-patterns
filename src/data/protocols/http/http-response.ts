export enum HttpStatusCode {
  ok = 200,
  noContent = 204,
  badRequest = 400,
  unathorized = 401,
  notFound = 404,
  serverError = 500,
}

export type HttpResponse<Res> = {
  statusCode: HttpStatusCode
  body?: Res
}
