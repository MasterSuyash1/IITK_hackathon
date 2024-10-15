import React, { useState, useEffect } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
import {
    Box,
    Button,
    Text,
    Input,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Flex,
    VStack,
    useColorMode,
} from "@chakra-ui/react";
import { useConfig } from "../configContext";

function FastestSlowestRoutes({ onClose }) {
    const { baseURL } = useConfig();
    const [fastestRoutes, setFastestRoutes] = useState([]);
    const [slowestRoutes, setSlowestRoutes] = useState([]);
    const [currentPageFastest, setCurrentPageFastest] = useState(1);
    const [currentPageSlowest, setCurrentPageSlowest] = useState(1);
    const routesPerPage = 10;
    const [selectedDate, setSelectedDate] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { colorMode, toggleColorMode } = useColorMode();

    const fetchRoutesData = async () => {
        if (!selectedDate) {
            alert("Please enter a date in YYYYMMDD format.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.get(
                `${baseURL}/api/slowest_fastest_routes`,
                {
                    params: { date: selectedDate },
                }
            );
            setSlowestRoutes(response.data.slowest_routes);
            setFastestRoutes(response.data.fastest_routes);
        } catch (error) {
            console.error("Error fetching routes data:", error);
        }
        setIsLoading(false);
    };

    const renderColorBox = (color) => {
        const formattedColor = color.startsWith("#") ? color : `#${color}`;
        return (
            <Box
                width="20px"
                height="20px"
                borderRadius="md"
                bg={formattedColor}
                border="1px solid black"
                display="inline-block"
            />
        );
    };

    const indexOfLastFastestRoute = currentPageFastest * routesPerPage;
    const indexOfFirstFastestRoute = indexOfLastFastestRoute - routesPerPage;
    const currentFastestRoutes = fastestRoutes.slice(
        indexOfFirstFastestRoute,
        indexOfLastFastestRoute
    );

    const indexOfLastSlowestRoute = currentPageSlowest * routesPerPage;
    const indexOfFirstSlowestRoute = indexOfLastSlowestRoute - routesPerPage;
    const currentSlowestRoutes = slowestRoutes.slice(
        indexOfFirstSlowestRoute,
        indexOfLastSlowestRoute
    );

    const renderFastestRows = () => {
        return currentFastestRoutes.map((route, index) => (
            <Tr key={index}>
                <Td>{route.route_id || "NA"}</Td>
                <Td>{route.route_long_name || "NA"}</Td>
                <Td>{renderColorBox(route.route_color)}</Td>
                <Td>{route.service_speed || "NA"}</Td>
            </Tr>
        ));
    };

    const renderSlowestRows = () => {
        return currentSlowestRoutes.map((route, index) => (
            <Tr key={index}>
                <Td>{route.route_id || "NA"}</Td>
                <Td>{route.route_long_name || "NA"}</Td>
                <Td>{renderColorBox(route.route_color)}</Td>
                <Td>{route.service_speed || "NA"}</Td>
            </Tr>
        ));
    };

    const handleNextPageFastest = () => {
        if (
            currentPageFastest < Math.ceil(fastestRoutes.length / routesPerPage)
        ) {
            setCurrentPageFastest(currentPageFastest + 1);
        }
    };

    const handlePreviousPageFastest = () => {
        if (currentPageFastest > 1) {
            setCurrentPageFastest(currentPageFastest - 1);
        }
    };

    const handleNextPageSlowest = () => {
        if (
            currentPageSlowest < Math.ceil(slowestRoutes.length / routesPerPage)
        ) {
            setCurrentPageSlowest(currentPageSlowest + 1);
        }
    };

    const handlePreviousPageSlowest = () => {
        if (currentPageSlowest > 1) {
            setCurrentPageSlowest(currentPageSlowest - 1);
        }
    };

    const plotData = {
        fastest: {
            x: currentFastestRoutes.map((route) => route.route_long_name),
            y: currentFastestRoutes.map((route) => route.service_speed),
            type: "bar",
            name: "Fastest Routes",
            marker: { color: "5463FF" },
        },
        slowest: {
            x: currentSlowestRoutes.map((route) => route.route_long_name),
            y: currentSlowestRoutes.map((route) => route.service_speed),
            type: "bar",
            name: "Slowest Routes",
            marker: { color: "FF5656" },
        },
    };

    return (
        <Box
            p={6}
            bg={colorMode === "light" ? "gray.100" : "gray.700"}
            borderRadius="md"
            boxShadow="xl"
            maxW="1200px"
            mx="auto"
            fontFamily="Poppins, sans-serif"
        >
            <Flex justify="space-between" mb={4}>
                <Text
                    fontSize="3xl"
                    fontWeight="bold"
                    color={colorMode === "light" ? "gray.800" : "gray.200"}
                >
                    Fastest and Slowest Routes
                </Text>
                <Button onClick={toggleColorMode} colorScheme="purple">
                    {colorMode === "light" ? "Dark Mode" : "Light Mode"}
                </Button>
            </Flex>

            <Flex mb={4} justifyContent="flex-start">
                <Text mr={2}>Select Date:</Text>
                <Input
                    placeholder="YYYYMMDD"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    bg={colorMode === "light" ? "white" : "gray.600"}
                    color={colorMode === "light" ? "gray.800" : "gray.100"}
                    borderColor="purple.300"
                    _hover={{ borderColor: "purple.500" }}
                />
                <Button
                    ml={2}
                    onClick={fetchRoutesData}
                    colorScheme="purple"
                    isLoading={isLoading}
                >
                    Search
                </Button>
            </Flex>

            {fastestRoutes.length === 0 && slowestRoutes.length === 0 ? (
                <Text>No routes to display</Text>
            ) : (
                <>
                    <Plot
                        data={[plotData.fastest, plotData.slowest]}
                        layout={{
                            title: "Service Speed of Routes",
                            barmode: "group",
                            xaxis: {
                                title: "Route Name",
                            },
                            yaxis: {
                                title: "Service Speed",
                            },
                            paper_bgcolor:
                                colorMode === "light"
                                    ? "rgba(0,0,0,0)"
                                    : "rgba(255,255,255,0.1)",
                            plot_bgcolor:
                                colorMode === "light"
                                    ? "rgba(0,0,0,0)"
                                    : "rgba(255,255,255,0.1)",
                            font: {
                                color:
                                    colorMode === "light" ? "black" : "white",
                            },
                        }}
                        style={{ width: "100%", height: "400px" }}
                    />

                    <Text
                        fontSize="2xl"
                        fontWeight="bold"
                        mt={6}
                        mb={4}
                        color={colorMode === "light" ? "gray.800" : "gray.200"}
                    >
                        Fastest Routes
                    </Text>
                    <Table
                        variant="striped"
                        colorScheme="purple"
                        size="md"
                        borderRadius="md"
                        boxShadow="md"
                    >
                        <Thead>
                            <Tr>
                                <Th>Route ID</Th>
                                <Th>Route Name</Th>
                                <Th>Route Color</Th>
                                <Th>Service Speed</Th>
                            </Tr>
                        </Thead>
                        <Tbody>{renderFastestRows()}</Tbody>
                    </Table>

                    <Flex justify="space-between" mt={6} alignItems="center">
                        <Button
                            onClick={handlePreviousPageFastest}
                            disabled={currentPageFastest === 1}
                            colorScheme="purple"
                        >
                            Previous
                        </Button>
                        <Text
                            color={
                                colorMode === "light" ? "gray.700" : "gray.100"
                            }
                        >
                            Page {currentPageFastest} of{" "}
                            {Math.ceil(fastestRoutes.length / routesPerPage)}
                        </Text>
                        <Button
                            onClick={handleNextPageFastest}
                            disabled={
                                currentPageFastest ===
                                Math.ceil(fastestRoutes.length / routesPerPage)
                            }
                            colorScheme="purple"
                        >
                            Next
                        </Button>
                    </Flex>

                    <Text
                        fontSize="2xl"
                        fontWeight="bold"
                        mt={6}
                        mb={4}
                        color={colorMode === "light" ? "gray.800" : "gray.200"}
                    >
                        Slowest Routes
                    </Text>
                    <Table
                        variant="striped"
                        colorScheme="purple"
                        size="md"
                        borderRadius="md"
                        boxShadow="md"
                    >
                        <Thead>
                            <Tr>
                                <Th>Route ID</Th>
                                <Th>Route Name</Th>
                                <Th>Route Color</Th>
                                <Th>Service Speed</Th>
                            </Tr>
                        </Thead>
                        <Tbody>{renderSlowestRows()}</Tbody>
                    </Table>

                    <Flex justify="space-between" mt={6} alignItems="center">
                        <Button
                            onClick={handlePreviousPageSlowest}
                            disabled={currentPageSlowest === 1}
                            colorScheme="purple"
                        >
                            Previous
                        </Button>
                        <Text
                            color={
                                colorMode === "light" ? "gray.700" : "gray.100"
                            }
                        >
                            Page {currentPageSlowest} of{" "}
                            {Math.ceil(slowestRoutes.length / routesPerPage)}
                        </Text>
                        <Button
                            onClick={handleNextPageSlowest}
                            disabled={
                                currentPageSlowest ===
                                Math.ceil(slowestRoutes.length / routesPerPage)
                            }
                            colorScheme="purple"
                        >
                            Next
                        </Button>
                    </Flex>
                </>
            )}
        </Box>
    );
}

export default FastestSlowestRoutes;
