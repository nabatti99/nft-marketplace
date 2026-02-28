import { BlockchainAddress } from "@/components/ui/blockchain-address/blockchain-address";
import {
  cancelListing,
  compareAddress,
  fetchActiveListings,
  getMarketplaceContract,
  MarketplaceListing
} from "@/services/blockchain/blockchain";
import { addTransaction, invalidateRequests, updateTransaction } from "@/store/slice/blockchain.slice";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { addToast, Button, Card, CardBody, Image, Spinner } from "@heroui/react";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import EmptyBoxPng from "@/pages/marketplace/assets/empty-box.png";

function MyListingsPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const { provider, walletAddress, lastRequestTimestamp } = useAppSelector(state => state.blockchain);

  const [listings, setListings] = useState<Array<MarketplaceListing>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);

  async function loadMyListings() {
    setIsLoading(true);

    try {
      const activeListings = await fetchActiveListings(provider!);

      if (!walletAddress) {
        setListings([]);
        return;
      }

      const ownListings = activeListings.filter(listing => compareAddress(listing.seller, walletAddress));

      setListings(ownListings);
    } catch (error) {
      addToast({
        title: "Error",
        description: (error as Error).message || "Failed to load listings.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!provider) return;

    void loadMyListings();
  }, [provider, walletAddress, lastRequestTimestamp]);

  useEffect(() => {
    if (!provider) return;

    const marketplace = getMarketplaceContract(provider);
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

  async function onCancelListing(listing: MarketplaceListing) {
    if (!provider) {
      addToast({
        title: "Wallet Not Connected",
        description: "Connect wallet first to cancel listings.",
        color: "warning",
      });
      return;
    }

    setActionKey(listing.key);

    try {
      const block = await provider.getBlock("latest");
      const timestamp = block?.timestamp ?? Math.floor(Date.now() / 1000);
      const tx = await cancelListing(provider, listing.nftContract, listing.tokenId);

      dispatch(
        addTransaction({
          key: tx.hash,
          data: {
            action: "cancel_listing",
            timestamp,
            status: "pending",
          },
        })
      );

      await tx.wait();
      dispatch(
        updateTransaction({
          key: tx.hash,
          data: {
            status: "confirmed",
          },
        })
      );
      dispatch(invalidateRequests());
    } catch (error) {
      addToast({
        title: "Error",
        description: (error as Error).message || "Cancel failed.",
        color: "danger",
      });
    } finally {
      setActionKey(null);
    }
  }

  return (
    <main className="grow flex flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">My Listings</h1>
          <p className="text-sm text-slate-600 sm:text-base">Manage your active NFT listings.</p>
        </div>
      </div>

      {!walletAddress ? (
        <Card className="rounded-2xl border border-sky-200/70 bg-gradient-to-br from-white/95 via-sky-50/85 to-cyan-100/70 shadow-[0_20px_45px_-32px_rgba(14,165,233,0.6)]">
          <CardBody className="p-10 text-cyan-600">Connect your wallet to view and manage your listings.</CardBody>
        </Card>
      ) : isLoading ? (
        <div className="grow flex items-center justify-center rounded-2xl border border-sky-200/70 bg-gradient-to-br from-white/95 via-sky-50/85 to-cyan-100/70 py-16 shadow-[0_20px_45px_-32px_rgba(14,165,233,0.6)]">
          <Spinner label="Loading your listings..." />
        </div>
      ) : listings.length === 0 ? (
        <Card className="rounded-2xl border border-sky-200/70 bg-gradient-to-br from-white/95 via-sky-50/85 to-cyan-100/70 shadow-[0_20px_45px_-32px_rgba(14,165,233,0.6)]">
          <CardBody className="py-10 items-center">
            <Image src={EmptyBoxPng} alt="No Listings" className="mx-auto mb-4 h-72 w-72 opacity-70" />
            <p className="text-center text-cyan-600">You have no active listings.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {listings.map(listing => (
            <Card
              key={listing.key}
              className="rounded-2xl border border-sky-200/70 bg-white/90 shadow-[0_20px_45px_-35px_rgba(14,165,233,0.55)] transition-all duration-200 hover:shadow-[0_24px_52px_-34px_rgba(14,165,233,0.7)]"
            >
              <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="text-base font-semibold text-slate-900">
                    Token #{listing.tokenId.toString()} · {ethers.formatUnits(listing.price, 18)} XSGD
                  </div>
                  <div className="text-sm text-slate-600">
                    Collection:{" "}
                    <BlockchainAddress
                      address={listing.nftContract}
                      type="short"
                      className="inline-flex text-sky-700 hover:text-cyan-700"
                    />
                  </div>
                </div>
                <Button
                  color="danger"
                  className="rounded-full border border-red-200 bg-red-50 font-semibold text-red-700 shadow-sm transition-colors duration-200 hover:bg-red-100"
                  onPress={() => onCancelListing(listing)}
                  isLoading={actionKey === listing.key}
                >
                  Cancel Listing
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

export default MyListingsPage;
