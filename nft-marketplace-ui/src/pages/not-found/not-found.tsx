import { Button } from "@heroui/react";
import { Link } from "react-router-dom";
import RejectedPng from "./assets/rejected.png";

const NotFoundPage = (): JSX.Element => {
  return (
    <main className="grow flex flex-col items-center justify-center gap-4 text-center">
      <img src={RejectedPng} alt="Rejected" className="w-64 h-64 object-contain" />
      <h1 className="text-5xl font-bold">404</h1>
      <p className="text-foreground-500">This page does not exist.</p>
      <Button
        as={Link}
        color="primary"
        className="font-semibold border-cyan-300/80 bg-gradient-to-r from-cyan-600/80 to-blue-600/80 text-cyan-50 shadow-lg hover:from-cyan-600/95 hover:to-blue-600/95"
        to="/marketplace"
      >
        Go to Marketplace
      </Button>
    </main>
  );
};

export default NotFoundPage;
