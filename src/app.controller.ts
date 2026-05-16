
import express from "express";
import type { Request,Response,NextFunction ,ErrorRequestHandler} from "express";
import { pipeline } from "node:stream/promises";
import cors from "cors";
import helmet from "helmet";
import {rateLimit} from "express-rate-limit";
import { PORT } from "./confing/config.service";
import { globalErrorHandler } from "./common/utils/global-error-handlier";
import {appError} from "./common/utils/global-error-handlier";
import authRouter from "./modules/auth/auth.controller";
import connectDb from "./DB/connectionDb";
import redisService from "./common/service/redis.service";
import s3Service from "./common/service/s3.service";
import commentRouter from "./modules/comments/comment.controller";
import postRouter from "./modules/posts/post.controller";
import userRouter from "./modules/user/user.controller";
import notificationService from "./common/service/notification.service";
import { successResponse } from "./common/utils/response.sucsess";
const app: express.Application = express();
const port=PORT;

const bootstrap = async () => {
await connectDb();
await redisService.connect();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
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
    //throw new Error(`URL: ${req.originalUrl} with method ${req.method} not found `,{cause:404})
    throw new appError(`URL: ${req.originalUrl} with method ${req.method} not found `,404)
});

app.use(globalErrorHandler)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);   
})
}   



export default bootstrap;
