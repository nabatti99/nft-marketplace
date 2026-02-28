import { expect } from "chai";
import { network } from "hardhat";

describe("NFTMarketplace", function () {
    async function deployFixture() {
        const { ethers } = await network.connect();
        const [owner, seller, buyer, other] = await ethers.getSigners();

        const xsgd = await ethers.deployContract("XSGD");
        const marketplace = await ethers.deployContract("NFTMarketplace", [
            await xsgd.getAddress(),
            await owner.getAddress(),
        ]);

        const nftA = await ethers.deployContract("TestERC721", ["Collection A", "COLA"]);
        const nftB = await ethers.deployContract("TestERC721", ["Collection B", "COLB"]);

        return { ethers, owner, seller, buyer, other, xsgd, marketplace, nftA, nftB };
    }

    it("lists an NFT successfully and escrows it in the marketplace", async function () {
        const { seller, marketplace, nftA } = await deployFixture();
        const sellerAddress = await seller.getAddress();
        const nftAddress = await nftA.getAddress();
        const tokenId = 1n;
        const price = 100n;

        await nftA.connect(seller).mintWithTokenId(sellerAddress, tokenId);
        await nftA.connect(seller).approve(await marketplace.getAddress(), tokenId);

        await expect(marketplace.connect(seller).listNFT(nftAddress, tokenId, price))
            .to.emit(marketplace, "NFTListed")
            .withArgs(sellerAddress, nftAddress, tokenId, price);

        expect(await nftA.ownerOf(tokenId)).to.equal(await marketplace.getAddress());

        const listing = await marketplace.getListing(nftAddress, tokenId);
        expect(listing.seller).to.equal(sellerAddress);
        expect(listing.price).to.equal(price);
        expect(listing.isActive).to.equal(true);
    });

    it("reverts listing when price is zero", async function () {
        const { seller, marketplace, nftA } = await deployFixture();
        const tokenId = 1n;

        await nftA.connect(seller).mintWithTokenId(await seller.getAddress(), tokenId);
        await nftA.connect(seller).approve(await marketplace.getAddress(), tokenId);

        await expect(
            marketplace.connect(seller).listNFT(await nftA.getAddress(), tokenId, 0)
        ).to.be.revertedWithCustomError(marketplace, "InvalidPrice");
    });

    it("reverts listing when caller is not token owner", async function () {
        const { seller, other, marketplace, nftA } = await deployFixture();
        const tokenId = 1n;

        await nftA.connect(other).mintWithTokenId(await other.getAddress(), tokenId);

        await expect(
            marketplace.connect(seller).listNFT(await nftA.getAddress(), tokenId, 100)
        ).to.be.revertedWithCustomError(marketplace, "NotTokenOwner");
    });

    it("reverts listing when token is already listed", async function () {
        const { seller, marketplace, nftA } = await deployFixture();
        const tokenId = 1n;
        const price = 100n;
        const nftAddress = await nftA.getAddress();

        await nftA.connect(seller).mintWithTokenId(await seller.getAddress(), tokenId);
        await nftA.connect(seller).approve(await marketplace.getAddress(), tokenId);
        await marketplace.connect(seller).listNFT(nftAddress, tokenId, price);

        await expect(
            marketplace.connect(seller).listNFT(nftAddress, tokenId, price)
        ).to.be.revertedWithCustomError(marketplace, "AlreadyListed");
    });

    it("cancels listing and returns NFT to seller", async function () {
        const { seller, marketplace, nftA } = await deployFixture();
        const sellerAddress = await seller.getAddress();
        const tokenId = 1n;
        const price = 100n;
        const nftAddress = await nftA.getAddress();

        await nftA.connect(seller).mintWithTokenId(sellerAddress, tokenId);
        await nftA.connect(seller).approve(await marketplace.getAddress(), tokenId);
        await marketplace.connect(seller).listNFT(nftAddress, tokenId, price);

        await expect(marketplace.connect(seller).cancelListing(nftAddress, tokenId))
            .to.emit(marketplace, "ListingCancelled")
            .withArgs(sellerAddress, nftAddress, tokenId);

        expect(await nftA.ownerOf(tokenId)).to.equal(sellerAddress);
        const listing = await marketplace.getListing(nftAddress, tokenId);
        expect(listing.isActive).to.equal(false);
    });

    it("reverts cancelListing when caller is not seller", async function () {
        const { seller, buyer, marketplace, nftA } = await deployFixture();
        const tokenId = 1n;

        await nftA.connect(seller).mintWithTokenId(await seller.getAddress(), tokenId);
        await nftA.connect(seller).approve(await marketplace.getAddress(), tokenId);
        await marketplace.connect(seller).listNFT(await nftA.getAddress(), tokenId, 100);

        await expect(
            marketplace.connect(buyer).cancelListing(await nftA.getAddress(), tokenId)
        ).to.be.revertedWithCustomError(marketplace, "NotSeller");
    });

    it("reverts cancelListing when token is not listed", async function () {
        const { seller, marketplace, nftA } = await deployFixture();

        await expect(
            marketplace.connect(seller).cancelListing(await nftA.getAddress(), 999)
        ).to.be.revertedWithCustomError(marketplace, "NotListed");
    });

    it("buys listed NFT, pays 5% commission to owner and 95% to seller", async function () {
        const { owner, seller, buyer, xsgd, marketplace, nftA, ethers } =
            await deployFixture();

        const sellerAddress = await seller.getAddress();
        const buyerAddress = await buyer.getAddress();
        const ownerAddress = await owner.getAddress();
        const nftAddress = await nftA.getAddress();
        const tokenId = 1n;
        const price = ethers.parseUnits("100", 18);
        const commission = (price * 500n) / 10_000n;
        const sellerProceeds = price - commission;

        await nftA.connect(seller).mintWithTokenId(sellerAddress, tokenId);
        await nftA.connect(seller).approve(await marketplace.getAddress(), tokenId);
        await marketplace.connect(seller).listNFT(nftAddress, tokenId, price);

        await xsgd.transfer(buyerAddress, price);
        await xsgd.connect(buyer).approve(await marketplace.getAddress(), price);

        const ownerBalanceBefore = await xsgd.balanceOf(ownerAddress);
        const sellerBalanceBefore = await xsgd.balanceOf(sellerAddress);

        await expect(marketplace.connect(buyer).buyNFT(nftAddress, tokenId))
            .to.emit(marketplace, "NFTPurchased")
            .withArgs(
                buyerAddress,
                sellerAddress,
                nftAddress,
                tokenId,
                price,
                commission,
                sellerProceeds
            );

        const ownerBalanceAfter = await xsgd.balanceOf(ownerAddress);
        const sellerBalanceAfter = await xsgd.balanceOf(sellerAddress);

        expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(commission);
        expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(sellerProceeds);
        expect(await nftA.ownerOf(tokenId)).to.equal(buyerAddress);
        const listing = await marketplace.getListing(nftAddress, tokenId);
        expect(listing.isActive).to.equal(false);
    });

    it("reverts buyNFT when seller tries to buy their own NFT", async function () {
        const { seller, marketplace, nftA } = await deployFixture();
        const tokenId = 1n;
        const nftAddress = await nftA.getAddress();

        await nftA.connect(seller).mintWithTokenId(await seller.getAddress(), tokenId);
        await nftA.connect(seller).approve(await marketplace.getAddress(), tokenId);
        await marketplace.connect(seller).listNFT(nftAddress, tokenId, 100);

        await expect(
            marketplace.connect(seller).buyNFT(nftAddress, tokenId)
        ).to.be.revertedWithCustomError(marketplace, "SellerCannotBuyOwnNFT");
    });

    it("reverts buyNFT when listing is not active", async function () {
        const { buyer, marketplace, nftA } = await deployFixture();

        await expect(
            marketplace.connect(buyer).buyNFT(await nftA.getAddress(), 1)
        ).to.be.revertedWithCustomError(marketplace, "NotListed");
    });

    it("reverts buyNFT when buyer allowance is insufficient", async function () {
        const { seller, buyer, xsgd, marketplace, nftA, ethers } = await deployFixture();
        const tokenId = 1n;
        const nftAddress = await nftA.getAddress();
        const price = ethers.parseUnits("10", 18);

        await nftA.connect(seller).mintWithTokenId(await seller.getAddress(), tokenId);
        await nftA.connect(seller).approve(await marketplace.getAddress(), tokenId);
        await marketplace.connect(seller).listNFT(nftAddress, tokenId, price);

        await xsgd.transfer(await buyer.getAddress(), price);

        await expect(
            marketplace.connect(buyer).buyNFT(nftAddress, tokenId)
        ).to.be.revertedWithCustomError(xsgd, "ERC20InsufficientAllowance");
    });

    it("reverts buyNFT when buyer balance is insufficient", async function () {
        const { seller, buyer, marketplace, xsgd, nftA, ethers } = await deployFixture();
        const tokenId = 1n;
        const nftAddress = await nftA.getAddress();
        const price = ethers.parseUnits("10", 18);

        await nftA.connect(seller).mintWithTokenId(await seller.getAddress(), tokenId);
        await nftA.connect(seller).approve(await marketplace.getAddress(), tokenId);
        await marketplace.connect(seller).listNFT(nftAddress, tokenId, price);

        await xsgd.connect(buyer).approve(await marketplace.getAddress(), price);

        await expect(
            marketplace.connect(buyer).buyNFT(nftAddress, tokenId)
        ).to.be.revertedWithCustomError(xsgd, "ERC20InsufficientBalance");
    });

    it("supports listings from multiple NFT collections with the same tokenId", async function () {
        const { seller, marketplace, nftA, nftB } = await deployFixture();
        const sellerAddress = await seller.getAddress();
        const tokenId = 1n;

        await nftA.connect(seller).mintWithTokenId(sellerAddress, tokenId);
        await nftB.connect(seller).mintWithTokenId(sellerAddress, tokenId);

        await nftA.connect(seller).approve(await marketplace.getAddress(), tokenId);
        await nftB.connect(seller).approve(await marketplace.getAddress(), tokenId);

        await marketplace.connect(seller).listNFT(await nftA.getAddress(), tokenId, 100);
        await marketplace.connect(seller).listNFT(await nftB.getAddress(), tokenId, 200);

        const listingA = await marketplace.getListing(await nftA.getAddress(), tokenId);
        const listingB = await marketplace.getListing(await nftB.getAddress(), tokenId);
        expect(listingA.isActive).to.equal(true);
        expect(listingB.isActive).to.equal(true);
    });

    it("supports relisting after cancellation", async function () {
        const { seller, marketplace, nftA } = await deployFixture();
        const sellerAddress = await seller.getAddress();
        const tokenId = 1n;
        const nftAddress = await nftA.getAddress();

        await nftA.connect(seller).mintWithTokenId(sellerAddress, tokenId);
        await nftA.connect(seller).approve(await marketplace.getAddress(), tokenId);
        await marketplace.connect(seller).listNFT(nftAddress, tokenId, 100);

        await marketplace.connect(seller).cancelListing(nftAddress, tokenId);

        await nftA.connect(seller).approve(await marketplace.getAddress(), tokenId);
        await marketplace.connect(seller).listNFT(nftAddress, tokenId, 200);

        const listing = await marketplace.getListing(nftAddress, tokenId);
        expect(listing.seller).to.equal(sellerAddress);
        expect(listing.price).to.equal(200);
        expect(listing.isActive).to.equal(true);
    });

    it("supports relisting by the new owner after a sale", async function () {
        const { seller, buyer, xsgd, marketplace, nftA, ethers } = await deployFixture();
        const tokenId = 1n;
        const nftAddress = await nftA.getAddress();
        const price = ethers.parseUnits("10", 18);

        await nftA.connect(seller).mintWithTokenId(await seller.getAddress(), tokenId);
        await nftA.connect(seller).approve(await marketplace.getAddress(), tokenId);
        await marketplace.connect(seller).listNFT(nftAddress, tokenId, price);

        await xsgd.transfer(await buyer.getAddress(), price);
        await xsgd.connect(buyer).approve(await marketplace.getAddress(), price);
        await marketplace.connect(buyer).buyNFT(nftAddress, tokenId);

        await nftA.connect(buyer).approve(await marketplace.getAddress(), tokenId);
        await marketplace.connect(buyer).listNFT(nftAddress, tokenId, 50);

        const listing = await marketplace.getListing(nftAddress, tokenId);
        expect(listing.seller).to.equal(await buyer.getAddress());
        expect(listing.price).to.equal(50);
        expect(listing.isActive).to.equal(true);
    });

    it("rounds commission down for very small prices", async function () {
        const { owner, seller, buyer, xsgd, marketplace, nftA } = await deployFixture();
        const ownerAddress = await owner.getAddress();
        const sellerAddress = await seller.getAddress();
        const buyerAddress = await buyer.getAddress();
        const nftAddress = await nftA.getAddress();
        const tokenId = 1n;
        const price = 1n;

        await nftA.connect(seller).mintWithTokenId(sellerAddress, tokenId);
        await nftA.connect(seller).approve(await marketplace.getAddress(), tokenId);
        await marketplace.connect(seller).listNFT(nftAddress, tokenId, price);

        await xsgd.transfer(buyerAddress, price);
        await xsgd.connect(buyer).approve(await marketplace.getAddress(), price);

        const ownerBalanceBefore = await xsgd.balanceOf(ownerAddress);
        const sellerBalanceBefore = await xsgd.balanceOf(sellerAddress);

        await expect(marketplace.connect(buyer).buyNFT(nftAddress, tokenId))
            .to.emit(marketplace, "NFTPurchased")
            .withArgs(buyerAddress, sellerAddress, nftAddress, tokenId, price, 0, 1);

        const ownerBalanceAfter = await xsgd.balanceOf(ownerAddress);
        const sellerBalanceAfter = await xsgd.balanceOf(sellerAddress);

        expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(0);
        expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(1);
    });

    it("returns listed contracts and listings per contract", async function () {
        const { seller, marketplace, nftA, nftB } = await deployFixture();
        const sellerAddress = await seller.getAddress();
        const nftAAddress = await nftA.getAddress();
        const nftBAddress = await nftB.getAddress();

        await nftA.connect(seller).mintWithTokenId(sellerAddress, 1);
        await nftA.connect(seller).mintWithTokenId(sellerAddress, 2);
        await nftB.connect(seller).mintWithTokenId(sellerAddress, 11);

        await nftA.connect(seller).setApprovalForAll(await marketplace.getAddress(), true);
        await nftB.connect(seller).setApprovalForAll(await marketplace.getAddress(), true);

        await marketplace.connect(seller).listNFT(nftAAddress, 1, 100);
        await marketplace.connect(seller).listNFT(nftAAddress, 2, 200);
        await marketplace.connect(seller).listNFT(nftBAddress, 11, 300);

        const listedContracts = await marketplace.getListedContracts();
        expect(listedContracts).to.include(nftAAddress);
        expect(listedContracts).to.include(nftBAddress);

        const [tokenIdsA, listingsA] = await marketplace.getListingsByContract(nftAAddress);
        expect(tokenIdsA.length).to.equal(listingsA.length);
        expect(tokenIdsA.map(id => Number(id)).sort((a, b) => a - b)).to.deep.equal([1, 2]);

        const listingByTokenId = new Map<number, (typeof listingsA)[number]>();
        tokenIdsA.forEach((id, i) => listingByTokenId.set(Number(id), listingsA[i]));

        expect(listingByTokenId.get(1)?.seller).to.equal(sellerAddress);
        expect(listingByTokenId.get(1)?.price).to.equal(100);
        expect(listingByTokenId.get(1)?.isActive).to.equal(true);

        expect(listingByTokenId.get(2)?.seller).to.equal(sellerAddress);
        expect(listingByTokenId.get(2)?.price).to.equal(200);
        expect(listingByTokenId.get(2)?.isActive).to.equal(true);
    });

    it("keeps contract listed when one of multiple token listings is removed", async function () {
        const { seller, marketplace, nftA } = await deployFixture();
        const sellerAddress = await seller.getAddress();
        const nftAAddress = await nftA.getAddress();

        await nftA.connect(seller).mintWithTokenId(sellerAddress, 1);
        await nftA.connect(seller).mintWithTokenId(sellerAddress, 2);
        await nftA.connect(seller).setApprovalForAll(await marketplace.getAddress(), true);

        await marketplace.connect(seller).listNFT(nftAAddress, 1, 100);
        await marketplace.connect(seller).listNFT(nftAAddress, 2, 200);

        await marketplace.connect(seller).cancelListing(nftAAddress, 1);

        const listedContracts = await marketplace.getListedContracts();
        expect(listedContracts).to.include(nftAAddress);

        const [tokenIdsA, listingsA] = await marketplace.getListingsByContract(nftAAddress);
        expect(tokenIdsA.map(id => Number(id))).to.deep.equal([2]);
        expect(listingsA.length).to.equal(1);
        expect(listingsA[0].isActive).to.equal(true);
        expect(listingsA[0].price).to.equal(200);
    });

    it("removes contract from listed contracts when last listing is removed", async function () {
        const { seller, marketplace, nftA } = await deployFixture();
        const nftAAddress = await nftA.getAddress();

        await nftA.connect(seller).mintWithTokenId(await seller.getAddress(), 1);
        await nftA.connect(seller).approve(await marketplace.getAddress(), 1);
        await marketplace.connect(seller).listNFT(nftAAddress, 1, 100);

        await marketplace.connect(seller).cancelListing(nftAAddress, 1);

        const listedContracts = await marketplace.getListedContracts();
        expect(listedContracts).to.not.include(nftAAddress);

        const [tokenIdsA, listingsA] = await marketplace.getListingsByContract(nftAAddress);
        expect(tokenIdsA.length).to.equal(0);
        expect(listingsA.length).to.equal(0);
    });

    it("buy path removes last listing and collection", async function () {
        const { seller, buyer, xsgd, marketplace, nftA } = await deployFixture();
        const nftAAddress = await nftA.getAddress();
        const tokenId = 1n;
        const price = 1000n;

        await nftA.connect(seller).mintWithTokenId(await seller.getAddress(), tokenId);
        await nftA.connect(seller).approve(await marketplace.getAddress(), tokenId);
        await marketplace.connect(seller).listNFT(nftAAddress, tokenId, price);

        await xsgd.transfer(await buyer.getAddress(), price);
        await xsgd.connect(buyer).approve(await marketplace.getAddress(), price);

        await marketplace.connect(buyer).buyNFT(nftAAddress, tokenId);

        const listing = await marketplace.getListing(nftAAddress, tokenId);
        expect(listing.isActive).to.equal(false);

        const listedContracts = await marketplace.getListedContracts();
        expect(listedContracts).to.not.include(nftAAddress);

        const [tokenIdsA, listingsA] = await marketplace.getListingsByContract(nftAAddress);
        expect(tokenIdsA.length).to.equal(0);
        expect(listingsA.length).to.equal(0);
    });
});
