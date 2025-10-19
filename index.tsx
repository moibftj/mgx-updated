import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";

// Clear caches in background after app loads (non-blocking)
setTimeout(() => {
  (async () => {
    try {
      // Clear service workers
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log("Service worker unregistered");
        }
      }

      // Clear all cache storage
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => {
            console.log("Deleting cache:", cacheName);
            return caches.delete(cacheName);
          }),
        );
      }

      console.log("All caches cleared successfully");
    } catch (error) {
      console.error("Error clearing caches:", error);
    }
  })();
}, 100); // Delay cache clearing to avoid blocking initial render

// Debug environment variables
console.log("Environment Variables:", {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
});

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error("ErrorBoundary caught an error:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary details:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h1>Something went wrong.</h1>
          <p>Error: {this.state.error?.message}</p>
          <p>Please check the console for more details.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
