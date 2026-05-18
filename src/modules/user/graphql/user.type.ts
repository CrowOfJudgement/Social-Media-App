import { GraphQLEnumType, GraphQLID, GraphQLInt, GraphQLObjectType, GraphQLString } from "graphql";

export type UserGender = "male" | "female";

export type GraphqlUser = {
    id: string | number;
    age: number;
    name: string;
    gender: UserGender;
};

export const users: GraphqlUser[] = [
    { id: 1, age: 23, name: "eslam", gender: "male" },
    { id: 2, age: 21, name: "gamal", gender: "female" },
    { id: 3, age: 27, name: "test", gender: "male" }
];

export const genderType = new GraphQLEnumType({
    name: "Gender",
    values: {
        male: { value: "male" },
        female: { value: "female" }
    }
});

export const userType = new GraphQLObjectType({
    name: "User",
    fields: {
        id: {
            type: GraphQLID,
            resolve: (source: Record<string, unknown>) => source.id ?? source._id
        },
        age: { type: GraphQLInt },
        name: {
            type: GraphQLString,
            resolve: (source: Record<string, unknown>) => source.name ?? source.userName
        },
        gender: { type: genderType }
    }
});
