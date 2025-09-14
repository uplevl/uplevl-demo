import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const typographyVariants = cva("text-brand-deep-gray font-sans", {
  variants: {
    size: {
      "2xl": "text-2xl -tracking-[0.02em]",
      xl: "text-xl -tracking-[0.02em]",
      l: "text-l -tracking-[0.02em]",
      mp: "text-mp -tracking-[0.02em]",
      s: "text-s",
      xs: "text-xs",
      xsp: "text-xsp",
    },
    weight: {
      bold: "font-bold",
      semibold: "font-semibold",
      medium: "font-medium",
      normal: "font-normal",
    },
    center: {
      true: "text-center",
    },
  },
  defaultVariants: {
    size: "s",
    weight: "normal",
    center: false,
  },
});

type TypographyOwnProps = VariantProps<typeof typographyVariants> & {
  children?: React.ReactNode;
  className?: string;
};

type TypographyProps<T extends React.ElementType = "p"> = TypographyOwnProps & {
  as?: T;
} & Omit<React.ComponentPropsWithoutRef<T>, keyof TypographyOwnProps>;

export function Typography<T extends React.ElementType = "p">({
  children,
  size,
  weight,
  center,
  className,
  as,
  ...props
}: TypographyProps<T>) {
  const Comp = (as || "p") as React.ElementType;

  return (
    <Comp {...props} className={cn(typographyVariants({ size, weight, center }), className)}>
      {children}
    </Comp>
  );
}
