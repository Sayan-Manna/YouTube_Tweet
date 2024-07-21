import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
//  middleware
app.use(
    cors({
        // add CORS_ORIGIN in env file => CORS_ORIGIN=* (from any place req is coming)
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);
/* Middleware to parse incoming requests.
 * We can get data from various sources:
 * - URL parameters
 * - JSON payloads in the body of the request
 * - Form data in the body of the request
 */
// To parse JSON requests with a limit of 16kb
app.use(express.json({ limit: "16kb" })); // accept json limit of 16kb
// To parse URL-encoded data with a limit of 16kb
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// To serve static files like images, CSS, and JavaScript from the 'public' directory
app.use(express.static("public"));
// To parse cookies from incoming requests
// Main mere server se user ki cookies access kar pau aur cookies set vi kar pau
// basically crud operations kar pau cookies pe.
app.use(cookieParser());

// routes
import userRouter from "./routes/user.routes.js";

// routes declaration
app.use("/api/v1/users", userRouter);

export { app };
