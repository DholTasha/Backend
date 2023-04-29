require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const customerRouter = require("./routes/customerRoute");
const pathakRouter = require("./routes/pathakRoute");
const eventRouter = require("./routes/eventRoute");
const cors = require("cors");
const app = express();

const port = process.env.PORT;

// built-in middlewares
app.use(cors({origin: "http://localhost:3000", credentials: true,}));
app.use(express.json());
// app.use(cookieParser());

mongoose
    .connect(process.env.MONGODB_URL, { useNewUrlParser: true })
    .then((result) => {app.listen(port, () => {console.log("Connected to db and Server is up on the port : " + port);});})
    .catch((err) => {console.log(err);});

app.use(customerRouter);
app.use(pathakRouter);
app.use(eventRouter);