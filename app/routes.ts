import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/analyze", "routes/api.analyze.ts"),
  route("api/token", "routes/api.token.ts"),
  route("api/history", "routes/api.history.ts"),
  route("api/compare", "routes/api.compare.ts"),
  route("api/portfolio", "routes/api.portfolio.ts"),
  route("api/portfolio-analyze", "routes/api.portfolio.analyze.ts"),
] satisfies RouteConfig;