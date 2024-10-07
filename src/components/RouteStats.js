import React, { useState } from "react";
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
} from "@chakra-ui/react";
import Plot from "react-plotly.js";
import { useConfig } from "../configContext";

function RouteStats({ onClose }) {
    const { baseURL } = useConfig();
    const [routeStatsData, setRouteStatsData] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const statsPerPage = 5;

    // Fetch route statistics data
    const fetchRouteStatsData = async () => {
        if (!selectedDate) {
            alert("Please enter a date in YYYYMMDD format.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.get(`${baseURL}/api/route_stats`, {
                params: { date: selectedDate },
            });
            setRouteStatsData(response.data.route_stats);
        } catch (error) {
            console.error("Error fetching route stats data:", error);
        }
        setIsLoading(false);
    };

    // Paginate route stats data
    const indexOfLastStat = currentPage * statsPerPage;
    const indexOfFirstStat = indexOfLastStat - statsPerPage;
    const currentRouteStats = routeStatsData.slice(indexOfFirstStat, indexOfLastStat);

    const renderRows = (stats) => {
        return stats.map((stat, index) => (
            <Tr key={index}>
                <Td>{renderColorBox(stat.route_color)}</Td> {/* Render color box */}
                <Td>{stat.route_id}</Td>
                <Td>{stat.route_long_name}</Td>
                <Td>{stat.num_trips}</Td>
                <Td>{stat.mean_trip_duration ? stat.mean_trip_duration.toFixed(2) : "NA"}</Td>
                <Td>{stat.mean_trip_distance || "NA"}</Td>
                <Td>{stat.mean_headway || "NA"}</Td>
                <Td>{stat.peak_start_time ? stat.peak_start_time : "NA"}</Td>
                <Td>{stat.peak_num_trips || "NA"}</Td>
                <Td>{stat.service_speed || "NA"}</Td>
            </Tr>
        ));
    };
    
    const handleNextPage = () => {
        if (currentPage < Math.ceil(routeStatsData.length / statsPerPage)) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Generate Plotly Graph for Route Stats
    const renderRouteStatsPlot = () => {
        const routeNames = routeStatsData.map((item) => item.route_long_name);
        const meanDurations = routeStatsData.map((item) => item.mean_trip_duration); // Corrected to mean_trip_duration
        const meanSpeeds = routeStatsData.map((item) => item.service_speed); // Corrected to service_speed

        return (
            <Plot
                data={[
                    {
                        x: routeNames,
                        y: meanDurations,
                        type: "bar",
                        name: "Mean Duration",
                        marker: { color: routeStatsData.map((item) => `#${item.route_color}`) }, // Color based on route color
                    },
                    {
                        x: routeNames,
                        y: meanSpeeds,
                        type: "line",
                        name: "Mean Speed",
                        yaxis: "y2",
                        line: { color: "blue" }, // You can set a specific color for the line
                    },
                ]}
                layout={{
                    title: "Route Duration and Speed Analysis",
                    xaxis: { title: "Route" },
                    yaxis: { title: "Mean Duration (min)" },
                    yaxis2: {
                        title: "Mean Speed (km/h)",
                        overlaying: "y",
                        side: "right",
                    },
                }}
            />
        );
    };

    // Function to render route color with a '#' prefix
    const renderColorBox = (color) => {
        const formattedColor = `#${color}`; // Add '#' prefix to color
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
        <Box p={6} bg="gray.50" borderRadius="md" boxShadow="md">
            <Text fontSize="2xl" mb={4}>
                Route Statistics
            </Text>

            {/* Date selection and search button */}
            <Flex mb={4} justifyContent="flex-start">
                <Text mr={2}>Select Date:</Text>
                <input
                    type="text"
                    placeholder="YYYYMMDD"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{
                        padding: "0.5rem",
                        borderRadius: "4px",
                        border: "1px solid gray",
                    }}
                />
                <Button
                    ml={2}
                    onClick={fetchRouteStatsData}
                    colorScheme="blue"
                    isLoading={isLoading}
                >
                    Search
                </Button>
            </Flex>

            {routeStatsData.length === 0 ? (
                <Text>No statistics to display</Text>
            ) : (
                <>
                    {/* Table for Route Stats */}
                    <Table variant="simple" mt={4}>
                        <Thead>
                            <Tr>
                                <Th>Route Color</Th>
                                <Th>Route ID</Th>
                                <Th>Route Name</Th>
                                <Th>Number of Trips</Th>
                                <Th>Mean Trip Duration (min)</Th>
                                <Th>Mean Trip Distance(Km)</Th>
                                <Th>Mean Headway(Hr)</Th>
                                <Th>Peak Start Time</Th>
                                <Th>Peak No of Trips</Th>
                                <Th>Service Speed(Km/hr)</Th>
                            </Tr>
                        </Thead>
                        <Tbody>{renderRows(currentRouteStats)}</Tbody>
                    </Table>

                    {/* Plot for Route Stats */}
                    {renderRouteStatsPlot()}

                    {/* Pagination */}
                    <Flex justify="space-between" mt={4}>
                        <Button
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            colorScheme="blue"
                        >
                            Previous
                        </Button>
                        <Text>
                            Page {currentPage} of {Math.ceil(routeStatsData.length / statsPerPage)}
                        </Text>
                        <Button
                            onClick={handleNextPage}
                            disabled={currentPage === Math.ceil(routeStatsData.length / statsPerPage)}
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

export default RouteStats;
