# First Setup

-   `npm init` => write your start script `"start": node index.js`
-   Install Express and use it

```js
// index.js
const express  = require('express') // common js
const app = express();
const port = 4000;

app.get("/", (req, res)=> {
	res.send('get req in / route <h1>Bold</h1>**s**') 🔑
})
...
app.listen(port, ()=> {
	console.log(`Listening on port ${port}`);
})
```

-   Now if you do some modifications or create another route, we have to restart our server or we have to install `nodemon`
-   Now in server there might be a case when 4000 port is running by other application, in these cases we need to set env variables for port.
-   Install `npm i dotenv`
-   Create .env file
    ```env
    # .env
    PORT=3000
    ```
    ```js
    // index.js
    require('dotenv').config()
    ...
    const port = 4000 || process.env.PORT 🔑
    ```
-   To send json data `res.json({...})`
-   To use `module js` we need to change the code in `package.json`
    ```json
    "type":"module"
    ```
-   Now we can use `import express from 'express';`

---

# Connect with Front-End

-   Create your backend and serve a json array to jokes(array of objects)
-   In the front-end folder do few steps

```jsx
// App.jsx
import axios from "axios";
function App() {
    const [jokes, setJokes] = useState([]);
    const getJokes = async () => {
        try {
            const res = await axios.get("localhost:3000/api/jokes");
            setJokes(res.data);
        } catch (error) {
            console.log(error);
        }
    };
    useEffect(() => {
        getJokes();
    });

    return (
        <>
            {jokes.map((joke) => (
                <div key={joke.id}>
                    <h3>{joke.title}</h3>
                    <p>{joke.content}</p>
                </div>
            ))}
        </>
    );
}
```

-   Now this will result in CORS error
-   We can fix via `npm i cors` and codes also, but we'll use proxy here
-   Now in the url I have set the full url which doesn't make any sense. If our app is deployed the url will be changed we need proxy

    ```js
    // vite.config.js 🔑
    ...
    export default defineConfig({
    	server: {
    		proxy: {
    			// when user requests for /api/... this url will be appended and the whitelisting will be done
    			// basically server will think the req comming from same server so it'll not block
    			// change the url in case of production
    			'/api':'http://localhost:3000' 🔑
    		}
    	},
    })

    ```

---

# Data Modelling with Mongoose

-   **Prisma vs Mongoose**
    -   **Prisma** => ORM => SQL DB, => If you need strong type safety => good choice for GraphQL and REST APIs
    -   **Mongoose** => ODM => For NoSQL where flexible and dynamic schema design is needed. => Ideal for CMS, real-time analytics etc
-   `npm i mongoose`

### User based ToDo App Modelling

-   Create a folder `models/todos` -> Inside that create files `user.models.js`, `todo.models.js`, `sub-todo.models.js`
-   `user.model.js`

```js
// user.model.js
import mongoose from 'mongoose'
// Creating schema for our DB
const UserSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true,
		lowercase: true
	},
	email: {
		...
	},
	password: {
		type: String,
		required: true,
		min: [4, 'Must be 4 digits long, got {VALUE}'], 🔑
		max: 5
	}
}, {timestamps: true}) // createdAt, updatedAt 🔑
// In DB the table name will be users instead of User
export const User = mongoose.model("User", userSchema) 🔑


```

---

```js
// todo.models.js
import mongoose from 'mongoose'
const todoSchema = mongoose.Schema({
	content: {
		type: String,
		required: true,
	},
	complete: {
		type: Boolean,
		default: false
	},
	createdBy: {
		// ref of other model (User) will be here inside this object, hence type
		// and ref must be there
		// ref: keyword defined inside the model when defining Schema 🔑
		type: mongoose.Schema.Types.ObjectId, 🔑
		ref: "User" 🔑
	},
	// Array of sub-todos 🔑
	subTodos: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "SubTodo"
		}
	]
}, {timestamps: true})
export const Todo = mongoose.model("Todo", todoSchema)
```

---

```js
// sub_todo.models.js
import mongoose from 'mongoose'
const subTodoSchema = mongoose.Schema({
	content: {...},
	complete: {...},
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	}
}, {timestamps: true})
export const SubTodo = mongoose.model("SubTodo", todoSchema)
```

---

-   Some other types

```js
price: {
	type: Number,
	default: 0
},
orderItems: {
	// Think about a case where we have Product schema but I want to find products with their quantities
	type: [orderItemSchema] // this is a different schema, on same file or in different file
},
status: {
	type: String,
	enum: ["PENDING","CANCELED","DELIVERED"]
	default: "PENDING"
}
```

---

# Setup Professional Backend Project

-   Initial Folder Structure and few initial dev dependencies(nodemon, prettier) are needed
-   `src/controllers`, `src/models`,`src/utils`, `sc/middlewares`, `src/db`,`src/routes`, index.js, constants.js, app.js

---

# Connect DB with MERN

-   Create Cluster and configure your DB. Allow every one to access using 0.0.0.0/0 IP
-   Now we need to create few files to store our env and other configs for db connection -> `.env`, `src/constants.js`
-   Install `npm i dotenv`. Inside the env file put the port and db url from the mongo db cluster
-   In `constants` we put the `db_name`, it could be put in the .env as well but it isn't system specific and not that sensitive so put it in constants.
-   Now there are basically 2 approaches to connect our app with DB

    -   **Using `index.js`** : As we are executing `src/index.js` from `nodemon`, we'll write the logic for DB connection there and it'll be executed at the very beginning.

        ```js
        // src/index.js
        import mongoose from "mongoose";
        // a lot of time we'll have errors with imports so import the full syntax
        import { DB_NAME } from "./constants.js";
        import express from "express";
        const app = express();
        // Always async/await and try/catch while establishing db connection
        (async () => {
            try {
                // we could store it as well, mongoDB returns an object when connecting
                await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
                // if error in express when connecting with db, we also want to listen it
                app.on("error", (error) => {
                    console.log("ERRR: ", error);
                    throw error;
                });
                app.listen(process.env.PORT, () => {
                    console.log(
                        `Server is running on port ${process.env.PORT}`
                    );
                });
            } catch (error) {
                console.log("ERROR: ", error);
                throw error;
            }
        })();
        ```

    -   **Creating a db folder** : Create a db folder and write the logics there then import it on index file and execute.

        ```js
        // src/db/index.js
        import mongoose from "mongoose";
        // full syntax to prevent error
        import { DB_NAME } from "../constants.js";

        const connectDB = async () => {
            try {
                const connectionInstance = await mongoose.connect(
                    `${process.env.MONGODB_URI}/${DB_NAME}`
                );
                // As we know there are different db servers say dev. prod, test etc. So to know the host name
                console.log(
                    `MongoDB Connected !! DB Host: ${connectionInstance.connection.host}`
                );
            } catch (error) {
                console.log("MONGODB Connection Error: ", error);
                // throw also exits the code, this also does.
                // process is given to us by node, now there are different codes exit(1), exit(0) etc
                process.exit(1);
            }
        };
        export default connectDB;
        ```

        ```js
        // src/index.js
        // require('dotenv').config({path: './.env'})
        //  we have to configure our package.json to load env as well
        import dotenv from "dotenv";
        import connectDB from "./db/index.js";
        // env var location
        dotenv.config({
            path: "./.env",
        });

        // Connect to MongoDB
        connectDB();
        ```

        ```.env
        PORT=4000
        MONGODB_URI=mongodb+srv://.....
        ```

---

# Setup middleware, Custom API response and Exception Handling

-   In `app.js` we'll write express codes here

    ```js
    // src/app.js
    import express from "express";

    const app = express();

    export { app };
    ```

-   Now we know when an `async` method is completed, it returns a promise as well. So in our `index.js` we'll modify the code
    ```js
    // index.js
    import {app} from "./app.js"
    ...
    ...
    // Connect to MongoDB
    connectDB()
    .then(()=>{
      app.on("error", (error) => {
        console.log("ERRR: ", error);
        throw error;
      })
      app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
      })
    })
    .catch((error) => {
      console.log("MongoDB Connection Failed : ", error);
    })
    ```
-   Visit Express API Ref page. There you'll find Application, Request, Response, Router etc. Majorly we focus on Request and Response
-   Now in request we have a lot of properties to choose like- `req.body`, `req.cookie`,`req.fresh`,`req.host`,`req.hostname`,`req.ip`,`req.method`,`req.param`,`req.path`,`req.protocol`,`req.baseUrl`,`req.query` etc.
-   Install required packages - `cookie-parser`,`cors`

    -   “parse” means to read, interpret, and convert incoming data into a format that the application can work with. Specifically, it refers to the process of analysing the structure of the incoming data (such as JSON, URL-encoded data, or cookies) and transforming it into a JavaScript object or other data structures that the Express application can easily manipulate and use.

    ```js
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

    export { app };
    ```

-   **Middleware** :
-   If we are requesting a route /about, first the checking will be if I am logged in or not, these chekings are done by middlewares. There can be multiple middlewares. Now it has flags named `next`. It simply refers that one middleware's job is done, go to next middleware if any, if there isn't any then it will be discarded and we'll get the response. Generally we get 4 params in any request `error`,`req`,`res`,`next`
-   Create an `utils/asyncHandler.js`

        ```js
        // src/utils/asyncHanfler.js
        // Using Promise
        const asyncHandler = (requestHandler) => {
            return (req, res, next) => {
                Promise.resolve(requestHandler(req, res, next)).catch((error) =>
                    next(error) // next(error)) will pass the error to the Express error-handling middleware, which means it won’t handle the error directly but instead let another piece of middleware handle it
                );
            };
        };
        // or
        const asyncHandler = (requestHandler) => {

        return (req, res, next) => {
                Promise.resolve(requestHandler(req, res, next))
                    .catch((error) => {
                        res.status(error.code || 500).json({
                            success: false,
                            message: error.message || "Something went wrong",
                        });
                    });
            };

            // Using async/await
            // asyncHandler is a higher order function so it can accept a function as an argument and return a new function.
            // const asyncHandler = (fn) => {
            //     return async (req,res,next) => {
            //       try {
            //         await fn(req, res, next);
            //       } catch (error) {
            //           res.status(error.code || 500).json({
            //             success: false,
            //             message: error.message || "Something went wrong",
            //           });
            //       }
            //     }
            // };
            })
            export { asyncHandler };

        ```

-   Now we want to optimise the responses when error occurs, because later we might get confuse if we want to show the message first or the status code etc.

```js
// src/utils/ApiError.js
class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        errorStack = ""
    ) {
        // to override, we use super, now message has been passed, so it'll be overridden definitely
        super(message); // must call super of the main class(Error)
        this.statusCode = statusCode;
        this.data = null; // typically, an error response might not have associated “data” in the same way that a successful response might
        this.message = message;
        this.success = false;
        this.errors = errors;

        if (errorStack) {
            this.stack = errorStack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
export { ApiError };
```

```js
//src/utils/ApiResponse.js
class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode;
        this.data = data; // containing the result of a successful API operation.
        this.message = message;
        this.success = statusCode < 400; // boolean :: as codes in the 2xx and 3xx range generally indicate success
    }
}
export { ApiResponse };

/* For Example

const successResponse = new ApiResponse(200, { id: 1, name: "John Doe" }, "User fetched successfully");
console.log(successResponse);

// Output:
// {
//   statusCode: 200,
//   data: { id: 1, name: "John Doe" },
//   message: "User fetched successfully",
//   success: true
// }
*/
```

---

# User and video model with hooks and JWT

-   Now let's create our user and video mongoose models.
    ![db_schema](https://i.imgur.com/89XnpHf.png)
-   `user.model.js`

    ```js
    import mongoose, { Schema } from "mongoose";
    import jwt from "jsonwebtoken"; // install jwt
    import bcrypt from "bcryptjs";  // install bcryptjs for hashing password etc

    const userSchema = new Schema(
        {
            username: {
                ...
                trim: true,
                index: true, // for faster search
            },
            ...
            avatar: {
                type: String, // cloudinary url
                required: true,
            },
            coverImage: {
                type: String, // cloudinary url
            },
            watchHistory: [
                // mini schema
                // watchHistroy stores an array of type Video
                {
                    type: Schema.Types.ObjectId,
                    ref: "Video",
                },
            ],
            password: {
                type: String,
                required: [true, "Password is required"],
            },
            // we only stores refresh token inside db, not access token
            refreshToken: {
                type: String,
            },
        },
        {
            timestamps: true,
        }
    );
    // Before saving to db, mongoose allows us to do something using the pre-save hook, which is a middleware function
    // we want to hash our password and store the hashed one in db
    // as cryptography it might take time so async in nature
    // Now Arrow function doesn't have context but in this case we want to refer the schema document, so we are taking a regular function.
    // next is a callback function that you call when the middleware has finished its work.
    // If you don’t call next(), the middleware chain will be broken, and the save operation will not proceed.
    // It signals Mongoose to move to the next middleware function in the chain or to proceed with saving the document.
    // next() is called to ensure the middleware does not block the save operation.
    userSchema.pre("save", async function (next) {
    	// isModified is a method of the Mongoose document instance, so this.isModified
        if (!this.isModified("password")) return next();

        this.password = await bcrypt.hash(this.password, 10);
        next();
    });

    userSchema.methods.isPasswordCorrect = async function (password) {
    	// this.password accesses the password field of the document, which contains the hashed password. with the input password
        return await bcrypt.compare(password, this.password);
    };

    export const User = mongoose.model("User", userSchema);

    ```

-   `video.model.js`

    ```js
    import mongoose, { Schema } from "mongoose";
    import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

    const videoSchema = new Schema(
        {
            videoFile: {
                type: String, //cloudinary url
                required: true,
            },
            thumbnail: {
                type: String, //cloudinary url
                required: true,
            },
            ...
            duration: {
                type: Number,
                required: true,
            },
            views: {
                type: Number,
                default: 0,
            },
            isPublished: {
                type: Boolean,
                default: true,
            },
            owner: {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        },
        {
            timestamps: true,
        }
    );

    videoSchema.plugin(mongooseAggregatePaginate); // so that the schema can use mongoose aggregation framework

    export const Video = mongoose.model("Video", videoSchema);

    ```

-   JWT Access Token and Refresh Token
    -   inside `.env`
        ```.env
        ACCESS_TOKEN_SECRET=some_text
        ACCESS_TOKEN_EXPIRY=1d
        REFRESH_TOKEN_SECRET=some___text
        REFRESH_TOKEN_EXPIRY=10d
        ```
    -   Now in `user.model.js`
        ```js
        ...
        // you can write the function async as well, but happens very fast so no need
        // Access tokens are typically short-lived and used to authenticate requests to protected resources.
        userSchema.methods.generateAccessToken = function () {
            return jwt.sign(
        	    // payload
                {
                    _id: this._id, // unique id generated by mongoDB for each document
                    // we could only store id and then get the rest items by querying in db but here we are providing some more payloads
                    email: this.email,
                    username: this.username,
                    fullName: this.fullName,
                },
                process.env.ACCESS_TOKEN_SECRET,
                {
                    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
                }
            );
        };
        // This method generates a refresh token containing the user’s ID
        // Refresh tokens are typically long-lived and used to obtain new access tokens without requiring the user to re-authenticate.
        userSchema.methods.generateRefreshToken = function () {
            return jwt.sign(
                {
                    _id: this._id,
                },
                process.env.REFRESH_TOKEN_SECRET,
                {
                    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
                }
            );
        };
        ...
        ```

---

# Upload file using Multer + Cloudinary

-   Set up Cloudinary service. Store the credentials in env
-   We'll be using `multer` or `express-fileupload` as a middleware.
-   File gets uploaded through multer to cloudinary
-   **Strategy**:
    1.  User file -> store in local server temporarily -> Take file from cloudinary through multer -> store it in server
    2.  User file -> multer sends file to cloudinary -> store it in server
        We'll be using the 1st technique because user gets a chance to reupload their file if needed.
-   Create `utils/cloudinary.js`

    -   We'll get the files through filesystem. That means files are already uploaded to local server. -> So we'll take the local path from the server -> send the file from the path to cloudinary
    -   Now if file is uploaded successfully, our server doesn't need the file anymore so remove it from the local server.

    ```js
    import { v2 as cloudinary } from "cloudinary";
    import fs from "fs"; // Node.js file system module -> helps in R,W,Remove etc on file
    import { request } from "http";

    // Configuration
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const uploadOnCloudinary = async (localFilePath) => {
        try {
            if (!localFilePath) {
                return null;
                throw new Error("Local file path is required");
            }
            const response = await cloudinary.uploader.upload(localFilePath, {
                resource_type: "auto", // Automatically determine the type of file
            });
            console.log("Upload successful: ", response.url);
            fs.unlinkSync(localFilePath);
            return response;
        } catch (error) {
            // when you remove a file, it basically unlinks from the file system - os concept
            // At this stage, file is there in my server but maybe it is not uploaded to cloudinary
            // so to cleanup -> remove local file from my server 1st
            // unlinksync -> do the unlinking in synchronous process -> we'll move forward only when it is unlinked
            fs.unlinkSync(localFilePath); // remove the locally saved temp file as the upload operation filed
            return null;
        }
    };

    export { uploadOnCloudinary };
    ```

-   Create the multer middleware
-   It's a middleware for handling `multipart/form-data`, which is primarily used for uploading `files`. This configuration specifies how and where the uploaded files should be stored

    ```js
    // middleware/multer.middleware.js
    import multer from "multer";
    // we'll be using diskstorage as memorystorage is risky and might cause problems
    // This function creates a storage engine for multer that allows you to control where and how the files are stored.
    // It is essentially like this var = multer.diskStorage({key:value})
    const storage = multer.diskStorage({
        // A function that specifies the folder where the uploaded files should be stored.
        destination: function (req, file, cb) {
            // callback function
            cb(null, "./public/temp"); // depends on your file structure
        },
        // function that specifies the name of the file that will be saved.
        filename: function (req, file, cb) {
            //// Generates a unique suffix using the current timestamp and a random number.
            // const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            console.log("file: ", file);
            // cb(null, file.fieldname + "-" + uniqueSuffix);
            // Calls the callback with null as the first argument (indicating no error) and the original name of the file (file.originalname) as the filename. This means the uploaded file will be saved with its original name.
            cb(null, file.originalname);
        },
    });
    // multer is called with an options object. The object has one property, storage, set to the storage variable you defined.
    // This tells multer to use the provided storage configuration for handling file uploads.
    // This instance (upload) can now be used as middleware to handle file uploads in your routes.
    export const upload = multer({ storage: storage });
    ```

---

# Router and Controller - Basic Setup

-   First we will create `routes` folder to write routes for the user

```js
// src/routes/user.router.js
import { Router } from "express";

const router = Router();

export default router;
```

-   Now in `app.js`

```js
...
...
// routes
import userRouter from "./routes/user.routes.js";

// routes declaration
// As we have separated our router and declaring routes here, we need to use middleware instead of just app.get etc
app.use("/api/v1/users", userRouter);

export {app}
```

-   Now we want to make the registration post req. We write the logic in Controllers

```js
// src/controller/user.controller.js
mport { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res, next) => {
	// TESTING ONLY
    res.status(200).json({
        success: true,
        message: "Register user",
    });
});

export { registerUser };

```

-   Now back in `user.router.js`

```js
...
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(registerUser);

export default router;
```

> [!Summary]+
>
> -   Create a basic controller -> where we write our main logics -> also handle exceptions
> -   Create the router from express then using the router we'll define routes and make requests like get, post etc
> -   Now for request mapping, let's choose app.js file and as we have separated everything, to use router we need to use middleware so `app.use("api/v1/users", userRouter)`
> -   Now userRouter will have controll, which is nothing but our defined router. Write the final uri (/register) and method(get, post, put etc)

# Router and Controller - Register Logic

-   Now to make a user register what are the steps that are need to be followed??
    > [!note]+
    >
    > -   Get data from form, uri as params, cookies etc. So extract the data
    > -   Maybe front-end might not validate the details so revalidate in server side as well
    > -   Check if user already exists
    > -   Check for required files are there or not (for file/image)
    > -   If available -> upload to cloudinary or other services to get the url
    > -   Create the object -> entry in mongoDB
    > -   Remove password(although it will be hashed), refresh token from response as we don't want to show this to the client
    > -   Check for user creation and return response

```js
// user.controller.js
import {User} from "../models/user.model.js"
...
...
const registerUser = asyncHandler(async (req, res,next) => {
	// #1
	const {fullname, email, username, password} = req.body;
	// #2 (here just checking if required any filed is empty)
	if ([fullname, email, username, password].some(
		(field) => field?.trim() === ""
	)) {
		throw new ApiError(400, "All fields are required")
	}
	// #3 -> User is coming from mongoose Schema
	// findOne-> jo vi pehle find ho or use find
	const existedUser = await User.findOne({ $or: [{email}, {username}] })
	if (existedUser) throw new ApiError(409, "....")
	// #4 -> for this make changes on router to accept files as we don't get them from req body
	...

})
```

```js
// user.router.js
import { upload } from "../middlewares/multer.middleware.js"; // multer
...
router.route("/register").post(
	// array -> ek hi field me multiple files leta hy, we don't want that
	// single => for single file upload handle
	// for multiple files accept -> accepts array of multiple fields
	upload.fields([
		{
			name:"avatar", // has be same as in form or front-end
			maxCount:1
		},
		{
			name: "coverImage",
			maxCount: 1
		}
	]),
	registerUser
)
```

-   Now back in controller

```js
import { uploadOnCloudinary } from "../utils/cloudinary.js";
...
const registerUser = asyncHandler(async (req, res,next) => {
	...
	// #4 --> get local path of the files
	// req.body jayse hi multer req.files deta hy for files
	// Now we only want the 1st property, there are other as well, so avatar[0]
	const avatarLocalPath = req.files?.avatar[0]?.path;
	// const coverImageLocalPath = req.files?.converImage[0]?.path; -> ERROR
	let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

	if (!avatarLocalPath) {
		throw new ApiError(400, "Please upload the avatar")
	}
	// #5 -> upload to cloudinary
	// upload me time toh lagega hi -> await
	const avatar = await uploadOnCloudinary(avatarLocalPath)
	const coverImage = await ...
	if (!avatar) throw ...

	// #6 -> db entry
	// user se liya data as it is paste karo db me jinka kuch value define nahi liya like email, fullname etc
	const user = await User.create({
		username: username.toLowerCase(),
		email,
		fullName,
		password,
		avatar: avatar.url,
		coverImage: coverImage?.url || ""
	})
	// #7 -> remove password and refresh token field from response so that it is not sent to the user
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    // #8 -> check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong :: User not created");
    }
    // #9 -> send response
    return res
        .status(201)
        .json(
            new ApiResponse(200, createdUser, "User registered successfully")
        );
})
export { registerUser };

```

# Router and Controller - Login + Cookies

> [!info] ### Access and Refresh Token Basics :
>
> -   It's a modern practice to create both tokens otherwise only access token will also work
> -   The only difference between them is that Refresh token is long-lived compared to access token
> -   **Access Token**: As long as you have valid/not expired access token, if you are authenticated, do your stuffs of where you have access to. Now if I set the time as 15min. You have to login again after 15min if you do not have refresh token.
> -   **Refresh Token** : The user and DB has Refresh Token. Now once you get logged out, the user will hit certain endpoint and the the user's and db's refresh tokens will be checked, if equal, the user will be given new access token to access content again and get autheticated without password.

-   Now let's create the Login user logic

```js
// user.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
...
...
const loginUser = asyncHandler(async (req, res) => {
	// #1 -> get data from user -> req.body
	const {email, username, password} = req.body
	// #2 -> check if email or username is empty
	if (!email && !username) {
		throw new ApiError(400, "Username or email is required")
	}
	// #3 -> find the user with specific email or username in db
	const user = await User.findOne({ $or: [{username}, {email}]})
	// #4 -> check in db if user with this username or email exist
	if (!user) {
		throw new ApiError(404, "User not found")
	}
	// #5 -> check for password
	/* In db we've stored the hashed password using bcryptJS, now we also created one function
	* named `isPasswordCorrect()` inside User model that basically compares the original and hashed password
	* here `user` -> is our actual user found from db schema
	*/
	const isPasswordCorrect = await user.isPasswordCorrect(password);
	if (!isPasswordCorrect) {
		throw new ApiError(401, "Invalid User credentials/unauthenticated")
	}
	// #6 -> generate access and refresh token
	const {accessToken, refreshToken} = await user.generateAccessAndRefreshToken(user._id)
	// #7 -> remove password and refresh token from response as we don't want to give this to the user as response
	const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
	// #8 -> send cookies to the user -> cookies access kr paa rhe hy cookieparser middleware ke wajay se
	const options = {
		// Because if these 2 options, cookie will be modified/set from the server only
		httpOnly : true,
		secure : true
	}
	// send response and cookies
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
	)
})
const generateAccessAndRefreshToken = async (userId) => {
	try{
		// get the user from the id
		const user = await User.findById(userId);
		const accessToken = user.generateAccessToken(); // this function was written in user model
        const refreshToken = user.generateRefreshToken();
		// set the refresh token to the user -> as refreshtoken pehle se generated nhi tha and use db me daal na hy, so set karo
		user.refreshToken = refreshToken
		// save the refresh token in db ->
		// Now we have saved only one field thus mongoose will give error as we have not saved the required password field etc, to avoid use make it false
		await user.save({validateBeforeSave : false})

        return {accessToken, refreshToken}
	}catch(error) {
		throw new ApiError(500, "Token generation failed");
	}
}

export {registerUser, logInUser, ...}
```

-   Now create the route for login

```js
// user.router.js
import {loginUser,...} from "../controllers/user.controller.js";
...
...
router.route("/login").post(logInUser)
...
export default router;
```

# Router and Controller - Logout + Cookies + Middleware

-   Now let's create Logout user logic and find the reason for middleware

```js
// user.controller.js
...
...
const logoutUser = asyncHandler(async (req, res, next) => {
	// Why creating middleware for this?
    // because how to get the user??? In previous functions we are getting info from req.body but in logout obviously we'll not give form to user to logout
    // That's when we need middleware -> middleware: jaane se pehle milke jana
    // reset the refresh token in the db

})

```

-   Create our middleware `src/middleware/auth.middleware.js`

```js
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// This will verify is user is there or not
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
        // The token is verified using jwt.verify, which decodes the token and returns the payload. The payload typically contains user-specific information, including the user’s _id
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        ); // we have added _id as key in user model with value _id, here we are putting the key
        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }
        // Attach the user object to the request object
        // If the user is found in the database, it is assigned to req.user
        // This allows the user data to be easily accessed in any subsequent middleware or route handler.
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
});
```

-   Now Create the secured route for it. We need secured route because it requires the user to be authenticated before they can access it. The security is enforced by the verifyJWT middleware function
-   The /logout route is responsible for ending a user’s session by clearing the refresh token in the database and deleting authentication cookies on the client side. This is a sensitive operation that should only be performed by the authenticated user who owns the session.

```js
// router/user.router.js
...
router.route("/logout").post(verifyJWT, logoutUser);

```

-   req.user is a property added to the request object in your verifyJWT middleware. It represents the currently authenticated user.
-   Once the user is authenticated via their JWT (JSON Web Token), their user data is retrieved from the database and stored in req.user. This makes the user data accessible in all subsequent middleware functions or route handlers.

```js
const logoutUser = asyncHandler(async (req, res) => {
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
```

# Access and Refresh Token - Refresh the user's Access Token

-

# Router and Controllers - Update Controllers

-   Let's understand the subscriptions schema. The one who is subscribing is a user and the channel to whom the user is subscribing can also be considered as a user.
    ![scription_model](https://i.imgur.com/TNpxra5.png)

```js
import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        // one who is subscribing
        subscriber: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        // one to whome 'subscriber' is subscribing
        channel: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
```

-   Now we'll create some other user related controllers
-   **Change Current Password of the user** :
    > [!info]+
    >
    > -   old password and new password extraction from user via req.body
    > -   Find the user as authenticated, the user must have payload stored in req.user because of the verifyJWT middleware
    > -   Check if old password is same as stored in db (db pass is encrypted)
    > -   set the old password to new password
    > -   store the new pass to db (hashed due to pre hook)

```js
// user.controller.js
const changeCurrentPassword = asyncHandler(async(req,res) => {
	// # 1 -> get the old password from req.body
	const {oldPassword, newPassword} = req.body;
	// # 2 ->
	// findById returns a promise to await
	const user = await User.findById(req.user?._id)
	// # 3 -> isPasswordCorrect() is the function defined in user.model.js to check if provided password is same as db encrypted password by bcrypt
 	const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
 	if (!isPasswordCorrect) {
	 	throw new ApiError(400, "Invalid old password")
 	}
 	// # 4 -> set the new password
 	user.password = newPassword
 	// # 5 -> save in db , now before save pre hook will run and create hash of newPassword and store
 	await user.save({validateBeforeSave: false})
 	return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully")"))

}))

```

-   **Get current user**

```js
const getCurrentUser = asyncHandler(async (req,res) => {
	// req.user is the current authenticated user as discussed
	return res.status(200).json(new ApiResponse(200, req.user, "User found successfully"))"))
})
```

-   **Update User basic details**
    > [!info]+
    >
    > -   Get new user details which you want to update
    > -   Find the user and update
    > -   remove password from response
    > -   return res

```js
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
```

-   We need to verify that the user making the request is indeed the one they claim to be. If we solely rely on the data from req.body, an attacker could potentially send a request with someone else’s details, including a different user ID, to update another user’s account. By fetching the user from the database using the authenticated user’s ID (req.user?.\_id), we ensure that the operation is performed on the correct account and that only the legitimate user can update their details.

-   **Update Avatar**
    > [!info]+
    >
    > -   Get the avatar local path. As only one file so req.file instead of re.files. It assumes that req.file?.avatar contains an array of files, and it grabs the path of the first file in that array.
    > -   Upload the new avatar to cloudinary
    > -   Delete previous avatar from clodinary
    > -   find the user and set the avatar to the new avatar.url

```js
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
```

```js
// utils/cloudinary.js
...
const deleteFromCloudinary = async (public_id, resource_type = "image") => {
    try {
        if (!public_id) {
            throw new Error("Public ID is required");
        }
        const response = await cloudinary.uploader.destroy(public_id, {
            resource_type,
        });
        console.log("Delete Response:", response);
    } catch (error) {
        console.error("Error in deleting cloudinary assets ", error);
    }
};
```

-   **Update Cover Image**

```js
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
```

# Subscription Model for the Youtube application

-   Now what I want is to create a controller that will fetch us the user/channel profile page with details like name, avatar, username, _subscriber count_, _subscription count_(to who else the user is subscribed to) etc also _Subscribe_,_subscribed_ toggle etc

-   Now we could have created a subscriber count entry in users model, that could hold the value. But imagine the user has a lot of subscriber and some people unsubscribes, so to handle that count in array in very much costly, and it can get overflowed as well. That's why we have created the **subscriptions** model

-   If you look closely in subscription model both _subscriber_ and _channel_ essentially signifies user only. Subscriber: one who is subscribing, channel: one to whom 'subscriber is subscribing'

![](https://i.imgur.com/zVugrVt.png)

-   So Every time when anyone subscribes to any channel, a document will be created each time.
-   Now to find **how many subscribers does channel 'CAC' have :** => **Count the no. of document/count the no. of channels**
-   **Count channels to get the subscriber**

# MongoDB Aggregation pipelines

-   Now here we will be joining the subscriptions schema with the users schema (Left Join)
-   It basically means : 'subscriptions se jitni information milti hy unhe join krdo users ke andar'. To do that we need Aggregation pipelines
-   For joining documents we use `lookup` in mongoDB

[Aggregation Pipeline](01_MongoDB.md#Aggregation Pipeline)

-   Now let's write a controller that will fetch channel Informations like its subscriber's count, channel it is subscribed to, name etc

```js
// user.controller.js
...
const getUserChannelProfile = asyncHandler(async (req, res) => {
	// how to get someone's profile infor? -> obviously my going to the url -> req.params
	const {username} = req.params;
	if (!username?.trim()) throw new ApiError(400, "username is missing");
	// find the user from db
	// on basic of user's id perform aggregation
	// Now we don't need that, we can directly perform aggregation using $match field as it'll filter the required document ----------
	// Values comes as array when writing aggregate
	const channel = await User.aggregate([
		{
			$match: {username: username?.toLowerCase()}
		},
		// Now to get how many subscribers does this channel have
		{
			$lookup: {
				from: "subscriptions" // got from subscrption schema
				localField: "_id",
				foreignField: "channel", // from schema -> if you select channels you'll get the subcribers count
				as: "subscribers"
			}
		},
		// Now to get how many channels I have subscribed to
		{
			$lookup: {
				from: "subscriptions",
				localField: "_id",
				"foreignField": "subscriber", // got from schema
				as:"subscribedTo"
			}
		}
		// Now to add these fields with additional fields
		{
			$addFields: {
				subscribersCount: {
					$size: "$subscribers" // 'as' is now a field
				},
                channelsSubscribedToCount: {
                    $size: "$subscribedTo" // 'as' is now a field
                },
                // subscribed or not button status
                isSubscribed: {
	                $cond: {
		                // $in -> andar jao array yah object ke aur check karo
	                    // now if user is there and logged in, we'll get the id from req.user
	                    // Now kaha se dekhna hy ?? -> subscribers fields se
	                    // ab field hy uske andar hamara subscription schema ka 2 schemas ayenge, hame chahiye subscriber
	                    // if the current user (req.user?._id) is subscribed to something
	                    if: {
		                    // check if the user’s id exists in the subscribers.subscriber field of the document
	                        $in: [req.user?._id, "$subscribers.subscriber"]
	                    },
	                    then: true,
	                    else: false
                    }
                }
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
			}
		}

	])
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
})


```

# Sub-pipelines and routes

![](https://i.imgur.com/89XnpHf.png)

-   Let's do the watch history controller

```js
// user.controller.js
...
const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
	            // **new mongoose.Types.ObjectId(req.user._id)**: This converts the user’s ID from the request (req.user._id) into a MongoDB ObjectId. In many cases, MongoDB IDs are stored as ObjectId types, so this conversion ensures the types match when performing the comparison.
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

```

-   Now let's complete the rest of the routes

```js
// user.routes.js
...
// secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
// The PATCH method is used to make **partial updates** to an existing resource. It applies changes to specific fields of a resource without modifying the entire resource.
// In this case, if a user is updating only part of their account details (e.g., changing their email address or username), PATCH is the appropriate method.
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

router
    .route("/avatar")
    .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
    .route("/cover-image")
    .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);

```

# Like playlist and Tweet model
