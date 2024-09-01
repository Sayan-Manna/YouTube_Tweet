import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // set refresh token to the user and save the refresh token in the db
        user.refreshToken = refreshToken;
        // Now we have saved only one field thus mongoose will give error as we have not saved the required password field etc, to avoid use make it false
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Token generation failed");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // **get user data from frontend -----------------------------
    // Ab data aayega req.body mein, url se bhi aa sakta hai as req param, cookies se bhi, form se bhi etc
    // extract the data then
    const { username, email, fullName, password } = req.body;
    // console.log("Username", username);

    // **validation server side - not empty etc -----------------------------
    // if (fullName === "" || username === "" || email === "" || password === "") {
    //     throw new ApiError(400, "Please fill all the fields");
    // }
    // // or using
    // if ([fullName, username, email, password].includes("")) {
    //     throw new ApiError(400, "Please fill all the fields");
    // }
    // or using .some
    if (
        [fullName, username, email, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // **check if user already exists - email or username -----------------------------
    // $or is used to check if any of the conditions are true
    // syntax: { $or: [{ <expression1> }, { <expression2> }, ... , { <expressionN> } ] }
    const existedUser = await User.findOne({ $or: [{ email }, { username }] });
    console.log(existedUser);
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }
    // **required files are there or not - avatar -> get the local path -----------------------------
    // console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path; // will throw error if not passed
    let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Please upload an avatar");
    }

    // **If available -> upload to cloudinary -> avatar checking in multer & cloudinary -> getting url from cloudinary -----------------------------

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    // **Create user object -> create entry in db -----------------------------
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullName,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    });
    // **remove password and refresh token field from response so that it is not sent to the user -----------------------------
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    // **check for user creation -----------------------------
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong :: User not created");
    }
    // **send response -----------------------------
    return res
        .status(201)
        .json(
            new ApiResponse(200, createdUser, "User registered successfully")
        );
});

const loginUser = asyncHandler(async (req, res) => {
    // ** get data from req body -----------------------------
    const { email, username, password } = req.body;
    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }
    // ** find username or email -----------------------------
    const user = await User.findOne({ $or: [{ email }, { username }] });
    // ** find the user -----------------------------
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    // ** password check -----------------------------
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid user credentials/unauthenticated");
    }
    // **access and refresh token generation and send back to user -----------------------------
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
        user._id
    );
    // ** send cookies to the user -----------------------------
    // remove password and refresh token from the response so that it is not sent to the user
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    const options = {
        // Because if these 2 options are not set then the cookie will not be modified/set in the browser/client
        httpOnly: true,
        secure: true, // only for https
    };
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    // you can send any data. Here if user want to save the token in the local storage -> not a good practice but if the user is using mobile app
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged in successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    // Why creating middleware for this?
    // because how to get the user??? In previous functions we are getting info from req.body but in logout obviously we'll not give form to user to logout
    // That's when we need middleware -> middleware: jaane se pehle milke jana
    // reset the refresh token in the db
    // Cookies cleared from the client side
    await User.findByIdAndUpdate(
        req.user._id,
        {
            // Unsetting the refresh token effectively invalidates the session, meaning the user would need to log in again to obtain a new session.
            $unset: {
                refreshToken: 1, // this removes the field from document
            },
        },
        // This option tells Mongoose to return the updated document after the update operation
        {
            new: true,
        }
    );
    // * or using findById ------|
    // Find the user by ID
    // const user = await User.findById(req.user._id);
    // if (!user) {
    //     throw new ApiError(404, "User not found");
    // }
    // // Unset the refreshToken field
    // user.refreshToken = undefined; // or `null` if you prefer, but `undefined` removes it from the document
    // // Save the updated user document
    // await user.save();

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    // get the refresh token from the cookies
    const incomingRefreshToken =
        req.cookies?.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }
    try {
        // verify the refresh token
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        // find the user by the id in the refresh token
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        // generate a new access token
        const options = {
            httpOnly: true,
            secure: true,
        };

        const { accessToken, newRefreshToken } =
            await generateAccessAndRefereshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});
// Change user's password
const changeCurrentPassword = asyncHandler(async (req, res) => {
    // obviously user should be logged in to change the password and he must put the old password before creating a new one
    const { oldPassword, newPassword } = req.body;
    const user = User.findById(req.user?._id);
    if (!user) {
        return ApiError(404, "User not found");
    }
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// Get the current user
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User found successfully")); // req.user is coming from the middleware so user has been injected in the request
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;
    if (!fullName || !email) {
        throw new ApiError(400, "Full name and email are required");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { fullName, email: email },
        },
        // The { new: true } option ensures that the function returns the updated user object after the update is applied.
        { new: true }
    ).select("-password"); // The select("-password") method is used to exclude the password field from the returned user object. This ensures that sensitive data (like the password) is not included in the response.

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account details updated successfully")
        );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.avatar[0]?.path;
    const user = req?.user;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar || !avatar.url) {
        throw new ApiError(400, "Error while uploading avatar");
    }
    // Delete old avatar from cloudinary
    if (user.avatarPublicId) {
        await deleteFromCloudinary(user.avatarPublicId);
    }
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { avatar: avatar.url, avatarPublicId: avatar.public_id },
        },
        { new: true }
    ).select("-password");
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { user: updatedUser },
                "Avatar updated successfully"
            )
        );
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    const user = req?.user;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar");
    }
    // delete old image - assignment
    if (user.coverImagePublicId) {
        await deleteFromCloudinary(user.coverImagePublicId);
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url,
                coverImagePublicId: coverImage.public_id,
            },
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { user: updatedUser },
                "Cover image updated successfully"
            )
        );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing");
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        // Now to get how many channels I have subscribed to
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber", // got from schema
                as: "subscribedTo",
            },
        },
        // Now to add these fields with additional fields
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo",
                },
                // subscribed or not button status
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"],
                        },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        // Now project selectd fields
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                createdAt: 1,
            },
        },
    ]);
    console.log("Channel : ", channel);
    if (!channel || channel.length === 0) {
        throw new ApiError(404, "Channel does not exist");
    }
    return res.status(200).json(
        new ApiResponse(
            200,
            channel[0], // because we are getting only one channel
            "user channel fetched successfully"
        )
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                // new mongoose.Types.ObjectId(req.user._id): This converts the user’s ID from the request (req.user._id) into a MongoDB ObjectId. In many cases, MongoDB IDs are stored as ObjectId types, so this conversion ensures the types match when performing the comparison.
                _id: new mongoose.Types.ObjectId(req.user._id), // converting string to object id
            },
        },
        {
            // Joins the videos collection with the watchHistory field, which holds video IDs.
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                // The pipeline option allows you to specify additional aggregation operations to perform on the joined collection.
                // Here, we're using the pipeline option to perform a lookup on the users collection to get the owner of the video.
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            // Here, we're using the pipeline option to project only the required fields from the owner document.
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    // The $addFields stage is used to add the owner field to the video document.
                    // The $first operator is used to get the first element from the owner array.
                    // This is necessary because the $lookup stage returns an array of documents.
                    // Since we're only interested in the first element, we use the $first operator to get it.
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            },
                        },
                    },
                ],
            },
        },
    ]);
    if (!user.length || !user[0].watchHistory.length) {
        return res
            .status(404)
            .json(new ApiResponse(404, [], "No watch history found"));
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch history fetched successfully"
            )
        );
});
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
};
