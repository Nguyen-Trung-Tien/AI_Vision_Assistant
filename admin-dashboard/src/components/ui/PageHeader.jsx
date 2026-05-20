import { cn } from "@/lib/utils";

export default function PageHeader({
  title,
  highlight,
  description,
  children,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col lg:flex-row lg:items-center justify-between gap-6",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary uppercase">
          {title} <span className="text-indigo-500">{highlight}</span>
        </h1>
        {description && (
          <p className="text-text-secondary font-medium text-sm">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {children}
        </div>
      )}
    </div>
  );
}
