import { RouterProvider } from "react-router";
import { router } from "./routes";
import { PerformanceStoreProvider } from "./performance/store";

export default function App() {
  return (
    <PerformanceStoreProvider>
      <RouterProvider router={router} />
    </PerformanceStoreProvider>
  );
}
