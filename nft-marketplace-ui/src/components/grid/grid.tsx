import { cn } from "@heroui/react";

export type GridProps = React.ComponentProps<"div">;

export function Grid({ className, children, ...props }: GridProps) {
  return (
    <div className={cn("flex flex-row flex-wrap gap-x-0 gap-y-2 -mx-1", className)} {...props}>
      {children}
    </div>
  );
}
