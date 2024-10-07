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
    VStack,
} from "@chakra-ui/react";
import Plot from "react-plotly.js"; // Import Plotly
import { useConfig } from "../configContext";

const TripPlanner = ({ onClose }) => {
    const { baseURL } = useConfig();
    const [stops, setStops] = useState([]);
    const [results, setResults] = useState({ trips_between_stops: [] });
    const [startStop, setStartStop] = useState("");
    const [endStop, setEndStop] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const toast = useToast();

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

    const normalizeStopName = (stopName) => {
        return stopName.trim().replace(/\s+/g, " ");
    };

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
            const encodedStartStop = encodeURIComponent(normalizeStopName(startStop)).replace(/%20/g, "%20");
            const encodedEndStop = encodeURIComponent(normalizeStopName(endStop)).replace(/%20/g, "%20");

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

            const errorMessage = error.response?.data?.error || "An error occurred while fetching trips.";

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
        const pageTrips = results.trips_between_stops.slice(startIndex, endIndex);

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

    const handleNextPage = () => {
        setCurrentPage((prev) => prev + 1);
    };

    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const totalResults = results.total_results || 0;
    const totalPages = Math.ceil(totalResults / 10);

    // Extract data for Plotly graph
    const tripDurations = results.trips_between_stops.map((trip) =>
        (trip.duration * 60).toFixed(0)
    );
    const tripIds = results.trips_between_stops.map((trip) => trip.trip_id);

    return (
        <Box p={4}>
            <form onSubmit={handleSubmit}>
                <Select
                    value={startStop}
                    onChange={(e) => setStartStop(e.target.value)}
                    placeholder="Select start stop"
                    mb={4}
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
                    mb={4}
                >
                    {stops.map((stop) => (
                        <option key={stop.stop_id} value={stop.stop_name}>
                            {stop.stop_name}
                        </option>
                    ))}
                </Select>

                <Button type="submit" colorScheme="teal" isLoading={isLoading}>
                    Find Trips
                </Button>
            </form>

            {startStop && endStop && (
                <Text mt={4} mb={2}>
                    Showing trips from {startStop} to {endStop}
                </Text>
            )}

            {isLoading ? (
                <Spinner mt={4} />
            ) : (
                <>
                    <Table variant="simple" mt={4}>
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

                    {/* Plotly chart for trip durations */}
                    {tripDurations.length > 0 && (
                        <Box mt={6}>
                            <Plot
                                data={[
                                    {
                                        x: tripIds,
                                        y: tripDurations,
                                        type: "bar",
                                        marker: { color: "teal" },
                                    },
                                ]}
                                layout={{
                                    title: "Trip Durations",
                                    xaxis: { title: "Trip ID" },
                                    yaxis: { title: "Duration (minutes)" },
                                }}
                            />
                        </Box>
                    )}

                    {totalResults > 10 && (
                        <Box mt={4}>
                            <Button
                                onClick={handlePreviousPage}
                                disabled={currentPage === 1}
                                mr={2}
                            >
                                Previous
                            </Button>
                            <Button
                                onClick={handleNextPage}
                                disabled={currentPage * 10 >= totalResults}
                            >
                                Next
                            </Button>
                            <Box as="span" ml={4}>
                                Page {currentPage} of {totalPages}
                            </Box>
                        </Box>
                    )}
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
};

export default TripPlanner;
