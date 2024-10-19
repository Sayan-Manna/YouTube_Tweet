import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// This will verify the user's token and check if the user is authenticated or not
export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        // req has access to cookies due to cookie-parser middleware
        // Now if the user is on mobile app then the token will be sent in the headers so we are checking both and that's why we are using the optional(?) here
        const token =
            req.cookies?.accessToken ||
            req.headers("Authorization").replace("Bearer ", ""); // Authorization: Bearer <token> -> as we only need the value of the token to extract
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }
        // verify the token using jwt
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // Exclude the password and refreshToken fields from the returned user object, as these are sensitive and not needed in this context.
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        ); // we have added _id as key in user model with value _id, here we are putting the key
        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }
        // If the user is found, it is assigned to req.user, making the user data available in subsequent middleware or route handlers.
        req.user = user;
        // Passes control to the next middleware or route handler.
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
});
