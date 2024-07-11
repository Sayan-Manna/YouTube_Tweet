# First Setup

- `npm init` => write your start script `"start": node index.js`
- Install Express and use it
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
- Now if you do some modifications or create another route, we have to restart our server or we have to install `nodemon`
- Now in server there might be a case when 4000 port is running by other application, in these cases we need to set env variables for port.
- Install `npm i dotenv`
- Create .env
	```env
	PORT=3000
	```
	```js
	// index.js
	require('dotenv').config()
	...
	const port = 4000 || process.env.PORT 🔑
	```
- To send json data `res.json({...})`
- To use `module js` we need to change the code in `package.json`
	```json
	"type":"module"
	```
- Now we can use `import express from 'express';`
# Connect with Front-End

- Create your backend and serve a json array to jokes(array of objects)
- In the front-end folder do few steps
```jsx
// App.jsx
import axios from 'axios'
function App() {
	const [jokes, setJokes] = useState([]);
	const getJokes = async () => {
		try{
			const res = await axios.get("localhost:3000/api/jokes");
			setJokes(res.data)
		}catch (error){
			console.log(error)
		}
	}
	useEffect(()=> {
		getJokes();
	})

	return (
		<>
		{jokes.map((joke) => (
			<div key={joke.id}>
				<h3>{joke.title}</h3>
				<p>{joke.content}</p>
			</div>
		))}
		</>
	)
}

```
- Now this will result in CORS error
- We can fix via `npm i cors` and codes also, but we'll use proxy here
- Now in the url I have set the full url which doesn't make any sense. If our app is deployed the url will be changed we need proxy
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

# Data Modelling with Mongoose

- **Prisma vs Mongoose**
	- **Prisma** => ORM => SQL DB, => If you need strong type safety => good choice for GraphQL and REST APIs
	- **Mongoose** => ODM => For NoSQL where flexible and dynamic schema design is needed. => Ideal for CMS, real-time analytics etc
- `npm i mongoose`
### User based ToDo App Modelling
- Create a folder `models/todos` -> Inside that create files `user.models.js`, `todo.models.js`, `sub-todo.models.js`
- `user.model.js`
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
- Some other types
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
# Setup Professional Backend Project

- Initial Folder Structure and few initial dev dependencies(nodemon, prettier) are needed
- `src/controllers`, `src/models`,`src/utils`, `sc/middlewares`, `src/db`,`src/routes`, index.js, constants.js, app.js
# Connect DB with MERN

- Create Cluster and configure your DB. Allow every one to access using 0.0.0.0/0 IP
- Now we need to create few files to store our env and other configs for db connection -> `.env`, `src/constants.js`
- Install `npm i dotenv`. Inside the env file put the port and db url from the mongo db cluster
- In `constants` we put the `db_name`, it could be put in the .env as well but it isn't system specific and not that sensitive so put it in constants.
- Now there are basically 2 approaches to connect our app with DB
	- **Using `index.js`** : As we are executing `src/index.js` from `nodemon`, we'll write the logic for DB connection there and it'll be executed at the very beginning.

		```js
		// src/index.js
		import mongoose from "mongoose";
		// a lot of time we'll have errors with imports so import the full syntax
		import { DB_NAME } from "./constants.js";
		import express from 'express'
		const app = express()
		// Always async/await and try/catch while establishing db connection
		;(async ()=>{
		  try {
			// we could store it as well, mongoDB returns an object when connecting
		    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
		    // if error in express when connecting with db
		    app.on("error", (error)=> {
		      console.log("ERRR: ", error);
		      throw error;
		    })
		    app.listen(process.env.PORT, ()=> {
		      console.log(`Server is running on port ${process.env.PORT}`);
		    })
		  } catch (error) {
		    console.log("ERROR: ", error);
		    throw error;
		  }
		})()
		```

	- **Creating a db folder** : Create a db folder and write the logics there then import it on index file and execute.

		```js
		// src/db/index.js
		import mongoose from "mongoose";
		// full syntax to prevent error
		import { DB_NAME } from "../constants.js";
		
		const connectDB = async () => {
		  try {
		    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
		    // As we know there are different db servers say dev. prod, test etc. So to know the host name 
		    console.log(`MongoDB Connected !! DB Host: ${connectionInstance.connection.host}`);
		  } catch (error) {
		    console.log("MONGODB Connection Error: ", error);
		    // throw also exits the code, this also does.
		    // process is given to us by node, now there are different codes exit(1), exit(0) etc
		    process.exit(1);
		  }
		}
		export default connectDB;
		```
		
		```js
		// src/index.js
		// require('dotenv').config({path: './env'})
		//  we have to configure our package.json to load env as well
		import dotenv from "dotenv";
		import connectDB from "./db/index.js";
		// env var location
		dotenv.config({
		  path: "./env"
		})
		
		// Connect to MongoDB
		connectDB();
		```

		```.env
		PORT=4000
		MONGODB_URI=mongodb+srv://.....
		```
# Custom API response and Exception Handling

# 