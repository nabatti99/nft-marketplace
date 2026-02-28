import {
  approveNftForMarketplace,
  compareAddress,
  getErc721LikeContract,
  isNftApprovedForMarketplace,
  listNft,
} from "@/services/blockchain/blockchain";
import { addTransaction, invalidateRequests, updateTransaction } from "@/store/slice/blockchain.slice";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { addToast, Button, Card, CardBody, CardHeader, Form, Input } from "@heroui/react";
import { ethers } from "ethers";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";

function SellPage(): JSX.Element {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { provider } = useAppSelector(state => state.blockchain);

  const { control, handleSubmit, getValues, setValue, watch } = useForm({
    defaultValues: {
      nft_address: "",
      token_id: "",
      price: "",
    },
  });

  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const inputClassNames = {
    label: "text-sky-800/90",
    inputWrapper:
      "border border-sky-200/80 bg-white/90 shadow-[0_10px_26px_-18px_rgba(14,165,233,0.65)] backdrop-blur-sm data-[hover=true]:bg-white/20",
    input: "text-slate-800 placeholder:text-slate-400",
    errorMessage: "text-red-500",
  } as const;

  async function onSubmit({ nft_address: nftContract, token_id: tokenId, price }: any) {
    if (!provider) {
      addToast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to list an NFT.",
        color: "warning",
      });
      return;
    }

    try {
      setIsExecuting(true);

      const tokenIdValue = BigInt(tokenId);
      const priceValue = ethers.parseUnits(price, 18);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      const nftContractInstance = getErc721LikeContract(nftContract, signer);
      const owner = await nftContractInstance.ownerOf(tokenIdValue);

      if (!compareAddress(owner, signerAddress)) {
        throw new Error("The connected wallet does not own this token. Can you try connecting to the correct wallet?");
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
      setIsExecuting(false);
    }
  }

  return (
    <main className="grow flex justify-center px-4 py-8 sm:px-6 lg:px-8">
      <Card className="relative isolate w-full max-w-2xl overflow-hidden rounded-3xl border border-sky-200/80 bg-gradient-to-br from-white/95 via-sky-50/90 to-cyan-100/80 shadow-[0_28px_70px_-42px_rgba(14,165,233,0.65)] backdrop-blur-md before:absolute before:inset-0 before:bg-[url('https://plus.unsplash.com/premium_photo-1674586761705-97be1a8c15a7?auto=format&fit=crop&w=1500&q=80')] before:bg-contain before:bg-bottom before:opacity-15 before:content-[''] after:absolute after:inset-0 after:bg-gradient-to-r after:from-white/85 after:via-sky-50/70 after:to-cyan-100/60 after:content-['']">
        <CardHeader className="relative z-10 flex flex-col items-start gap-2 px-6 pt-6 sm:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Sell NFT</h1>
          <p className="max-w-xl text-sm text-slate-600 sm:text-base">
            Enter NFT details and list it for sale in XSGD.
          </p>
        </CardHeader>
        <CardBody className="relative z-10 px-6 pb-6 sm:px-8 sm:pb-8">
          <Form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
            <Controller
              control={control}
              name="nft_address"
              render={({ field: { name, value, onChange, onBlur, ref }, fieldState: { invalid, error } }) => (
                <Input
                  ref={ref}
                  isRequired
                  errorMessage={error?.message}
                  label="NFT Collection Address"
                  isInvalid={invalid}
                  placeholder="0x..."
                  disableAnimation
                  className="w-full"
                  classNames={inputClassNames}
                  name={name}
                  value={value}
                  onBlur={onBlur}
                  onChange={onChange}
                />
              )}
              rules={{
                required: "NFT Collection Address is required.",
                validate: value => ethers.isAddress(value) || "Invalid NFT Collection Address.",
              }}
            />

            <Controller
              control={control}
              name="token_id"
              render={({ field: { name, value, onChange, onBlur, ref }, fieldState: { invalid, error } }) => (
                <Input
                  ref={ref}
                  type="number"
                  isRequired
                  errorMessage={error?.message}
                  label="Token ID"
                  isInvalid={invalid}
                  placeholder="1"
                  disableAnimation
                  className="w-full"
                  classNames={inputClassNames}
                  name={name}
                  value={value}
                  onBlur={onBlur}
                  onChange={onChange}
                />
              )}
              rules={{
                required: "Token ID is required.",
                validate: value => Number(value) > 0 || "Token ID must be a positive number.",
              }}
            />

            <Controller
              control={control}
              name="price"
              render={({ field: { name, value, onChange, onBlur, ref }, fieldState: { invalid, error } }) => (
                <Input
                  ref={ref}
                  type="number"
                  isRequired
                  errorMessage={error?.message}
                  label="Price (XSGD)"
                  isInvalid={invalid}
                  placeholder="10.5"
                  disableAnimation
                  className="w-full"
                  classNames={inputClassNames}
                  name={name}
                  value={value}
                  onBlur={onBlur}
                  onChange={onChange}
                />
              )}
              rules={{
                required: "Price is required.",
                validate: value => Number(value) > 0 || "Price must be greater than 0.",
              }}
            />

            <Button
              type="submit"
              color="primary"
              className="w-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 py-6 text-base font-semibold text-white shadow-[0_16px_36px_-18px_rgba(14,165,233,0.95)] transition-all duration-200 disabled:opacity-70"
              isLoading={isExecuting}
            >
              List NFT
            </Button>

            <div className="flex flex-col gap-2">
              <small className="text-sm text-slate-600">
                <strong>Note:</strong> There will be 2 steps - approving the marketplace to transfer your NFT, and
                listing the NFT for sale.
              </small>

              <small className="text-sm text-slate-600">
                The owner of this marketplace will receive a <strong>5% commission fee</strong> from each sale. By
                listing, you agree to the marketplace's terms and conditions.
              </small>
            </div>
          </Form>
        </CardBody>
      </Card>
    </main>
  );
}

export default SellPage;
