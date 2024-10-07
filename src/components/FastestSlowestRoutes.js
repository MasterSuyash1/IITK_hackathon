import React, { useState } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
import {
    Box,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Text,
    Flex,
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

    // Function to render route color with a '#' prefix
    const renderColorBox = (color) => {
        const formattedColor = `#${color}`; // Add '#' prefix to color
        return (
            <Box
                width="20px"
                height="20px"
                borderRadius="full"
                backgroundColor={formattedColor}
                border="1px solid black"
            />
        );
    };

    // Pagination for fastest routes
    const indexOfLastFastestRoute = currentPageFastest * routesPerPage;
    const indexOfFirstFastestRoute = indexOfLastFastestRoute - routesPerPage;
    const currentFastestRoutes = fastestRoutes.slice(indexOfFirstFastestRoute, indexOfLastFastestRoute);

    // Pagination for slowest routes
    const indexOfLastSlowestRoute = currentPageSlowest * routesPerPage;
    const indexOfFirstSlowestRoute = indexOfLastSlowestRoute - routesPerPage;
    const currentSlowestRoutes = slowestRoutes.slice(indexOfFirstSlowestRoute, indexOfLastSlowestRoute);

    const renderFastestRows = () => {
        return currentFastestRoutes.map((route, index) => (
            <Tr key={index}>
                <Td>{route.route_id || "NA"}</Td>
                <Td>{route.route_long_name || "NA"}</Td>
                <Td>{renderColorBox(route.route_color)}</Td> {/* Render color box */}
                <Td>{route.service_speed || "NA"}</Td>
            </Tr>
        ));
    };

    const renderSlowestRows = () => {
        return currentSlowestRoutes.map((route, index) => (
            <Tr key={index}>
                <Td>{route.route_id || "NA"}</Td>
                <Td>{route.route_long_name || "NA"}</Td>
                <Td>{renderColorBox(route.route_color)}</Td> {/* Render color box */}
                <Td>{route.service_speed || "NA"}</Td>
            </Tr>
        ));
    };

    const handleNextPageFastest = () => {
        if (currentPageFastest < Math.ceil(fastestRoutes.length / routesPerPage)) {
            setCurrentPageFastest(currentPageFastest + 1);
        }
    };

    const handlePreviousPageFastest = () => {
        if (currentPageFastest > 1) {
            setCurrentPageFastest(currentPageFastest - 1);
        }
    };

    const handleNextPageSlowest = () => {
        if (currentPageSlowest < Math.ceil(slowestRoutes.length / routesPerPage)) {
            setCurrentPageSlowest(currentPageSlowest + 1);
        }
    };

    const handlePreviousPageSlowest = () => {
        if (currentPageSlowest > 1) {
            setCurrentPageSlowest(currentPageSlowest - 1);
        }
    };

    // Prepare data for the Plotly chart
    const plotData = {
        fastest: {
            x: currentFastestRoutes.map(route => route.route_long_name),
            y: currentFastestRoutes.map(route => route.service_speed),
            type: 'bar',
            name: 'Fastest Routes',
            marker: { color: '5463FF' },
        },
        slowest: {
            x: currentSlowestRoutes.map(route => route.route_long_name),
            y: currentSlowestRoutes.map(route => route.service_speed),
            type: 'bar',
            name: 'Slowest Routes',
            marker: { color: 'FF5656' },
        },
    };

    return (
        <Box p={6} bg="gray.50" borderRadius="md" boxShadow="md">
            <Text fontSize="2xl" mb={4}>
                Fastest and Slowest Routes
            </Text>

            {/* Date selection and search button */}
            <Flex mb={4} justifyContent="flex-start">
                <Text mr={2}>Select Date:</Text>
                <input
                    type="text"
                    placeholder="YYYYMMDD"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{
                        padding: "0.5rem",
                        borderRadius: "4px",
                        border: "1px solid gray",
                    }}
                />
                <Button
                    ml={2}
                    onClick={fetchRoutesData}
                    colorScheme="blue"
                    isLoading={isLoading}
                >
                    Search
                </Button>
            </Flex>

            {fastestRoutes.length === 0 && slowestRoutes.length === 0 ? (
                <Text>No routes to display</Text>
            ) : (
                <>
                    {/* Plotly Chart */}
                    <Plot
                        data={[plotData.fastest, plotData.slowest]}
                        layout={{
                            title: 'Service Speed of Routes',
                            barmode: 'group',
                            xaxis: {
                                title: 'Route Name',
                            },
                            yaxis: {
                                title: 'Service Speed',
                            },
                        }}
                        style={{ width: '100%', height: '400px' }}
                    />

                    <Text fontSize="xl" mt={4}>Fastest Routes</Text>
                    <Table variant="striped" size="sm" mt={2}>
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

                    {/* Fastest Routes Pagination */}
                    <Flex justify="space-between" mt={4}>
                        <Button
                            onClick={handlePreviousPageFastest}
                            disabled={currentPageFastest === 1}
                            colorScheme="blue"
                        >
                            Previous
                        </Button>
                        <Text>
                            Page {currentPageFastest} of{" "}
                            {Math.ceil(fastestRoutes.length / routesPerPage)}
                        </Text>
                        <Button
                            onClick={handleNextPageFastest}
                            disabled={
                                currentPageFastest ===
                                Math.ceil(fastestRoutes.length / routesPerPage)
                            }
                            colorScheme="blue"
                        >
                            Next
                        </Button>
                    </Flex>

                    <Text fontSize="xl" mt={4}>Slowest Routes</Text>
                    <Table variant="striped" size="sm" mt={2}>
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

                    {/* Slowest Routes Pagination */}
                    <Flex justify="space-between" mt={4}>
                        <Button
                            onClick={handlePreviousPageSlowest}
                            disabled={currentPageSlowest === 1}
                            colorScheme="blue"
                        >
                            Previous
                        </Button>
                        <Text>
                            Page {currentPageSlowest} of{" "}
                            {Math.ceil(slowestRoutes.length / routesPerPage)}
                        </Text>
                        <Button
                            onClick={handleNextPageSlowest}
                            disabled={
                                currentPageSlowest ===
                                Math.ceil(slowestRoutes.length / routesPerPage)
                            }
                            colorScheme="blue"
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
