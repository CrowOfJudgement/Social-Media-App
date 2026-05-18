import { GraphQLID, GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
import { genderType } from "./user.type";

export const getUserArgs = {
    id: { type: new GraphQLNonNull(GraphQLID) }
};

export const createUserArgs = {
    id: { type: new GraphQLNonNull(GraphQLInt) },
    age: { type: new GraphQLNonNull(GraphQLInt) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    gender: { type: new GraphQLNonNull(genderType) }
};
