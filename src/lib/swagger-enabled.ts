// Swagger (the /swagger page and the /api/docs spec) is off unless SWAGGER_ENABLED=true. Read on
// the server at request time: NEXT_PUBLIC_SWAGGER_ENABLED was never read by the app, and a
// NEXT_PUBLIC_ value would be fixed at build time anyway.
export function swaggerEnabled(): boolean {
    return process.env.SWAGGER_ENABLED === "true";
}
