import mongoose from "mongoose";

import { error as errorResponse } from "../utils/response.js";

const isPlainObject = (value) => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

const toArray = (value) => {
  if (value === undefined || value === null || value === "") return [];
  return Array.isArray(value) ? value : [value];
};

const validators = {
  requiredString:
    (field, label = field, options = {}) =>
    (value) => {
      if (value === undefined || value === null || String(value).trim() === "") {
        return `${label} is required`;
      }

      if (options.minLength && String(value).trim().length < options.minLength) {
        return `${label} must be at least ${options.minLength} characters`;
      }

      return null;
    },

  optionalString:
    (field, label = field, options = {}) =>
    (value) => {
      if (value === undefined || value === null || value === "") {
        return null;
      }

      if (typeof value !== "string") {
        return `${label} must be a string`;
      }

      if (options.minLength && value.trim().length < options.minLength) {
        return `${label} must be at least ${options.minLength} characters`;
      }

      return null;
    },

  optionalEmail:
    (field, label = field) =>
    (value) => {
      if (value === undefined || value === null || value === "") return null;
      if (typeof value !== "string") return `${label} must be a valid email`;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value.trim()) ? null : `${label} must be a valid email`;
    },

  optionalNumber:
    (field, label = field, options = {}) =>
    (value) => {
      if (value === undefined || value === null || value === "") return null;
      const parsed = Number(value);
      if (Number.isNaN(parsed)) return `${label} must be a number`;
      if (options.min !== undefined && parsed < options.min) {
        return `${label} must be greater than or equal to ${options.min}`;
      }
      if (options.max !== undefined && parsed > options.max) {
        return `${label} must be less than or equal to ${options.max}`;
      }
      return null;
    },

  optionalInteger:
    (field, label = field, options = {}) =>
    (value) => {
      if (value === undefined || value === null || value === "") return null;
      const parsed = Number(value);
      if (!Number.isInteger(parsed)) return `${label} must be an integer`;
      if (options.min !== undefined && parsed < options.min) {
        return `${label} must be greater than or equal to ${options.min}`;
      }
      if (options.max !== undefined && parsed > options.max) {
        return `${label} must be less than or equal to ${options.max}`;
      }
      return null;
    },

  requiredObjectId:
    (field, label = field) =>
    (value) => {
      if (value === undefined || value === null || value === "") {
        return `${label} is required`;
      }
      return mongoose.Types.ObjectId.isValid(String(value)) ? null : `${label} is invalid`;
    },

  optionalObjectId:
    (field, label = field) =>
    (value) => {
      if (value === undefined || value === null || value === "") return null;
      return mongoose.Types.ObjectId.isValid(String(value)) ? null : `${label} is invalid`;
    },

  optionalEnum:
    (field, label = field, values = []) =>
    (value) => {
      if (value === undefined || value === null || value === "") return null;
      return values.includes(value) ? null : `${label} is invalid`;
    },

  optionalStringArray:
    (field, label = field) =>
    (value) => {
      if (value === undefined || value === null || value === "") return null;
      const items = Array.isArray(value) ? value : String(value).split(",");
      return items.every((item) => typeof item === "string")
        ? null
        : `${label} must be an array of strings`;
    },

  optionalObjectIdArray:
    (field, label = field) =>
    (value) => {
      if (value === undefined || value === null || value === "") return null;
      const items = toArray(value);
      return items.every((item) => mongoose.Types.ObjectId.isValid(String(item)))
        ? null
        : `${label} must contain valid ids`;
    },

  optionalBooleanString:
    (field, label = field) =>
    (value) => {
      if (value === undefined || value === null || value === "") return null;
      return ["true", "false", true, false].includes(value) ? null : `${label} is invalid`;
    },

  optionalObject:
    (field, label = field) =>
    (value) => {
      if (value === undefined || value === null) return null;
      return isPlainObject(value) ? null : `${label} must be an object`;
    },
};

const runValidationSet = (target, schema = {}) => {
  const details = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = target?.[field];
    for (const rule of rules) {
      const validationError = rule(value, target);
      if (validationError) {
        details.push({
          field,
          message: validationError,
        });
        break;
      }
    }
  }

  return details;
};

export const validateRequest = (schema = {}) => {
  return (req, res, next) => {
    const details = [
      ...runValidationSet(req.body, schema.body),
      ...runValidationSet(req.params, schema.params),
      ...runValidationSet(req.query, schema.query),
    ];

    if (details.length) {
      return errorResponse(res, "Request validation failed", "VALIDATION_ERROR", 400, details);
    }

    return next();
  };
};

export { validators };
