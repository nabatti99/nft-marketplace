import MarketplacePage from "./marketplace.js";

const MarketplaceRoutes = {
  path: "/marketplace",
  children: [
    {
      index: true,
      element: <MarketplacePage />,
    },
  ],
};

export default MarketplaceRoutes;
