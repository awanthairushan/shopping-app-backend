import {ApolloServer} from '@apollo/server';
import typeDefs from "./graphql/typedefs.js";
import resolvers from "./graphql/resolvers.js";
import mongoose from "mongoose";
import {startStandaloneServer} from "@apollo/server/standalone";

const server = new ApolloServer({
    typeDefs,
    resolvers,
});
mongoose.connect(process.env.DATABASE)
    .then(() => {
        console.log("Database connected")
    })

const {url} = await startStandaloneServer(server, {
    listen: {port: 4000}
})

console.log('server running at ' + url)