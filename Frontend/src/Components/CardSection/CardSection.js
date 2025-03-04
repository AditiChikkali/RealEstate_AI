import React, { useEffect, useState } from 'react';
import './CardSection.css';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import axios from 'axios';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const CardSection = ({ onCardClick }) => {
  const [chartData, setChartData] = useState(null);
  const endpoint = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    axios
      .get(endpoint + '/api/chartdata', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setChartData(response.data);
      })
      .catch((error) => {
        console.error('There was an error fetching the chart data!', error);
      });
  }, []);

  if (!chartData) {
    return (
      <div className='card-section'>
        <div>
          <h2>No Charts Data as of now!</h2>
        </div>
      </div>
    );
  }

  const historyData = {
    labels: chartData.historyChart.labels,
    datasets: [
      {
        label: 'Property Sale Price',
        data: chartData.historyChart.data,
        fill: false,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
      },
    ],
  };

  const inventoryData = {
    labels: chartData.scatterChart.labels,
    datasets: [
      {
        label: 'Property Sale Price',
        data: chartData.scatterChart.data,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const cashFlowData = {
    labels: chartData.cashFlowChart.labels,
    datasets: [
      {
        label: 'Projected Cash Flow',
        data: chartData.cashFlowChart.data,
        fill: true,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const leadChannelData = {
    labels: chartData.leadChannelChart.labels,
    datasets: [
      {
        label: 'Total Leads',
        data: chartData.leadChannelChart.data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#263B72',
        },
      },
      title: {
        display: true,
        text: 'Chart Title',
        color: '#263B72',
        font: {
          size: 18,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#263B72',
        },
      },
      y: {
        ticks: {
          color: '#263B72',
        },
      },
    },
  };

  return (
    <div className='card-section'>
      <Carousel
        showThumbs={false}
        showStatus={false}
        useKeyboardArrows
        autoPlay
      >
        <div className='card'>
          <div className='chart-container'>
            <Line
              data={historyData}
              options={{
                ...options,
                plugins: {
                  ...options.plugins,
                  title: {
                    ...options.plugins.title,
                    text: 'History of Sold Flips',
                  },
                },
              }}
            />
          </div>
        </div>
        <div className='card'>
          <div className='chart-container'>
            <Bar
              data={inventoryData}
              options={{
                ...options,
                plugins: {
                  ...options.plugins,
                  title: {
                    ...options.plugins.title,
                    text: 'Inventory vs Property Sale Price',
                  },
                },
              }}
            />
          </div>
        </div>
        <div className='card'>
          <div className='chart-container'>
            <Line
              data={cashFlowData}
              options={{
                ...options,
                plugins: {
                  ...options.plugins,
                  title: {
                    ...options.plugins.title,
                    text: 'Cash Flow Analysis',
                  },
                },
              }}
            />
          </div>
        </div>
        <div className='card'>
          <div className='chart-container'>
            <Pie
              data={leadChannelData}
              options={{
                ...options,
                plugins: {
                  ...options.plugins,
                  title: {
                    ...options.plugins.title,
                    text: 'Lead Channel Performance',
                  },
                },
              }}
            />
          </div>
        </div>
      </Carousel>
    </div>
  );
};

export default CardSection;
