import express from "express";
import { authRouter } from "./modules";
import { globalErrorHandler } from "./middleware";
import { connectDB } from "./DB/connected.db";
import { PORT } from "./config/config";
import { redisService } from "./common/services/redis.service";
import { userRouter } from "./modules/user";
import cors from "cors";
import { s3Service, successResponse } from "./common";
import { pipeline } from "node:stream";
import { promisify } from "node:util";

const s3WriteStream = promisify(pipeline);
// or
// import express from "express";
// import type { Express, Request, Response, NextFunction } from "express";

const bootstrap = async () => {
  const app: express.Express = express();
  app.use(express.json(), cors());

  // connect DB
  await connectDB();
  await redisService.connect();

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
  app.use("/user", userRouter);

  app.get(
    "/uploads/*path",
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      const { download, fileName } = req.query as {
        download: string;
        fileName: string;
      };
      const { path } = req.params as { path: string[] };
      const Key = path.join("/");
      const { Body, ContentType } = await s3Service.getAsset({ Key });
      res.setHeader("Content-Type", ContentType || "application/octet-stream");
      res.set("Cross-Origin-Resource-policy", "cross-origin");
      if (download === "true") {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName || Key.split("/").pop()}"`,
        );
      }

      return await s3WriteStream(Body as NodeJS.ReadableStream, res);
    },
  );

  app.get(
    "/pre-signed/*path",
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      const { download, fileName } = req.query as {
        download: string;
        fileName: string;
      };
      const { path } = req.params as { path: string[] };
      const Key = path.join("/");
      const url = await s3Service.createPreSignedFetchLink({
        Key,
        download,
        fileName,
      });

      return successResponse({ res, data: { url } });
    },
  );

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
