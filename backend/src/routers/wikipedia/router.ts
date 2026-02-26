import { Router } from "express";
import {
  WikipediaController,
  WikipediaRepository,
  WikipediaService,
} from "../../integrations/wikipedia";

const wikipediaRepository = new WikipediaRepository();
const wikipediaService = new WikipediaService(wikipediaRepository);
const wikipediaController = new WikipediaController(wikipediaService);

export const router = Router();

router.get("/", wikipediaController.getArticleExtract);
