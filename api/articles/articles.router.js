const { Router } = require("express");
const articlesController = require("./articles.controller");
const router = Router();

router.get("/", articlesController.getAll);
router.get("/:id", articlesController.getById);
router.post("/", articlesController.create);
router.put("/:id", articlesController.update);
router.delete("/:id", articlesController.delete);

module.exports = router;
