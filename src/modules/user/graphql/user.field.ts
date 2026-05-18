import { GraphQLList } from "graphql";
import { RoleEnum } from "../../../common/enum/user.enum";
import { graphql_auth } from "../../../common/middleware/authentication";
import { graphql_authorization } from "../../../common/middleware/authorization";
import { appError } from "../../../common/utils/global-error-handlier";
import { GraphqlContext } from "../../graphql/graphql.context";
import userService from "../user.service";
import { createUserArgs, getUserArgs } from "./user.args";
import { GraphqlUser, users, userType } from "./user.type";

class UserFields {
    constructor() {}
    query = () => {
        return {
            getUser: {
                type: userType,
                args: getUserArgs,
                resolve: async (_parent: unknown, _args: { id: string }, context: GraphqlContext) => {
                    const { user } = await graphql_auth(context.req.headers.authorization);
                    await graphql_authorization([RoleEnum.Admin], user.role);

                    return await userService.getGraphqlUserById(String(user._id));
                }
            },
            listUsers: {
                type: new GraphQLList(userType),
                resolve: async (_parent: unknown, _args: unknown, context: GraphqlContext) => {
                    const { user } = await graphql_auth(context.req.headers.authorization);
                    await graphql_authorization([RoleEnum.Admin], user.role);

                    return await userService.getGraphqlUsers();
                }
            }
        };
    };

    mutation = () => {
        return {
            createUser: {
                type: userType,
                args: createUserArgs,
                resolve: async (_parent: unknown, args: GraphqlUser, context: GraphqlContext) => {
                    const { user } = await graphql_auth(context.req.headers.authorization);
                    await graphql_authorization([RoleEnum.Admin], user.role);

                    const idExist = users.find((user) => user.id === args.id);

                    if (idExist) {
                        throw new appError("id already exist", 400);
                    }

                    users.push(args);
                    return args;
                }
            }
        };
    };
}

const userFields = new UserFields();

export default userFields;
