import dotenv from "dotenv";
import connectDB from "./config/db.js";
import createApp from "./app.js";
dotenv.config();

export const app = createApp();

const port = process.env.PORT || 3000;

export async function startServer() {
  try {
    await connectDB();

    return app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}
