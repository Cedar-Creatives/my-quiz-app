import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();

  console.log(
    "PrivateRoute - currentUser:",
    currentUser ? currentUser.email : "null",
    "loading:",
    loading
  );

  if (loading) {
    console.log("PrivateRoute - still loading, showing loading state");
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    console.log("PrivateRoute - no user, redirecting to /auth");
    return <Navigate to="/auth" />;
  }

  console.log("PrivateRoute - user authenticated, rendering children");
  return children;
}

export default PrivateRoute;
