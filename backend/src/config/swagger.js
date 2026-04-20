import swaggerJSDoc from "swagger-jsdoc";

const getServerUrl = () => {
  const port = process.env.PORT || 5000;
  return process.env.API_BASE_URL || `http://localhost:${port}`;
};

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Smart Campus Companion API",
      version: "1.0.0",
      description:
        "Auto-generated API docs for testing SCC backend endpoints.",
    },
    servers: [
      {
        url: getServerUrl(),
        description: "Current API server",
      },
    ],
    tags: [
      { name: "System", description: "System and health endpoints" },
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Groups", description: "Study group endpoints" },
      { name: "Notes", description: "Note management endpoints" },
      { name: "Files", description: "File upload/download endpoints" },
      { name: "Messages", description: "Realtime/chat messaging endpoints" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    paths: {
      "/": {
        get: {
          tags: ["System"],
          summary: "API root",
          responses: {
            200: {
              description: "API info",
            },
          },
        },
      },
      "/api/health": {
        get: {
          tags: ["System"],
          summary: "Health check",
          responses: {
            200: {
              description: "Server health status",
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js", "./src/server.js"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;