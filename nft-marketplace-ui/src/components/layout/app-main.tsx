import { breakpoints, useActiveBreakpoint } from "@/hooks/ui/useBreakpoint";
import { cn } from "@heroui/react";
import type * as React from "react";

function AppMain({ className, children, ...props }: React.ComponentProps<"div">) {
  const activeBreakpoint = useActiveBreakpoint();

  return (
    <div className={cn("flex justify-center items-stretch", className)} {...props}>
      <div
        className="flex flex-col items-stretch mx-auto"
        style={{
          width: breakpoints[activeBreakpoint],
        }}
      >
        {children}
      </div>
    </div>
  );
}

export { AppMain };
