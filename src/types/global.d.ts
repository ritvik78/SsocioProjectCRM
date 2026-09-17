export {};

declare global {
  type RouteContext<Route extends string> = {
    params: Promise<Record<string, string>>;
    __route?: Route extends string ? "/" : never;
  };
}