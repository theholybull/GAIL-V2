import { createGailHttpServer } from "./http-server";
import { DOMAIN_ROUTES } from "./routes/domain-routes";

export const apiModule = {
  name: "gail-api",
  status: "http-server-wired",
  notes: "Node HTTP server is wired to the domain services for create/list/update endpoints.",
  routes: DOMAIN_ROUTES,
  serverFactory: createGailHttpServer,
};
