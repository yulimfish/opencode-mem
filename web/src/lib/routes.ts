export const ROUTES = {
  home: "/",
  project: "/project-memories",
  graph: "/graph",
  profile: "/user-profile",
} as const;

export type AppView = "project" | "graph" | "profile";

export function normalizePath(pathname: string): string {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export function viewFromPath(pathname: string): AppView {
  const path = normalizePath(pathname);
  if (path === ROUTES.profile) return "profile";
  if (path === ROUTES.graph) return "graph";
  return "project";
}

export function pathForView(view: AppView): string {
  if (view === "profile") return ROUTES.profile;
  if (view === "graph") return ROUTES.graph;
  return ROUTES.project;
}

export function isAppPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return (
    path === ROUTES.home ||
    path === ROUTES.project ||
    path === ROUTES.graph ||
    path === ROUTES.profile
  );
}

/** Canonical app path — `/` redirects to project memories. */
export function resolveAppPath(pathname: string): string {
  const path = normalizePath(pathname);
  if (path === ROUTES.home) return ROUTES.project;
  if (path === ROUTES.project || path === ROUTES.graph || path === ROUTES.profile) return path;
  return ROUTES.project;
}
