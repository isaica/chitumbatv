import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary-glow hover:shadow-md hover:shadow-primary/20 active:bg-primary-dark active:shadow-sm active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/80 hover:shadow-md hover:shadow-destructive/20 active:bg-destructive/90 active:scale-[0.98]",
        outline:
          "border-2 border-primary/30 bg-transparent text-primary hover:bg-primary/10 hover:border-primary hover:shadow-sm hover:shadow-primary/10 active:bg-primary/20 active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-primary/10 hover:text-primary hover:shadow-md hover:shadow-primary/10 active:bg-primary/15 active:scale-[0.98]",
        ghost: 
          "text-foreground hover:bg-primary/10 hover:text-primary active:bg-primary/15 active:scale-[0.98]",
        link: 
          "text-primary underline-offset-4 hover:underline hover:text-primary-glow active:text-primary-dark",
        success:
          "bg-success text-success-foreground shadow-sm hover:bg-success/80 hover:shadow-md hover:shadow-success/20 active:bg-success/90 active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
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
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
