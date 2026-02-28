import MarketplaceRoutes from "@/pages/marketplace/marketplace.route";
import MyListingsRoutes from "@/pages/my-listings/my-listings.route";
import NotFoundRoute from "@/pages/not-found/not-found.route";
import SellRoutes from "@/pages/sell/sell.route";
import type React from "react";
import { Navigate, useRoutes } from "react-router-dom";

export const AppRoute: React.FC = () => {
  const routes = useRoutes([
    {
      path: "/",
      element: <Navigate to="/marketplace" replace />,
    },
    MarketplaceRoutes,
    SellRoutes,
    MyListingsRoutes,
    NotFoundRoute,
  ]);
  return routes;
};

export default AppRoute;
