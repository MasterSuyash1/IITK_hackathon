import React, { useState, useEffect } from "react";
import axios from "axios";
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
    VStack,
    Input,
    InputGroup,
    InputRightElement,
    Spinner,
} from "@chakra-ui/react";
import { useConfig } from "../configContext";
import Plot from "react-plotly.js"; // Import Plotly component

function FrequentRoutesModal({ onClose }) {
    const { baseURL } = useConfig();
    const [frequentRoutes, setFrequentRoutes] = useState({
        most_frequent_routes: [],
        least_frequent_routes: [],
    });
    const [currentPageMost, setCurrentPageMost] = useState(1);
    const [currentPageLeast, setCurrentPageLeast] = useState(1);
    const [routesPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchDate, setSearchDate] = useState("");
    const [isSearched, setIsSearched] = useState(false);

    useEffect(() => {
        if (isSearched) {
            fetchRoutesData(searchDate);
        }
    }, [searchDate, isSearched]);

    const fetchRoutesData = async (date) => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.get(
                `${baseURL}/api/frequent_routes?date=${date}`
            );
            if (response.status === 200) {
                setFrequentRoutes(response.data);
            } else {
                setError("Error fetching frequent routes");
            }
        } catch (err) {
            setError("Error fetching frequent routes");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (searchDate.trim() === "") {
            setError("Please enter a date");
        } else {
            setIsSearched(true);
            setCurrentPageMost(1);
            setCurrentPageLeast(1);
        }
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

    // Pagination for Most Frequent Routes
    const indexOfLastMostRoute = currentPageMost * routesPerPage;
    const indexOfFirstMostRoute = indexOfLastMostRoute - routesPerPage;
    const currentMostFrequentRoutes = frequentRoutes.most_frequent_routes.slice(
        indexOfFirstMostRoute,
        indexOfLastMostRoute
    );

    // Pagination for Least Frequent Routes
    const indexOfLastLeastRoute = currentPageLeast * routesPerPage;
    const indexOfFirstLeastRoute = indexOfLastLeastRoute - routesPerPage;
    const currentLeastFrequentRoutes =
        frequentRoutes.least_frequent_routes.slice(
            indexOfFirstLeastRoute,
            indexOfLastLeastRoute
        );

    // Prepare data for Plotly
    const preparePlotData = () => {
        const mostFrequent = currentMostFrequentRoutes.map(route => ({
            routeName: route.route_long_name,
            maxHeadway: route.max_headway,
            minHeadway: route.min_headway,
        }));

        const leastFrequent = currentLeastFrequentRoutes.map(route => ({
            routeName: route.route_long_name,
            maxHeadway: route.max_headway,
            minHeadway: route.min_headway,
        }));

        return {
            xMost: mostFrequent.map(route => route.routeName),
            yMaxMost: mostFrequent.map(route => route.maxHeadway),
            yMinMost: mostFrequent.map(route => route.minHeadway),
            xLeast: leastFrequent.map(route => route.routeName),
            yMaxLeast: leastFrequent.map(route => route.maxHeadway),
            yMinLeast: leastFrequent.map(route => route.minHeadway),
        };
    };

    const plotData = preparePlotData();

    return (
        <Box p={6} bg="gray.50" borderRadius="md" boxShadow="md">
            <Text fontSize="2xl" mb={4}>
                Frequent Routes Analysis
            </Text>

            {/* Search Bar */}
            <InputGroup mb={4}>
                <Input
                    placeholder="Enter date (YYYYMMDD)"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                />
                <InputRightElement width="4.5rem">
                    <Button h="1.75rem" size="sm" onClick={handleSearch}>
                        Search
                    </Button>
                </InputRightElement>
            </InputGroup>

            {loading ? (
                <Spinner size="lg" />
            ) : error ? (
                <Text color="red.500">{error}</Text>
            ) : (
                <>
                    {frequentRoutes.most_frequent_routes.length > 0 && (
                        <>
                            <Text fontSize="lg" mb={2}>
                                Most Frequent Routes
                            </Text>
                            <Table variant="simple" size="sm" mb={6}>
                                <Thead>
                                    <Tr>
                                        <Th>Route ID</Th>
                                        <Th>Route Name</Th>
                                        <Th>Route Color</Th>
                                        <Th>Max Headway</Th>
                                        <Th>Min Headway</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {currentMostFrequentRoutes.map(
                                        (route, index) => (
                                            <Tr key={index}>
                                                <Td>{route.route_id}</Td>
                                                <Td>{route.route_long_name}</Td>
                                                <Td>{renderColorBox(route.route_color)}</Td> {/* Render color box */}
                                                <Td>{route.max_headway}</Td>
                                                <Td>{route.min_headway}</Td>
                                            </Tr>
                                        )
                                    )}
                                </Tbody>
                            </Table>

                            {/* Plotly Chart for Most Frequent Routes */}
                            <Plot
                                data={[
                                    {
                                        x: plotData.xMost,
                                        y: plotData.yMaxMost,
                                        type: 'bar',
                                        name: 'Max Headway',
                                    },
                                    {
                                        x: plotData.xMost,
                                        y: plotData.yMinMost,
                                        type: 'bar',
                                        name: 'Min Headway',
                                    },
                                ]}
                                layout={{
                                    title: 'Most Frequent Routes - Headway',
                                    barmode: 'group',
                                    xaxis: { title: 'Route Name' },
                                    yaxis: { title: 'Headway (min)' },
                                }}
                            />

                            {/* Pagination for Most Frequent Routes */}
                            <Flex justify="space-between" mt={4}>
                                <Button
                                    onClick={() =>
                                        setCurrentPageMost((prev) =>
                                            Math.max(prev - 1, 1)
                                        )
                                    }
                                    disabled={currentPageMost === 1}
                                    colorScheme="blue"
                                >
                                    Previous
                                </Button>
                                <Text>
                                    Page {currentPageMost} of{" "}
                                    {Math.ceil(
                                        frequentRoutes.most_frequent_routes
                                            .length / routesPerPage
                                    )}
                                </Text>
                                <Button
                                    onClick={() =>
                                        setCurrentPageMost((prev) =>
                                            Math.min(
                                                prev + 1,
                                                Math.ceil(
                                                    frequentRoutes
                                                        .most_frequent_routes
                                                        .length / routesPerPage
                                                )
                                            )
                                        )
                                    }
                                    colorScheme="blue"
                                    disabled={
                                        currentPageMost ===
                                        Math.ceil(
                                            frequentRoutes.most_frequent_routes
                                                .length / routesPerPage
                                        )
                                    }
                                >
                                    Next
                                </Button>
                            </Flex>
                        </>
                    )}

                    {frequentRoutes.least_frequent_routes.length > 0 && (
                        <>
                            <Text fontSize="lg" mb={2}>
                                Least Frequent Routes
                            </Text>
                            <Table variant="simple" size="sm">
                                <Thead>
                                    <Tr>
                                        <Th>Route ID</Th>
                                        <Th>Route Name</Th>
                                        <Th>Route Color</Th>
                                        <Th>Max Headway</Th>
                                        <Th>Min Headway</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {currentLeastFrequentRoutes.map(
                                        (route, index) => (
                                            <Tr key={index}>
                                                <Td>{route.route_id}</Td>
                                                <Td>{route.route_long_name}</Td>
                                                <Td>{renderColorBox(route.route_color)}</Td> {/* Render color box */}
                                                <Td>{route.max_headway}</Td>
                                                <Td>{route.min_headway}</Td>
                                            </Tr>
                                        )
                                    )}
                                </Tbody>
                            </Table>

                            {/* Plotly Chart for Least Frequent Routes */}
                            <Plot
                                data={[
                                    {
                                        x: plotData.xLeast,
                                        y: plotData.yMaxLeast,
                                        type: 'bar',
                                        name: 'Max Headway',
                                    },
                                    {
                                        x: plotData.xLeast,
                                        y: plotData.yMinLeast,
                                        type: 'bar',
                                        name: 'Min Headway',
                                    },
                                ]}
                                layout={{
                                    title: 'Least Frequent Routes - Headway',
                                    barmode: 'group',
                                    xaxis: { title: 'Route Name' },
                                    yaxis: { title: 'Headway (min)' },
                                }}
                            />

                            {/* Pagination for Least Frequent Routes */}
                            <Flex justify="space-between" mt={4}>
                                <Button
                                    onClick={() =>
                                        setCurrentPageLeast((prev) =>
                                            Math.max(prev - 1, 1)
                                        )
                                    }
                                    disabled={currentPageLeast === 1}
                                    colorScheme="blue"
                                >
                                    Previous
                                </Button>
                                <Text>
                                    Page {currentPageLeast} of{" "}
                                    {Math.ceil(
                                        frequentRoutes.least_frequent_routes
                                            .length / routesPerPage
                                    )}
                                </Text>
                                <Button
                                    onClick={() =>
                                        setCurrentPageLeast((prev) =>
                                            Math.min(
                                                prev + 1,
                                                Math.ceil(
                                                    frequentRoutes
                                                        .least_frequent_routes
                                                        .length / routesPerPage
                                                )
                                            )
                                        )
                                    }
                                    colorScheme="blue"
                                    disabled={
                                        currentPageLeast ===
                                        Math.ceil(
                                            frequentRoutes.least_frequent_routes
                                                .length / routesPerPage
                                        )
                                    }
                                >
                                    Next
                                </Button>
                            </Flex>
                        </>
                    )}
                </>
            )}
        </Box>
    );
}

export default FrequentRoutesModal;
