import { React, useState } from "react";
import { CRow, CCol, CWidgetStatsA } from "@coreui/react";
import { CChartLine } from "@coreui/react-chartjs";

import { FaTemperatureEmpty } from "react-icons/fa6";
import { WiHumidity } from "react-icons/wi";
import { CiBrightnessDown } from "react-icons/ci";

import Chart1 from "./TempChart";
import Chart2 from "./HumidityChart";
import Chart3 from "./LuxChart";

  const getTemperatureColor = (temperature) => {
    // Clamp the temperature value between 0 and 50 for the sake of simplicity
    const clampedTemp = Math.max(0, Math.min(temperature, 50))
  
    // Calculate the linear interpolation between yellow (255, 255, 0) and red (255, 0, 0)
    const greenComponent = Math.round(255 - (clampedTemp / 50) * 255)
  
    // Return the RGB color string
    return `rgb(255, ${greenComponent}, 0)`
  }

  const getHumidityColor = (humidity) => {
    const clampedHumi = Math.max(0, Math.min(humidity, 100));
  
    // Calculate the red, green, and blue components based on humidity
    const redComponent = Math.round(173 - (clampedHumi / 100) * (173 - 20)); // from 173 to 20
    const greenComponent = Math.round(216 - (clampedHumi / 100) * 216); // from 216 to 0
    const blueComponent = Math.round(230 + (clampedHumi / 100) * (255 - 230)); // from 230 to 255
  
    // Return the RGB color string with the calculated components
    return `rgb(${redComponent}, ${greenComponent}, ${blueComponent})`;
  };

  const getLuxColor = (lux) => {
    const clampedLux = Math.max(100, Math.min(lux, 700));

    // Calculate the red and green components based on lux
    const redComponent = Math.round(153 + (clampedLux - 100) / 600 * (255 - 153)); // from 153 (gray) to 255 (light yellow)
    const greenComponent = Math.round(153 + (clampedLux - 100) / 600 * (255 - 153)); // from 153 (gray) to 255 (light yellow)
    const blueComponent = Math.round(153 - (clampedLux - 100) / 600 * 153); // from 153 (gray) to 0 (yellow)

    // Return the RGB color string with the calculated components
    return `rgb(${redComponent}, ${greenComponent}, ${blueComponent})`;
};




  
const WidgetDropDown = (props) => {
  const { temp, humidity, lux } = props;

  return (
    <CRow className={props.className} xs={{ gutter: 4 }}>
      {/* Temperature */}
      <CCol xs="12" sm="6" md="4">
        <CWidgetStatsA
          style={{
            backgroundColor: getTemperatureColor(temp), 
            color: "#fff",
            maxWidth: "100%",
          }}
          value={
            <>
              {temp} <span className="fs-8">°C</span>
            </>
          }
          action={<FaTemperatureEmpty className="temp" />
          }
          title="Nhiệt độ"
          chart={
            <Chart1 chartData={props.chartData}/>
          }
        />
      </CCol>

      {/* Humidity */}
      <CCol xs="12" sm="6" md="4">
        <CWidgetStatsA
          style={{
            backgroundColor: getHumidityColor(humidity), // Set dynamic background color
            color: "#fff", // Ensure text is visible on darker backgrounds
            maxWidth: "100%",
          }}
          value={
            <>
              {humidity} <span className="fs-8">%</span>
            </>
          }
          title="Độ ẩm"
          action={
            <WiHumidity className="humi"/>
          }
          chart={
            <Chart2 chartData={props.chartData}/>
          }
        />
      </CCol>

      {/* Lux */}
      <CCol xs="12" sm="6" md="4">
        <CWidgetStatsA
          style={{
            backgroundColor: getLuxColor(lux),
            color: "#fff",
            maxWidth: "100%",
          }}
          value={
            <>
              {lux} <span className="fs-8">LUX</span>
            </>
          }
          title="Độ sáng"
          action={
            <CiBrightnessDown className="lux"/>
          }
          chart={
            <Chart3 chartData={props.chartData}/>
          }
        />
      </CCol>
    </CRow>
  );
};

export default WidgetDropDown;
