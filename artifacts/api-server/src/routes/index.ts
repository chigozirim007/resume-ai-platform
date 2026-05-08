import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import resumesRouter from "./resumes";
import resumesExtractRouter from "./resumes-extract";
import scrapeJobRouter from "./scrape-job";
import analysesRouter from "./analyses";
import dashboardRouter from "./dashboard";
import userRouter from "./user";
import paystackRouter from "./paystack";
import reviewsRouter from "./reviews";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(resumesRouter);
router.use(resumesExtractRouter);
router.use(scrapeJobRouter);
router.use(analysesRouter);
router.use(dashboardRouter);
router.use(userRouter);
router.use(paystackRouter);
router.use(reviewsRouter);

export default router;
