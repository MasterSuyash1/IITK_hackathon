import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
} from '@chakra-ui/react';
import { useConfig } from "../configContext";

function StopsModal({ onClose }) {
    const { baseURL } = useConfig();
    const [stopsData, setStopsData] = useState([]); // Initialize as empty array
    const [currentPage, setCurrentPage] = useState(1); // Track the current page
    const stopsPerPage = 10; // Number of stops per page

    // Fetch the stops data from the API
    useEffect(() => {
        const fetchStopsData = async () => {
            try {
                const response = await axios.get(`${baseURL}/stops`);
                setStopsData(response.data);
            } catch (error) {
                console.error("Error fetching stops data:", error);
            }
        };

        fetchStopsData();
    }, []);

    const indexOfLastStop = currentPage * stopsPerPage;
    const indexOfFirstStop = indexOfLastStop - stopsPerPage;
    const currentStops = stopsData.slice(indexOfFirstStop, indexOfLastStop);

    const renderRows = () => {
        return currentStops.map((stop, index) => (
            <Tr key={index}>
                <Td>{stop.stop_id || 'NA'}</Td>
                <Td>{stop.stop_code || 'NA'}</Td>
                <Td>{stop.stop_name || 'NA'}</Td>
                <Td>{stop.stop_desc || 'NA'}</Td>
                <Td>{stop.stop_lat || 'NA'}</Td>
                <Td>{stop.stop_lon || 'NA'}</Td>
            </Tr>
        ));
    };

    const handleNextPage = () => {
        if (currentPage < Math.ceil(stopsData.length / stopsPerPage)) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    return (
        <Box p={6} bg="gray.50" borderRadius="md" boxShadow="md">
            <Text fontSize="2xl" mb={4}>Stops Information</Text>
            {stopsData.length === 0 ? (
                <Text>No stops to display</Text>
            ) : (
                <>
                    <Table variant="striped" size="sm">
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
                        <Tbody>
                            {renderRows()}
                        </Tbody>
                    </Table>

                    {/* Pagination */}
                    <Flex justify="space-between" mt={4}>
                        <Button
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            colorScheme="blue"
                        >
                            Previous
                        </Button>
                        <Text>Page {currentPage} of {Math.ceil(stopsData.length / stopsPerPage)}</Text>
                        <Button
                            onClick={handleNextPage}
                            disabled={currentPage === Math.ceil(stopsData.length / stopsPerPage)}
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

export default StopsModal;
