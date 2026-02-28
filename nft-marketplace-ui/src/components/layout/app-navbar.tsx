import {
  connectMetamask,
  displayAddress,
  ensureSupportedNetwork,
  MARKETPLACE_CONFIG,
} from "@/services/blockchain/blockchain";
import { connectBlockchain } from "@/store/slice/blockchain.slice";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { Button, cn, Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarProps } from "@heroui/react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import MetamaskLogo from "./assets/metamask-logo.png";

function AppNavBar({ className, ...props }: NavbarProps) {
  const dispatch = useAppDispatch();
  const { walletAddress, provider } = useAppSelector(state => state.blockchain);

  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  async function connectWallet() {
    setIsConnecting(true);
    try {
      const provider = await connectMetamask();
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      dispatch(
        connectBlockchain({
          provider,
          walletAddress,
        })
      );
    } finally {
      setIsConnecting(false);
    }
  }

  useEffect(() => {
    if (!provider) return;

    provider.getNetwork().then(network => {
      setChainId(Number(network.chainId));
    });
  }, [provider]);

  return (
    <div className="sticky top-0 z-40 shrink-0 border-b border-white/20 bg-gradient-to-r from-sky-950/80 via-cyan-900/70 to-indigo-950/80 shadow-[0_12px_40px_-20px_rgba(14,165,233,0.9)] backdrop-blur-xl">
      <Navbar
        isBlurred={false}
        className={cn("container mx-auto bg-transparent", className)}
        maxWidth="full"
        {...props}
      >
        <NavbarBrand
          as={NavLink}
          to="/marketplace"
          className="text-xl font-black tracking-wide text-transparent bg-gradient-to-r from-cyan-200 via-sky-100 to-indigo-200 bg-clip-text drop-shadow-sm"
        >
          NFT Marketplace
        </NavbarBrand>

        <NavbarContent className="hidden gap-4 sm:flex" justify="center">
          <NavbarItem>
            <NavLink
              to="/marketplace"
              className={({ isActive }) =>
                isActive
                  ? "rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(6,182,212,0.45)] transition-all"
                  : "rounded-full px-4 py-2 text-sm font-medium text-cyan-100/90 transition-all hover:bg-white/15 hover:text-white"
              }
            >
              Marketplace
            </NavLink>
          </NavbarItem>
          <NavbarItem>
            <NavLink
              to="/sell"
              className={({ isActive }) =>
                isActive
                  ? "rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(6,182,212,0.45)] transition-all"
                  : "rounded-full px-4 py-2 text-sm font-medium text-cyan-100/90 transition-all hover:bg-white/15 hover:text-white"
              }
            >
              Sell
            </NavLink>
          </NavbarItem>
          <NavbarItem>
            <NavLink
              to="/my-listings"
              className={({ isActive }) =>
                isActive
                  ? "rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(6,182,212,0.45)] transition-all"
                  : "rounded-full px-4 py-2 text-sm font-medium text-cyan-100/90 transition-all hover:bg-white/15 hover:text-white"
              }
            >
              My Listings
            </NavLink>
          </NavbarItem>
        </NavbarContent>

        <NavbarContent className="gap-2" justify="end">
          {provider && chainId !== MARKETPLACE_CONFIG.chainId && (
            <Button
              color="danger"
              variant="bordered"
              radius="full"
              className="font-semibold text-white border-white/40 bg-white/10 shadow-lg transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/15"
              onPress={() => ensureSupportedNetwork(provider!)}
              isLoading={isConnecting}
            >
              Switch to {MARKETPLACE_CONFIG.chainName}
            </Button>
          )}

          {walletAddress ? (
            <NavbarItem className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium text-cyan-50 shadow-md backdrop-blur-md">
              {displayAddress(walletAddress, "short")}
            </NavbarItem>
          ) : (
            <NavbarItem>
              <Button
                color="primary"
                variant="bordered"
                radius="full"
                className="font-semibold border-cyan-300/70 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-50 shadow-lg transition-all duration-200 hover:from-cyan-500/35 hover:to-blue-500/35"
                onPress={connectWallet}
                isLoading={isConnecting}
                startContent={
                  <img src={MetamaskLogo} alt="Metamask Logo" className="h-5 w-5 rounded-full ring-1 ring-white/50" />
                }
              >
                Connect Wallet
              </Button>
            </NavbarItem>
          )}
        </NavbarContent>
      </Navbar>
    </div>
  );
}

export { AppNavBar };
