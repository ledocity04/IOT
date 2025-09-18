const mysql = require("mysql");
const express = require("express");
const cors = require("cors");
const mqtt = require("mqtt");
const swagger = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");
const YAML = require("yamljs");

const app = express();
const PORT = 8081;
const client = mqtt.connect("mqtt://172.20.10.3");

const MQTT_TOPIC = "iot_project";
const MQTT_REQUEST = "iot_project_request";
const MQTT_UPDATE = "iot_project_update";

let dataSensor = [];
let actionHistory = [];

// Allow cross-origin requests from the frontend app
app.use(
  cors({
    origin: "http://localhost:3001",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

app.use(express.json());

// Create a connection to the database
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "MatKhauMoi123!",
  database: "iot_project", ///////////////chỉnh
  port: "3306",
});

// Format time from Date() to "YY:MM:DD hh:mm:ss"
function getFormattedTime() {
  const now = new Date();
  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}/${String(now.getDate()).padStart(2, "0")} ${String(
    now.getHours()
  ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(
    now.getSeconds()
  ).padStart(2, "0")}`;
}

client.on("connect", () => {
  client.subscribe(MQTT_TOPIC, (err) => {
    if (err) {
      console.log(err);
    }
  });
});

client.on("message", (topic, message) => {
  if (topic === MQTT_TOPIC) {
    let data;
    try {
      data = JSON.parse(message);
    } catch (error) {
      console.error("Failed to parse MQTT message as JSON:", error);
      return;
    }

    if (data.temperature !== undefined)
      data.temperature = parseFloat(data.temperature.toFixed(1));
    if (data.humidity !== undefined)
      data.humidity = parseFloat(data.humidity.toFixed(1));
    if (data.lux !== undefined) data.lux = parseFloat(data.lux.toFixed(1));

    data.date = getFormattedTime();

    const sql =
      "INSERT INTO data_sensor (temperature, humidity, lux, date, fan, light, ac) VALUES (?)";
    const values = [
      data.temperature,
      data.humidity,
      data.lux,
      data.date,
      data.fan,
      data.light,
      data.ac,
    ];

    db.query(sql, [values], (err) => {
      if (err) {
        console.error("Error inserting data into database:", err);
      } else {
        // console.log("Data inserted into database:", data);
      }
    });
  }
});

// Get status data from ESP32
app.get("/status", (req, res) => {
  db.query(
    "SELECT fan, light, ac, temperature, humidity, lux FROM data_sensor ORDER BY id DESC LIMIT 7;",
    (err, result) => {
      if (err) {
        console.error("Error executing SQL query:", err);
        return res.status(500).json({ error: "Error executing SQL query" });
      }

      const data = result.map((row) => {
        return {
          fan: row.fan,
          light: row.light,
          ac: row.ac,
          temperature: row.temperature,
          humidity: row.humidity,
          lux: row.lux,
        };
      });

      return res.json(data);
    }
  );
});

// Get data from the database for data sensor
app.get("/data_sensor", (req, res) => {
  const sql = "SELECT * FROM data_sensor ORDER BY id DESC";
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Error executing SQL query:", err);
      return res.status(500).json({ error: "Error executing SQL query" });
    }

    const data = result.map((row) => {
      const dateObj = new Date(row.date);
      const formattedDate = `${dateObj.getUTCFullYear()}-${String(
        dateObj.getUTCMonth() + 1
      ).padStart(2, "0")}-${String(dateObj.getUTCDate()).padStart(
        2,
        "0"
      )} ${String(dateObj.getUTCHours()).padStart(2, "0")}:${String(
        dateObj.getUTCMinutes()
      ).padStart(2, "0")}:${String(dateObj.getUTCSeconds()).padStart(2, "0")}`;

      return {
        id: row.id,
        temperature: row.temperature,
        humidity: row.humidity,
        lux: row.lux,
        date: formattedDate,
      };
    });

    return res.json(data);
  });
});

// Get data from the database for action history
app.get("/action_history", (req, res) => {
  const sql = "SELECT * FROM action_history ORDER BY id DESC";
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Error executing SQL query:", err);
      return res.status(500).json({ error: "Error executing SQL query" });
    }

    const data = result.map((row) => {
      const dateObj = new Date(row.date);
      const formattedDate = `${dateObj.getUTCFullYear()}-${String(
        dateObj.getUTCMonth() + 1
      ).padStart(2, "0")}-${String(dateObj.getUTCDate()).padStart(
        2,
        "0"
      )} ${String(dateObj.getUTCHours()).padStart(2, "0")}:${String(
        dateObj.getUTCMinutes()
      ).padStart(2, "0")}:${String(dateObj.getUTCSeconds()).padStart(2, "0")}`;

      return {
        id: row.id,
        device: row.device,
        action: row.action,
        date: formattedDate,
      };
    });

    return res.json(data);
  });
});

app.post("/actiondata", async (req, res) => {
  const { device, action } = req.body;

  try {
    await new Promise((resolve, reject) => {
      client.subscribe(MQTT_UPDATE, (err) => {
        if (err) {
          console.error("Failed to subscribe to MQTT topic:", err);
          return reject(new Error("Failed to subscribe to MQTT topic"));
        }
        resolve();
      });
    });

    client.publish(MQTT_REQUEST, JSON.stringify({ device, action }), (err) => {
      if (err) {
        console.error("Failed to send data to MQTT Broker:", err);
        return res
          .status(500)
          .json({ error: "Failed to send action data to MQTT" });
      }
      console.log(
        "Action data sent to MQTT:",
        JSON.stringify({ device, action })
      );
    });

    const timeout = setTimeout(() => {
      console.error("Timeout waiting for MQTT response");
      client.unsubscribe(MQTT_UPDATE);
      client.removeListener("message", handleMessage);
      return res
        .status(500)
        .json({ error: "Timeout waiting for MQTT response" });
    }, 10000); // 10 seconds timeout

    const handleMessage = (topic, message) => {
      if (topic === MQTT_UPDATE) {
        clearTimeout(timeout);
        client.unsubscribe(MQTT_UPDATE);
        client.removeListener("message", handleMessage);

        try {
          const data = JSON.parse(message);
          const { device: responseDevice, action: responseAction } = data;
          if (responseDevice === device && responseAction === action) {
            const dev =
              device === "light"
                ? "Đèn"
                : device === "fan"
                ? "Quạt"
                : "Điều hoà";
            const act = action === "on" ? "Bật" : "Tắt";
            const sql =
              "INSERT INTO action_history (device, action, date) VALUES (?)";
            const values = [dev, act, getFormattedTime()];

            db.query(sql, [values], (err) => {
              if (err) {
                console.error(
                  "Error inserting action history into database:",
                  err
                );
              } else {
                console.log("Action history inserted into database:", {
                  device,
                  action,
                });
              }
            });
            return res.json({ device: responseDevice, action: responseAction });
          }
        } catch (error) {
          console.error("Failed to parse MQTT response:", error);
          return res
            .status(500)
            .json({ error: "Failed to parse MQTT response" });
        }
      }
    };

    client.on("message", handleMessage);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// app.get("/sensor_search", (req, res) => {
//   const {
//     parameterFilter,
//     dateFilter,
//     searchTerm,
//     pageSize = 10,
//     currentPage = 1,
//   } = req.query;
//   console.log(req.query);

//   let query = "SELECT * FROM data_sensor";
//   if (searchTerm && searchTerm !== "undefined") {
//     if (parameterFilter) query += " WHERE ";
//     if (parameterFilter) {
//       if (parameterFilter === "temp")
//         query += `ROUND(temperature, 1) = ${searchTerm} `;
//       if (parameterFilter === "humidity") query += `humidity = ${searchTerm} `;
//       if (parameterFilter === "lux") query += `ROUND(lux, 1) = ${searchTerm} `;
//     } else {
//       query += ` WHERE (ROUND(temperature, 1) = ${searchTerm} OR humidity = ${searchTerm} OR ROUND(lux, 1) = ${searchTerm})`;
//     }
//   }

//   if ((dateFilter && searchTerm === "undefined") || (!searchTerm && dateFilter))
//     query += ` WHERE date >= '${dateFilter} 00:00:00' AND date <= '${dateFilter} 23:59:59'`;
//   else if (dateFilter && searchTerm) {
//     query += ` AND date >= '${dateFilter} 00:00:00' AND date <= '${dateFilter} 23:59:59'`;
//   }
//   query += " ORDER BY ID DESC ";

//   // Pagination logic
//   const limit = parseInt(pageSize);
//   const offset = (parseInt(currentPage) - 1) * limit;
//   query += ` LIMIT ${limit} OFFSET ${offset}`;

//   console.log(query);
//   // query db ;
//   db.query(query, (err, result) => {
//     if (err) {
//       console.error("Error executing SQL query:", err);
//       return res.status(500).json({ error: "Error executing SQL query" });
//     }

//     const totalRows = result.length;

//     const data = result.map((row) => {
//       const dateObj = new Date(row.date + "Z");
//       const formattedDate = `${dateObj.getUTCFullYear()}-${String(
//         dateObj.getUTCMonth() + 1
//       ).padStart(2, "0")}-${String(dateObj.getUTCDate()).padStart(
//         2,
//         "0"
//       )} ${String(dateObj.getUTCHours()).padStart(2, "0")}:${String(
//         dateObj.getUTCMinutes()
//       ).padStart(2, "0")}:${String(dateObj.getUTCSeconds()).padStart(2, "0")}`;
//       return {
//         id: row.id,
//         temperature: row.temperature,
//         humidity: row.humidity,
//         lux: row.lux,
//         date: formattedDate,
//       };
//     });
//     dataSensor = data;
//     return res.json({data, totalRows});
//   });
// });

const isDate = (searchTerm) => {
  // Regex to check if searchTerm is a date in the format YYYY-MM-DD or YYYY-MM-DD HH:MM:SS
  return /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/.test(searchTerm);
};

app.get("/sensor_search", (req, res) => {
  let {
    parameterFilter,
    dateFilter,
    searchTerm,
    pageSize = 10,
    currentPage = 1,
  } = req.query;

  console.log(req.query);

  let baseQuery = "SELECT * FROM data_sensor";
  let countQuery = "SELECT COUNT(*) AS total FROM data_sensor";
  let whereClause = "";

  const tmp = String(searchTerm || "").trim();

  // Search term logic
  if (tmp.length > 8) {
    if (isDate(tmp)) {
      whereClause += ` WHERE date LIKE '${tmp}%' `;
    } else if (parameterFilter) {
      whereClause += " WHERE ";
      if (parameterFilter === "temp") {
        whereClause += `ROUND(temperature, 1) = ${tmp} `;
      } else if (parameterFilter === "humidity") {
        whereClause += `humidity = ${tmp} `;
      } else if (parameterFilter === "lux") {
        whereClause += `ROUND(lux, 1) = ${tmp} `;
      }
    } else if (searchTerm !== "undefined" && searchTerm) {
      whereClause += ` WHERE (ROUND(temperature, 1) = ${tmp} OR humidity = ${tmp} OR ROUND(lux, 1) = ${tmp}) `;
    }
  }

  // Device filter logic, this would be similar to your history_search logic
  if (!tmp && parameterFilter) {
    whereClause += " WHERE ";
    if (parameterFilter === "temp") {
      whereClause += `ROUND(temperature, 1) = ${tmp} `;
    } else if (parameterFilter === "humidity") {
      whereClause += `humidity = ${tmp} `;
    } else if (parameterFilter === "lux") {
      whereClause += `ROUND(lux, 1) = ${tmp} `;
    }
  }

  // Date filter logic
  if (
    (dateFilter && !searchTerm && !parameterFilter) ||
    (!searchTerm && dateFilter && !parameterFilter)
  ) {
    whereClause += ` WHERE date >= '${dateFilter} 00:00:00' AND date <= '${dateFilter} 23:59:59'`;
  } else if (dateFilter && (searchTerm || parameterFilter)) {
    whereClause += ` AND date >= '${dateFilter} 00:00:00' AND date <= '${dateFilter} 23:59:59'`;
  }

  const limit = parseInt(pageSize);
  const offset = (parseInt(currentPage) - 1) * limit;

  // Add where clause to base and count queries
  countQuery += whereClause;
  baseQuery += whereClause + " ORDER BY ID DESC LIMIT ? OFFSET ?";

  console.log(countQuery);

  // Query for total records
  db.query(countQuery, (err, countResult) => {
    if (err) {
      console.error("Error executing count query:", err);
      return res.status(500).json({ error: "Error executing count query" });
    }

    const totalRows = countResult[0].total; // Assuming `total` is the first field
    console.log(baseQuery);

    // Query for paginated results
    db.query(baseQuery, [limit, offset], (err, result) => {
      if (err) {
        console.error("Error executing SQL query:", err);
        return res.status(500).json({ error: "Error executing SQL query" });
      }

      const data = result.map((row) => {
        const dateObj = new Date(row.date + "Z");
        const formattedDate = `${dateObj.getUTCFullYear()}-${String(
          dateObj.getUTCMonth() + 1
        ).padStart(2, "0")}-${String(dateObj.getUTCDate()).padStart(
          2,
          "0"
        )} ${String(dateObj.getUTCHours()).padStart(2, "0")}:${String(
          dateObj.getUTCMinutes()
        ).padStart(2, "0")}:${String(dateObj.getUTCSeconds()).padStart(
          2,
          "0"
        )}`;

        return {
          id: row.id,
          temperature: row.temperature,
          humidity: row.humidity,
          lux: row.lux,
          date: formattedDate,
        };
      });
      dataSensor = data;
      return res.json({ data, totalRows, pageSize });
    });
  });
});

app.get("/history_search", (req, res) => {
  const {
    deviceFilter,
    dateFilter,
    searchTerm,
    pageSize = 10,
    currentPage = 1,
  } = req.query;
  console.log(req.query);

  let baseQuery = "SELECT * FROM action_history";
  let countQuery = "SELECT COUNT(*) AS total FROM action_history";
  let whereClause = "";

  const tmp = String(searchTerm || "").trim();
  if (tmp.length > 8) {
    whereClause += ` WHERE Date LIKE '%${tmp}%' `;
    if (deviceFilter) {
      whereClause += `AND device = '${deviceFilter}'`;
    }
  } else {
    if (searchTerm && searchTerm !== "undefined") {
      if (deviceFilter) whereClause += " WHERE ";
      if (deviceFilter) {
        if (deviceFilter === "đèn") whereClause += `device = "Đèn" `;
        if (deviceFilter === "điều hoà") whereClause += `device = "Điều hoà" `;
        if (deviceFilter === "quạt") whereClause += `device = "Quạt" `;
        whereClause += `AND action = '${tmp}' `;
      }
    } else if (!searchTerm && deviceFilter) {
      whereClause += " WHERE ";
      if (deviceFilter === "đèn") whereClause += `device = "Đèn" `;
      if (deviceFilter === "điều hoà") whereClause += `device = "Điều hoà" `;
      if (deviceFilter === "quạt") whereClause += `device = "Quạt" `;
    }
  }

  if (
    (dateFilter && searchTerm === "undefined" && !deviceFilter) ||
    (!searchTerm && dateFilter && !deviceFilter)
  ) {
    whereClause += ` WHERE Date >= '${dateFilter} 00:00:00' AND Date <= '${dateFilter} 23:59:59'`;
  } else if ((dateFilter && searchTerm) || (dateFilter && deviceFilter)) {
    whereClause += ` AND Date >= '${dateFilter} 00:00:00' AND Date <= '${dateFilter} 23:59:59'`;
  }

  const limit = parseInt(pageSize);
  const offset = (parseInt(currentPage) - 1) * limit;

  // Add the where clause to both queries
  countQuery += whereClause;
  baseQuery += whereClause + " ORDER BY ID DESC LIMIT ? OFFSET ?";

  console.log(countQuery);

  // Query for total records
  db.query(countQuery, (err, countResult) => {
    if (err) {
      console.error("Error executing count query:", err);
      return res.status(500).json({ error: "Error executing count query" });
    }

    const totalRows = countResult[0].total; // Assuming `total` is the first field
    console.log(baseQuery);

    // Query for paginated results
    db.query(baseQuery, [limit, offset], (err, result) => {
      if (err) {
        console.error("Error executing SQL query:", err);
        return res.status(500).json({ error: "Error executing SQL query" });
      }

      const data = result.map((row) => {
        const dateObj = new Date(row.date + "Z");
        const formattedDate = `${dateObj.getUTCFullYear()}-${String(
          dateObj.getUTCMonth() + 1
        ).padStart(2, "0")}-${String(dateObj.getUTCDate()).padStart(
          2,
          "0"
        )} ${String(dateObj.getUTCHours()).padStart(2, "0")}:${String(
          dateObj.getUTCMinutes()
        ).padStart(2, "0")}:${String(dateObj.getUTCSeconds()).padStart(
          2,
          "0"
        )}`;

        return {
          id: row.id,
          device: row.device,
          action: row.action,
          date: formattedDate,
        };
      });
      actionHistory = data;
      return res.json({ data, totalRows, pageSize });
    });
  });
});

app.get("/sort_sensor", (req, res) => {
  const { column, sort } = req.query;
  console.log(req.query);
  if (!dataSensor.length) {
    res.status(400).json({ error: "No data to sort" });
  }

  const sortedData = dataSensor.sort((a, b) => {
    if (sort === "asc") {
      return a[column] > b[column] ? 1 : -1;
    } else {
      return a[column] < b[column] ? 1 : -1;
    }
  });
  res.json(sortedData);
});

app.get("/sort_history", (req, res) => {
  const { column, sort } = req.query;
  console.log(req.query);
  if (!actionHistory.length) {
    res.status(400).json({ error: "No data to sort" });
  }

  const sortedData = actionHistory.sort((a, b) => {
    if (sort === "asc") {
      return a[column] > b[column] ? 1 : -1;
    } else {
      return a[column] < b[column] ? 1 : -1;
    }
  });
  res.json(sortedData);
});

const swaggerDocument = YAML.load("./apidocs.yaml");
app.use("/api-docs", swagger.serve, swagger.setup(swaggerDocument));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
