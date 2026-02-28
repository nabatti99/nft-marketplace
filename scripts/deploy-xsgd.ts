import { network } from "hardhat";
import XSGDModule from "../ignition/modules/XSGDModule.js";

const { ethers, ignition, networkName } = await network.connect();
const [deployer] = await ethers.getSigners();

console.log("===Deploy XSGD===");
await ignition.deploy(XSGDModule, {
    displayUi: true,
    deploymentId: `xsgd-${networkName}`,
    defaultSender: deployer.address,
});

console.log("✅ Done");
