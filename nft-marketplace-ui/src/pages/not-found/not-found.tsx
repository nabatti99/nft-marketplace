import { Button } from "@heroui/react";
import { Link } from "react-router-dom";

const NotFoundPage = (): JSX.Element => {
  return (
    <main className="grow flex flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="text-foreground-500">This page does not exist.</p>
      <Button as={Link} color="primary" to="/marketplace">
        Go to Marketplace
      </Button>
    </main>
  );
};

export default NotFoundPage;
