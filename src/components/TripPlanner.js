import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Box,
    Button,
    Select,
    Table,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    useToast,
    Spinner,
    Text,
    Flex,
    VStack,
    useColorMode,
    Input,
} from "@chakra-ui/react";
import Plot from "react-plotly.js";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useConfig } from "../configContext";

// Custom marker icon for Leaflet (Green marker for start, Red marker for end)
const customIcon = (iconUrl) =>
    new L.Icon({
        iconUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        shadowSize: [41, 41],
    });

const TripPlanner = ({ onClose }) => {
    const { baseURL } = useConfig();
    const [stops, setStops] = useState([]);
    const [results, setResults] = useState({ trips_between_stops: [] });
    const [startStop, setStartStop] = useState("");
    const [endStop, setEndStop] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const toast = useToast();
    const { colorMode, toggleColorMode } = useColorMode();

    useEffect(() => {
        fetchStops();
    }, []);

    const fetchStops = async () => {
        try {
            const response = await axios.get(`${baseURL}/stops`);
            setStops(response.data || []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch stops",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const normalizeStopName = (stopName) =>
        stopName.trim().replace(/\s+/g, " ");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!startStop || !endStop) {
            toast({
                title: "Error",
                description: "Please select both start and end stops.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        setIsLoading(true);

        try {
            const encodedStartStop = encodeURIComponent(
                normalizeStopName(startStop)
            ).replace(/%20/g, "%20");
            const encodedEndStop = encodeURIComponent(
                normalizeStopName(endStop)
            ).replace(/%20/g, "%20");

            const url = `${baseURL}/api/trips_between_stops?start_stop_name=${encodedStartStop}&end_stop_name=${encodedEndStop}`;

            const response = await axios.get(url);

            if (response.data && response.data.trips_between_stops) {
                setResults(response.data);
            } else {
                setResults({ trips_between_stops: [] });
                toast({
                    title: "No Results",
                    description: "No trips found between the selected stops.",
                    status: "info",
                    duration: 5000,
                    isClosable: true,
                });
            }
            setCurrentPage(1);
        } catch (error) {
            console.error("API Error:", error.response || error);
            setResults({ trips_between_stops: [] });

            const errorMessage =
                error.response?.data?.error ||
                "An error occurred while fetching trips.";

            toast({
                title: "Error",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const renderTableRows = () => {
        if (!results.trips_between_stops?.length) {
            return (
                <Tr>
                    <Td colSpan={4}>No trips found for the selected stops.</Td>
                </Tr>
            );
        }

        const startIndex = (currentPage - 1) * 10;
        const endIndex = startIndex + 10;
        const pageTrips = results.trips_between_stops.slice(
            startIndex,
            endIndex
        );

        return pageTrips.map((trip, index) => (
            <Tr key={index}>
                <Td>
                    <Box
                        display="inline-block"
                        width="20px"
                        height="20px"
                        backgroundColor={`#${trip.route_color || "FFFFFF"}`}
                        marginRight={2}
                    />
                    {trip.route_short_name} - {trip.route_long_name}
                </Td>
                <Td>{trip.trip_id}</Td>
                <Td>
                    {trip.duration
                        ? `${(trip.duration * 60).toFixed(0)} minutes`
                        : "N/A"}
                </Td>
                <Td>
                    {trip.distance ? `${trip.distance.toFixed(2)} km` : "N/A"}
                </Td>
            </Tr>
        ));
    };

    const handleNextPage = () => setCurrentPage((prev) => prev + 1);
    const handlePreviousPage = () =>
        setCurrentPage((prev) => Math.max(prev - 1, 1));

    const totalResults = results.total_results || 0;
    const totalPages = Math.ceil(totalResults / 10);

    const tripDurations = results.trips_between_stops.map((trip) =>
        (trip.duration * 60).toFixed(0)
    );
    const tripIds = results.trips_between_stops.map((trip) => trip.trip_id);

    const startStopCoordinates = stops.find(
        (stop) => stop.stop_name === startStop
    );
    const endStopCoordinates = stops.find((stop) => stop.stop_name === endStop);

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
                    Trip Planner
                </Text>
                <Button onClick={toggleColorMode} colorScheme="purple">
                    {colorMode === "light" ? "Dark Mode" : "Light Mode"}
                </Button>
            </Flex>

            <form onSubmit={handleSubmit}>
                <VStack spacing={4} align="stretch">
                    <Select
                        value={startStop}
                        onChange={(e) => setStartStop(e.target.value)}
                        placeholder="Select start stop"
                        bg={colorMode === "light" ? "white" : "gray.600"}
                        color={colorMode === "light" ? "gray.800" : "gray.100"}
                        borderColor="purple.300"
                        _hover={{ borderColor: "purple.500" }}
                    >
                        {stops.map((stop) => (
                            <option key={stop.stop_id} value={stop.stop_name}>
                                {stop.stop_name}
                            </option>
                        ))}
                    </Select>

                    <Select
                        value={endStop}
                        onChange={(e) => setEndStop(e.target.value)}
                        placeholder="Select end stop"
                        bg={colorMode === "light" ? "white" : "gray.600"}
                        color={colorMode === "light" ? "gray.800" : "gray.100"}
                        borderColor="purple.300"
                        _hover={{ borderColor: "purple.500" }}
                    >
                        {stops.map((stop) => (
                            <option key={stop.stop_id} value={stop.stop_name}>
                                {stop.stop_name}
                            </option>
                        ))}
                    </Select>

                    <Button
                        type="submit"
                        colorScheme="purple"
                        isLoading={isLoading}
                    >
                        Find Trips
                    </Button>
                </VStack>
            </form>

            {startStop && endStop && (
                <Text
                    mt={4}
                    mb={2}
                    color={colorMode === "light" ? "gray.700" : "gray.100"}
                >
                    Showing trips from {startStop} to {endStop}
                </Text>
            )}

            {isLoading ? (
                <Spinner mt={4} color="purple.500" />
            ) : (
                <>
                    <Table
                        variant="striped"
                        colorScheme="purple"
                        mt={4}
                        borderRadius="md"
                        boxShadow="md"
                    >
                        <Thead>
                            <Tr>
                                <Th>Route</Th>
                                <Th>Trip ID</Th>
                                <Th>Duration</Th>
                                <Th>Distance</Th>
                            </Tr>
                        </Thead>
                        <Tbody>{renderTableRows()}</Tbody>
                    </Table>

                    {tripDurations.length > 0 && (
                        <Box mt={6}>
                            <Plot
                                data={[
                                    {
                                        x: tripIds,
                                        y: tripDurations,
                                        type: "bar",
                                        marker: { color: "purple" },
                                    },
                                ]}
                                layout={{
                                    title: "Trip Durations",
                                    xaxis: { title: "Trip ID" },
                                    yaxis: { title: "Duration (minutes)" },
                                    paper_bgcolor:
                                        colorMode === "light"
                                            ? "rgb(237, 242, 247)"
                                            : "rgb(45, 55, 72)",
                                    plot_bgcolor:
                                        colorMode === "light"
                                            ? "rgb(237, 242, 247)"
                                            : "rgb(45, 55, 72)",
                                    font: {
                                        color:
                                            colorMode === "light"
                                                ? "black"
                                                : "white",
                                    },
                                }}
                            />
                        </Box>
                    )}

                    {totalResults > 10 && (
                        <Flex
                            justify="space-between"
                            mt={6}
                            alignItems="center"
                        >
                            <Button
                                onClick={handlePreviousPage}
                                disabled={currentPage === 1}
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
                                Page {currentPage} of {totalPages}
                            </Text>
                            <Button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                colorScheme="purple"
                            >
                                Next
                            </Button>
                        </Flex>
                    )}

                    {startStopCoordinates && endStopCoordinates && (
                        <Box
                            mt={6}
                            borderRadius="md"
                            overflow="hidden"
                            boxShadow="lg"
                        >
                            <MapContainer
                                center={[
                                    startStopCoordinates.stop_lat,
                                    startStopCoordinates.stop_lon,
                                ]}
                                zoom={13}
                                style={{ height: "400px", width: "100%" }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker
                                    position={[
                                        startStopCoordinates.stop_lat,
                                        startStopCoordinates.stop_lon,
                                    ]}
                                    icon={customIcon(
                                        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png"
                                    )}
                                >
                                    <Popup>
                                        {startStopCoordinates.stop_name}
                                    </Popup>
                                </Marker>
                                <Marker
                                    position={[
                                        endStopCoordinates.stop_lat,
                                        endStopCoordinates.stop_lon,
                                    ]}
                                    icon={customIcon(
                                        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png"
                                    )}
                                >
                                    <Popup>
                                        {endStopCoordinates.stop_name}
                                    </Popup>
                                </Marker>
                                <Polyline
                                    positions={[
                                        [
                                            startStopCoordinates.stop_lat,
                                            startStopCoordinates.stop_lon,
                                        ],
                                        [
                                            endStopCoordinates.stop_lat,
                                            endStopCoordinates.stop_lon,
                                        ],
                                    ]}
                                    color="purple"
                                    weight={3}
                                />
                            </MapContainer>
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

export default TripPlanner;
