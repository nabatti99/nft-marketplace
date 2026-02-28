import SellPage from "./sell.js";

const SellRoutes = {
  path: "/sell",
  children: [
    {
      index: true,
      element: <SellPage />,
    },
  ],
};

export default SellRoutes;
