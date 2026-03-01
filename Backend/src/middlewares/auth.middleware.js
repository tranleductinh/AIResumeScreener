import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { error } from "../utils/response.js";
import dotenv from "dotenv";
dotenv.config();

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return error(res, "You are not authorized", "UNAUTHORIZED", 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const decode = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decode.id).select("-passwordHash");
    if (!user) {
      return error(res, "User not found", "UNAUTHORIZED", 401);
    }
    req.user = user;
    next();
  } catch (err) {
    return error(res, "Token is not valid", "UNAUTHORIZED", 401);
  }
};
