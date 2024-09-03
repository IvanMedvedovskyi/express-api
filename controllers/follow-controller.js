const { prisma } = require("../prisma/prisma-client");
const generateErrorResponse = require("./generateErrorResponse");

const FollowController = {
  followUser: async (req, res) => {
    const { followingId } = req.body;
    const userId = req.user.userId;

    if (followingId === userId) {
      return generateErrorResponse(
        res,
        500,
        "Вы не можете подписаться на самого себя"
      );
    }

    try {
      const existingFollow = await prisma.follows.findFirst({
        where: {
          AND: [{ followerId: userId }, { followingId }],
        },
      });

      if (existingFollow) {
        return generateErrorResponse(res, 400, "Подписка уже существует");
      }

      await prisma.follows.create({
        data: {
          follower: { connect: { id: userId } },
          following: { connect: { id: followingId } },
        },
      });

      res.status(201).json({ message: "Подписка успешно создана" });
    } catch (error) {
      console.error("Follow error", error);
      return generateErrorResponse(res, 500, "Internal server error");
    }
  },
  unFollowUser: async (req, res) => {
    const { followingId } = req.body;
    const userId = req.user.userId;

    try {
      const follows = await prisma.follows.findFirst({
        where: {
          AND: [{ followerId: userId }, { followingId }],
        },
      });

      if (!follows) {
        return generateErrorResponse(
          res,
          404,
          "Вы не подписаны на этого пользователя"
        );
      }

      await prisma.follows.delete({
        where: { id: follows.id },
      });

      res.status(201).json({ message: "Вы отписались" });
    } catch (error) {
      console.error("UnFollow error", error);
      return generateErrorResponse(res, 500, "Internal server error");
    }
  },
};

module.exports = FollowController;
