import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
    VStack,
} from '@chakra-ui/react';
import { useConfig } from "../configContext";

const CalendarDatesModal = ({ onClose }) => {
    const { baseURL } = useConfig();
    const [calendarDates, setCalendarDates] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const calendarDatesPerPage = 10;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCalendarDates = async () => {
            try {
                const response = await axios.get(`${baseURL}/calendar_dates`);
                if (response.status === 200) {
                    setCalendarDates(response.data);
                } else {
                    setError('Error fetching calendar dates');
                }
            } catch (err) {
                setError('Error fetching calendar dates');
            } finally {
                setLoading(false);
            }
        };

        fetchCalendarDates();
    }, []);

    const indexOfLastDate = currentPage * calendarDatesPerPage;
    const indexOfFirstDate = indexOfLastDate - calendarDatesPerPage;
    const currentCalendarDates = calendarDates.slice(indexOfFirstDate, indexOfLastDate);

    const formatDate = (dateStr) => {
        // Format the date string from YYYYMMDD to MM/DD/YYYY
        const year = dateStr.slice(0, 4);
        const month = dateStr.slice(4, 6);
        const day = dateStr.slice(6, 8);
        return `${month}/${day}/${year}`;
    };

    const renderRows = () => {
        return currentCalendarDates.map((date, index) => (
            <Tr key={index}>
                <Td>{date.service_id || 'NA'}</Td>
                <Td>{formatDate(date.start_date) || 'NA'}</Td>
                <Td>{formatDate(date.end_date) || 'NA'}</Td>
                <Td>{date.monday ? 'Yes' : 'No'}</Td>
                <Td>{date.tuesday ? 'Yes' : 'No'}</Td>
                <Td>{date.wednesday ? 'Yes' : 'No'}</Td>
                <Td>{date.thursday ? 'Yes' : 'No'}</Td>
                <Td>{date.friday ? 'Yes' : 'No'}</Td>
                <Td>{date.saturday ? 'Yes' : 'No'}</Td>
                <Td>{date.sunday ? 'Yes' : 'No'}</Td>
            </Tr>
        ));
    };

    const handleNextPage = () => {
        if (currentPage < Math.ceil(calendarDates.length / calendarDatesPerPage)) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    return (
        <Box p={6} bg="gray.50" borderRadius="md" boxShadow="md">
            <Text fontSize="2xl" mb={4}>Calendar Dates Information</Text>

            {loading ? (
                <Text>Loading calendar dates...</Text>
            ) : error ? (
                <Text color="red.500">{error}</Text>
            ) : calendarDates.length === 0 ? (
                <Text>No calendar dates to display</Text>
            ) : (
                <>
                    <Table variant="simple" size="sm">
                        <Thead>
                            <Tr>
                                <Th>Service ID</Th>
                                <Th>Start Date</Th>
                                <Th>End Date</Th>
                                <Th>Monday</Th>
                                <Th>Tuesday</Th>
                                <Th>Wednesday</Th>
                                <Th>Thursday</Th>
                                <Th>Friday</Th>
                                <Th>Saturday</Th>
                                <Th>Sunday</Th>
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
                        <Text>Page {currentPage} of {Math.ceil(calendarDates.length / calendarDatesPerPage)}</Text>
                        <Button
                            onClick={handleNextPage}
                            disabled={currentPage === Math.ceil(calendarDates.length / calendarDatesPerPage)}
                            colorScheme="blue"
                        >
                            Next
                        </Button>
                    </Flex>
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

export default CalendarDatesModal;
