import { cn } from "@heroui/react";
import type * as React from "react";

function AppMain({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex justify-center items-stretch before:pointer-events-none before:absolute before:top-0 before:left-0 before:h-72 before:w-72 before:rounded-full before:bg-cyan-400/20 before:blur-3xl before:content-[''] after:pointer-events-none after:absolute after:right-0 after:top-0 after:h-80 after:w-80 after:rounded-full after:bg-blue-500/20 after:blur-3xl after:content-['']",
        className
      )}
      {...props}
    >
      <div className="container flex flex-col items-stretch mx-auto px-8 sm:px-0">{children}</div>
    </div>
  );
}

export { AppMain };
