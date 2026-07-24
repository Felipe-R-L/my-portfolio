import { Analytics } from "@vercel/analytics/react";
import AppLayout from "./AppLayout";

/**
 * The site is a single scrolling page. A full data router
 * (`createBrowserRouter` + `RouterProvider`) shipped its runtime, turbo-stream
 * deserialiser and history stack for exactly one static route, so the layout is
 * rendered directly instead.
 */
export default function App() {
  return (
    <>
      <AppLayout />
      <Analytics />
    </>
  );
}
