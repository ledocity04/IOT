import React from 'react'
import { CChartLine } from "@coreui/react-chartjs";

const Chart3 = (props) => {
  const lux = props.chartData.lux.reverse();

  return (
    <>
      <CChartLine
              //   ref={widgetChartRef1}
              className="mt-3 mx-3"
              style={{ height: "70px" }}
              data={{
                labels: ["", "", "", "", "", "", ""],
                datasets: [
                  {
                    label: "Độ sáng",
                    backgroundColor: "transparent",
                    borderColor: "rgba(255,255,255,.55)",
                    data: lux,
                  },
                ],
              }}
              options={{
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                maintainAspectRatio: false,
                scales: {
                  x: {
                    border: {
                      display: false,
                    },
                    grid: {
                      display: false,
                      drawBorder: false,
                    },
                    ticks: {
                      display: false,
                    },
                  },
                  y: {
                    min: 0,
                    max: 1500,
                    display: false,
                    grid: {
                      display: false,
                    },
                    ticks: {
                      display: false,
                    },
                  },
                },
                elements: {
                  line: {
                    borderWidth: 1,
                    tension: 0.4,
                  },
                  point: {
                    radius: 4,
                    hitRadius: 10,
                    hoverRadius: 4,
                  },
                },
              }}
            />
    </>
  )
}

export default Chart3
