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

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import RoutesModal from "./components/RoutesModal";
import TripsModal from "./components/TripsModal";
import StopsModal from "./components/StopsModal";
import CalendarDatesModal from "./components/CalendarDatesModal";
import FrequentRoutesModal from "./components/FrequentRoutesModal";
import PeakHourTraffic from "./components/PeakHourTraffic";
import TripPlanner from "./components/TripPlanner";
import FastestSlowestRoutes from "./components/FastestSlowestRoutes";
import ShortestLongestRoutes from "./components/ShortestLongestRoutes";
import RouteEfficiency from "./components/RouteEfficiency";
import TripStatsModal from "./components/TripStatsModal";
import RouteStats from "./components/RouteStats";
import TrainModel from "./components/TrainModel";

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

    const cityCoordinates = {
        "New York": [40.7128, -74.006],
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const closeModals = () => setActiveView(null);

    return (
        <Flex>
            <Box w="250px" bg={bgColor} boxShadow="lg" h="auto" overflow="auto">
                <Text fontSize="2xl" fontWeight="bold" p={4}>
                    Dashboard
                </Text>
                <VStack align="stretch">
                    <Button
                        leftIcon={<Icon as={FaTachometerAlt} />}
                        onClick={() => setActiveView("overview")}
                        justifyContent="flex-start"
                        variant="ghost"
                        _hover={{ bg: buttonHoverBg }}
                        w="auto"
                        color={textColor}
                        bg={
                            activeView === "overview"
                                ? buttonHoverBg
                                : "transparent"
                        }
                    >
                        Overview
                    </Button>
                    {[
                        {
                            icon: FaRoute,
                            text: "View Routes",
                            view: "routes",
                        },
                        {
                            icon: FaBus,
                            text: "View Trips",
                            view: "trips",
                        },
                        {
                            icon: FaMapMarkerAlt,
                            text: "View Stops",
                            view: "stops",
                        },
                        {
                            icon: FaCalendarAlt,
                            text: "View Calendar Dates",
                            view: "calendarDates",
                        },
                        {
                            icon: FaChartLine,
                            text: "Frequent Routes",
                            view: "frequentRoutes",
                        },
                        {
                            icon: FaClock,
                            text: "Peak Hour Traffic",
                            view: "peakHourTraffic",
                        },
                        {
                            icon: FaMapSigns,
                            text: "Trip Planner",
                            view: "tripPlanner",
                        },
                        {
                            icon: FaBus,
                            text: "Fastest/Slowest Routes",
                            view: "fsRoutes",
                        },
                        {
                            icon: FaRulerHorizontal,
                            text: "Shortest/Longest Routes",
                            view: "slRoutes",
                        },
                        {
                            icon: FaBalanceScale,
                            text: "Route Efficiency",
                            view: "routeEfficiency",
                        },
                        {
                            icon: FaChartBar,
                            text: "Trip Stats",
                            view: "tripStats",
                        },
                        {
                            icon: FaChartLine,
                            text: "Route Stats",
                            view: "routeStats",
                        },
                        {
                            icon: FaChartLine,
                            text: "Train Model",
                            view: "trainModel",
                        },
                    ].map((item, index) => (
                        <Button
                            key={index}
                            leftIcon={<Icon as={item.icon} />}
                            onClick={() => setActiveView(item.view)}
                            justifyContent="flex-start"
                            variant="ghost"
                            _hover={{ bg: buttonHoverBg }}
                            w="auto"
                            color={textColor}
                            bg={
                                activeView === item.view
                                    ? buttonHoverBg
                                    : "transparent"
                            }
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

                {activeView === "routes" && (
                    <RoutesModal onClose={() => setActiveView("overview")} />
                )}
                {activeView === "trips" && (
                    <TripsModal onClose={() => setActiveView("overview")} />
                )}
                {activeView === "stops" && (
                    <StopsModal onClose={() => setActiveView("overview")} />
                )}
                {activeView === "calendarDates" && (
                    <CalendarDatesModal
                        onClose={() => setActiveView("overview")}
                    />
                )}
                {activeView === "frequentRoutes" && (
                    <FrequentRoutesModal
                        onClose={() => setActiveView("overview")}
                    />
                )}
                {activeView === "peakHourTraffic" && (
                    <PeakHourTraffic
                        onClose={() => setActiveView("overview")}
                    />
                )}
                {activeView === "tripPlanner" && (
                    <TripPlanner onClose={() => setActiveView("overview")} />
                )}
                {activeView === "fsRoutes" && (
                    <FastestSlowestRoutes
                        onClose={() => setActiveView("overview")}
                    />
                )}
                {activeView === "slRoutes" && (
                    <ShortestLongestRoutes
                        onClose={() => setActiveView("overview")}
                    />
                )}
                {activeView === "routeEfficiency" && (
                    <RouteEfficiency
                        onClose={() => setActiveView("overview")}
                    />
                )}
                {activeView === "tripStats" && (
                    <TripStatsModal onClose={() => setActiveView("overview")} />
                )}
                {activeView === "routeStats" && (
                    <RouteStats onClose={() => setActiveView("overview")} />
                )}
                {activeView === "trainModel" && (
                    <TrainModel onClose={() => setActiveView("overview")} />
                )}
            </Box>
        </Flex>
    );
}

export default App;
