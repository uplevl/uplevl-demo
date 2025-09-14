import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "flex items-center flex-row justify-center gap-3 rounded-lg border border-transparent enabled:cursor-pointer transition-colors duration-300 ease-out",
  {
    variants: {
      variant: {
        primary: "bg-brand-deep-gray text-white border-brand-deep-gray hover:bg-brand-deep-gray/90",
        secondary: "bg-white border-brand-deep-gray text-brand-deep-gray",
        tertiary: "border-neutral-300 bg-transparent text-brand-deep-gray",
      },
      size: {
        sm: "h-9",
        md: "h-10",
        lg: "h-11",
        xl: "h-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "lg",
    },
  },
);

type ButtonVariants = VariantProps<typeof buttonVariants>;
type ButtonProps = React.ComponentProps<"button"> & ButtonVariants;

export default function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button {...props} className={cn(buttonVariants({ variant, size }), className)} />;
}
