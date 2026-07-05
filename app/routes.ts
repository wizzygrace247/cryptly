import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/analyze", "routes/api.analyze.ts"),
  route("api/token", "routes/api.token.ts"),
] satisfies RouteConfig;