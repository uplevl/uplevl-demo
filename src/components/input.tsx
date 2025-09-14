import { cn } from "@/lib/utils";

const inputClassName =
  "text-brand-deep-gray font-sans h-14 w-full rounded-lg border border-gray-300 bg-white px-3 py-1 text-lg leading-6 placeholder:text-gray-400/75 placeholder:font-sans focus:outline focus:outline-brand-yellow focus:border-brand-yellow transition-all duration-300 ease-out";

export default function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(inputClassName, className)} {...props} />;
}
