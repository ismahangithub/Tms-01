import React, { useState, useEffect } from "react";
import axios from "axios";

interface Report {
  _id: string;
  title: string;
  author: string;
  createdAt: string;
  content: string;
}

interface ReportsTabProps {
  projectId: string;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ projectId }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await axios.get<Report[]>(`/api/projects/${projectId}/reports`);
        setReports(response.data);
      } catch (err: any) {
        setError("Failed to load reports.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [projectId]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Reports</h2>

      {loading ? (
        <p>Loading reports...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : reports.length === 0 ? (
        <p>No reports available for this project.</p>
      ) : (
        reports.map((report) => (
          <div key={report._id} className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium">{report.title}</h3>
            <p className="text-sm text-gray-500 mb-2">
              by {report.author} - {new Date(report.createdAt).toLocaleDateString()}
            </p>
            <p className="text-gray-700">{report.content}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default ReportsTab;
