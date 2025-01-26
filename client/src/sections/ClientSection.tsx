// src/sections/ClientSection.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, Tooltip, Legend, CategoryScale, LinearScale } from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import StatCard from "../components/StatCard";
import Spinner from "../components/Spinner";
import FilterPanel from "../components/FilterPanel";

ChartJS.register(BarElement, Tooltip, Legend, CategoryScale, LinearScale);

interface ClientSummary {
  _id: string;
  count: number;
}

interface DashboardData {
  clientSummary: ClientSummary[];
}

const ClientSection: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  // Filter States
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Filtered Client Summary
  const [filteredClientSummary, setFilteredClientSummary] = useState<ClientSummary[]>([]);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const response = await axios.get("http://localhost:8001/api/dashboard"); // Update the endpoint as needed
        const clientData: ClientSummary[] = response.data.clientSummary || [];
        setData({ clientSummary: clientData });
        setFilteredClientSummary(clientData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching client data:", error);
        setIsError(true);
        setIsLoading(false);
      }
    };

    fetchClientData();
  }, []);

  // Filter Logic (Assuming clients have a 'createdDate' field)
  useEffect(() => {
    if (!data) return;

    if (!startDate && !endDate) {
      setFilteredClientSummary(data.clientSummary);
      return;
    }

    const filteredClients = data.clientSummary.filter((client) => {
      const clientDate = new Date(client._id); // Assuming '_id' represents date; adjust accordingly
      if (startDate && clientDate < startDate) return false;
      if (endDate && clientDate > endDate) return false;
      return true;
    });

    setFilteredClientSummary(filteredClients);
  }, [startDate, endDate, data]);

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  if (isLoading) return <Spinner />;
  if (isError || !data)
    return (
      <div className="flex flex-col justify-center items-center text-red-600">
        <p>Failed to load client data.</p>
      </div>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filter Panel */}
        <FilterPanel
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          clearFilters={clearFilters}
        />

        {/* Client Summary Bar Chart */}
        <div className="mt-4">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Clients per Category</h2>
          {filteredClientSummary.length > 0 ? (
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <Bar
                  data={{
                    labels: filteredClientSummary.map((client) => client._id),
                    datasets: [
                      {
                        label: "Clients",
                        data: filteredClientSummary.map((client) => client.count),
                        backgroundColor: "#6366F1", // Indigo color
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            return `Clients: ${context.parsed.y}`;
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 5,
                          precision: 0,
                        },
                      },
                      x: {
                        ticks: {
                          autoSkip: false,
                          maxRotation: 45,
                          minRotation: 45,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">No client data available for the selected date range.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientSection;
