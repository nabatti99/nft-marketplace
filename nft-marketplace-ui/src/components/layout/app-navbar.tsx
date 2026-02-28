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
    <Navbar isBlurred={false} className={cn("shrink-0 shadow-md", className)} maxWidth="full" {...props}>
      <NavbarBrand as={NavLink} to="/marketplace" className="font-bold text-xl">
        NFT Marketplace
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-6" justify="center">
        <NavbarItem>
          <NavLink
            to="/marketplace"
            className={({ isActive }) => (isActive ? "text-primary font-semibold" : "text-foreground")}
          >
            Marketplace
          </NavLink>
        </NavbarItem>
        <NavbarItem>
          <NavLink
            to="/sell"
            className={({ isActive }) => (isActive ? "text-primary font-semibold" : "text-foreground")}
          >
            Sell
          </NavLink>
        </NavbarItem>
        <NavbarItem>
          <NavLink
            to="/my-listings"
            className={({ isActive }) => (isActive ? "text-primary font-semibold" : "text-foreground")}
          >
            My Listings
          </NavLink>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end">
        {provider && chainId !== MARKETPLACE_CONFIG.chainId && (
          <Button
            color="danger"
            variant="bordered"
            radius="full"
            className="font-semibold"
            onPress={() => ensureSupportedNetwork(provider!)}
            isLoading={isConnecting}
          >
            Switch to {MARKETPLACE_CONFIG.chainName}
          </Button>
        )}

        {walletAddress ? (
          <NavbarItem className="font-medium">{displayAddress(walletAddress, "short")}</NavbarItem>
        ) : (
          <NavbarItem>
            <Button
              color="primary"
              variant="bordered"
              radius="full"
              className="font-semibold"
              onPress={connectWallet}
              isLoading={isConnecting}
              startContent={<img src={MetamaskLogo} alt="Metamask Logo" className="w-5 h-5" />}
            >
              Connect Wallet
            </Button>
          </NavbarItem>
        )}
      </NavbarContent>
    </Navbar>
  );
}

export { AppNavBar };
