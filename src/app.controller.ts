
import express from "express";
import type { Request,Response,NextFunction ,ErrorRequestHandler} from "express";
import cors from "cors";
import helmet from "helmet";
import {rateLimit} from "express-rate-limit";
import { PORT } from "./confing/config.service";
import { globalErrorHandler } from "./common/utils/global-error-handlier";
import {appError} from "./common/utils/global-error-handlier";
import authRouter from "./modules/auth/auth.controller";
import connectDb from "./DB/connectionDb";
import redisService from "./common/service/redis.service";
import userRouter from "./modules/user/user.controller";
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
app.use("/users", userRouter);

app.get("/", (req:Request, res:Response,next:NextFunction) => {
    res.json({ message: "Welcome to the Social Media App " });
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
