console.log("Messages:");
console.log("0 - No problems");
console.log("1 - Could not receive URL or URL is blank");
console.log("2 - URL not valid");

const express = require("express");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static("public"));
app.use(express.json());

// MongoDB setup
const client = new MongoClient(process.env.CONNECTIONSTRING);
let db;

async function connectDB() {
    await client.connect();
    db = client.db("urlDataDb");
    console.log("MongoDB connection success");
}

// Start server ONLY after DB connects
async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error("MongoDB connection failed:", err);
        process.exit(1);
    }
}

// Rate limiter (to prevent spam)
app.set("trust proxy", 1);
const createLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1h
    max: 10, // Max 10 req per window
    message: {
        message: "You've reached the limit. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});

startServer();

// Routes
// Create new short URL
app.post("/new", createLimiter, async (req, res) => {
    if (!db) {
        return res.status(500).json({ message: 1 });
    }

    let { url } = req.body;
    url = url.trim();
    console.log(`URL entered: ${url}`);

    if(!url) {
        console.log(1);
        return res.json({ message: 1 });
    }
    if(!(await isValidUrl(url))){
        console.log(2);
        return res.json({ message: 2 })
    }

    const collection = db.collection("urlData");
    let randomIdValid = false;
    let randomId;
    while(!randomIdValid){
        randomId = Math.random().toString(36).slice(2, 8);

        const response = await collection.findOne({
            _id: randomId
        });
        if(!response){
            randomIdValid = true;
        }
    }

    await collection.insertOne({
        _id: randomId,
        url: url,
        time: getFormattedDate(),
        clicks: 0,
        ip: req.ip
    });

    console.log(0);
    return res.json({
        message: 0,
        id: randomId
    });
});

app.post("/check", async (req, res) => {
    if (!db) {
        return res.status(500).json({ message: 1 });
    }

    let { url } = req.body;
    url = url.trim();
    console.log(`URL entered: ${url}`);

    if(!url) {
        console.log(1);
        return res.json({ message: 1 });
    }
    if(url.length !== 6){
        console.log(2);
        return res.json({ message: 2 });
    }

    const collection = db.collection("urlData");

    const response = await collection.findOne({
        _id: url
    });
    if(response){
        console.log(0)
        return res.json({
            message: 0,
            shortened: response._id,
            original: response.url
        })
    }
    else{
        console.log(1);
        return res.json({ message: 1 });
    }

});

// Redirect
app.get("/dir/:id", async (req, res) => {
    if (!db) {
        return res.status(500).send("Database unavailable");
    }

    const collection = db.collection("urlData");
    const id = req.params.id;

    const urlDoc = await collection.findOne({ _id: id });

    if (!urlDoc) {
        return res.status(404).send("ERROR 404: Link not found.");
    }

    await collection.updateOne(
        { _id: id },
        { $inc: { clicks: 1 } }
    );

    res.redirect(urlDoc.url);
});

// Functions
// Check if can access URL
function isValidUrl(url) {
    try {
        const u = new URL(url);

        // Allow only http/https
        if (!["http:", "https:"].includes(u.protocol)) return false;

        // Block local/private IPs (for privacy)
        const host = u.hostname;
        if (
            host === "localhost" ||
            host === "127.0.0.1" ||
            host.startsWith("192.168.") ||
            host.startsWith("10.") ||
            host.startsWith("172.")
        ) return false;

        return true;
    } catch {
        return false;
    }
}

function getFormattedDate() {
    const now = new Date();

    const day = String(now.getUTCDate()).padStart(2, "0");
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const year = now.getUTCFullYear();
    const hour = now.getHours();
    const minute = now.getMinutes();

    return `${day}/${month}/${year} ${hour}:${minute}`;
}
