import { cn } from "@/lib/utils";
import Loading from "./Loading";

export default function DataTable({
  headers,
  children,
  loading,
  empty,
  emptyMessage = "Không có dữ liệu",
  className,
  containerClassName,
}) {
  return (
    <div
      className={cn(
        "bg-bg-card border border-border-primary rounded-[2.5rem] overflow-hidden shadow-2xl",
        containerClassName,
      )}
    >
      {loading && !children ? (
        <Loading size="lg" text="Đang xử lý dữ liệu..." className="py-24" />
      ) : empty ? (
        <div className="py-24 text-center text-text-secondary space-y-4">
          <div className="font-bold text-lg opacity-40 italic">
            {emptyMessage}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className={cn("w-full text-left border-collapse", className)}>
            <thead>
              <tr className="border-b border-border-primary text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] bg-text-primary/5">
                {headers.map((header, idx) => (
                  <th key={idx} className={cn("px-8 py-4", header.className)}>
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary/50">
              {children}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
