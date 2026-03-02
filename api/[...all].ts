/**
 * Minimal API handler so Vercel deploy completes (no heavy Express bundle).
 * The full API lives in api-express/; see api-express/README.md to re-enable.
 */
export default function handler(_req: any, res: any) {
  res.status(503).setHeader("Content-Type", "application/json").json({
    error: "API not deployed",
    message:
      "Backend is disabled so the frontend deploy can finish. To enable: see api-express/README.md",
  });
}
