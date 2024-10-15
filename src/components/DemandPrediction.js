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
    Input,
} from "@chakra-ui/react";
import { useConfig } from "../configContext";

function DemandPrediction({ onClose }) {
    const { baseURL } = useConfig();
    const [formData, setFormData] = useState({
        route_id: "",
        date: "",
        time: "",
        total_stops: "",
        avg_speed: "",
        avg_duration: "",
        avg_distance: "",
    });
    const [predictionResult, setPredictionResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await axios.post(`${baseURL}/predict_demand`, {
                route_id: formData.route_id,
                date: formData.date,
                time: formData.time,
                total_stops: parseInt(formData.total_stops),
                avg_speed: parseFloat(formData.avg_speed),
                avg_duration: parseFloat(formData.avg_duration),
                avg_distance: parseFloat(formData.avg_distance),
            });
            setPredictionResult(response.data.predicted_demand);
        } catch (error) {
            console.error("Error predicting demand:", error);
            setPredictionResult("Error occurred during prediction");
        }
        setIsLoading(false);
    };

    return (
        <Box p={6} bg="gray.50" borderRadius="md" boxShadow="md">
            <Text fontSize="2xl" mb={4}>
                Demand Prediction
            </Text>

            <Flex direction="column" mb={4}>
                <Input
                    placeholder="Route ID"
                    name="route_id"
                    value={formData.route_id}
                    onChange={handleInputChange}
                    mb={2}
                />
                <Input
                    placeholder="Date (YYYYMMDD)"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    mb={2}
                />
                <Input
                    placeholder="Time (HH:MM)"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    mb={2}
                />
                <Input
                    placeholder="Total Stops"
                    name="total_stops"
                    value={formData.total_stops}
                    onChange={handleInputChange}
                    mb={2}
                />
                <Input
                    placeholder="Average Speed"
                    name="avg_speed"
                    value={formData.avg_speed}
                    onChange={handleInputChange}
                    mb={2}
                />
                <Input
                    placeholder="Average Duration"
                    name="avg_duration"
                    value={formData.avg_duration}
                    onChange={handleInputChange}
                    mb={2}
                />
                <Input
                    placeholder="Average Distance"
                    name="avg_distance"
                    value={formData.avg_distance}
                    onChange={handleInputChange}
                    mb={2}
                />
                <Button
                    onClick={handleSubmit}
                    colorScheme="blue"
                    isLoading={isLoading}
                >
                    Predict Demand
                </Button>
            </Flex>

            {predictionResult !== null && (
                <Table variant="simple" mt={4}>
                    <Thead>
                        <Tr>
                            <Th>Predicted Demand</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        <Tr>
                            <Td>{predictionResult}</Td>
                        </Tr>
                    </Tbody>
                </Table>
            )}

            <Box mt={4}>
                <Button colorScheme="red" onClick={onClose}>
                    Close
                </Button>
            </Box>
        </Box>
    );
}

export default DemandPrediction;
