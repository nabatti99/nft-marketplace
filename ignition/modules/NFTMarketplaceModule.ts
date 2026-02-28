import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("NFTMarketplaceModule", (m) => {
    const tokenAddress = m.getParameter("tokenAddress");
    const initialOwner = m.getParameter("initialOwner");

    const NFTMarketplace = m.contract("NFTMarketplace", [tokenAddress, initialOwner]);

    return {
        NFTMarketplace,
    };
});
