import React, { useState, useEffect } from "react";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import {
    Box,
    Flex,
    Heading,
    Text,
    Icon,
    Grid,
    GridItem,
    Button,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import {
    FaTachometerAlt,
    FaRoute,
    FaBus,
    FaMapMarkerAlt,
    FaCalendarAlt,
    FaChartLine,
    FaClock,
    FaMapSigns,
    FaRulerHorizontal,
    FaBalanceScale,
    FaChartBar,
} from "react-icons/fa";

// import { FaTachometerAlt } from "react-icons/fa";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import RoutesModal from "./components/RoutesModal";
import TripsModal from "./components/TripsModal"; // Import TripsModal
import StopsModal from "./components/StopsModal"; // Import StopsModal
import CalendarDatesModal from "./components/CalendarDatesModal"; // Import CalendarDatesModal
import FrequentRoutesModal from "./components/FrequentRoutesModal";
import PeakHourTraffic from "./components/PeakHourTraffic";
import TripPlanner from "./components/TripPlanner";
import FastestSlowestRoutes from "./components/FastestSlowestRoutes";
import ShortestLongestRoutes from "./components/ShortestLongestRoutes";
import RouteEfficiency from "./components/RouteEfficiency";
import TripStatsModal from "./components/TripStatsModal";
import RouteStats from "./components/RouteStats";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

function App() {
    const bgColor = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.800", "white");
    const buttonBg = useColorModeValue("gray.100", "gray.700");
    const buttonHoverBg = useColorModeValue("gray.200", "gray.600");

    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedCity, setSelectedCity] = useState("New York");
    const [dashboardData, setDashboardData] = useState({
        fuelConsumption: "15,234 L",
        carbonEmissions: "2,456 kg",
        onTimePerformance: "98.5%",
        userSatisfaction: "4.8/5",
    });
    const [activeView, setActiveView] = useState("overview");
    const [isRoutesModalOpen, setIsRoutesModalOpen] = useState(false);
    const [isTripsModalOpen, setIsTripsModalOpen] = useState(false); // Modal state for Trips
    const [isStopsModalOpen, setIsStopsModalOpen] = useState(false); // Modal state for Stops
    const [isCalendarDatesModalOpen, setIsCalendarDatesModalOpen] =
        useState(false); // Modal state for Calendar Dates
    const [frequentRoutes, setFrequentRoutes] = useState();
    const [peak_hour_traffic, setPeak_hour_traffic] = useState(false);
    const [trip_planner, set_trip_planner] = useState(false);
    const [fsRoutes, setfsRoutes] = useState(false);
    const [slRoutes, setslRoutes] = useState(false);
    const [routeEfficiency, setrouteEfficiency] = useState(false);
    const [trip_stats, set_trip_stats] = useState(false);
    const [route_stats,set_route_stats]=useState(false);

    const cityCoordinates = {
        "New York": [40.7128, -74.006],
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <Flex>
            <Box
                w="250px"
                bg={bgColor}
                boxShadow="lg"
                h="100vh"
                overflow="auto"
            >
                {/* <Heading size="lg" mb={8} color={textColor}>
                    Dashboard
                </Heading> */}

                <Text fontSize="2xl" fontWeight="bold" p={4}>
                    Dashboard
                </Text>
                <VStack align="stretch">
                    {[
                        {
                            icon: FaRoute,
                            text: "View Routes",
                            onClick: () => setIsRoutesModalOpen(true),
                        },
                        {
                            icon: FaBus,
                            text: "View Trips",
                            onClick: () => setIsTripsModalOpen(true),
                        },
                        {
                            icon: FaMapMarkerAlt,
                            text: "View Stops",
                            onClick: () => setIsStopsModalOpen(true),
                        },
                        {
                            icon: FaCalendarAlt,
                            text: "View Calendar Dates",
                            onClick: () => setIsCalendarDatesModalOpen(true),
                        },
                        {
                            icon: FaChartLine,
                            text: "Frequent Routes",
                            onClick: () => setFrequentRoutes(true),
                        },
                        {
                            icon: FaClock,
                            text: "Peak Hour Traffic",
                            onClick: () => setPeak_hour_traffic(true),
                        },
                        {
                            icon: FaMapSigns,
                            text: "Trip Planner",
                            onClick: () => set_trip_planner(true),
                        },
                        {
                            icon: FaBus,
                            text: "Fastest/Slowest Routes",
                            onClick: () => setfsRoutes(true),
                        },
                        {
                            icon: FaRulerHorizontal,
                            text: "Shortest/Longest Routes",
                            onClick: () => setslRoutes(true),
                        },
                        {
                            icon: FaBalanceScale,
                            text: "Route Efficiency",
                            onClick: () => setrouteEfficiency(true),
                        },
                        {
                            icon: FaChartBar,
                            text: "Trip Stats",
                            onClick: () => set_trip_stats(true),
                        },
                        {
                            icon: FaChartLine,
                            text: "Route Stats",
                            onClick: () => set_route_stats(true),
                        },
                    ].map((item, index) => (
                        <Button
                            key={index}
                            leftIcon={<Icon as={item.icon} />}
                            onClick={item.onClick}
                            justifyContent="flex-start"
                            // variant="ghost"
                            _hover={{ bg: buttonHoverBg }}
                            w="auto"
                            color={textColor}
                        >
                            {item.text}
                        </Button>
                    ))}
                </VStack>
            </Box>
            <Box w="84%" p={6}>
                {activeView === "overview" && (
                    <>
                        <Flex justify="space-between" align="center" mb={6}>
                            <Heading size="lg">
                                Transit Management System
                            </Heading>
                            <Flex align="center" gap={4}>
                                <VStack spacing={0}>
                                    <Text fontSize="sm">Current Time:</Text>
                                    <Text fontSize="xl" fontWeight="bold">
                                        {currentTime.toLocaleTimeString()}
                                    </Text>
                                </VStack>
                            </Flex>
                        </Flex>
                        <MapContainer
                            center={cityCoordinates[selectedCity]}
                            zoom={13}
                            style={{ height: "400px", width: "100%" }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <Marker position={cityCoordinates[selectedCity]}>
                                <Popup>{selectedCity} is here!</Popup>
                            </Marker>
                        </MapContainer>
                        <Grid templateColumns="repeat(4, 1fr)" gap={6} mt={6}>
                            <GridItem bg="blue.500" p={4} borderRadius="md">
                                <Text fontSize="lg" fontWeight="bold">
                                    Fuel Consumption
                                </Text>
                                <Text fontSize="2xl">
                                    {dashboardData.fuelConsumption}
                                </Text>
                            </GridItem>
                            <GridItem bg="green.500" p={4} borderRadius="md">
                                <Text fontSize="lg" fontWeight="bold">
                                    Carbon Emissions
                                </Text>
                                <Text fontSize="2xl">
                                    {dashboardData.carbonEmissions}
                                </Text>
                            </GridItem>
                            <GridItem bg="orange.500" p={4} borderRadius="md">
                                <Text fontSize="lg" fontWeight="bold">
                                    On-Time Performance
                                </Text>
                                <Text fontSize="2xl">
                                    {dashboardData.onTimePerformance}
                                </Text>
                            </GridItem>
                            <GridItem bg="purple.500" p={4} borderRadius="md">
                                <Text fontSize="lg" fontWeight="bold">
                                    User Satisfaction
                                </Text>
                                <Text fontSize="2xl">
                                    {dashboardData.userSatisfaction}
                                </Text>
                            </GridItem>
                        </Grid>
                    </>
                )}

                {/* RoutesModal */}
                {isRoutesModalOpen && (
                    <RoutesModal onClose={() => setIsRoutesModalOpen(false)} />
                )}

                {/* TripsModal */}
                {isTripsModalOpen && (
                    <TripsModal onClose={() => setIsTripsModalOpen(false)} /> // Pass onClose handler
                )}

                {/* StopsModal */}
                {isStopsModalOpen && (
                    <StopsModal onClose={() => setIsStopsModalOpen(false)} /> // Pass onClose handler
                )}

                {/* CalendarDatesModal */}
                {isCalendarDatesModalOpen && (
                    <CalendarDatesModal
                        onClose={() => setIsCalendarDatesModalOpen(false)}
                    /> // Pass onClose handler
                )}

                {/* FrequentModal */}
                {frequentRoutes && (
                    <FrequentRoutesModal
                        onClose={() => setFrequentRoutes(false)}
                    /> // Pass onClose handler
                )}
                {/* FrequentModal */}
                {peak_hour_traffic && (
                    <PeakHourTraffic
                        onClose={() => setPeak_hour_traffic(false)}
                    /> // Pass onClose handler
                )}
                {/* Trip Planner */}
                {trip_planner && (
                    <TripPlanner onClose={() => set_trip_planner(false)} /> // Pass onClose handler
                )}
                {/* Fastest Slowest Routes */}
                {fsRoutes && (
                    <FastestSlowestRoutes onClose={() => setfsRoutes(false)} />
                )}
                {/* Shortest Longest Routes */}
                {slRoutes && (
                    <ShortestLongestRoutes onClose={() => setslRoutes(false)} />
                )}
                {/* Route Efficiency */}
                {routeEfficiency && (
                    <RouteEfficiency
                        onClose={() => setrouteEfficiency(false)}
                    />
                )}
                {/* Trip Stats */}
                {trip_stats && (
                    <TripStatsModal onClose={() => setrouteEfficiency(false)} />
                )}
                {/* Route Stats */}
                {route_stats && (
                    <RouteStats onClose={() => set_route_stats(false)} />
                )}
            </Box>
        </Flex>
    );
}

export default App;
