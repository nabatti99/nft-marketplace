import {
  connectMetamask,
  displayAddress,
  ensureSupportedNetwork,
  MARKETPLACE_CONFIG,
} from "@/services/blockchain/blockchain";
import { connectBlockchain } from "@/store/slice/blockchain.slice";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  Button,
  cn,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarProps,
  useDisclosure,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import MetamaskLogo from "./assets/metamask-logo.png";

type NavItem = {
  to: "/marketplace" | "/sell" | "/my-listings";
  label: string;
};

const navItems: Array<NavItem> = [
  { to: "/marketplace", label: "Marketplace" },
  { to: "/sell", label: "Sell" },
  { to: "/my-listings", label: "My Listings" },
];

function AppNavBar({ className, ...props }: NavbarProps) {
  const dispatch = useAppDispatch();
  const { walletAddress, provider } = useAppSelector(state => state.blockchain);

  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

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
        <Button
          isIconOnly
          aria-label="Open navigation menu"
          variant="light"
          radius="full"
          className="min-w-0 text-cyan-50 transition-colors hover:bg-white/15 sm:hidden"
          onPress={onOpen}
        >
          <span className="flex h-4 w-5 flex-col justify-between">
            <span className="h-0.5 w-full rounded-full bg-current" />
            <span className="h-0.5 w-full rounded-full bg-current" />
            <span className="h-0.5 w-full rounded-full bg-current" />
          </span>
        </Button>
        <NavbarBrand
          as={NavLink}
          to="/marketplace"
          className="max-w-[10rem] truncate text-base font-black tracking-wide text-transparent bg-gradient-to-r from-cyan-200 via-sky-100 to-indigo-200 bg-clip-text drop-shadow-sm sm:max-w-none sm:text-xl"
        >
          NFT Marketplace
        </NavbarBrand>

        <NavbarContent className="hidden gap-4 sm:flex" justify="center">
          {navItems.map(item => (
            <NavbarItem key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  isActive
                    ? "rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(6,182,212,0.45)] transition-all"
                    : "rounded-full px-4 py-2 text-sm font-medium text-cyan-100/90 transition-all hover:bg-white/15 hover:text-white"
                }
              >
                {item.label}
              </NavLink>
            </NavbarItem>
          ))}
        </NavbarContent>

        <NavbarContent className="gap-2" justify="end">
          {provider && chainId !== MARKETPLACE_CONFIG.chainId && (
            <Button
              color="danger"
              variant="bordered"
              radius="full"
              className="max-w-[10rem] px-3 text-xs font-semibold text-white border-white/40 bg-white/10 shadow-lg transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/15 sm:max-w-none sm:px-4 sm:text-sm"
              onPress={() => ensureSupportedNetwork(provider!)}
              isLoading={isConnecting}
            >
              <span className="sm:hidden">Switch Network</span>
              <span className="hidden sm:inline">Switch to {MARKETPLACE_CONFIG.chainName}</span>
            </Button>
          )}

          {walletAddress ? (
            <NavbarItem className="max-w-[9.5rem] truncate rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-cyan-50 shadow-md backdrop-blur-md sm:max-w-none sm:px-4 sm:text-sm">
              {displayAddress(walletAddress, "short")}
            </NavbarItem>
          ) : (
            <NavbarItem>
              <Button
                color="primary"
                variant="bordered"
                radius="full"
                className="px-3 text-xs font-semibold border-cyan-300/70 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-50 shadow-lg transition-all duration-200 hover:from-cyan-500/35 hover:to-blue-500/35 sm:px-4 sm:text-sm"
                onPress={connectWallet}
                isLoading={isConnecting}
                startContent={
                  <img
                    src={MetamaskLogo}
                    alt="Metamask Logo"
                    className="h-4 w-4 rounded-full ring-1 ring-white/50 sm:h-5 sm:w-5"
                  />
                }
              >
                <span className="sm:hidden">Connect</span>
                <span className="hidden sm:inline">Connect Wallet</span>
              </Button>
            </NavbarItem>
          )}
        </NavbarContent>
      </Navbar>

      <Drawer isOpen={isOpen} onOpenChange={onOpenChange} placement="left" backdrop="blur" size="xs">
        <DrawerContent className="border-r border-white/20 bg-slate-950/95 text-cyan-50">
          <DrawerHeader className="text-lg font-semibold tracking-wide text-cyan-100">Navigation</DrawerHeader>
          <DrawerBody className="gap-2 pb-6">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  isActive
                    ? "rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-3 text-base font-semibold text-white shadow-[0_0_20px_rgba(6,182,212,0.45)] transition-all"
                    : "rounded-xl px-4 py-3 text-base font-medium text-cyan-100/90 transition-all hover:bg-white/10 hover:text-white"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export { AppNavBar };
