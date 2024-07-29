import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res, next) => {
    // **get user data from frontend -----------------------------
    // Ab data aayega req.body mein, url se bhi aa sakta hai as req param, cookies se bhi, form se bhi etc
    // extract the data then
    const { username, email, fullName, password } = req.body;
    console.log("Username", username);

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
    console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
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

export { registerUser };
