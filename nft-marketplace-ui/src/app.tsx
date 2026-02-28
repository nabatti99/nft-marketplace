import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { PropsWithChildren } from "react";
import { NavigateOptions, useHref, useNavigate } from "react-router-dom";
import { AppMain } from "./components/layout/app-main.js";
import { AppNavBar } from "./components/layout/app-navbar.js";
import AppRoute from "./router/app-route.js";
import { ErrorBoundary } from "./components/layout/error-boundary.js";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

function AppLayout({ children }: PropsWithChildren): JSX.Element {
  return (
    <div className="flex flex-col h-screen">
      <AppNavBar />
      <div className="grow flex items-stretch">
        <AppMain className="grow">{children}</AppMain>
      </div>
    </div>
  );
}

function App(): JSX.Element {
  const navigate = useNavigate();

  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <ToastProvider />
      <ErrorBoundary>
        <AppLayout>
          <AppRoute />
        </AppLayout>
      </ErrorBoundary>
    </HeroUIProvider>
  );
}

export default App;
