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

function TripStatsModal({ onClose }) {
    const { baseURL } = useConfig();
    const [tripStatsData, setTripStatsData] = useState({
        trip_duration_analysis: [],
        trip_period_analysis: [],
    });
    const [currentPage, setCurrentPage] = useState(1);
    const statsPerPage = 5;
    const [selectedDate, setSelectedDate] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Fetch trip statistics data
    const fetchTripStatsData = async () => {
        if (!selectedDate) {
            alert("Please enter a date in YYYYMMDD format.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.get(
                `${baseURL}/api/trip_stats`,
                {
                    params: { date: selectedDate },
                }
            );
            setTripStatsData(response.data);
        } catch (error) {
            console.error("Error fetching trip stats data:", error);
        }
        setIsLoading(false);
    };

    // Paginate trip duration and period analysis data
    const indexOfLastStat = currentPage * statsPerPage;
    const indexOfFirstStat = indexOfLastStat - statsPerPage;
    const currentTripDurationAnalysis =
        tripStatsData.trip_duration_analysis.slice(
            indexOfFirstStat,
            indexOfLastStat
        );
    const currentTripPeriodAnalysis = tripStatsData.trip_period_analysis.slice(
        indexOfFirstStat,
        indexOfLastStat
    );

    const renderRows = (stats) => {
        return stats.map((stat, index) => (
            <Tr key={index}>
                <Td>{stat.time_of_day || stat.period_time || "NA"}</Td>
                <Td>{stat.num_trips}</Td>
                <Td>{stat.mean_duration.toFixed(2)}</Td>
                <Td>{stat.min_duration}</Td>
                <Td>{stat.max_duration}</Td>
                <Td>{stat.mean_speed.toFixed(2)}</Td>
                <Td>{stat.min_speed}</Td>
                <Td>{stat.max_speed}</Td>
            </Tr>
        ));
    };

    const handleNextPage = () => {
        if (
            currentPage <
            Math.ceil(
                tripStatsData.trip_duration_analysis.length / statsPerPage
            )
        ) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Generate Plotly Graphs
    const renderTripDurationPlot = () => {
        const timeOfDay = tripStatsData.trip_duration_analysis.map(
            (item) => item.time_of_day
        );
        const meanDuration = tripStatsData.trip_duration_analysis.map(
            (item) => item.mean_duration
        );
        const meanSpeed = tripStatsData.trip_duration_analysis.map(
            (item) => item.mean_speed
        );

        return (
            <Plot
                data={[
                    {
                        x: timeOfDay,
                        y: meanDuration,
                        type: "bar",
                        name: "Mean Duration",
                    },
                    {
                        x: timeOfDay,
                        y: meanSpeed,
                        type: "line",
                        name: "Mean Speed",
                        yaxis: "y2",
                    },
                ]}
                layout={{
                    title: "Trip Duration and Speed Analysis by Time of Day",
                    xaxis: { title: "Time of Day" },
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

    const renderTripPeriodPlot = () => {
        const periodTime = tripStatsData.trip_period_analysis.map(
            (item) => item.period_time
        );
        const meanDuration = tripStatsData.trip_period_analysis.map(
            (item) => item.mean_duration
        );
        const meanSpeed = tripStatsData.trip_period_analysis.map(
            (item) => item.mean_speed
        );

        return (
            <Plot
                data={[
                    {
                        x: periodTime,
                        y: meanDuration,
                        type: "bar",
                        name: "Mean Duration",
                    },
                    {
                        x: periodTime,
                        y: meanSpeed,
                        type: "line",
                        name: "Mean Speed",
                        yaxis: "y2",
                    },
                ]}
                layout={{
                    title: "Trip Period Analysis",
                    xaxis: { title: "Time Period" },
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

    return (
        <Box p={6} bg="gray.50" borderRadius="md" boxShadow="md">
            <Text fontSize="2xl" mb={4}>
                Trip Statistics
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
                    onClick={fetchTripStatsData}
                    colorScheme="blue"
                    isLoading={isLoading}
                >
                    Search
                </Button>
            </Flex>

            {tripStatsData.trip_duration_analysis.length === 0 &&
            tripStatsData.trip_period_analysis.length === 0 ? (
                <Text>No statistics to display</Text>
            ) : (
                <>
                    {/* Table for Trip Duration Analysis */}
                    <Table variant="simple" mt={4}>
                        <Thead>
                            <Tr>
                                <Th>Time/Period</Th>
                                <Th>Number of Trips</Th>
                                <Th>Mean Duration (min)</Th>
                                <Th>Min Duration</Th>
                                <Th>Max Duration</Th>
                                <Th>Mean Speed (km/h)</Th>
                                <Th>Min Speed (km/h)</Th>
                                <Th>Max Speed (km/h)</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {renderRows(currentTripDurationAnalysis)}
                        </Tbody>
                    </Table>

                    {/* Plot for Trip Duration Analysis */}
                    {renderTripDurationPlot()}

                    {/* Table for Trip Period Analysis */}
                    <Table variant="simple" mt={4}>
                        <Thead>
                            <Tr>
                                <Th>Period Time</Th>
                                <Th>Number of Trips</Th>
                                <Th>Mean Duration (min)</Th>
                                <Th>Min Duration</Th>
                                <Th>Max Duration</Th>
                                <Th>Mean Speed (km/h)</Th>
                                <Th>Min Speed (km/h)</Th>
                                <Th>Max Speed (km/h)</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {renderRows(currentTripPeriodAnalysis)}
                        </Tbody>
                    </Table>

                    {/* Plot for Trip Period Analysis */}
                    {renderTripPeriodPlot()}

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
                            Page {currentPage} of{" "}
                            {Math.ceil(
                                tripStatsData.trip_duration_analysis.length /
                                    statsPerPage
                            )}
                        </Text>
                        <Button
                            onClick={handleNextPage}
                            disabled={
                                currentPage ===
                                Math.ceil(
                                    tripStatsData.trip_duration_analysis
                                        .length / statsPerPage
                                )
                            }
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

export default TripStatsModal;
