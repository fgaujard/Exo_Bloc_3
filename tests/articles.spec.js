const request = require("supertest");
const { app } = require("../server");
const jwt = require("jsonwebtoken");
const config = require("../config");
const mongoose = require("mongoose");
const mockingoose = require("mockingoose");
const Article = require("../api/articles/articles.schema");
const User = require("../api/users/users.model");
const articlesService = require("../api/articles/articles.service");

describe("API articles tests", () => {
  let token;
  let adminToken;
  const USER_ID = "507f1f77bcf86cd799439011";
  const ADMIN_USER_ID = "507f1f77bcf86cd799439012";
  const ARTICLE_ID = "507f1f77bcf86cd799439013";

  const MOCK_USER = {
    _id: USER_ID,
    name: "John Doe",
    email: "john@test.com",
    role: "member",
  };

  const MOCK_ADMIN_USER = {
    _id: ADMIN_USER_ID,
    name: "Admin User",
    email: "admin@test.com",
    role: "admin",
  };

  const MOCK_ARTICLE_CREATED = {
    title: "New Article",
    content: "Content of the new article",
  };

  const MOCK_ARTICLE_UPDATED = {
    title: "Updated Article",
    content: "Updated content",
  };

  beforeEach(() => {
    token = jwt.sign({ userId: USER_ID }, config.secretJwtToken);
    adminToken = jwt.sign({ userId: ADMIN_USER_ID }, config.secretJwtToken);

    mockingoose(User).toReturn(MOCK_USER, "findById");
    mockingoose(Article).toReturn(MOCK_ARTICLE_CREATED, "save");
  });

  describe("POST /api/articles - Article creation", () => {
    test("Should create an article with authenticated user", async () => {
      const spy = jest.spyOn(articlesService, "create").mockResolvedValue({
        _id: ARTICLE_ID,
        ...MOCK_ARTICLE_CREATED,
        user: USER_ID,
      });

      const spyGet = jest.spyOn(articlesService, "get").mockResolvedValue({
        _id: ARTICLE_ID,
        ...MOCK_ARTICLE_CREATED,
        user: MOCK_USER,
      });

      const res = await request(app)
        .post("/api/articles")
        .send(MOCK_ARTICLE_CREATED)
        .set("x-access-token", token);

      expect(res.status).toBe(201);
      expect(res.body.title).toBe(MOCK_ARTICLE_CREATED.title);
      expect(res.body.content).toBe(MOCK_ARTICLE_CREATED.content);

      spy.mockRestore();
      spyGet.mockRestore();
    });

    test("Should reject creation without authentication token", async () => {
      const res = await request(app)
        .post("/api/articles")
        .send(MOCK_ARTICLE_CREATED);

      expect(res.status).toBe(401);
    });

    test("Should call articlesService.create", async () => {
      const spy = jest.spyOn(articlesService, "create").mockResolvedValue({
        _id: ARTICLE_ID,
        ...MOCK_ARTICLE_CREATED,
        user: USER_ID,
      });

      jest.spyOn(articlesService, "get").mockResolvedValue({
        _id: ARTICLE_ID,
        ...MOCK_ARTICLE_CREATED,
        user: MOCK_USER,
      });

      await request(app)
        .post("/api/articles")
        .send(MOCK_ARTICLE_CREATED)
        .set("x-access-token", token);

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith({
        ...MOCK_ARTICLE_CREATED,
        user: USER_ID,
      });
    });
  });

  describe("PUT /api/articles/:id - Article update", () => {
    test("Should allow admin to update an article", async () => {
      jest.spyOn(User, "findById").mockResolvedValue(MOCK_ADMIN_USER);
      mockingoose(Article).toReturn(
        {
          _id: ARTICLE_ID,
          ...MOCK_ARTICLE_UPDATED,
          user: MOCK_ADMIN_USER,
        },
        "findOneAndUpdate"
      );

      const res = await request(app)
        .put(`/api/articles/${ARTICLE_ID}`)
        .send(MOCK_ARTICLE_UPDATED)
        .set("x-access-token", adminToken);

      expect(res.status).toBe(200);
    });

    test("Should reject update by non-admin user", async () => {
      jest.spyOn(User, "findById").mockResolvedValue(MOCK_USER);

      const res = await request(app)
        .put(`/api/articles/${ARTICLE_ID}`)
        .send(MOCK_ARTICLE_UPDATED)
        .set("x-access-token", token);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("administrators");
    });

    test("Should reject update without token", async () => {
      const res = await request(app)
        .put(`/api/articles/${ARTICLE_ID}`)
        .send(MOCK_ARTICLE_UPDATED);

      expect(res.status).toBe(401);
    });

    test("Should call articlesService.update", async () => {
      jest.spyOn(User, "findById").mockResolvedValue(MOCK_ADMIN_USER);
      const spy = jest.spyOn(articlesService, "update").mockResolvedValue({
        _id: ARTICLE_ID,
        ...MOCK_ARTICLE_UPDATED,
        user: MOCK_ADMIN_USER,
      });

      await request(app)
        .put(`/api/articles/${ARTICLE_ID}`)
        .send(MOCK_ARTICLE_UPDATED)
        .set("x-access-token", adminToken);

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(ARTICLE_ID, MOCK_ARTICLE_UPDATED);
    });
  });

  describe("DELETE /api/articles/:id - Article deletion", () => {
    test("Should allow admin to delete an article", async () => {
      jest.spyOn(User, "findById").mockResolvedValue(MOCK_ADMIN_USER);
      mockingoose(Article).toReturn({ deletedCount: 1 }, "deleteOne");

      const res = await request(app)
        .delete(`/api/articles/${ARTICLE_ID}`)
        .set("x-access-token", adminToken);

      expect(res.status).toBe(204);
    });

    test("Should reject deletion by non-admin user", async () => {
      jest.spyOn(User, "findById").mockResolvedValue(MOCK_USER);

      const res = await request(app)
        .delete(`/api/articles/${ARTICLE_ID}`)
        .set("x-access-token", token);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("administrators");
    });

    test("Should reject deletion without token", async () => {
      const res = await request(app).delete(`/api/articles/${ARTICLE_ID}`);

      expect(res.status).toBe(401);
    });

    test("Should return 404 if article does not exist", async () => {
      jest.spyOn(User, "findById").mockResolvedValue(MOCK_ADMIN_USER);
      const spy = jest
        .spyOn(articlesService, "delete")
        .mockResolvedValue({ deletedCount: 0 });

      const res = await request(app)
        .delete(`/api/articles/${ARTICLE_ID}`)
        .set("x-access-token", adminToken);

      expect(res.status).toBe(404);
      spy.mockRestore();
    });

    test("Should call articlesService.delete", async () => {
      jest.spyOn(User, "findById").mockResolvedValue(MOCK_ADMIN_USER);
      const spy = jest
        .spyOn(articlesService, "delete")
        .mockResolvedValue({ deletedCount: 1 });

      await request(app)
        .delete(`/api/articles/${ARTICLE_ID}`)
        .set("x-access-token", adminToken);

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(ARTICLE_ID);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockingoose.resetAll();
  });
});
