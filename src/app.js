const express = require("express");
const DBController = require("./db/mongoose");
const path = require("path"); //to show upload folder
const cors = require("cors");
const cron = require("node-cron");
const env = require("dotenv");
const Util = require("./utils/util");
const CronController = require("./schedulers/CronController");
const adminRoutes = require("./routes/adminRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const agentRoutes = require("./routes/agentRoutes");
const buyerRoutes = require("./routes/buyerRoutes");
const defaultRoutes = require("./routes/defaultRoutes");

const app = express();
app.use(cors());

env.config({
    path : "./config/dev.env"
})

app.use(express.json());
app.use(express.urlencoded({extended: true, limit: "5gb", parameterLimit: 50000})); // To parse application/json
app.use(
    express.json({
        limit: "5gb",
    })
); // To parse application/x-www-form-urlencoded

app.use(adminRoutes);
app.use(sellerRoutes);
app.use(agentRoutes);
app.use(buyerRoutes);
app.use(defaultRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../uploads"))); //to show image
app.use("/static_files", express.static(path.join(__dirname, "../static_files")))

app.get("/", (req, res) => {
    res.sendStatus(200);
});

DBController.initConnection(async () => {
    const httpServer = require("http").createServer(app);
    httpServer.listen(process.env.PORT, async function() {
        console.log("Server is running on", Util.getBaseURL());

        //This is used to find app usage time of every users
        cron.schedule(
            "0 12 * * *",   //daily check at 11:00 AM
            // "* * * * *",
            async () => {
                console.log("here")
                await CronController.bookingStatusPending();
                await CronController.inquiryReplyPending()
            }
        )
    })
})

