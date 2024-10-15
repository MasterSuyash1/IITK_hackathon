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
    Spinner,
    Alert,
    AlertIcon,
    useColorMode,
} from "@chakra-ui/react";
import { useConfig } from "../configContext";

function StopsModal({ onClose }) {
    const { baseURL } = useConfig();
    const [stopsData, setStopsData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const stopsPerPage = 10;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { colorMode } = useColorMode(); // Enable light/dark mode

    // Fetch the stops data from the API
    useEffect(() => {
        const fetchStopsData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${baseURL}/stops`);
                setStopsData(response.data);
            } catch (error) {
                console.error("Error fetching stops data:", error);
                setError("Failed to load stops data.");
            } finally {
                setLoading(false);
            }
        };

        fetchStopsData();
    }, [baseURL]);

    const indexOfLastStop = currentPage * stopsPerPage;
    const indexOfFirstStop = indexOfLastStop - stopsPerPage;
    const currentStops = stopsData.slice(indexOfFirstStop, indexOfLastStop);

    const renderRows = () => {
        return currentStops.map((stop, index) => (
            <Tr key={index}>
                <Td>{stop.stop_id || "NA"}</Td>
                <Td>{stop.stop_code || "NA"}</Td>
                <Td>{stop.stop_name || "NA"}</Td>
                <Td>{stop.stop_desc || "NA"}</Td>
                <Td>{stop.stop_lat || "NA"}</Td>
                <Td>{stop.stop_lon || "NA"}</Td>
            </Tr>
        ));
    };

    const handleNextPage = () => {
        if (currentPage < Math.ceil(stopsData.length / stopsPerPage)) {
            setCurrentPage((prevPage) => prevPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prevPage) => prevPage - 1);
        }
    };

    return (
        <Box
            p={6}
            bg={colorMode === "light" ? "gray.100" : "gray.700"}
            borderRadius="md"
            boxShadow="xl"
            maxW="800px"
            mx="auto"
            fontFamily="Poppins, sans-serif"
        >
            <Text
                fontSize="2xl"
                mb={4}
                color={colorMode === "light" ? "gray.800" : "gray.200"}
            >
                Stops Information
            </Text>

            {loading ? (
                <Flex justify="center" align="center" height="200px">
                    <Spinner size="lg" />
                </Flex>
            ) : error ? (
                <Alert status="error" borderRadius="md" mb={4}>
                    <AlertIcon />
                    {error}
                </Alert>
            ) : stopsData.length === 0 ? (
                <Text>No stops to display</Text>
            ) : (
                <>
                    <Table
                        variant="striped"
                        colorScheme="purple"
                        size="md"
                        borderRadius="md"
                        boxShadow="md"
                    >
                        <Thead>
                            <Tr>
                                <Th>Stop ID</Th>
                                <Th>Stop Code</Th>
                                <Th>Stop Name</Th>
                                <Th>Description</Th>
                                <Th>Latitude</Th>
                                <Th>Longitude</Th>
                            </Tr>
                        </Thead>
                        <Tbody>{renderRows()}</Tbody>
                    </Table>

                    {/* Pagination */}
                    <Flex justify="space-between" mt={6} alignItems="center">
                        <Button
                            onClick={handlePreviousPage}
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
                            Page {currentPage} of{" "}
                            {Math.ceil(stopsData.length / stopsPerPage)}
                        </Text>
                        <Button
                            onClick={handleNextPage}
                            disabled={
                                currentPage ===
                                Math.ceil(stopsData.length / stopsPerPage)
                            }
                            colorScheme="purple"
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

export default StopsModal;
