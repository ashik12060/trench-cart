import { createCrudRouter } from "./crud.js";
import { CarouselSlide } from "../models/CarouselSlide.js";

export const carouselSlidesRouter = createCrudRouter(CarouselSlide);
