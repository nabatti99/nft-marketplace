import { readFileSync } from "fs";
import { network } from "hardhat";

const { ethers, ignition } = await network.connect();
const [admin, buyer] = await ethers.getSigners();
const seller = process.env.AMOY_SELLER_ADDRESS!;
const iotWallet = process.env.AMOY_IOT_WALLET_ADDRESS!;

const chainId = (await ethers.provider.getNetwork()).chainId;
const deployedAddresses = JSON.parse(
    readFileSync(
        `ignition/deployments/chain-${chainId}/deployed_addresses.json`,
        { encoding: "utf-8" }
    )
);

const TestXSGD = await ethers.getContractAt(
    "XSGD",
    deployedAddresses["TestXSGDModule#XSGD"]
);

console.log("===Distribute Test Assets===");
await admin.sendTransaction({
    to: buyer,
    value: ethers.parseEther("100"),
});
await admin.sendTransaction({
    to: seller,
    value: ethers.parseEther("100"),
});

await TestXSGD.mint(
    buyer,
    ethers.parseUnits("1000", await TestXSGD.decimals())
);

console.log("✅ Done");
