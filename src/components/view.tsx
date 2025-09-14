import { cn } from "@/lib/utils";

export default function View({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className="flex-1 py-safe bg-white">
      <div className={cn("flex flex-col p-6", className)} {...props}>
        {children}
      </div>
    </div>
  );
}
