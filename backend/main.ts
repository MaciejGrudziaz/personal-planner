import express from 'express';
import { graphqlHTTP, Options } from 'express-graphql';
import loadGraphQLSchema from './graphql/schema';

const app = express();

loadGraphQLSchema({user: "mg", password: "1234", database: "personalplanner"}, "graphql/schema.graphql").then((schema: Options | undefined) => {
    if(schema === undefined) {
        console.error("Error encountered while initializing GraphQL schema, exiting process...");
        process.exit(1);
    }
    app.use("/", graphqlHTTP(schema));
});

const port = 8080;
app.listen(port, ()=> {
    console.log(`listening on port: ${port}`);
})

