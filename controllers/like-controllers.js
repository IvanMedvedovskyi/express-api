const { prisma } = require("../prisma/prisma-client");
const generateErrorResponse = require("./generateErrorResponse");

const LikeController = {
  likePost: async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.userId;

    if (!postId) {
      return generateErrorResponse(res, 400, "Все поля обязательны");
    }

    try {
      const existingLike = await prisma.like.findFirst({
        where: { postId, userId },
      });

      if(existingLike) {
        return generateErrorResponse(res, 400, "Лайк уже поставлен");
      }

      const like = await prisma.like.create({
        data: {
            postId,
            userId
        }
      })

      res.json(like)
    } catch (error) {
        console.error("Error like post", error)
        return generateErrorResponse(res, 500, "Internal sever error")
    }
  },
  unlikePost: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    if(!id) {
        return generateErrorResponse(res, 400, "Вы уже поставили дизлайк")
    }

    try {
       const existingLike = await prisma.like.findFirst({
        where: {
            postId: id,
            userId
        }
       }) 

       if (!existingLike) {
        return generateErrorResponse(res, 400, "Нельзя поставить дизлайк")
       }

       const like = await prisma.like.deleteMany({
        where: { postId: id, userId }
       })

       res.json(like)
    } catch (error) {
        console.error("Error dislike post", error)
        return generateErrorResponse(res, 500, "Internal sever error")
    }
  },
};

module.exports = LikeController;
