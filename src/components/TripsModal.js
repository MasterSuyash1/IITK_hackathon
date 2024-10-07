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
    VStack,
    Input,
    InputGroup,
    InputRightElement
} from '@chakra-ui/react';
import { useConfig } from "../configContext";

function TripsModal({ onClose }) { 
    const { baseURL } = useConfig();
    const [tripsData, setTripsData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const tripsPerPage = 10;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTripId, setSearchTripId] = useState('');
    const [searchResult, setSearchResult] = useState(null);

    useEffect(() => {
        const fetchTripsData = async () => {
            try {
                const response = await axios.get(`${baseURL}/trips`);
                if (response.status === 200) {
                    setTripsData(response.data);
                } else {
                    setError('Error fetching trips');
                }
            } catch (err) {
                setError('Error fetching trips');
            } finally {
                setLoading(false);
            }
        };

        fetchTripsData();
    }, []);

    const indexOfLastTrip = currentPage * tripsPerPage;
    const indexOfFirstTrip = indexOfLastTrip - tripsPerPage;
    const currentTrips = tripsData.slice(indexOfFirstTrip, indexOfLastTrip);

    const renderRows = () => {
        return currentTrips.map((trip, index) => (
            <Tr key={index}>
                <Td>{trip.trip_id || 'NA'}</Td>
                <Td>{trip.route_id || 'NA'}</Td>
                <Td>{trip.service_id || 'NA'}</Td>
                <Td>{trip.trip_headsign || 'NA'}</Td>
            </Tr>
        ));
    };

    const handleNextPage = () => {
        if (currentPage < Math.ceil(tripsData.length / tripsPerPage)) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleSearch = async () => {
        if (searchTripId.trim() === '') return;

        setLoading(true);
        try {
            const response = await axios.get(`${baseURL}/trip/${searchTripId}`);
            if (response.status === 200) {
                setSearchResult(response.data[0]);  // Assuming a single trip result
                setError('');
            } else {
                setSearchResult(null);
                setError('Trip not found');
            }
        } catch (err) {
            setError('Trip not found');
            setSearchResult(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box p={6} bg="gray.50" borderRadius="md" boxShadow="md">
            <Text fontSize="2xl" mb={4}>Trips Information</Text>

            {/* Search Bar */}
            <InputGroup mb={4}>
                <Input
                    placeholder="Search by Trip ID"
                    value={searchTripId}
                    onChange={(e) => setSearchTripId(e.target.value)}
                />
                <InputRightElement width="4.5rem">
                    <Button h="1.75rem" size="sm" onClick={handleSearch}>
                        Search
                    </Button>
                </InputRightElement>
            </InputGroup>

            {loading ? (
                <Text>Loading trips...</Text>
            ) : error ? (
                <Text color="red.500">{error}</Text>
            ) : searchResult ? (
                <>
                    {/* Display the search result */}
                    <Table variant="simple" size="sm">
                        <Thead>
                            <Tr>
                                <Th>Trip ID</Th>
                                <Th>Route ID</Th>
                                <Th>Service ID</Th>
                                <Th>Headsign</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            <Tr>
                                <Td>{searchResult.trip_id || 'NA'}</Td>
                                <Td>{searchResult.route_id || 'NA'}</Td>
                                <Td>{searchResult.service_id || 'NA'}</Td>
                                <Td>{searchResult.trip_headsign || 'NA'}</Td>
                            </Tr>
                        </Tbody>
                    </Table>
                </>
            ) : (
                <>
                    <Table variant="simple" size="sm">
                        <Thead>
                            <Tr>
                                <Th>Trip ID</Th>
                                <Th>Route ID</Th>
                                <Th>Service ID</Th>
                                <Th>Headsign</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {renderRows()}
                        </Tbody>
                    </Table>

                    <Flex justify="space-between" mt={4}>
                        <Button
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            colorScheme="blue"
                        >
                            Previous
                        </Button>
                        <Text>Page {currentPage} of {Math.ceil(tripsData.length / tripsPerPage)}</Text>
                        <Button
                            onClick={handleNextPage}
                            disabled={currentPage === Math.ceil(tripsData.length / tripsPerPage)}
                            colorScheme="blue"
                        >
                            Next
                        </Button>
                    </Flex>
                </>
            )}

            {/* Close button */}
            <VStack mt={4}>
                <Button colorScheme="red" onClick={onClose}>
                    Close
                </Button>
            </VStack>
        </Box>
    );
}

export default TripsModal;
