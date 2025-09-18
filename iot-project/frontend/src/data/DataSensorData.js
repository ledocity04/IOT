import React, {useEffect, useState} from 'react'
import axios from 'axios';

const DataSensorData = [
    {
      data: []
    }
]

export const useDataSensorData = () => {
    const [data, setData] = useState([]);
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          const result = await axios.get('http://localhost:8081/data1');
          const dataSensor = result.data.map((item) => ({
            id: item.id,
            temperature: item.temperature,
            humidity: item.humidity,
            lux: item.lux,
            date: item.date,
          }));
          setData(dataSensor);
          DataSensorData.data = dataSensor; // Update the exported constant
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };
      
      fetchData();
    }, []);
  
    return data;
  };

export default DataSensorData