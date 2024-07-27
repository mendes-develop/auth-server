import { Elysia, t } from "elysia";
import { userDTO } from "./user.dto";
import { jwtConfig } from "./jwt.config";
import { swagger } from '@elysiajs/swagger';

// Define the schema for the request body, including 'email' and 'password' fields
const body = t.Object({
  email: t.String(),
  password: t.String(),
});

const PORT = 4157;

// Create a new Elysia server instance
new Elysia()
  // Use the JWT configuration for authentication and authorization
  .use(jwtConfig)
  // Integrate Swagger for API documentation
  .use(swagger())
  // Derive the user information from the JWT token in the request headers
  .derive(async ({ headers, jwt_auth }) => {
    // Extract the authorization header
    const auth = headers['authorization'];
    // Extract the Bearer token from the authorization header if it exists
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;

    // If no token is found, return a user object set to null
    if (!token) return { user: null };

    // Verify the JWT token and extract the user information
    const user = await jwt_auth.verify(token);

    // Return the user object for further use in request handling
    return { user };
  })
  // Define the /signup endpoint for user registration
  .post("/signup", async ({ body, jwt_auth, error }) => {
    // 1. Check if the user already exists in the database using their email
    const foundUser = userDTO.findUserByEmail(body.email);

    // 2. If the user exists, return an error message; otherwise, proceed to create a new user
    if (foundUser) {
      return error("Bad Gateway", "User already exists");
    }

    // Create a new user with the provided email and password
    const newUser = await userDTO.createUser({
      email: body.email,
      password: body.password,
    });

    // 3. Generate a JWT token for the newly created user
    const token = await jwt_auth.sign({ id: newUser.id });

    // Return the generated token to the client
    return { token };
  },
    // Specify the expected request body structure for this endpoint
    { body }
  )
  // Define the /login endpoint for user authentication
  .post("/login", async ({ body, error, jwt_auth }) => {
    // 1. Check if the user exists in the database using their email
    const foundUser = userDTO.findUserByEmail(body.email);

    // 2. If the user doesn't exist, throw an error; otherwise, proceed to authenticate
    if (!foundUser) throw new Error("User does not exist");

    // 3. Verify the provided password against the stored password hash
    const isPasswordCorrect = await userDTO.verifyPassword(
      body.password,
      foundUser.password_hash
    );

    // If the password is incorrect, return an error message
    if (!isPasswordCorrect) return error('Bad Request', 'Invalid password');

    // 4. Generate a JWT token for the authenticated user
    const token = await jwt_auth.sign({ id: foundUser.id });

    // 5. Return the generated token to the client
    return { token };
  },
    // Specify the expected request body structure for this endpoint
    { body }
  )
  // Define a guard to protect certain routes, ensuring the user is authenticated
  .guard({
    beforeHandle({ user, set }) {
      // If the user is not authenticated, set the response status to "Unauthorized"
      if (!user) return (set.status = "Unauthorized");
    },
  }, app =>
    // Define the /me endpoint to get information about the authenticated user
    app.get("/me", ({ user, error }) => {
      // If the user is not authenticated, return a 401 error
      if (!user) return error(401, "Not Authorized");

      // Return the user object to the client
      return { user };
    })
  )
  // Define a /private endpoint to demonstrate a protected route
  .get("/private", ({ user }) => {
    // Return a simple object indicating the route is private
    return { private: true };
  })
  // Start the server and listen on the specified port
  .listen(PORT);

console.log(`🦊 Server is running on port ${PORT}`);
