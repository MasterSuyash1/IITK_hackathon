import React, { useState } from "react";
import axios from "axios";
import { useConfig } from "../configContext";
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
    Input,
    InputGroup,
    InputRightElement,
    Spinner,
    Flex,
    VStack,
    useColorMode,
} from "@chakra-ui/react";

// Include a modern Google font
// import "@fontsource/poppins";

function PeakHourTraffic({ onClose }) {
    const { baseURL } = useConfig();
    const [peakHourRoutes, setPeakHourRoutes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchDate, setSearchDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const { colorMode, toggleColorMode } = useColorMode();

    const handleSearch = async () => {
        if (searchDate.trim() === "") {
            setError("Please enter a date");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await axios.get(
                `${baseURL}/api/peak_hour_traffic?date=${searchDate}`
            );
            if (response.status === 200) {
                setPeakHourRoutes(response.data.peak_hour_routes);
                setCurrentPage(1);
            } else {
                setError("Error fetching peak hour traffic data.");
            }
        } catch (err) {
            setError("Error fetching peak hour traffic data.");
        } finally {
            setLoading(false);
        }
    };

    const lastIndex = currentPage * itemsPerPage;
    const firstIndex = lastIndex - itemsPerPage;
    const currentItems = peakHourRoutes.slice(firstIndex, lastIndex);
    const totalPages = Math.ceil(peakHourRoutes.length / itemsPerPage);

    const nextPage = () =>
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

    const plotData = {
        x: peakHourRoutes.map((route) => route.route_long_name),
        y: peakHourRoutes.map((route) => route.trip_id),
        type: "bar",
        marker: { color: colorMode === "light" ? "purple" : "lightblue" },
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
                    Peak Hour Traffic
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
                    {currentItems.length > 0 && (
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
                                    <Th>Number of Trips</Th>
                                    <Th>Time Periods</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {currentItems.map((route, index) => (
                                    <Tr key={index}>
                                        <Td>{route.route_id}</Td>
                                        <Td>{route.route_long_name}</Td>
                                        <Td>
                                            {renderColorBox(route.route_color)}
                                        </Td>
                                        <Td>{route.trip_id}</Td>
                                        <Td>{route.time_period.join(", ")}</Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    )}

                    {peakHourRoutes.length > 0 && (
                        <Box mt={6}>
                            <Plot
                                data={[plotData]}
                                layout={{
                                    title: "Peak Hour Traffic Analysis",
                                    xaxis: { title: "Route Name" },
                                    yaxis: { title: "Number of Trips" },
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
                        </Box>
                    )}

                    <Flex justify="space-between" mt={6} alignItems="center">
                        <Button
                            onClick={prevPage}
                            disabled={currentPage === 1}
                            colorScheme="purple"
                        >
                            Previous
                        </Button>
                        <Text
                            color={
                                colorMode === "light" ? "gray.700" : "gray.100"
                            }
                        >
                            Page {currentPage} of {totalPages}
                        </Text>
                        <Button
                            onClick={nextPage}
                            disabled={currentPage === totalPages}
                            colorScheme="purple"
                        >
                            Next
                        </Button>
                    </Flex>
                </>
            )}

            <VStack mt={6}>
                <Button colorScheme="red" onClick={onClose}>
                    Close
                </Button>
            </VStack>
        </Box>
    );
}

export default PeakHourTraffic;
