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
import { addToast, Button, Card, CardBody, Link, Spinner } from "@heroui/react";
import { ethers } from "ethers";
import { useEffect, useState } from "react";

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
    <main className="grow flex flex-col gap-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <p className="text-sm text-foreground-500">
          Browse active listings and purchase NFTs with{" "}
          <Link
            className="text-sm"
            href={createExplorerLink(MARKETPLACE_CONFIG.xsgdAddress, "address")}
            target="_blank"
          >
            XSGD
          </Link>
          .
        </p>
      </div>

      {isLoadingListings ? (
        <div className="grow flex justify-center items-center">
          <Spinner label="Loading listings..." />
        </div>
      ) : listings.length === 0 ? (
        <Card>
          <CardBody>No active listings found.</CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
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
              <Card key={listing.key}>
                <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="font-semibold">
                      Token #{listing.tokenId.toString()} · {ethers.formatUnits(listing.price, 18)} XSGD
                    </div>
                    <div className="text-sm">
                      Collection:{" "}
                      <BlockchainAddress address={listing.nftContract} type="short" className="inline-flex" />
                    </div>
                    <div className="text-sm">
                      Seller: <BlockchainAddress address={listing.seller} type="short" className="inline-flex" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLoadingAllowance && walletAddress ? <Spinner size="sm" /> : null}
                    <Button
                      color="primary"
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
