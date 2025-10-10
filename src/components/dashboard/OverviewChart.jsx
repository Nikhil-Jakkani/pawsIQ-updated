import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
});

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const OverviewChart = ({ data = [], loading = false, interval = 'monthly', onIntervalChange, error = '' }) => {
  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
        y1: {
          beginAtZero: true,
          position: 'right',
        },
      },
      elements: {
        line: {
          tension: 0.4,
        },
      },
    };
  }, []);

  const chartData = useMemo(() => {
    if (!data.length) {
      return null;
    }

    const labels = data.map((point) => {
      if (!(point.bucket instanceof Date)) {
        return '';
      }
      return interval === 'daily' ? dayFormatter.format(point.bucket) : monthFormatter.format(point.bucket);
    });

    return {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data: data.map((point) => point.grossRevenue ?? 0),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'Bookings',
          data: data.map((point) => point.bookings ?? 0),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          yAxisID: 'y1',
        },
      ],
    };
  }, [data, interval]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Overview</h3>
        <select
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          value={interval}
          onChange={(event) => onIntervalChange?.(event.target.value)}
        >
          <option value="daily">Last 30 Days</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      {loading ? (
        <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Loading chart…</div>
      ) : error ? (
        <div className="h-56 flex items-center justify-center text-sm text-red-500">
          {error}
        </div>
      ) : chartData ? (
        <Line options={chartOptions} data={chartData} height={80} />
      ) : (
        <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No data available</div>
      )}
    </div>
  );
};

export default OverviewChart;