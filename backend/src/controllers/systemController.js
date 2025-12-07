import { checkDatabaseConnection } from "../services/systemService.js";

export async function getDatabaseStatus(req, res) {
  try {
    const result = await checkDatabaseConnection();

    if (result && result.ok === 1) {
      return res.json({
        status: "OK",
        db: "connected",
        details: result,
      });
    }

    return res.status(500).json({
      status: "ERROR",
      db: "unexpected_result",
      details: result,
    });
  } catch (error) {
    console.error("DB status check failed:", error);
    return res.status(500).json({
      status: "ERROR",
      db: "connection_failed",
      error: error.message,
    });
  }
}
