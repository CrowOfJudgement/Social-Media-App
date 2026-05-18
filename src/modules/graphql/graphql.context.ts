import type { Request } from "express";

export type GraphqlContext = {
    req: Request;
    user: Request["user"];
    decoded: Request["decoded"];
};

export const buildGraphqlContext = (req: Request): GraphqlContext => {
    return {
        req,
        user: req.user,
        decoded: req.decoded
    };
};
