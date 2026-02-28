import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TestERC721Module", (m) => {
    const TestERC721 = m.contract("TestERC721", ["Test NFT", "TNFT"]);

    return {
        TestERC721,
    };
});
