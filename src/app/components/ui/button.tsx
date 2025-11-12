/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/app/lib/utils" // Note: Assumes @/ is src/

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-linear-to-r from-indigo-400 via-violet-500 to-purple-500 text-white shadow-[0_15px_35px_rgba(91,95,255,0.45)] hover:brightness-110",
        destructive:
          "bg-linear-to-r from-rose-500 to-amber-500 text-white shadow-[0_15px_35px_rgba(244,63,94,0.45)] hover:brightness-110",
        outline:
          "border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white",
        secondary:
          "bg-white/8 text-slate-100 hover:bg-white/12",
        ghost:
          "text-slate-200 hover:text-white hover:bg-white/10",
        link: "text-indigo-200 underline-offset-4 hover:text-white hover:underline",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-2xl px-8 text-base",
        icon: "h-11 w-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      // --- FIX: Explicitly cast props for Comp ---
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props as any} // Using 'any' here bypasses the complex type mismatch
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }