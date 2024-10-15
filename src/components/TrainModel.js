import React, { useState } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
import {
    Box,
    Button,
    Text,
    Flex,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Spinner,
    Alert,
    AlertIcon,
} from "@chakra-ui/react";

import { useConfig } from "../configContext"; // Replace this with your Flask server URL

function TrainModel({ onClose }) {
    const { baseURL } = useConfig();
    const [mse, setMSE] = useState(null);
    const [mae, setMAE] = useState(null);
    const [featureImportances, setFeatureImportances] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Function to trigger model training
    const trainModel = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.post(`${baseURL}/train_model`);
            const { mse, mae, feature_importance } = response.data;

            // Set the state with the response data
            setMSE(mse);
            setMAE(mae);
            setFeatureImportances(feature_importance);
        } catch (error) {
            console.error("Error during model training:", error);
            setError("Error during model training. Please try again.");
        }

        setIsLoading(false);
    };

    // Calculate total importance for percentage calculation
    const totalImportance = featureImportances.reduce(
        (total, item) => total + item.Importance,
        0
    );

    return (
        <Box p={6} bg="gray.50" borderRadius="md" boxShadow="md">
            <Text fontSize="2xl" mb={4}>
                Train Model
            </Text>

            {/* Trigger model training button */}
            <Flex mb={4} justifyContent="center">
                <Button
                    onClick={trainModel}
                    colorScheme="blue"
                    isLoading={isLoading}
                    loadingText="Training Model"
                >
                    Train Model
                </Button>
            </Flex>

            {/* Show loading spinner during training */}
            {isLoading && (
                <Flex justifyContent="center">
                    <Spinner size="lg" />
                </Flex>
            )}

            {/* Show error message if training fails */}
            {error && (
                <Alert status="error" mb={4}>
                    <AlertIcon />
                    {error}
                </Alert>
            )}

            {/* Display training results after success */}
            {!isLoading && mse && mae && (
                <>
                    <Text fontSize="lg" mb={4} color="green.600">
                        Model trained successfully!
                    </Text>
                    <Text fontWeight="bold" color="blue.700">
                        Mean Squared Error (MSE): {mse.toFixed(4)}
                    </Text>
                    <Text fontWeight="bold" color="blue.700">
                        Mean Absolute Error (MAE): {mae.toFixed(4)}
                    </Text>

                    {/* Display Feature Importances Table */}
                    <Box mt={6}>
                        <Text fontSize="lg" mb={2}>
                            Feature Importances
                        </Text>
                        <Table variant="simple" size="sm">
                            <Thead>
                                <Tr>
                                    <Th>Feature</Th>
                                    <Th>Importance</Th>
                                    <Th>Percentage</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {featureImportances.map((item, index) => (
                                    <Tr key={index}>
                                        <Td>{item.Feature}</Td>
                                        <Td>{item.Importance.toFixed(4)}</Td>
                                        <Td>
                                            {(
                                                (item.Importance /
                                                    totalImportance) *
                                                100
                                            ).toFixed(2)}
                                            %
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </Box>

                    {/* Plot Feature Importances as Pie Chart */}
                    <Box mt={6} justifyContent={"center"}>
                        <Text fontSize="lg" mb={4}>
                            Feature Importance Distribution (Pie Chart)
                        </Text>
                        <Plot
                            data={[
                                {
                                    values: featureImportances.map(
                                        (item) => item.Importance
                                    ),
                                    labels: featureImportances.map(
                                        (item) => item.Feature
                                    ),
                                    type: "pie",
                                    textinfo: "label+percent",
                                    hoverinfo: "label+value",
                                    marker: {
                                        colors: [
                                            "#ff7f0e",
                                            "#1f77b4",
                                            "#2ca02c",
                                            "#d62728",
                                            "#9467bd",
                                        ],
                                    },
                                },
                            ]}
                            layout={{
                                width: 800,
                                height: 800,
                                title: "Feature Importance in Percentages",
                            }}
                        />
                    </Box>

                    {/* Plot Feature Importances as Bar Chart */}
                    <Box mt={6}>
                        <Text fontSize="lg" mb={4}>
                            Feature Importance Comparison (Bar Chart)
                        </Text>
                        <Plot
                            data={[
                                {
                                    x: featureImportances.map(
                                        (item) => item.Feature
                                    ),
                                    y: featureImportances.map(
                                        (item) =>
                                            (item.Importance /
                                                totalImportance) *
                                            100
                                    ),
                                    type: "bar",
                                    marker: { color: "blue" },
                                },
                            ]}
                            layout={{
                                width: 800,
                                height: 600,
                                title: "Feature Importance Percentage Comparison",
                                yaxis: { title: "Percentage (%)" },
                            }}
                        />
                    </Box>
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

export default TrainModel;
