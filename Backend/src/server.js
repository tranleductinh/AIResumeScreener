import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import connectDB from "./config/db.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 5000;

async function startServer() {
  try {
    const connection = await connectDB();

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

startServer();
