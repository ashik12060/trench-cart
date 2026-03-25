import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { storeApi } from "@/api/storeClient";

const CustomerAuthContext = createContext(null);

export const CustomerAuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const refreshCustomer = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const data = await storeApi.customers.me();
      setCustomer(data);
    } catch (error) {
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCustomer();
  }, [refreshCustomer]);

  const loginCustomer = async (form) => {
    setAuthError(null);
    const data = await storeApi.customers.login(form);
    setCustomer(data);
    return data;
  };

  const registerCustomer = async (form) => {
    setAuthError(null);
    const data = await storeApi.customers.register(form);
    setCustomer(data);
    return data;
  };

  const logoutCustomer = async () => {
    try {
      await storeApi.customers.logout();
    } finally {
      setCustomer(null);
    }
  };

  const updateProfile = async (payload) => {
    const data = await storeApi.customers.update(payload);
    setCustomer(data);
    return data;
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isLoading,
        authError,
        loginCustomer,
        registerCustomer,
        logoutCustomer,
        updateProfile,
        refreshCustomer,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return context;
};
