import { createCrudRouter } from "./crud.js";
import { Category } from "../models/Category.js";

export const categoriesRouter = createCrudRouter(Category);
