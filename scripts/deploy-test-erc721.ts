import { network } from "hardhat";
import TestERC721Module from "../ignition/modules/TestERC721Module.js";

const { ethers, ignition, networkName } = await network.connect();
const [deployer] = await ethers.getSigners();

console.log("===Deploy TestERC721===");
await ignition.deploy(TestERC721Module, {
    displayUi: true,
    deploymentId: `test-erc721-${networkName}`,
    defaultSender: deployer.address,
});

console.log("✅ Done");
