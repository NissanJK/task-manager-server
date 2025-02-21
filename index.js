const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rw4nz.mongodb.net/taskManager?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

let db, tasksCollection, usersCollection;

async function connectDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        db = client.db("taskManager");
        tasksCollection = db.collection("tasks");
        usersCollection = db.collection("users");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error);
        process.exit(1);
    }
}

// User Routes
app.post("/api/users", async (req, res) => {
    try {
        const { uid, email, displayName } = req.body;
        if (!uid || !email) return res.status(400).json({ error: "Missing user details" });

        const existingUser = await usersCollection.findOne({ uid });
        if (!existingUser) await usersCollection.insertOne({ uid, email, displayName });

        res.status(200).json({ message: "User saved successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to save user" });
    }
});

app.get("/api/users/:uid", async (req, res) => {
    try {
        const { uid } = req.params;
        const user = await usersCollection.findOne({ uid });
        if (!user) return res.status(404).json({ error: "User not found" });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

// Task Routes
app.post("/api/tasks", async (req, res) => {
    try {
        const { title, description, status, userId } = req.body;
        if (!title || !status || !userId) return res.status(400).json({ error: "Missing task details" });

        const lastTask = await tasksCollection
            .find({ userId, status })
            .sort({ order: -1 })
            .limit(1)
            .toArray();

        const order = lastTask.length > 0 ? lastTask[0].order + 1 : 0;

        const task = {
            title,
            description: description || "", 
            status,
            userId,
            order, 
            timestamp: new Date().toISOString(),
        };

        const result = await tasksCollection.insertOne(task);
        res.status(201).json({ message: "Task added successfully", taskId: result.insertedId });
    } catch (error) {
        res.status(500).json({ error: "Failed to add task" });
    }
});

app.get("/api/tasks", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "User ID is required" });

        const tasks = await tasksCollection.find({ userId }).sort({ order: 1 }).toArray();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch tasks" });
    }
});

app.put("/api/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status } = req.body;
        if (!title || !status) return res.status(400).json({ error: "Title and Status are required" });

        const result = await tasksCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { title, description, status } }
        );

        if (result.modifiedCount === 0) return res.status(404).json({ error: "Task not found or no changes detected" });

        const updatedTask = await tasksCollection.findOne({ _id: new ObjectId(id) });
        res.json({ message: "Task updated successfully", updatedTask });
    } catch (error) {
        res.status(500).json({ error: "Failed to update task" });
    }
});

app.patch("/api/tasks/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, order } = req.body;

        // Validate required fields
        if (!status || order === undefined) {
            return res.status(400).json({ error: "Status and Order are required" });
        }

        // Validate task ID format
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid task ID" });
        }

        // Update the task's status and order in the database
        const result = await tasksCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { status, order } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        // Fetch the updated task
        const updatedTask = await tasksCollection.findOne({ _id: new ObjectId(id) });
        res.json({ message: "Task status and order updated successfully", updatedTask });
    } catch (error) {
        console.error("Error updating task status and order:", error);
        res.status(500).json({ error: "Failed to update task status and order" });
    }
});

app.delete("/api/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).json({ error: "Task not found" });

        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete task" });
    }
});

// Server Running Check
app.get("/", (req, res) => {
    res.send("TaskManager API is running!");
});

// Start the server AFTER connecting to MongoDB
connectDB().then(() => {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
});