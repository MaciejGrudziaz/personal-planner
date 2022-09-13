import express from 'express';
import { graphqlHTTP } from 'express-graphql';
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

const schema = buildSchema(`
    type Person {
        age: Int
        name: String
    }
    type Query {
        hello: String
        name: String
        test(id: Int): String
        person: Person
    }
`)

const root = { 
    hello: () => "hello world", 
    name: () => "name field", 
    test: (val: {id: number}) => `id: ${val.id}`,
    person: {
        age: () => 19,
        name: () => "John Doe",
    }
};

app.get("/", (req, res)=>{
    res.send("hello world");
});

app.use("/graphql",
    graphqlHTTP({
        schema: schema,
        rootValue: root,
        graphiql: true,
    }),
);

const port = 8080;
app.listen(port, ()=> {
    console.log(`listening on port: ${port}`);
})

