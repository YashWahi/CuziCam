/**
 * Render start shim when Start Command is copied from backend (`node dist/index.js`).
 * Spawns the real FastAPI app via Uvicorn.
 */
const path = require("path");
const { spawn } = require("child_process");

const root = path.join(__dirname, "..");
const port = process.env.PORT || "8000";

const child = spawn(
  "python",
  ["-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", port],
  { stdio: "inherit", cwd: root, env: process.env }
);

child.on("exit", (code) => process.exit(code ?? 1));
