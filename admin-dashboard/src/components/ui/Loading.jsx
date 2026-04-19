import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Premium Loading Component
 * Supports multiple variants: "full" (page overlay), "box" (centered in container), "inline" (small spinner)
 */
export default function Loading({ variant = "box", className, size = "md", text }) {
  const sizes = {
    xs: "w-4 h-4 border-2",
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-[3px]",
    lg: "w-16 h-16 border-4",
    xl: "w-24 h-24 border-[5px]",
  };

  const containerClasses = cn(
    "flex flex-col items-center justify-center gap-4",
    variant === "full" && "fixed inset-0 z-[100] bg-bg-primary/80 backdrop-blur-md",
    variant === "box" && "w-full py-12",
    variant === "inline" && "inline-flex",
    className
  );

  return (
    <div className={containerClasses}>
      <div className="relative">
        {/* Outer Glowing Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className={cn(
            "rounded-full border-indigo-500/10 border-t-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]",
            sizes[size]
          )}
        />
        
        {/* Inner Pulsating Logo or Dot */}
        {size !== "xs" && (
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {size === "lg" || size === "xl" ? (
              <img src="/logo.png" alt="Loading" className={cn(size === "xl" ? "w-10 h-10" : "w-6 h-6", "opacity-80")} />
            ) : (
              <div className={cn("rounded-full bg-indigo-500/40", size === "md" ? "w-2 h-2" : "w-1 h-1")} />
            )}
          </motion.div>
        )}
      </div>

      {text && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "font-black uppercase tracking-[0.2em] text-indigo-500/70",
            size === "sm" ? "text-[8px]" : "text-[10px]"
          )}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}
