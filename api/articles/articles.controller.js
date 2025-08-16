const NotFoundError = require("../../errors/not-found");
const UnauthorizedError = require("../../errors/unauthorized");
const articlesService = require("./articles.service");
const User = require("../users/users.model");

class ArticlesController {
  async getAll(req, res, next) {
    try {
      const articles = await articlesService.getAll();
      res.json(articles);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const id = req.params.id;
      const article = await articlesService.get(id);
      if (!article) {
        throw new NotFoundError();
      }
      res.json(article);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const articleData = {
        ...req.body,
        user: req.user.userId,
      };

      const article = await articlesService.create(articleData);
      const populatedArticle = await articlesService.get(article._id);

      req.io.emit("article:create", populatedArticle);

      res.status(201).json(populatedArticle);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const user = await User.findById(req.user.userId);
      if (!user || user.role !== "admin") {
        throw new UnauthorizedError("Only administrators can modify articles");
      }

      const id = req.params.id;
      const data = req.body;
      const articleModified = await articlesService.update(id, data);

      if (!articleModified) {
        throw new NotFoundError();
      }

      req.io.emit("article:update", articleModified);

      res.json(articleModified);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const user = await User.findById(req.user.userId);
      if (!user || user.role !== "admin") {
        throw new UnauthorizedError("Only administrators can delete articles");
      }

      const id = req.params.id;
      const result = await articlesService.delete(id);

      if (result.deletedCount === 0) {
        throw new NotFoundError();
      }

      req.io.emit("article:delete", { id });

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ArticlesController();
