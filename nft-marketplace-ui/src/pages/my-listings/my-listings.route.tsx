import MyListingsPage from "./my-listings.js";

const MyListingsRoutes = {
  path: "/my-listings",
  children: [
    {
      index: true,
      element: <MyListingsPage />,
    },
  ],
};

export default MyListingsRoutes;
