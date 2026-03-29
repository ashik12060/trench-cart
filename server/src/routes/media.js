import { createCrudRouter } from "./crud.js";
import { MediaAsset } from "../models/MediaAsset.js";

export const mediaRouter = createCrudRouter(MediaAsset);
