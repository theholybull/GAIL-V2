import { loadEnvironmentFiles } from "./env-loader";
import { createGailHttpServer } from "./api/http-server";

loadEnvironmentFiles();

const requestedPort = process.env.GAIL_BACKEND_PORT;
const requestedHost = process.env.GAIL_BACKEND_HOST;
const port = requestedPort ? Number(requestedPort) : 4180;
const normalizedHost = requestedHost?.trim();
const host = !normalizedHost || /^(127\.0\.0\.1|localhost|::1)$/i.test(normalizedHost)
	? "0.0.0.0"
	: normalizedHost;

const app = createGailHttpServer({ port, host });
const result = app.start();

console.log(`Gail backend listening on ${result.host}:${result.port} with ${result.routeCount} routes.`);
