// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract NFTMarketplace is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    uint256 public constant COMMISSION_BPS = 500;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    IERC20 public immutable token;

    struct Listing {
        address seller;
        uint256 price;
        bool isActive;
    }

    // nftContract => tokenId => Listing
    mapping(address => mapping(uint256 => Listing)) private listings;

    // Used for view NFT listings by contract and token ID
    EnumerableSet.AddressSet private listedNFTContracts;
    mapping(address => EnumerableSet.UintSet) private listedNFTIds;

    error InvalidAddress();
    error InvalidPrice();
    error NotTokenOwner();
    error NotListed();
    error AlreadyListed();
    error NotSeller();
    error SellerCannotBuyOwnNFT();

    event NFTListed(
        address indexed seller,
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 price
    );
    event ListingCancelled(
        address indexed seller,
        address indexed nftContract,
        uint256 indexed tokenId
    );
    event NFTPurchased(
        address indexed buyer,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price,
        uint256 commission,
        uint256 sellerProceeds
    );

    constructor(
        address _token,
        address _initialOwner
    ) Ownable(_validatedAddress(_initialOwner)) {
        token = IERC20(_validatedAddress(_token));
    }

    function listNFT(address _nftContract, uint256 _tokenId, uint256 _price) external {
        if (_nftContract == address(0)) {
            revert InvalidAddress();
        }
        if (_price == 0) {
            revert InvalidPrice();
        }

        Listing storage listing = listings[_nftContract][_tokenId];
        if (listing.isActive) {
            revert AlreadyListed();
        }

        if (IERC721(_nftContract).ownerOf(_tokenId) != msg.sender) {
            revert NotTokenOwner();
        }

        IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);

        listings[_nftContract][_tokenId] = Listing({
            seller: msg.sender,
            price: _price,
            isActive: true
        });

        listedNFTContracts.add(_nftContract);
        listedNFTIds[_nftContract].add(_tokenId);

        emit NFTListed(msg.sender, _nftContract, _tokenId, _price);
    }

    function cancelListing(address _nftContract, uint256 _tokenId) external nonReentrant {
        Listing storage listing = listings[_nftContract][_tokenId];
        if (!listing.isActive) {
            revert NotListed();
        }
        if (listing.seller != msg.sender) {
            revert NotSeller();
        }

        address seller = listing.seller;

        _removeListing(_nftContract, _tokenId);

        IERC721(_nftContract).transferFrom(address(this), seller, _tokenId);

        emit ListingCancelled(seller, _nftContract, _tokenId);
    }

    function buyNFT(address _nftContract, uint256 _tokenId) external nonReentrant {
        Listing storage listing = listings[_nftContract][_tokenId];
        if (!listing.isActive) {
            revert NotListed();
        }
        if (listing.seller == msg.sender) {
            revert SellerCannotBuyOwnNFT();
        }

        address seller = listing.seller;
        uint256 price = listing.price;
        uint256 commission = (price * COMMISSION_BPS) / BPS_DENOMINATOR;
        uint256 sellerProceeds = price - commission;

        _removeListing(_nftContract, _tokenId);

        token.safeTransferFrom(msg.sender, address(this), price);
        token.safeTransfer(owner(), commission);
        token.safeTransfer(seller, sellerProceeds);

        IERC721(_nftContract).transferFrom(address(this), msg.sender, _tokenId);

        emit NFTPurchased(
            msg.sender,
            seller,
            _nftContract,
            _tokenId,
            price,
            commission,
            sellerProceeds
        );
    }

    // --- View Functions ---

    function getListing(address _nftContract, uint256 _tokenId) public view returns (Listing memory) {
        return listings[_nftContract][_tokenId];
    }

    function getListingsByContract(address _nftContract) public view returns (uint256[] memory, Listing[] memory) {
        uint256[] memory tokenIds = listedNFTIds[_nftContract].values();

        Listing[] memory listedNFTs = new Listing[](tokenIds.length);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            listedNFTs[i] = getListing(_nftContract, tokenId);
        }

        return (tokenIds, listedNFTs);
    }

    function getListedContracts() public view returns (address[] memory) {
        return listedNFTContracts.values();
    }

    // --- Private Functions ---

    function _removeListing(address _nftContract, uint256 _tokenId) private {
        delete listings[_nftContract][_tokenId];

        listedNFTIds[_nftContract].remove(_tokenId);
        if (listedNFTIds[_nftContract].length() == 0) {
            listedNFTContracts.remove(_nftContract);
        }
    }

    function _validatedAddress(address _value) private pure returns (address) {
        if (_value == address(0)) {
            revert InvalidAddress();
        }
        return _value;
    }
}
