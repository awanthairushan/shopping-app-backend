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
    
    type PaginatedProducts {
      total: Int!
      products: [Product!]!
    }

    type Query {
        getProduct(ID: ID!): Product!
        getProducts(offset: Int, limit: Int, category: String, query: String): PaginatedProducts
    }

    type Mutation {
        createProduct(productInput: ProductInput): Product!
        deleteProduct(ID: ID!): Boolean
        editProduct(ID: ID!, productInput: ProductInput): Boolean
    }
`;

export default typeDefs;
