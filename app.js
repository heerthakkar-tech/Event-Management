require("dotenv").config();
const express = require("express");
const pg = require("pg");
const cors = require("cors");
const helmet = require("helmet"); // secure your app by setting various HTTP headers.

const sequelize = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const registrationRoutes = require("./routes/registrationRoute");
const { restoreScheduledEvents } = require("./services/eventScheduler");

const app = express();
const PORT = process.env.PORT;

app.use(helmet());
app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/events", registrationRoutes);

app.get("/", (req, res) => {
  res.send("Hello i am root");
});

app.use((err, req, res, next) => {
  // console.error("ERROR DETAILS:", err);
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "Internal server error" : err.message,
  });
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("connection to postgresql establish successfully.");

    await restoreScheduledEvents();

    // start the express server
    app.listen(PORT, () => {
      console.log(` Server is running on port http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

startServer();
