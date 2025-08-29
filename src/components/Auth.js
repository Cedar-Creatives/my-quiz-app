import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Login from "./Login";
import Signup from "./Signup";

function Auth() {
  const [showLogin, setShowLogin] = useState(true);
  const { currentUser, loading } = useAuth();

  const toggleForm = () => {
    setShowLogin(!showLogin);
  };

  // If user is already authenticated, redirect to main app
  if (loading) {
    return <div>Loading...</div>;
  }

  if (currentUser) {
    console.log(
      "Auth component - user already authenticated, redirecting to /"
    );
    return <Navigate to="/" />;
  }

  return (
    <>
      {showLogin ? (
        <Login onToggleForm={toggleForm} />
      ) : (
        <Signup onToggleForm={toggleForm} />
      )}
    </>
  );
}

export default Auth;
