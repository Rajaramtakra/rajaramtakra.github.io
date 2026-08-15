import swaggerJsdoc from "swagger-jsdoc";
import path from "node:path";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "School ERP API",
      version: "0.1.0",
      description: "REST API for the School ERP & Management System (Phase 1: Auth, Academics, Admissions, Students).",
    },
    servers: [{ url: "/api", description: "API base path" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(__dirname, "../modules/**/*.routes.ts"), path.join(__dirname, "../modules/**/*.routes.js")],
});
