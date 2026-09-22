import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------------------------- Button --------------------------------- */

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-amber-400 text-zinc-950 hover:bg-amber-500 active:bg-amber-600 focus-visible:ring-amber-400 font-semibold shadow-sm border border-amber-400/90 disabled:hover:bg-amber-400",
  secondary:
    "bg-amber-50 text-zinc-950 hover:bg-amber-100/80 focus-visible:ring-amber-400 border border-amber-200/80 font-medium",
  outline:
    "border border-zinc-300 bg-white text-zinc-950 hover:bg-amber-50/80 hover:border-amber-400 focus-visible:ring-amber-400 font-medium",
  ghost:
    "bg-transparent text-zinc-800 hover:bg-amber-100/70 hover:text-zinc-950 font-medium",
  danger: "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500 disabled:hover:bg-red-600 font-semibold",
  success: "bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-500 disabled:hover:bg-emerald-600 font-semibold",
};

const buttonSizes: Record<ButtonSize, string> = {
  xs: "h-7 px-2 text-xs gap-1",
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-9.5 px-4 text-sm gap-2 py-2",
  lg: "h-11 px-6 text-base gap-2",
  icon: "h-9 w-9 p-0",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-offset-white",
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

/* ----------------------------------- Card ---------------------------------- */

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200/90 bg-white shadow-sm text-zinc-950",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pt-5", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-bold text-zinc-950", className)} {...props} />;
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-sm text-zinc-600", className)} {...props} />;
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

/* ---------------------------------- Input ---------------------------------- */

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-9.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-9.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-xs font-semibold text-zinc-900", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  required,
  children,
  className,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label>
        {label}
        {required && <span className="ml-0.5 text-amber-600 font-bold">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

/* --------------------------------- Banners --------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-14 text-center bg-white", className)}>
      {icon && <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-900">{icon}</div>}
      <h3 className="text-sm font-bold text-zinc-950">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-zinc-600">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-amber-500", className)} />;
}

export function FullPageLoader() {
  return (
    <div className="flex h-[60vh] items-center justify-center bg-white">
      <Spinner className="h-8 w-8 text-amber-500" />
    </div>
  );
}