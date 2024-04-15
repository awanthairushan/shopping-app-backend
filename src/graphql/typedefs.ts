import { gql } from "apollo-server";

const typeDefs = gql`
    type Product {
        name: String
        category: String
        price: Int
    }

    input ProductInput {
        name: String
        category: String
        price: Int
    }

    type Query {
        product(ID: ID!): Product!
        getProducts(amount: Int): [Product]
    }

    type Mutation {
        createProduct(productInput: ProductInput): Product!
        deleteProduct(ID: ID!): Boolean
        editProduct(ID: ID!, productInput: ProductInput): Boolean
    }
`;

export default typeDefs;
