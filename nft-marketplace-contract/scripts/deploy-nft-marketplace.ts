import { readFileSync } from "fs";
import { network } from "hardhat";
import NFTMarketplaceModule from "../ignition/modules/NFTMarketplaceModule.js";

const { ethers, ignition, networkName } = await network.connect();
const [deployer] = await ethers.getSigners();

const deployedXSGDAddress = JSON.parse(
    readFileSync(
        `ignition/deployments/xsgd-${networkName}/deployed_addresses.json`,
        { encoding: "utf-8" },
    ),
)["XSGDModule#XSGD"];

const XSGD = await ethers.getContractAt("XSGD", deployedXSGDAddress);

console.log("===Deploy NFTMarketplace===");
await ignition.deploy(NFTMarketplaceModule, {
    parameters: {
        NFTMarketplaceModule: {
            tokenAddress: await XSGD.getAddress(),
            initialOwner: await deployer.getAddress(),
        },
    },
    defaultSender: await deployer.getAddress(),
    displayUi: true,
    deploymentId: `nft-marketplace-${networkName}`,
});

console.log("✅ Done");
