const { prisma } = require("../prisma/prisma-client");
const generateErrorResponse = require("./generateErrorResponse");

const PostController = {
  createPost: async (req, res) => {
    const { content } = req.body;

    const authorId = req.user.userId;

    if (!content) {
      return generateErrorResponse(res, 400, "Все поля обязательны");
    }

    try {
      const post = await prisma.post.create({
        data: {
          content,
          authorId,
        },
      });

      res.json(post);
    } catch (error) {
      console.log("Create Post Error", error);
      return generateErrorResponse(res, 500, "Internal Server Error");
    }
  },
  getAllPosts: async (req, res) => {
    const userId = req.user.userId;

    try {
      const posts = await prisma.post.findMany({
        include: {
          likes: true,
          author: true,
          comments: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const postWithLikeInfo = posts.map((post) => ({
        ...post,
        likedByUser: post.likes.some((like) => like.userId === userId),
      }));

      res.json(postWithLikeInfo);
    } catch (error) {
      console.log("GetAllPosts error", error);
      return generateErrorResponse(res, 500, "Internal Server Error");
    }
  },
  getPostById: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          comments: {
            include: {
              user: true,
            },
          },
          likes: true,
          author: true,
        },
      });

      if (!post) {
        return generateErrorResponse(res, 404, "Пост не найден");
      }

      const postWithLikeInfo = {
        ...post,
        likedByUser: post.likes.some((like) => like.userId === userId),
      };

      res.json(postWithLikeInfo);
    } catch (error) {
      console.log("GetPostByID Error", error);
      return generateErrorResponse(res, 500, "Internal server error");
    }
  },
  deletePost: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) {
      return generateErrorResponse(res, 404, "Пост не найден");
    }

    if (post.authorId !== userId) {
      return generateErrorResponse(res, 403, "Нет доступа");
    }

    try {
      const transaction = await prisma.$transaction([
        prisma.comment.deleteMany({ where: { postId: id } }),
        prisma.like.deleteMany({ where: { postId: id } }),
        prisma.post.delete({ where: { id } }),
      ]);

      res.json(transaction)
    } catch (error) {
        console.log("Delete post error", error)
        return generateErrorResponse(res, 500, "Internal Server Error")
    }
  },
};

module.exports = PostController;
