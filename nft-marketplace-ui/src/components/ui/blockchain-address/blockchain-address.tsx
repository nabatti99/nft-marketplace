import { cn } from "@/lib/utils";
import { createExplorerLink, displayAddress } from "@/services/blockchain/blockchain";
import * as React from "react";
import { Link } from "react-router-dom";

export type BlockchainAddressProps = React.ComponentProps<"div"> & {
  address: string;
  type: "short" | "long" | "full";
};

export function BlockchainAddress({ className, children, address, type, ...props }: BlockchainAddressProps) {
  return (
    <div className={cn("flex items-center gap-1 font-mono underline", className)} {...props}>
      <Link to={createExplorerLink(address, "address")} target="_blank" rel="noopener noreferrer">
        {displayAddress(address, type)}
      </Link>
    </div>
  );
}
