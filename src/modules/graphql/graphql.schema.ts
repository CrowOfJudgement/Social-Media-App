import { GraphQLObjectType, GraphQLSchema } from "graphql";
import userFields from "../user/graphql/user.field";

const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: "Query",
        fields: userFields.query()
    }),
    mutation: new GraphQLObjectType({
        name: "Mutation",
        fields: userFields.mutation()
    })
});

export default schema;
