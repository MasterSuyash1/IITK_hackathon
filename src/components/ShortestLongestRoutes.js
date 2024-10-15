import React, { useState } from "react";
import axios from "axios";
import Plot from "react-plotly.js"; // Import Plotly component
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

function ShortestLongestRoutes({ onClose }) {
    const { baseURL } = useConfig();
    const [routesData, setRoutesData] = useState({
        shortest_routes: [],
        longest_routes: [],
    });
    const [currentPage, setCurrentPage] = useState(1);
    const routesPerPage = 10;
    const [selectedDate, setSelectedDate] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Fetch the shortest and longest routes data when the search button is clicked
    const fetchRoutesData = async () => {
        if (!selectedDate) {
            alert("Please enter a date in YYYYMMDD format.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.get(
                `${baseURL}/api/shortest_longest_routes`,
                {
                    params: { date: selectedDate },
                }
            );
            setRoutesData(response.data);
        } catch (error) {
            console.error("Error fetching routes data:", error);
        }
        setIsLoading(false);
    };

    // Paginate shortest and longest routes data
    const indexOfLastRoute = currentPage * routesPerPage;
    const indexOfFirstRoute = indexOfLastRoute - routesPerPage;
    const currentShortestRoutes = routesData.shortest_routes.slice(
        indexOfFirstRoute,
        indexOfLastRoute
    );
    const currentLongestRoutes = routesData.longest_routes.slice(
        indexOfFirstRoute,
        indexOfLastRoute
    );

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

    const renderRows = (routes) => {
        return routes.map((route, index) => (
            <Tr key={index}>
                <Td>{route.route_id || "NA"}</Td>
                <Td>{route.route_long_name || "NA"}</Td>
                <Td>{renderColorBox(route.route_color) || "NA"}</Td>{" "}
                {/* Updated to use renderColorBox */}
                <Td>{route.mean_trip_distance || "NA"}</Td>
            </Tr>
        ));
    };

    const handleNextPage = () => {
        if (
            currentPage <
            Math.ceil(routesData.shortest_routes.length / routesPerPage)
        ) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Function to prepare data for Plotly
    const preparePlotData = () => {
        const shortestDistances = routesData.shortest_routes.map(
            (route) => route.mean_trip_distance || 0
        );
        const longestDistances = routesData.longest_routes.map(
            (route) => route.mean_trip_distance || 0
        );

        return {
            shortest: {
                x: routesData.shortest_routes.map(
                    (route) => route.route_long_name
                ),
                y: shortestDistances,
                name: "Shortest Routes",
                type: "bar",
            },
            longest: {
                x: routesData.longest_routes.map(
                    (route) => route.route_long_name
                ),
                y: longestDistances,
                name: "Longest Routes",
                type: "bar",
            },
        };
    };

    return (
        <Box p={6} bg="gray.50" borderRadius="md" boxShadow="md">
            <Text fontSize="2xl" mb={4}>
                Shortest and Longest Routes
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
                    isLoading={isLoading} // Show a loading spinner when fetching
                >
                    Search
                </Button>
            </Flex>

            {routesData.shortest_routes.length === 0 &&
            routesData.longest_routes.length === 0 ? (
                <Text>No routes to display</Text>
            ) : (
                <>
                    <Text fontSize="xl" mb={2}>
                        Shortest Routes
                    </Text>
                    <Table variant="striped" size="sm">
                        <Thead>
                            <Tr>
                                <Th>Route ID</Th>
                                <Th>Route Name</Th>
                                <Th>Route Color</Th>
                                <Th>Mean Trip Distance</Th>
                            </Tr>
                        </Thead>
                        <Tbody>{renderRows(currentShortestRoutes)}</Tbody>
                    </Table>

                    <Text fontSize="xl" mt={6} mb={2}>
                        Longest Routes
                    </Text>
                    <Table variant="striped" size="sm">
                        <Thead>
                            <Tr>
                                <Th>Route ID</Th>
                                <Th>Route Name</Th>
                                <Th>Route Color</Th>
                                <Th>Mean Trip Distance</Th>
                            </Tr>
                        </Thead>
                        <Tbody>{renderRows(currentLongestRoutes)}</Tbody>
                    </Table>

                    {/* Plotly Chart */}
                    <Box mt={6}>
                        <Text fontSize="xl" mb={2}>
                            Distance Comparison
                        </Text>
                        <Plot
                            data={[
                                preparePlotData().shortest,
                                preparePlotData().longest,
                            ]}
                            layout={{
                                title: "Shortest vs Longest Routes",
                                barmode: "group",
                                xaxis: {
                                    title: "Route Name",
                                },
                                yaxis: {
                                    title: "Mean Trip Distance",
                                },
                                width: 1400, // Width in pixels
                                height: 500, // Height in pixels
                            }}
                        />
                    </Box>

                    {/* Pagination */}
                    <Flex justify="space-between" mt={4}>
                        <Button
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            colorScheme="blue"
                        >
                            Previous
                        </Button>
                        <Text>
                            Page {currentPage} of{" "}
                            {Math.ceil(
                                routesData.shortest_routes.length /
                                    routesPerPage
                            )}
                        </Text>
                        <Button
                            onClick={handleNextPage}
                            disabled={
                                currentPage ===
                                Math.ceil(
                                    routesData.shortest_routes.length /
                                        routesPerPage
                                )
                            }
                            colorScheme="blue"
                        >
                            Next
                        </Button>
                    </Flex>
                </>
            )}

            {/* Close button */}
            <Box mt={4}>
                <Button colorScheme="red" onClick={onClose}>
                    Close
                </Button>
            </Box>
        </Box>
    );
}

export default ShortestLongestRoutes;
