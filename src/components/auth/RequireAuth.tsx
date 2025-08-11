import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/store/auth";

const RequireAuth: React.FC = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!session) return <Navigate to="/auth" replace state={{ from: location }} />;
  return <Outlet />;
};

export default RequireAuth;
