
import express from "express";
import type { Request,Response,NextFunction } from "express";
import { pipeline } from "node:stream/promises";
import cors from "cors";
import helmet from "helmet";
import {rateLimit} from "express-rate-limit";
import { createHandler } from "graphql-http/lib/use/express";
import { PORT } from "./confing/config.service";
import { globalErrorHandler } from "./common/utils/global-error-handlier";
import {appError} from "./common/utils/global-error-handlier";
import authRouter from "./modules/auth/auth.controller";
import connectDb from "./DB/connectionDb";
import redisService from "./common/service/redis.service";
import s3Service from "./common/service/s3.service";
import commentRouter from "./modules/comments/comment.controller";
import { buildGraphqlContext } from "./modules/graphql/graphql.context";
import postRouter from "./modules/posts/post.controller";
import schema from "./modules/graphql/graphql.schema";
import userRouter from "./modules/user/user.controller";
import notificationService from "./common/service/notification.service";
import { successResponse } from "./common/utils/response.sucsess";
const app: express.Application = express();
const port=PORT;

const bootstrap = async () => {
await connectDb();
await redisService.connect();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    standardHeaders: true, 
    legacyHeaders: false, 
    handler: (req:Request, res:Response,next:NextFunction) => {
throw new appError(`Too many requests from this IP, please try again after 15 minutes`,429)
    }
});

app.use(helmet());
app.use(cors());
app.use(limiter);
app.use(express.json());
app.use("/auth", authRouter);
app.use("/comments", commentRouter);
app.use("/posts", postRouter);
app.use("/users", userRouter);


app.use(
    "/graphql",
    createHandler({
        schema,
        context: (req) => buildGraphqlContext(req.raw)
    })
);

app.get("/", (req:Request, res:Response,next:NextFunction) => {
    res.json({ message: "Welcome to the Social Media App " });
});

app.get("/upload/*path", async (req:Request, res:Response, next:NextFunction) => {
    try {
        const { path } = req.params as { path: string[] }
        const { download } = req.query
        const Key = path.join("/")

        const result = await s3Service.getFile(Key)
        const stream = result.Body as NodeJS.ReadableStream

        if (result.ContentType) {
            res.setHeader("Content-Type", result.ContentType)
        }
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin")

        if (download && download === "true") {
            res.setHeader("Content-Disposition", `attachment; filename="${path[path.length - 1]}"`)
        }

        await pipeline(stream, res)
    } catch (error) {
        next(error)
    }
})



app.post("/send-notification", async (req:Request, res:Response,next:NextFunction) => {
    try {
        const { token } = req.body as { token?: string }

        if (!token) {
            throw new appError("Token is required", 400)
        }

        const messageId = await notificationService.sendNotification({
            token,
            data: {
                title: "Alo",
                body: "Alooooooo"
            }
        })

        return successResponse({
            res,
            message: "Notification sent successfully",
            data: { messageId }
        })
    } catch (error) {
        next(error)
    }
});


app.use((req:Request, res:Response,next:NextFunction) => {
    throw new appError(`URL: ${req.originalUrl} with method ${req.method} not found `,404)
});

app.use(globalErrorHandler)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);   
})
}   



export default bootstrap;
