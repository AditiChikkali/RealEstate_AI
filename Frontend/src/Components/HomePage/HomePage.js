import React, { useEffect, useState } from 'react';
import './HomePage.css';
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
import { useNavigate } from 'react-router-dom';

import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import FooterChat from '../FooterChat/FooterChat';

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

const Homepage = () => {
  const navigate = useNavigate();
  const [inputMessage, setInputMessage] = useState('');
  const [chartData, setChartData] = useState(null);
  const endpoint = process.env.REACT_APP_BACKEND_URL;

  const handleChatRedirect = (message) => {
    if (message.trim()) {
      console.log('Navigating to Chat with question:', message);
      navigate('/chat', { state: { question: message.trim() } });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/signin');
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    axios
      .get(`${endpoint}/api/chartdata`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setChartData(response.data);
      })
      .catch((error) => {
        console.error('Error fetching chart data:', error);
      });
  }, []);

  if (!chartData) {
    return (
      <div className='homepage'>
        <h2>No Charts Data as of now!</h2>
      </div>
    );
  }

  // Chart configurations
  const historyData = chartData.historyChart
    ? {
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
      }
    : null;

  const inventoryData = chartData.scatterChart
    ? {
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
      }
    : null;

  const cashFlowData = chartData.cashFlowChart
    ? {
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
      }
    : null;

  const leadChannelData = chartData.leadChannelChart
    ? {
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
      }
    : null;

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
    <div className='homepage'>
      <div className='main-layout'>
        <div className='content-section'>
          <div className='content-wrapper'>
            <div className='chart-carousel'>
              <Carousel
                showThumbs={false}
                showStatus={false}
                emulateTouch
                infiniteLoop
              >
                {historyData && (
                  <div className='carousel-slide'>
                    <div className='chart-container'>
                      <Line
                        data={historyData}
                        options={{
                          ...options,
                          plugins: {
                            ...options.plugins,
                            title: { text: 'History of Sold Flips' },
                          },
                        }}
                      />
                    </div>
                  </div>
                )}
                {inventoryData && (
                  <div className='carousel-slide'>
                    <div className='chart-container'>
                      <Bar
                        data={inventoryData}
                        options={{
                          ...options,
                          plugins: {
                            ...options.plugins,
                            title: { text: 'Inventory vs Property Sale Price' },
                          },
                        }}
                      />
                    </div>
                  </div>
                )}
                {cashFlowData && (
                  <div className='carousel-slide'>
                    <div className='chart-container'>
                      <Line
                        data={cashFlowData}
                        options={{
                          ...options,
                          plugins: {
                            ...options.plugins,
                            title: { text: 'Cash Flow Analysis' },
                          },
                        }}
                      />
                    </div>
                  </div>
                )}
                {leadChannelData && (
                  <div className='carousel-slide'>
                    <div className='chart-container'>
                      <Pie
                        data={leadChannelData}
                        options={{
                          ...options,
                          plugins: {
                            ...options.plugins,
                            title: { text: 'Lead Channel Performance' },
                          },
                        }}
                      />
                    </div>
                  </div>
                )}
              </Carousel>
            </div>
            <div className='footer-chat-section'>
              <FooterChat
                inputMessage={inputMessage}
                setInputMessage={setInputMessage}
                onSend={handleChatRedirect}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
