import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("XSGDModule", (m) => {
    // Deploy XSGD token (for testing purposes)
    const TestXSGD = m.contract("XSGD", []);

    return {
        TestXSGD,
    };
});
