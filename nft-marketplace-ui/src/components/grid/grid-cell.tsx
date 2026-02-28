import { cn } from "@heroui/react";

export type GridCellProps = React.ComponentProps<"div">;

export function GridCell({ className, children, ...props }: GridCellProps) {
  return (
    <div className={cn("flex px-1", className)} {...props}>
      {children}
    </div>
  );
}
