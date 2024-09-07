import { ApolloServer } from '@apollo/server';
import mongoose from "mongoose";
import express from 'express';
import cors from 'cors'; // Make sure to install the 'cors' package
import typeDefs from "./graphql/typedefs.js";
import resolvers from "./graphql/resolvers.js";
import {expressMiddleware} from "@apollo/server/express4";
import dotenv from 'dotenv';
dotenv.config();

// CORS configuration
const corsOptions = {
    origin: 'http://localhost:5173', // or your specific origin
    credentials: true, // if your frontend sends credentials like cookies
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
});

const app = express();

// Apply CORS middleware to the Express app
app.use(cors(corsOptions));

await mongoose.connect(process.env.DATABASE);
console.log("Database connected");

await server.start();
app.use('/api', express.json(), expressMiddleware(server));

app.listen(process.env.PORT, () => console.log('Server running at ' + process.env.PORT + ' port'));
