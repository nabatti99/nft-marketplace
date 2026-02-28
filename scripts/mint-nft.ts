import { readFileSync } from "fs";
import { network } from "hardhat";
import { TestERC721__factory } from "../types/ethers-contracts/index.js";

const { ethers, networkName } = await network.connect();
const [deployer] = await ethers.getSigners();

const deployedTestERC721Address = JSON.parse(
    readFileSync(
        `ignition/deployments/test-erc721-${networkName}/deployed_addresses.json`,
        { encoding: "utf-8" },
    ),
)["TestERC721Module#TestERC721"];

const ERC721 = TestERC721__factory.connect(deployedTestERC721Address, deployer);

const receiver = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const tokenId = 5n;

console.log(`Minting token ID ${tokenId} to ${receiver}...`);
await ERC721.mintWithTokenId(receiver, tokenId);

console.log("✅ Done");
