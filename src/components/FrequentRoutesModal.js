import React, { useState, useEffect } from "react";
import axios from "axios";
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
    InputGroup,
    InputRightElement,
    Spinner,
    useColorMode,
} from "@chakra-ui/react";
import { useConfig } from "../configContext";
import Plot from "react-plotly.js";

// Include a modern Google font
// import "@fontsource/poppins";

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

    const { colorMode, toggleColorMode } = useColorMode();

    useEffect(() => {
        if (isSearched) {
            fetchRoutesData(searchDate);
        }
    }, [searchDate, isSearched, baseURL]);

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

    const renderColorBox = (color) => {
        const formattedColor = `#${color}`;
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

    const indexOfLastMostRoute = currentPageMost * routesPerPage;
    const indexOfFirstMostRoute = indexOfLastMostRoute - routesPerPage;
    const currentMostFrequentRoutes = frequentRoutes.most_frequent_routes.slice(
        indexOfFirstMostRoute,
        indexOfLastMostRoute
    );

    const indexOfLastLeastRoute = currentPageLeast * routesPerPage;
    const indexOfFirstLeastRoute = indexOfLastLeastRoute - routesPerPage;
    const currentLeastFrequentRoutes =
        frequentRoutes.least_frequent_routes.slice(
            indexOfFirstLeastRoute,
            indexOfLastLeastRoute
        );

    const preparePlotData = () => {
        const mostFrequent = currentMostFrequentRoutes.map((route) => ({
            routeName: route.route_long_name,
            maxHeadway: route.max_headway,
            minHeadway: route.min_headway,
        }));

        const leastFrequent = currentLeastFrequentRoutes.map((route) => ({
            routeName: route.route_long_name,
            maxHeadway: route.max_headway,
            minHeadway: route.min_headway,
        }));

        return {
            xMost: mostFrequent.map((route) => route.routeName),
            yMaxMost: mostFrequent.map((route) => route.maxHeadway),
            yMinMost: mostFrequent.map((route) => route.minHeadway),
            xLeast: leastFrequent.map((route) => route.routeName),
            yMaxLeast: leastFrequent.map((route) => route.maxHeadway),
            yMinLeast: leastFrequent.map((route) => route.minHeadway),
        };
    };

    const plotData = preparePlotData();

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
                    Frequent Routes Analysis
                </Text>
                <Button onClick={toggleColorMode} colorScheme="purple">
                    {colorMode === "light" ? "Dark Mode" : "Light Mode"}
                </Button>
            </Flex>

            <InputGroup mb={4}>
                <Input
                    placeholder="Enter date (YYYYMMDD)"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    bg={colorMode === "light" ? "white" : "gray.600"}
                    color={colorMode === "light" ? "gray.800" : "gray.100"}
                    borderColor="purple.300"
                    _hover={{ borderColor: "purple.500" }}
                />
                <InputRightElement width="4.5rem">
                    <Button
                        h="1.75rem"
                        size="sm"
                        onClick={handleSearch}
                        colorScheme="purple"
                    >
                        Search
                    </Button>
                </InputRightElement>
            </InputGroup>

            {loading ? (
                <Spinner size="xl" color="purple.500" />
            ) : error ? (
                <Text color="red.500">{error}</Text>
            ) : (
                <>
                    {frequentRoutes.most_frequent_routes.length > 0 && (
                        <VStack spacing={6} align="stretch">
                            <Box>
                                <Text
                                    fontSize="2xl"
                                    fontWeight="bold"
                                    mb={2}
                                    color={
                                        colorMode === "light"
                                            ? "gray.800"
                                            : "gray.200"
                                    }
                                >
                                    Most Frequent Routes
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
                                            <Th>Max Headway</Th>
                                            <Th>Min Headway</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {currentMostFrequentRoutes.map(
                                            (route, index) => (
                                                <Tr key={index}>
                                                    <Td>{route.route_id}</Td>
                                                    <Td>
                                                        {route.route_long_name}
                                                    </Td>
                                                    <Td>
                                                        {renderColorBox(
                                                            route.route_color
                                                        )}
                                                    </Td>
                                                    <Td>{route.max_headway}</Td>
                                                    <Td>{route.min_headway}</Td>
                                                </Tr>
                                            )
                                        )}
                                    </Tbody>
                                </Table>

                                <Plot
                                    data={[
                                        {
                                            x: plotData.xMost,
                                            y: plotData.yMaxMost,
                                            type: "bar",
                                            name: "Max Headway",
                                        },
                                        {
                                            x: plotData.xMost,
                                            y: plotData.yMinMost,
                                            type: "bar",
                                            name: "Min Headway",
                                        },
                                    ]}
                                    layout={{
                                        title: "Most Frequent Routes - Headway",
                                        barmode: "group",
                                        xaxis: { title: "Route Name" },
                                        yaxis: { title: "Headway (min)" },
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
                                                colorMode === "light"
                                                    ? "black"
                                                    : "white",
                                        },
                                    }}
                                    style={{ width: "100%", height: "400px" }}
                                />

                                <Flex
                                    justify="space-between"
                                    mt={6}
                                    alignItems="center"
                                >
                                    <Button
                                        onClick={() =>
                                            setCurrentPageMost((prev) =>
                                                Math.max(prev - 1, 1)
                                            )
                                        }
                                        disabled={currentPageMost === 1}
                                        colorScheme="purple"
                                    >
                                        Previous
                                    </Button>
                                    <Text
                                        color={
                                            colorMode === "light"
                                                ? "gray.700"
                                                : "gray.100"
                                        }
                                    >
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
                                                            .length /
                                                            routesPerPage
                                                    )
                                                )
                                            )
                                        }
                                        colorScheme="purple"
                                        disabled={
                                            currentPageMost ===
                                            Math.ceil(
                                                frequentRoutes
                                                    .most_frequent_routes
                                                    .length / routesPerPage
                                            )
                                        }
                                    >
                                        Next
                                    </Button>
                                </Flex>
                            </Box>

                            {frequentRoutes.least_frequent_routes.length >
                                0 && (
                                <Box>
                                    <Text
                                        fontSize="2xl"
                                        fontWeight="bold"
                                        mb={2}
                                        color={
                                            colorMode === "light"
                                                ? "gray.800"
                                                : "gray.200"
                                        }
                                    >
                                        Least Frequent Routes
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
                                                <Th>Max Headway</Th>
                                                <Th>Min Headway</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {currentLeastFrequentRoutes.map(
                                                (route, index) => (
                                                    <Tr key={index}>
                                                        <Td>
                                                            {route.route_id}
                                                        </Td>
                                                        <Td>
                                                            {
                                                                route.route_long_name
                                                            }
                                                        </Td>
                                                        <Td>
                                                            {renderColorBox(
                                                                route.route_color
                                                            )}
                                                        </Td>
                                                        <Td>
                                                            {route.max_headway}
                                                        </Td>
                                                        <Td>
                                                            {route.min_headway}
                                                        </Td>
                                                    </Tr>
                                                )
                                            )}
                                        </Tbody>
                                    </Table>

                                    <Plot
                                        data={[
                                            {
                                                x: plotData.xLeast,
                                                y: plotData.yMaxLeast,
                                                type: "bar",
                                                name: "Max Headway",
                                            },
                                            {
                                                x: plotData.xLeast,
                                                y: plotData.yMinLeast,
                                                type: "bar",
                                                name: "Min Headway",
                                            },
                                        ]}
                                        layout={{
                                            title: "Least Frequent Routes - Headway",
                                            barmode: "group",
                                            xaxis: { title: "Route Name" },
                                            yaxis: { title: "Headway (min)" },
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
                                                    colorMode === "light"
                                                        ? "black"
                                                        : "white",
                                            },
                                        }}
                                        style={{
                                            width: "100%",
                                            height: "400px",
                                        }}
                                    />

                                    <Flex
                                        justify="space-between"
                                        mt={6}
                                        alignItems="center"
                                    >
                                        <Button
                                            onClick={() =>
                                                setCurrentPageLeast((prev) =>
                                                    Math.max(prev - 1, 1)
                                                )
                                            }
                                            disabled={currentPageLeast === 1}
                                            colorScheme="purple"
                                        >
                                            Previous
                                        </Button>
                                        <Text
                                            color={
                                                colorMode === "light"
                                                    ? "gray.700"
                                                    : "gray.100"
                                            }
                                        >
                                            Page {currentPageLeast} of{" "}
                                            {Math.ceil(
                                                frequentRoutes
                                                    .least_frequent_routes
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
                                                                .length /
                                                                routesPerPage
                                                        )
                                                    )
                                                )
                                            }
                                            colorScheme="purple"
                                            disabled={
                                                currentPageLeast ===
                                                Math.ceil(
                                                    frequentRoutes
                                                        .least_frequent_routes
                                                        .length / routesPerPage
                                                )
                                            }
                                        >
                                            Next
                                        </Button>
                                    </Flex>
                                </Box>
                            )}
                        </VStack>
                    )}
                </>
            )}
        </Box>
    );
}

export default FrequentRoutesModal;
