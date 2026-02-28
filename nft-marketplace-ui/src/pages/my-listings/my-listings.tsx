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
import { addToast, Button, Card, CardBody, Spinner } from "@heroui/react";
import { ethers } from "ethers";
import { useEffect, useState } from "react";

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
    <main className="grow flex flex-col gap-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Listings</h1>
          <p className="text-sm text-foreground-500">Manage your active NFT listings.</p>
        </div>
      </div>

      {!walletAddress ? (
        <Card>
          <CardBody>Connect your wallet to view and manage your listings.</CardBody>
        </Card>
      ) : isLoading ? (
        <div className="grow flex justify-center items-center">
          <Spinner label="Loading your listings..." />
        </div>
      ) : listings.length === 0 ? (
        <Card>
          <CardBody>You have no active listings.</CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {listings.map(listing => (
            <Card key={listing.key}>
              <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="font-semibold">
                    Token #{listing.tokenId.toString()} · {ethers.formatUnits(listing.price, 18)} XSGD
                  </div>
                  <div className="text-sm">
                    Collection: <BlockchainAddress address={listing.nftContract} type="short" className="inline-flex" />
                  </div>
                </div>
                <Button color="danger" onPress={() => onCancelListing(listing)} isLoading={actionKey === listing.key}>
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
