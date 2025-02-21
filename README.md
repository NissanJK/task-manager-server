# Task Manager Server  

A RESTful API built with **Node.js**, **Express**, and **MongoDB** for managing tasks efficiently.  

## Table of Contents  

- [Introduction](#introduction)  
- [Features](#features)  
- [Installation](#installation)  
- [Usage](#usage)  
- [Configuration](#configuration)  
- [API Endpoints](#api-endpoints)  
- [Dependencies](#dependencies)  
- [Troubleshooting](#troubleshooting)  
- [License](#license)  

## Introduction  

The **Task Manager Server** provides an API for managing tasks, allowing users to create, update, delete, and retrieve tasks. The system also supports user management, storing task order, and organizing tasks by status.  

## Features  

- User management via Firebase authentication (`uid`, `email`, `displayName`).  
- Task CRUD operations (Create, Read, Update, Delete).  
- Supports task ordering within statuses.  
- CORS support for secure cross-origin requests.  
- Uses **MongoDB** as the database with **Express.js** for routing.  
- Environment variable configuration using **dotenv**.  

## Installation  

### Prerequisites  

Ensure you have the following installed:  

- [Node.js](https://nodejs.org/)  
- [MongoDB](https://www.mongodb.com/) (local or cloud instance)  

### Steps  

1. **Clone the repository**  
   ```sh
   git clone https://github.com/your-username/task-manager-server.git
   cd task-manager-server
   ```

2. **Install dependencies**  
   ```sh
   npm install
   ```

3. **Set up environment variables**  
   Create a `.env` file in the project root and add the following:  
   ```env
   DB_USER=your-mongodb-username
   DB_PASS=your-mongodb-password
   PORT=5000
   ```

4. **Start the server**  
   ```sh
   npm start
   ```

## Usage  

Once the server is running, you can interact with it using **Postman**, **cURL**, or a frontend application.

## Configuration  

This project uses environment variables for sensitive data. Update the `.env` file with your MongoDB credentials and desired port number.

## API Endpoints  

### User Routes  

| Method | Endpoint          | Description |
|--------|------------------|-------------|
| POST   | `/api/users`      | Create or update a user (`uid`, `email`, `displayName`). |
| GET    | `/api/users/:uid` | Retrieve user details by `uid`. |

### Task Routes  

| Method | Endpoint                  | Description |
|--------|--------------------------|-------------|
| POST   | `/api/tasks`              | Create a new task (`title`, `description`, `status`, `userId`). |
| GET    | `/api/tasks?userId=...`   | Retrieve all tasks for a specific user. |
| PUT    | `/api/tasks/:id`          | Update a task (`title`, `description`, `status`). |
| PATCH  | `/api/tasks/:id/status`   | Update task status and order. |
| DELETE | `/api/tasks/:id`          | Delete a task by ID. |

## Dependencies  

The project relies on the following packages:

| Package  | Version  | Description |
|----------|---------|-------------|
| express  | ^4.21.2 | Web framework for Node.js |
| mongodb  | ^6.13.0 | MongoDB driver for Node.js |
| cors     | ^2.8.5  | Enable CORS support |
| dotenv   | ^16.4.7 | Manage environment variables |

## Troubleshooting  

- **MongoDB connection issues:** Ensure your MongoDB credentials in `.env` are correct.  
- **CORS issues:** Ensure the frontend has proper CORS configuration.  
- **Port conflicts:** Change the `PORT` value in `.env` if needed.  
