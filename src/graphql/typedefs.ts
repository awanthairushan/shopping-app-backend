import { gql } from "apollo-server";

const typeDefs = gql`
    
    type User {
        id: String,
        email: String
        name: String,
        contact: String,
        password: String
    }
    
    input UserInput {
        email: String
        name: String,
        contact: String,
        password: String
        role: Int
    }
    
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

    type RegisterResponse {
        id: String
        token: String
        email: String
        name: String,
        contact: String,
        role: Int
    }

    input LoginInput {
        email: String
        password: String
    }
    
    input ProfileInput {
        email: String
        password: String
    }
    
    input AddressInput {
        fullName: String
        address: String
        city: String
        postalCode: String
        country: String
        contact: String
    }
    
    input OrderInput {
        productId: String
        quantity: Int
    }

    input PlaceOrderInput {
        orderList: [OrderInput]
        deliveryCharge: Int
        discountCode: String
        registerData:ProfileInput
        billingAddress: AddressInput
        shippingAddress: AddressInput
    }

    type Query {
        getProduct(ID: ID!): Product!
        getProducts(offset: Int, limit: Int, category: String, query: String): PaginatedProducts
    }

    type Mutation {
        login(loginData: LoginInput): RegisterResponse!
        registerUser(userInput: UserInput): RegisterResponse!
        createProduct(productInput: ProductInput): Product!
        deleteProduct(ID: ID!): Boolean
        editProduct(ID: ID!, productInput: ProductInput): Boolean
        placeOrder(placeOrderInput: PlaceOrderInput): String
    }
`;

export default typeDefs;
