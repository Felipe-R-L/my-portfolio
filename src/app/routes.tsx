import { createBrowserRouter } from "react-router";
import AppLayout from "./AppLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppLayout,
  },
]);
