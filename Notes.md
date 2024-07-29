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

-   **Middleware** : - If we are requesting a route /about, first the checking will be if I am logged in or not, these chekings are done by middlewares. There can be multiple middlewares. Now it has flags named `next`. It simply refers that one middleware's job is done, go to next middleware if any, if there isn't any then it will be discarded and we'll get the response. Generally we get 4 params in any request `error`,`req`,`res`,`next`
-   Create an `utils/asyncHandler.js`

    ```js
    // src/utils/asyncHanfler.js
    // Using Promise
    const asyncHandler = (requestHandler) => {
        return (req, res, next) => {
            Promise.resolve(requestHandler(req, res, next)).catch((error) =>
                next(error)
            );
        };
    };

    // Using async/await
    // asyncHandler is a higher order function so it can accept a function as an argument and return a new function.
    // const asyncHandler = (fn) => async (req, res, next) => {
    //     try {
    //       await fn(req, res, next);
    //     } catch (error) {
    //         res.status(error.code || 500).json({
    //             success: false,
    //             message: error.message || "Something went wrong",
    //         });
    //     }
    // };
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
        super(message);
        this.statusCode = statusCode;
        this.data = null;
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
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }
}
export { ApiResponse };
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
                throw new Error("Local file path is required");
            }
            const response = await cloudinary.uploader
                .upload(localFilePath, {
                    resource_type: "auto", // Automatically determine the type of file
                })
                .catch((error) => {
                    throw new Error("Error uploading file to cloudinary");
                });
            console.log("Upload successful: ", response.url);
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
	const coverImageLocalPath = req.files?.converImage[0]?.path;
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

# Router and Controller - Login Logic
