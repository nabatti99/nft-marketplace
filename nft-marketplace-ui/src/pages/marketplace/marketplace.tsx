import { BlockchainAddress } from "@/components/ui/blockchain-address/blockchain-address";
import {
  MARKETPLACE_CONFIG,
  MarketplaceListing,
  approveXsgd,
  buyNft,
  compareAddress,
  createExplorerLink,
  fetchActiveListings,
  getMarketplaceContract,
  getReadOnlyProvider,
  getXsgdAllowance,
} from "@/services/blockchain/blockchain";
import { addTransaction, invalidateRequests, updateTransaction } from "@/store/slice/blockchain.slice";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { addToast, Button, Card, CardBody, Image, Link, Spinner } from "@heroui/react";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import EthereumPng from "./assets/ethereum.png";
import EmptyBoxPng from "./assets/empty-box.png";

function MarketplacePage(): JSX.Element {
  const dispatch = useAppDispatch();
  const { provider, walletAddress, lastRequestTimestamp } = useAppSelector(state => state.blockchain);

  const [listings, setListings] = useState<Array<MarketplaceListing>>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [isLoadingAllowance, setIsLoadingAllowance] = useState(false);
  const [xsgdAllowance, setXsgdAllowance] = useState<bigint>(0n);
  const [actionKey, setActionKey] = useState<string | null>(null);

  async function loadListings() {
    setIsLoadingListings(true);
    try {
      const dataProvider = provider ?? getReadOnlyProvider();
      const activeListings = await fetchActiveListings(dataProvider);
      setListings(activeListings);
    } catch (error) {
      addToast({
        title: "Error",
        description: (error as Error).message || "Failed to load listings.",
        color: "danger",
      });
    } finally {
      setIsLoadingListings(false);
    }
  }

  async function loadXsgdAllowance() {
    setIsLoadingAllowance(true);
    try {
      const allowance = await getXsgdAllowance(provider!, walletAddress!);
      setXsgdAllowance(allowance);
    } catch (error) {
      console.error("Failed to fetch XSGD allowance:", error);
      addToast({
        title: "Error",
        description: (error as Error).message || "Failed to load allowance.",
        color: "danger",
      });
    } finally {
      setIsLoadingAllowance(false);
    }
  }

  useEffect(() => {
    if (!provider) return;

    void loadListings();
  }, [provider, lastRequestTimestamp]);

  useEffect(() => {
    if (!provider) return;

    void loadXsgdAllowance();
  }, [provider, walletAddress, lastRequestTimestamp]);

  useEffect(() => {
    const dataProvider = provider ?? getReadOnlyProvider();
    const marketplace = getMarketplaceContract(dataProvider);
    const onChainEvent = (..._args: Array<unknown>) => {
      dispatch(invalidateRequests());
    };

    const listedFilter = marketplace.filters.NFTListed();
    const cancelledFilter = marketplace.filters.ListingCancelled();
    const purchasedFilter = marketplace.filters.NFTPurchased();

    marketplace.on(listedFilter, onChainEvent);
    marketplace.on(cancelledFilter, onChainEvent);
    marketplace.on(purchasedFilter, onChainEvent);

    return () => {
      marketplace.off(listedFilter, onChainEvent);
      marketplace.off(cancelledFilter, onChainEvent);
      marketplace.off(purchasedFilter, onChainEvent);
    };
  }, [dispatch, provider]);

  async function handleListingAction(listing: MarketplaceListing) {
    if (!walletAddress || !provider) {
      addToast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to proceed.",
        color: "warning",
      });
      return;
    }

    setActionKey(listing.key);

    try {
      if (compareAddress(walletAddress, listing.seller)) {
        return;
      }

      const block = await provider.getBlock("latest");
      const timestamp = block?.timestamp ?? Math.floor(Date.now() / 1000);

      if (xsgdAllowance < listing.price) {
        const approveTx = await approveXsgd(provider, ethers.MaxUint256);
        dispatch(
          addTransaction({
            key: approveTx.hash,
            data: {
              action: "approve_xsgd",
              timestamp,
              status: "pending",
            },
          })
        );
        await approveTx.wait();
        dispatch(
          updateTransaction({
            key: approveTx.hash,
            data: {
              status: "confirmed",
            },
          })
        );
        dispatch(invalidateRequests());
        return;
      }

      const buyTx = await buyNft(provider, listing.nftContract, listing.tokenId);
      dispatch(
        addTransaction({
          key: buyTx.hash,
          data: {
            action: "buy_nft",
            timestamp,
            status: "pending",
          },
        })
      );
      await buyTx.wait();
      dispatch(
        updateTransaction({
          key: buyTx.hash,
          data: {
            status: "confirmed",
          },
        })
      );
      dispatch(invalidateRequests());
    } catch (error) {
      addToast({
        title: "Error",
        description: (error as Error).message || "Transaction failed.",
        color: "danger",
      });
    } finally {
      setActionKey(null);
    }
  }

  return (
    <main className="relative grow flex flex-col gap-6 overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative isolate flex gap-4 overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-sky-950 via-cyan-900/85 to-blue-950 px-6 py-8 shadow-[0_24px_60px_-30px_rgba(6,182,212,0.75)] before:absolute before:inset-0 before:bg-[url('https://images.unsplash.com/photo-1639762681057-408e52192e55?auto=format&fit=crop&w=1800&q=80')] before:bg-cover before:bg-center before:opacity-25 before:content-[''] after:absolute after:inset-0 after:bg-gradient-to-r after:from-slate-950/85 after:via-slate-900/70 after:to-cyan-900/45 after:content-['']">
        <Image
          src={EthereumPng}
          alt="Ethereum"
          className="shrink-0 relative h-20 w-20 opacity-80 transition-all duration-300 transform-3d hover:scale-110"
        />
        <div className="flex flex-col gap-2">
          <h1 className="relative z-10 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Marketplace</h1>
          <p className="relative z-10 max-w-2xl text-sm text-cyan-100/90 sm:text-base">
            Browse active listings and purchase NFTs with{" "}
            <Link
              className="text-sm font-semibold text-cyan-200 underline decoration-cyan-300/80 underline-offset-4 transition-colors hover:text-white"
              href={createExplorerLink(MARKETPLACE_CONFIG.xsgdAddress, "address")}
              target="_blank"
            >
              XSGD
            </Link>
            .
          </p>
        </div>
      </div>

      {isLoadingListings ? (
        <div className="grow flex items-center justify-center rounded-2xl border border-white/20 bg-slate-900/45 py-16 shadow-lg backdrop-blur-sm">
          <Spinner label="Loading listings..." />
        </div>
      ) : listings.length === 0 ? (
        <Card className="border border-dashed border-cyan-300/40 bg-white/10 shadow-lg backdrop-blur-sm">
          <CardBody className="py-10 items-center">
            <Image src={EmptyBoxPng} alt="No Listings" className="mx-auto mb-4 h-72 w-72 opacity-70" />
            <p className="text-center text-cyan-600">No active listings found.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {listings.map(listing => {
            const listedByYou = walletAddress ? compareAddress(walletAddress, listing.seller) : false;
            const requiresApproval = walletAddress ? xsgdAllowance < listing.price : false;
            const buttonLabel = !walletAddress
              ? "Connect Wallet"
              : listedByYou
                ? "Listed by you"
                : requiresApproval
                  ? "Approve XSGD"
                  : "Buy";

            return (
              <Card
                key={listing.key}
                className="group border border-white/20 bg-gradient-to-br from-slate-900/80 via-cyan-950/55 to-blue-950/75 shadow-[0_20px_50px_-30px_rgba(34,211,238,0.7)] backdrop-blur-md transition-all duration-300 hover:border-cyan-300/55 hover:shadow-[0_28px_55px_-26px_rgba(34,211,238,0.85)]"
              >
                <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1.5">
                    <div className="text-base font-semibold text-slate-100">
                      Token #{listing.tokenId.toString()} · {ethers.formatUnits(listing.price, 18)} XSGD
                    </div>
                    <div className="text-sm text-cyan-100/80">
                      Collection:{" "}
                      <BlockchainAddress
                        address={listing.nftContract}
                        type="short"
                        className="inline-flex text-cyan-200 hover:text-cyan-100"
                      />
                    </div>
                    <div className="text-sm text-cyan-100/80">
                      Seller:{" "}
                      <BlockchainAddress
                        address={listing.seller}
                        type="short"
                        className="inline-flex text-cyan-200 hover:text-cyan-100"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1">
                    {isLoadingAllowance && walletAddress ? <Spinner size="sm" /> : null}
                    <Button
                      className="rounded-full bg-cyan-50 font-semibold text-cyan-900 shadow-lg disabled:opacity-70"
                      onPress={() => handleListingAction(listing)}
                      isDisabled={listedByYou}
                      isLoading={actionKey === listing.key}
                    >
                      {buttonLabel}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default MarketplacePage;
