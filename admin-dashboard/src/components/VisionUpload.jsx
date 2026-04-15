import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileImage, CheckCircle2, AlertCircle } from "lucide-react";
import { visionUploadSchema } from "@/lib/form-schemas";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api-client";

/**
 * Premium Vision Upload Component
 * Combines React Hook Form, Zod, and React Dropzone with Framer Motion animations.
 */
export const VisionUpload = () => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(visionUploadSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      files: [],
    },
  });

  const files = watch("files");

  const onDrop = useCallback(
    (acceptedFiles) => {
      setValue("files", [...files, ...acceptedFiles], { shouldValidate: true });
    },
    [files, setValue],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".png", ".webp"] },
  });

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setValue("files", newFiles, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    try {
      console.log("Submitting AI Vision Job:", data);

      // Simulate API Call
      const formData = new FormData();
      formData.append("title", data.title);
      data.files.forEach((file) => formData.append("images", file));

      // await apiClient.post('/vision/analyze', formData);

      await new Promise((resolve) => setTimeout(resolve, 1500)); // Mock delay
      alert("AI Vision analysis started successfully!");
      reset();
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-card border border-border/40 rounded-xl shadow-lg max-w-xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Upload className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold">New Vision Task</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1.5 opacity-80">
            Task Title
          </label>
          <input
            {...register("title")}
            placeholder="e.g., Street Obstacle Detection"
            className={`w-full px-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all ${
              errors.title ? "border-destructive" : "border-border"
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.title.message}
            </p>
          )}
        </div>

        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer text-center ${
            isDragActive
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border bg-background/50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <div
              className={`p-4 rounded-full transition-colors ${isDragActive ? "bg-primary/20" : "bg-muted"}`}
            >
              <FileImage
                className={`w-8 h-8 ${isDragActive ? "text-primary" : "text-muted-foreground"}`}
              />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {isDragActive
                ? "Drop images here"
                : "Drag & drop images here, or click to browse"}
            </p>
            <p className="text-xs opacity-50">
              Support: JPG, PNG, WEBP (Max 5MB per file)
            </p>
          </div>
        </div>

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 gap-3"
            >
              {files.map((file, idx) => (
                <motion.div
                  key={idx + file.name}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 p-2 bg-muted/50 border rounded-lg group"
                >
                  <FileImage className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs truncate flex-1">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="p-1 hover:bg-destructive/10 hover:text-destructive rounded opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {errors.files && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.files.message}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 animate-spin-slow" />{" "}
              Analyzing...
            </span>
          ) : (
            "Start AI Analysis"
          )}
        </Button>
      </form>
    </motion.div>
  );
};
