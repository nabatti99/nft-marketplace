import { addToast } from "@heroui/react";
import * as React from "react";

export class ErrorBoundary extends React.Component<{
  children?: React.ReactNode;
}> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
  }

  // Must use arrow function to bind `this`
  handleError = (event: ErrorEvent | PromiseRejectionEvent | Error): void => {
    if (event instanceof ErrorEvent) {
      event.preventDefault();
      addToast({
        title: "Error",
        description: event.message || "Please try again later.",
        color: "danger",
        timeout: 8000,
      });
    }

    if (event instanceof PromiseRejectionEvent) {
      event.preventDefault();
      addToast({
        title: "Error",
        description: event.reason?.message || event.reason || "Please try again later.",
        color: "danger",
        timeout: 8000,
      });
    }

    if (event instanceof Error) {
      addToast({
        title: "Error",
        description: event.message || "Please try again later.",
        color: "danger",
        timeout: 8000,
      });
    }

    console.error("ErrorBoundary caught an error", event);
  };

  componentDidMount(): void {
    window.addEventListener("error", this.handleError);
    window.addEventListener("unhandledrejection", this.handleError);
  }

  componentWillUnmount(): void {
    window.removeEventListener("error", this.handleError);
    window.removeEventListener("unhandledrejection", this.handleError);
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.handleError(error);
  }

  render() {
    return this.props.children;
  }
}
