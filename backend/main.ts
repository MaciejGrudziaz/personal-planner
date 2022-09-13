import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { getGraphQLSchema } from './graphql/schema';
import { buildSchema } from 'graphql';
import { Client } from 'pg';
import {DBClient, initDBClient} from './db-client/client';

const app = express();

initDBClient("mg", "1234", "localhost").then((client: DBClient | undefined) => {
    if(client === undefined) {
        console.log("client is undefined");
        return;
    }
});

app.use("/", graphqlHTTP(getGraphQLSchema()));

const port = 8080;
app.listen(port, ()=> {
    console.log(`listening on port: ${port}`);
})

