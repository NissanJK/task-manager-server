const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://task-manager-a8537.web.app",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    },
});

const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rw4nz.mongodb.net/taskManager?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

let db, tasksCollection, usersCollection;

// Connect to MongoDB
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

// WebSocket Handling
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("getTasks", async (userId) => {
        const tasks = await tasksCollection.find({ userId }).toArray();
        socket.emit("tasks", tasks);
    });

    socket.on("addTask", async (task) => {
        const newTask = { ...task, _id: new ObjectId() };
        await tasksCollection.insertOne(newTask);
        io.emit("taskAdded", newTask);
    });

    socket.on("updateTask", async (updatedTask) => {
        const { _id, ...rest } = updatedTask;
        await tasksCollection.updateOne({ _id: new ObjectId(_id) }, { $set: rest });
        io.emit("taskUpdated", updatedTask);
    });

    socket.on("updateTaskStatus", async ({ _id, status }) => {
        try {
            await tasksCollection.updateOne(
                { _id: new ObjectId(_id) },
                { $set: { status } }
            );
    
            // Fetch the updated task list from the database
            const updatedTasks = await tasksCollection.find({}).toArray();
    
            // Emit the full updated task list to all clients
            io.emit("tasks", updatedTasks);
        } catch (error) {
            console.error("Error updating task status:", error);
        }
    });

    socket.on("deleteTask", async (taskId) => {
        await tasksCollection.deleteOne({ _id: new ObjectId(taskId) });
        io.emit("taskDeleted", taskId);
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected:", socket.id);
    });
});

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
        const { title, status, userId } = req.body;
        if (!title || !status || !userId) return res.status(400).json({ error: "Missing task details" });

        const result = await tasksCollection.insertOne({ title, status, userId });
        io.emit("taskAdded", { _id: result.insertedId, title, status, userId });

        res.status(201).json({ message: "Task added successfully", taskId: result.insertedId });
    } catch (error) {
        res.status(500).json({ error: "Failed to add task" });
    }
});

app.get("/api/tasks", async (req, res) => {
    try {
        const tasks = await tasksCollection.find().toArray();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch tasks" });
    }
});

app.put("/api/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { title, status } = req.body;
        if (!title || !status) return res.status(400).json({ error: "Title and Status are required" });

        const result = await tasksCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { title, status } }
        );

        if (result.modifiedCount === 0) return res.status(404).json({ error: "Task not found or no changes detected" });

        io.emit("taskUpdated", { _id: id, title, status });

        res.json({ message: "Task updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update task" });
    }
});

app.delete("/api/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).json({ error: "Task not found" });

        io.emit("taskDeleted", id);
        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete task" });
    }
});

// Server Running Check
app.get("/", (req, res) => {
    res.send("TaskManager API is running with WebSockets!");
});

// Start the server AFTER connecting to MongoDB
connectDB().then(() => {
    server.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
});
