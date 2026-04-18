import express from "express";
import { authRouter } from "./modules";
import { globalErrorHandler } from "./middleware";
import { connectDB } from "./DB/connected.db";
import { PORT } from "./config/config";
import { redisService } from "./common/services/redis.service";
// or
// import express from "express";
// import type { Express, Request, Response, NextFunction } from "express";

const bootstrap = async () => {
  const app: express.Express = express();
  app.use(express.json());

  // connect DB
  await connectDB();
  await redisService.connect()

  app.get(
    "/",
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      res.status(200).json({ message: "Landing Page" });
    },
  );

  // Application-Routing
  app.use("/auth", authRouter);

  // global Error Handling
  app.use(globalErrorHandler);

  app.use(
    "/*dummy",
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      res.status(404).json({ message: "Invalid Application Routing" });
    },
  );
  app.listen(PORT, () => {
    console.log("Server is running successfully on port 3000 !");
  });
};

export default bootstrap;
