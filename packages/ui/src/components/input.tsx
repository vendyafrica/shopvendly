import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "../lib/utils"

function Input({ className, type, id, ...props }: React.ComponentProps<"input">) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  return (
    <InputPrimitive
      id={inputId}
      type={type}
      data-slot="input"
      className={cn(
        "h-7 w-full min-w-0 rounded-md border bg-input/20 px-2 py-0.5 text-sm transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs/relaxed file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-xs/relaxed dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      suppressHydrationWarning
      {...props}
    />
  )
}

export { Input }
