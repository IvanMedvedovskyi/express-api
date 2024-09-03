const e = require("express");
const { prisma } = require("../prisma/prisma-client");
const generateErrorResponse = require("./generateErrorResponse");

const CommentController = {
  createComment: async (req, res) => {
    const { postId, content } = req.body;
    const userId = req.user.userId;

    if (!postId || !content) {
      return generateErrorResponse(res, 400, "Все поля обязательны");
    }

    try {
      const comment = await prisma.comment.create({
        data: {
          postId,
          userId,
          content,
        },
      });

      res.json(comment);
    } catch (error) {
      console.log("Create comment error", error);
      return generateErrorResponse(res, 500, "Internal Server Error");
    }
  },
  deleteComment: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const comment = await prisma.comment.findUnique({
        where: { id },
      });

      if (!comment) {
        return generateErrorResponse(res, 404, "Комментарий не найден");
      }

      if (comment.userId !== userId) {
        return generateErrorResponse(res, 403, "Нет доступа");
      }

      await prisma.comment.delete({ where: { id } });

      res.json(comment)
    } catch (error) {
        console.error("Error deleting comment", error)
        return generateErrorResponse(res, 500, "Internal server error")
    }
  },
};

module.exports = CommentController;
