import { Router } from "express";
import { parseFilters, parseSort } from "../utils/query.js";

export const createCrudRouter = (Model, options = {}) => {
  const { afterUpdate } = options;
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const filters = parseFilters(req.query);
      const sort = parseSort(req.query.sort);
      const limit = req.query.limit ? Number(req.query.limit) : 0;

      let query = Model.find(filters).sort(sort);
      if (limit > 0) query = query.limit(limit);

      const data = await query.exec();
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const doc = await Model.create(req.body);
      res.status(201).json(doc);
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      const prevDoc = await Model.findById(req.params.id);
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!doc) return res.status(404).json({ error: "Not found" });
      if (afterUpdate) {
        await afterUpdate({ req, prevDoc, updatedDoc: doc });
      }
      res.json(doc);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ error: "Not found" });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
};
