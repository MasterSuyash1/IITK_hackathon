import React, { useState } from "react";
import axios from "axios";
import {
    Box,
    Button,
    Table,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    Heading,
    useToast,
    Spinner,
    VStack,
    HStack,
} from "@chakra-ui/react";
import { useConfig } from "../configContext";
import Plot from "react-plotly.js";

const RouteEfficiency = ({ onClose }) => {
    const { baseURL } = useConfig();
    const [mostEfficientRoutes, setMostEfficientRoutes] = useState([]);
    const [leastEfficientRoutes, setLeastEfficientRoutes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [date, setDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [currentPageLeast, setCurrentPageLeast] = useState(1);
    const [routesPerPage] = useState(5);
    const toast = useToast();

    const fetchRouteEfficiency = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(
                `${baseURL}/api/route_efficiency`,
                {
                    params: { date },
                }
            );
            setMostEfficientRoutes(response.data.most_efficient_routes);
            setLeastEfficientRoutes(response.data.least_efficient_routes);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch route efficiency data",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDateChange = (e) => setDate(e.target.value);

    const indexOfLastRoute = currentPage * routesPerPage;
    const indexOfFirstRoute = indexOfLastRoute - routesPerPage;
    const currentMostEfficientRoutes = mostEfficientRoutes.slice(
        indexOfFirstRoute,
        indexOfLastRoute
    );

    const indexOfLastLeastRoute = currentPageLeast * routesPerPage;
    const indexOfFirstLeastRoute = indexOfLastLeastRoute - routesPerPage;
    const currentLeastEfficientRoutes = leastEfficientRoutes.slice(
        indexOfFirstLeastRoute,
        indexOfLastLeastRoute
    );

    const paginateMostEfficient = (pageNumber) => setCurrentPage(pageNumber);
    const paginateLeastEfficient = (pageNumber) => setCurrentPageLeast(pageNumber);

    // Prepare data for Plotly chart
    const mostEfficientPlotData = {
        x: mostEfficientRoutes.map(route => route.route_long_name),
        y: mostEfficientRoutes.map(route => route.efficiency_score),
        type: 'bar',
        name: 'Most Efficient Routes',
        marker: { color: '8FD14F' },
    };

    const leastEfficientPlotData = {
        x: leastEfficientRoutes.map(route => route.route_long_name),
        y: leastEfficientRoutes.map(route => route.efficiency_score),
        type: 'bar',
        name: 'Least Efficient Routes',
        marker: { color: 'FF885B' },
    };

    return (
        <VStack spacing={6} p={4}>
            <Heading>Route Efficiency</Heading>
            <Box>
                <input
                    type="text"
                    placeholder="Enter date (YYYYMMDD)"
                    value={date}
                    onChange={handleDateChange}
                />
                <Button colorScheme="teal" onClick={fetchRouteEfficiency} ml={4}>
                    Fetch Data
                </Button>
            </Box>

            {isLoading ? (
                <Spinner />
            ) : (
                <>
                    <Box>
                        <Heading size="md">Most Efficient Routes</Heading>
                        <Table variant="simple" mt={4}>
                            <Thead>
                                <Tr>
                                    <Th>Route ID</Th>
                                    <Th>Route Name</Th>
                                    <Th>Efficiency Score</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {currentMostEfficientRoutes.map((route) => (
                                    <Tr key={route.route_id}>
                                        <Td>{route.route_id}</Td>
                                        <Td>{route.route_long_name}</Td>
                                        <Td>{route.efficiency_score.toFixed(2)}</Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                        {/* Pagination for Most Efficient Routes */}
                        <HStack mt={4} spacing={2}>
                            {Array.from(
                                {
                                    length: Math.ceil(mostEfficientRoutes.length / routesPerPage),
                                },
                                (_, index) => (
                                    <Button key={index} onClick={() => paginateMostEfficient(index + 1)}>
                                        {index + 1}
                                    </Button>
                                )
                            )}
                        </HStack>
                    </Box>

                    {/* Plot for Most Efficient Routes */}
                    <Plot
                        data={[mostEfficientPlotData]}
                        layout={{ title: "Most Efficient Routes", width: 700, height: 400 }}
                    />

                    <Box>
                        <Heading size="md">Least Efficient Routes</Heading>
                        <Table variant="simple" mt={4}>
                            <Thead>
                                <Tr>
                                    <Th>Route ID</Th>
                                    <Th>Route Name</Th>
                                    <Th>Efficiency Score</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {currentLeastEfficientRoutes.map((route) => (
                                    <Tr key={route.route_id}>
                                        <Td>{route.route_id}</Td>
                                        <Td>{route.route_long_name}</Td>
                                        <Td>{route.efficiency_score.toFixed(2)}</Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                        {/* Pagination for Least Efficient Routes */}
                        <HStack mt={4} spacing={2}>
                            {Array.from(
                                {
                                    length: Math.ceil(leastEfficientRoutes.length / routesPerPage),
                                },
                                (_, index) => (
                                    <Button key={index} onClick={() => paginateLeastEfficient(index + 1)}>
                                        {index + 1}
                                    </Button>
                                )
                            )}
                        </HStack>
                    </Box>

                    {/* Plot for Least Efficient Routes */}
                    <Plot
                        data={[leastEfficientPlotData]}
                        layout={{ title: "Least Efficient Routes", width: 700, height: 400 }}
                    />
                </>
            )}

            <VStack mt={4}>
                <Button colorScheme="red" onClick={onClose}>
                    Close
                </Button>
            </VStack>
        </VStack>
    );
};

export default RouteEfficiency;
