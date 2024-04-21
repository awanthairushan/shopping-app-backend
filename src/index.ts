import {ApolloServer} from '@apollo/server';
import mongoose from "mongoose";
import express from 'express'
import typeDefs from "./graphql/typedefs.js";
import resolvers from "./graphql/resolvers.js";
import {expressMiddleware} from "@apollo/server/express4";

const server = new ApolloServer({
    typeDefs,
    resolvers,
});
const app = express()
await mongoose.connect(process.env.DATABASE)
console.log("Database connected")


await server.start()
app.use('/api', express.json(), expressMiddleware(server))

app.listen(process.env.PORT, () => console.log('server running at ' + process.env.PORT + ' port'))