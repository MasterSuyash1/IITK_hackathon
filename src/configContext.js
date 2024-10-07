import React, { createContext, useContext } from "react";

// Create the config context
const ConfigContext = createContext();

// Custom hook to use the config context
export const useConfig = () => useContext(ConfigContext);

// Provider component
export const ConfigProvider = ({ children }) => {
    const config = {
        // baseURL: "http://127.0.0.1:5000",
        baseURL: "https://ubiquitous-fiesta-q554gx4xj74f9jqq-5000.app.github.dev", // Your base URL
    };

    return (
        <ConfigContext.Provider value={config}>
            {children}
        </ConfigContext.Provider>
    );
};
