import React from "react";
import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import Home from "../pages/Home";
import AwardsList from "../pages/AwardsList";
import AwardDetail from "../pages/AwardDetail";
import NotFound from "../pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      { path: "awards", element: <AwardsList /> },
      { path: "awards/:awardId", element: <AwardDetail /> },
    ],
  },
]);