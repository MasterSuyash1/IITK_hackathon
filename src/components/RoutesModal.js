import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Button,
    Text,
    Input,
    List,
    ListItem,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Flex,
    VStack
} from '@chakra-ui/react';
import { useConfig } from "../configContext";

function RoutesModal({ onClose }) {
    const { baseURL } = useConfig();
    const [routeData, setRouteData] = useState([]);
    const [routeDetails, setRouteDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredRoutes, setFilteredRoutes] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const routesPerPage = 10;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${baseURL}/routes`);
                setRouteData(response.data);
                setFilteredRoutes(response.data);
            } catch (error) {
                console.error("Error fetching route data:", error);
            }
        };
        fetchData();
    }, [baseURL]);

    useEffect(() => {
        if (searchTerm) {
            const filtered = routeData.filter(route =>
                route.route_short_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                route.route_long_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredRoutes(filtered);
        } else {
            setFilteredRoutes(routeData);
        }
    }, [searchTerm, routeData]);

    const fetchRouteDetails = async (route_id) => {
        setLoadingDetails(true);
        setDetailsError('');
        setRouteDetails(null);

        try {
            const response = await axios.get(`${baseURL}/route/${route_id}`);
            if (response.status === 200) {
                setRouteDetails(response.data[0]);
            } else {
                setDetailsError('Error fetching route details');
            }
        } catch (error) {
            setDetailsError('Error fetching route details');
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleRouteSelect = (route_id) => {
        fetchRouteDetails(route_id);
        setSearchTerm('');
    };

    const indexOfLastRoute = currentPage * routesPerPage;
    const indexOfFirstRoute = indexOfLastRoute - routesPerPage;
    const currentRoutes = filteredRoutes.slice(indexOfFirstRoute, indexOfLastRoute);

    const handleNextPage = () => {
        if (currentPage < Math.ceil(filteredRoutes.length / routesPerPage)) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const renderRows = () => {
        return currentRoutes.map((route, index) => (
            <Tr key={index}>
                <Td>{route.route_id || "NA"}</Td>
                <Td>{route.route_short_name || "NA"}</Td>
                <Td>{route.route_long_name || "NA"}</Td>
                <Td>{route.route_type || "NA"}</Td>
                <Td>
                    <Button 
                        size="sm" 
                        colorScheme="blue" 
                        onClick={() => fetchRouteDetails(route.route_id)}
                    >
                        View Details
                    </Button>
                </Td>
            </Tr>
        ));
    };

    const getColorFromHex = (hex) => {
        return hex.startsWith('#') ? hex : `#${hex}`;
    };

    return (
        <Box p={6} bg="gray.50" borderRadius="md" boxShadow="md">
            <Text fontSize="2xl" mb={4}>Routes Information</Text>

            <Box mb={4}>
                <Input 
                    placeholder="Search by Route Name"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    mb={2}
                />
                {searchTerm && (
                    <List bg="white" border="1px" borderColor="gray.200" borderRadius="md" maxH="200px" overflowY="auto">
                        {filteredRoutes.length > 0 ? (
                            filteredRoutes.map(route => (
                                <ListItem
                                    key={route.route_id}
                                    p={2}
                                    cursor="pointer"
                                    _hover={{ bg: "gray.100" }}
                                    onClick={() => handleRouteSelect(route.route_id)}
                                >
                                    {route.route_short_name} - {route.route_long_name}
                                </ListItem>
                            ))
                        ) : (
                            <ListItem p={2}>No routes found</ListItem>
                        )}
                    </List>
                )}
            </Box>

            {filteredRoutes.length === 0 ? (
                <Text>No routes to display</Text>
            ) : (
                <>
                    <Table variant="simple" size="sm">
                        <Thead>
                            <Tr>
                                <Th>Route ID</Th>
                                <Th>Route Short Name</Th>
                                <Th>Route Long Name</Th>
                                <Th>Route Type</Th>
                                <Th>Action</Th>
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
                        <Text>Page {currentPage} of {Math.ceil(filteredRoutes.length / routesPerPage)}</Text>
                        <Button
                            onClick={handleNextPage}
                            disabled={currentPage === Math.ceil(filteredRoutes.length / routesPerPage)}
                            colorScheme="blue"
                        >
                            Next
                        </Button>
                    </Flex>
                </>
            )}

            {loadingDetails ? (
                <Text mt={4}>Loading route details...</Text>
            ) : detailsError ? (
                <Text mt={4} color="red.500">{detailsError}</Text>
            ) : routeDetails ? (
                <Box mt={4} p={4} borderWidth="1px" borderRadius="md">
                    <Text fontSize="xl" mb={2}>Route Details</Text>
                    <Text><strong>Route ID:</strong> {routeDetails.route_id || 'NA'}</Text>
                    <Text><strong>Route Short Name:</strong> {routeDetails.route_short_name || 'NA'}</Text>
                    <Text><strong>Route Long Name:</strong> {routeDetails.route_long_name || 'NA'}</Text>
                    <Text><strong>Route Description:</strong> {routeDetails.route_desc || 'NA'}</Text>
                    <Text><strong>Route TextColor:</strong> {routeDetails.route_text_color || 'NA'}</Text>
                    <Box 
                        as="span"
                        width="20px" 
                        height="20px" 
                        bg={getColorFromHex(routeDetails.route_text_color) || '#FFFFFF'} 
                        display="inline-block" 
                        ml={2} 
                        border="1px solid black"
                        borderRadius="md"
                    />
                </Box>
            ) : (
                <Text>No route selected. Please search and select a route.</Text>
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

export default RoutesModal;
