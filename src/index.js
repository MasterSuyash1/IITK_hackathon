import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import App from "./App";
import { ConfigProvider } from "./configContext"; // Import the ConfigProvider

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <ChakraProvider>
        <ConfigProvider> {/* Wrap the app with ConfigProvider */}
            <App />
        </ConfigProvider>
    </ChakraProvider>
);
