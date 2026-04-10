import { z } from "zod";

/**
 * Shared Zod Schemas for consistent validation across the dashboard
 */

// Schema for login
export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ").min(1, "Vui lòng nhập email"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

// Schema for register
export const registerSchema = loginSchema
  .extend({
    confirmPassword: z.string().min(6, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

// Schema for AI Vision Image Upload
export const visionUploadSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  files: z
    .array(z.any())
    .min(1, "Please upload at least one image")
    .refine((files) => files.every((file) => file.size <= 5 * 1024 * 1024), {
      message: "Each file must be less than 5MB",
    })
    .refine(
      (files) => files.every((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type)),
      {
        message: "Only .jpg, .png, and .webp formats are supported",
      }
    ),
});

// Schema for User Settings
export const settingsSchema = z.object({
  username: z.string().min(2, "Username is too short"),
  email: z.string().email("Invalid email address"),
  notifications: z.boolean().default(true),
});
