"use client";

import { useState } from "react";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([
  {
    title: "Server Crash",
    severity: "HIGH",
    impact: 9,
    status: "OPEN",
  },
  {
    title: "Login Bug",
    severity: "MEDIUM",
    impact: 5,
    status: "RESOLVED",
  },
]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Incidents</h1>

      {/* Add Incident Button */}
      <button className="bg-blue-500 text-white px-4 py-2 rounded mb-4">
        + Add Incident
      </button>

      {/* Table */}
      <div className="bg-white rounded shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-2">Title</th>
              <th>Severity</th>
              <th>Impact</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center p-4">
                  No incidents yet
                </td>
              </tr>
            ) : (
              incidents.map((inc, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{inc.title}</td>
                  <td>{inc.severity}</td>
                  <td>{inc.impact}</td>
                  <td>{inc.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}