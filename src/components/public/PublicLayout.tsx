import React from "react";
import { Outlet } from "react-router-dom";
import MegaMenuHeader from "./MegaMenuHeader";
import PublicFooter from "./PublicFooter";

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[hsl(222,47%,8%)] text-white overflow-x-hidden">
      <MegaMenuHeader />
      <main className="pt-16">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};

export default PublicLayout;
