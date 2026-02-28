import { Button, ButtonProps, cn } from "@heroui/react";
import type * as React from "react";
import { NavLink } from "react-router-dom";

type AppSideBarProps = ButtonProps & {
  to: string;
  isActive?: boolean;
  icon: React.ReactNode;
};

function AppSideBarItem({ to, className, icon, children, ...props }: AppSideBarProps) {
  return (
    <NavLink to={to} className="flex flex-col items-stretch group">
      <Button
        className={cn(
          "relative flex flex-col gap-2 py-10 rounded-none group-[.active]:bg-primary-50 group-[.active]:text-primary-500",
          className
        )}
        variant="light"
        {...props}
      >
        <div
          className={cn(
            "shrink-0 flex justify-center items-center w-10 h-10 rounded-full group-[.active]:bg-primary-500 group-[.active]:text-white"
          )}
        >
          {icon}
        </div>
        {children}

        <div className={cn("absolute top-0 right-0 w-0.5 h-full rounded-full group-[.active]:bg-primary-500")} />
      </Button>
    </NavLink>
  );
}

function AppSideBar({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("shrink-0 flex flex-col py-4", className)} {...props}>
      {children}
    </div>
  );
}

export { AppSideBar, AppSideBarItem };
