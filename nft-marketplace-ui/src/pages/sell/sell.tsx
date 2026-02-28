import {
  approveNftForMarketplace,
  compareAddress,
  getErc721LikeContract,
  isNftApprovedForMarketplace,
  listNft,
} from "@/services/blockchain/blockchain";
import { addTransaction, invalidateRequests, updateTransaction } from "@/store/slice/blockchain.slice";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { addToast, Button, Card, CardBody, CardHeader, Input } from "@heroui/react";
import { ethers } from "ethers";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function SellPage(): JSX.Element {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { provider } = useAppSelector(state => state.blockchain);

  const [nftContract, setNftContract] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [price, setPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit() {
    if (!provider) {
      addToast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to list an NFT.",
        color: "warning",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (!ethers.isAddress(nftContract)) {
        throw new Error("NFT collection address is invalid.");
      }
      if (!tokenId || !/^\d+$/.test(tokenId)) {
        throw new Error("Token ID must be a positive integer.");
      }
      if (!price || Number(price) <= 0) {
        throw new Error("Price must be greater than 0.");
      }

      const tokenIdValue = BigInt(tokenId);
      const priceValue = ethers.parseUnits(price, 18);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      const nftContractInstance = getErc721LikeContract(nftContract, signer);
      const owner = await nftContractInstance.ownerOf(tokenIdValue);

      if (!compareAddress(owner, signerAddress)) {
        throw new Error("Connected wallet does not own this token.");
      }

      const block = await provider.getBlock("latest");
      const timestamp = block?.timestamp ?? Math.floor(Date.now() / 1000);

      const approved = await isNftApprovedForMarketplace(provider, nftContract, tokenIdValue);
      if (!approved) {
        const approveTx = await approveNftForMarketplace(provider, nftContract, tokenIdValue);
        dispatch(
          addTransaction({
            key: approveTx.hash,
            data: {
              action: "approve_nft",
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
      }

      const listTx = await listNft(provider, nftContract, tokenIdValue, priceValue);
      dispatch(
        addTransaction({
          key: listTx.hash,
          data: {
            action: "list_nft",
            timestamp,
            status: "pending",
          },
        })
      );
      await listTx.wait();
      dispatch(
        updateTransaction({
          key: listTx.hash,
          data: {
            status: "confirmed",
          },
        })
      );

      dispatch(invalidateRequests());
      navigate("/my-listings");
    } catch (error) {
      addToast({
        title: "Error",
        description: (error as Error).message || "Failed to list NFT.",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grow flex justify-center py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-col items-start gap-1">
          <h1 className="text-2xl font-bold">Sell NFT</h1>
          <p className="text-sm text-foreground-500">Enter NFT details and list it for sale in XSGD.</p>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <Input
            label="NFT Collection Address"
            placeholder="0x..."
            value={nftContract}
            onValueChange={setNftContract}
          />
          <Input label="Token ID" placeholder="1" value={tokenId} onValueChange={setTokenId} />
          <Input label="Price (XSGD)" placeholder="10.5" value={price} onValueChange={setPrice} />

          <Button color="primary" onPress={onSubmit} isLoading={isSubmitting}>
            List NFT
          </Button>
        </CardBody>
      </Card>
    </main>
  );
}

export default SellPage;
