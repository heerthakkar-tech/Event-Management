require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet"); // secure your app by setting various HTTP headers.

const sequelize = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const registrationRoutes = require("./routes/registrationRoute");
const { restoreScheduledEvents } = require("./services/eventScheduler");
const errorHandler = require("./middlewares/errorHandler");

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

app.use(errorHandler);

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
