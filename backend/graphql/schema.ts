import { graphqlHTTP, Options } from "express-graphql";
import { buildSchema, buildASTSchema, Source, DocumentNode } from "graphql";
import { readFile } from 'fs/promises';
import getResolver from './resolver';
import { initDBClient, ConnectionParams } from '../db-client/client';

async function loadSchemaFile(filename: string): Promise<string | undefined> {
    try {
        const content = await readFile(filename, 'utf8');
        console.log(`Loaded GraphQL schema:\n${content}`);

        return content;
    } catch(err: any) {
        console.error(err.stack);
        return undefined;
    }
}

async function loadGraphQLSchema(dbParams: ConnectionParams, schemaFilename: string): Promise<Options | undefined> {
    const schemaContent = await loadSchemaFile(schemaFilename);
    if(schemaContent === undefined) {
        return undefined;
    }

    const db = await initDBClient(dbParams);
    if(db === undefined) {
        return undefined;
    }

    return {
        schema: buildSchema(schemaContent),
        rootValue: getResolver(db),
        graphiql: true,
    };
}

export default loadGraphQLSchema;
