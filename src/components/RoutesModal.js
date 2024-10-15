import React, { useState, useEffect } from "react";
import axios from "axios";
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
    VStack,
    useColorMode,
} from "@chakra-ui/react";
import { useConfig } from "../configContext";

// Include a modern Google font
// import "@fontsource/poppins";

function RoutesModal({ onClose }) {
    const { baseURL } = useConfig();
    const [routeData, setRouteData] = useState([]);
    const [routeDetails, setRouteDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredRoutes, setFilteredRoutes] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const routesPerPage = 10;

    const { colorMode, toggleColorMode } = useColorMode(); // Enable light/dark theme toggle

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
            const filtered = routeData.filter(
                (route) =>
                    route.route_short_name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    route.route_long_name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
            );
            setFilteredRoutes(filtered);
        } else {
            setFilteredRoutes(routeData);
        }
    }, [searchTerm, routeData]);

    const fetchRouteDetails = async (route_id) => {
        setLoadingDetails(true);
        setDetailsError("");
        setRouteDetails(null);

        try {
            const response = await axios.get(`${baseURL}/route/${route_id}`);
            if (response.status === 200) {
                setRouteDetails(response.data[0]);
            } else {
                setDetailsError("Error fetching route details");
            }
        } catch (error) {
            setDetailsError("Error fetching route details");
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleRouteSelect = (route_id) => {
        fetchRouteDetails(route_id);
        setSearchTerm("");
    };

    const indexOfLastRoute = currentPage * routesPerPage;
    const indexOfFirstRoute = indexOfLastRoute - routesPerPage;
    const currentRoutes = filteredRoutes.slice(
        indexOfFirstRoute,
        indexOfLastRoute
    );

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
                        colorScheme="teal"
                        onClick={() => fetchRouteDetails(route.route_id)}
                    >
                        View Details
                    </Button>
                </Td>
            </Tr>
        ));
    };

    const getColorFromHex = (hex) => {
        return hex.startsWith("#") ? hex : `#${hex}`;
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
                    Routes Information
                </Text>
                <Button onClick={toggleColorMode} colorScheme="purple">
                    {colorMode === "light" ? "Dark Mode" : "Light Mode"}
                </Button>
            </Flex>

            <Box mb={6}>
                <Input
                    placeholder="Search by Route Name"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    mb={2}
                    bg={colorMode === "light" ? "white" : "gray.600"}
                    color={colorMode === "light" ? "gray.800" : "gray.100"}
                    borderColor="purple.300"
                    _hover={{ borderColor: "purple.500" }}
                />
                {searchTerm && (
                    <List
                        bg={colorMode === "light" ? "white" : "gray.600"}
                        border="1px"
                        borderColor="purple.300"
                        borderRadius="md"
                        maxH="200px"
                        overflowY="auto"
                        boxShadow="lg"
                    >
                        {filteredRoutes.length > 0 ? (
                            filteredRoutes.map((route) => (
                                <ListItem
                                    key={route.route_id}
                                    p={2}
                                    cursor="pointer"
                                    _hover={{
                                        bg:
                                            colorMode === "light"
                                                ? "gray.100"
                                                : "gray.500",
                                    }}
                                    onClick={() =>
                                        handleRouteSelect(route.route_id)
                                    }
                                >
                                    {route.route_short_name} -{" "}
                                    {route.route_long_name}
                                </ListItem>
                            ))
                        ) : (
                            <ListItem p={2} textAlign="center" color="red.500">
                                No routes found
                            </ListItem>
                        )}
                    </List>
                )}
            </Box>

            {filteredRoutes.length === 0 ? (
                <Text>No routes to display</Text>
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
                                <Th>Route ID</Th>
                                <Th>Route Short Name</Th>
                                <Th>Route Long Name</Th>
                                <Th>Route Type</Th>
                                <Th>Action</Th>
                            </Tr>
                        </Thead>
                        <Tbody>{renderRows()}</Tbody>
                    </Table>

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
                            {Math.ceil(filteredRoutes.length / routesPerPage)}
                        </Text>
                        <Button
                            onClick={handleNextPage}
                            disabled={
                                currentPage ===
                                Math.ceil(filteredRoutes.length / routesPerPage)
                            }
                            colorScheme="purple"
                        >
                            Next
                        </Button>
                    </Flex>
                </>
            )}

            {loadingDetails ? (
                <Text mt={6} color="purple.500">
                    Loading route details...
                </Text>
            ) : detailsError ? (
                <Text mt={6} color="red.500">
                    {detailsError}
                </Text>
            ) : routeDetails ? (
                <Box
                    mt={6}
                    p={6}
                    borderWidth="1px"
                    borderRadius="md"
                    bg={colorMode === "light" ? "gray.50" : "gray.600"}
                >
                    <Text fontSize="2xl" fontWeight="bold" mb={4}>
                        Route Details
                    </Text>
                    <Text>
                        <strong>Route ID:</strong>{" "}
                        {routeDetails.route_id || "NA"}
                    </Text>
                    <Text>
                        <strong>Route Short Name:</strong>{" "}
                        {routeDetails.route_short_name || "NA"}
                    </Text>
                    <Text>
                        <strong>Route Long Name:</strong>{" "}
                        {routeDetails.route_long_name || "NA"}
                    </Text>
                    <Text>
                        <strong>Route Description:</strong>{" "}
                        {routeDetails.route_desc || "NA"}
                    </Text>
                    <Text>
                        <strong>Route Text Color:</strong>{" "}
                        {routeDetails.route_text_color || "NA"}
                    </Text>
                    <Box
                        as="span"
                        width="20px"
                        height="20px"
                        bg={
                            getColorFromHex(routeDetails.route_text_color) ||
                            "#FFFFFF"
                        }
                        display="inline-block"
                        ml={2}
                        border="1px solid black"
                        borderRadius="md"
                    />
                </Box>
            ) : null}
        </Box>
    );
}

export default RoutesModal;
