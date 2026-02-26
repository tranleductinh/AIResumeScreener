import mongoose from "mongoose";

async function connectDB() {
  try {
    const res = await mongoose.connect(process.env.MONGO_URI);
    console.log("Connect Mongo Successful");
  } catch (error) {
    console.log("Connect Mongo Error", error);
    process.exit(1);
  }
}

export default connectDB;
