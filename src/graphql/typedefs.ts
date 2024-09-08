import { gql } from "apollo-server";

const typeDefs = gql`
    type Product {
        id: String,
        name: String,
        price: Float,
        discountedPrice: Float,
        quantity: Int,
        category: String,
        image: String,
        description: String,
    }

    input ProductInput {
        name: String
        price: Float
        discountedPrice: Float,
        quantity: Int,
        category: String,
        image: String,
        description: String,
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
