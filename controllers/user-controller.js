const { prisma } = require("../prisma/prisma-client");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const jdenticon = require("jdenticon");
const path = require("path");
const fs = require("fs");
const generateErrorResponse = require("./generateErrorResponse");

const UserController = {
  register: async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return generateErrorResponse(res, 400, "Все поля обязательны");
    }

    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (existingUser) {
        return generateErrorResponse(res, 400, "Пользователь уже существует");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const png = jdenticon.toPng(`${name}${Date.now()}`, 200);
      const avatarName = `${name}_${Date.now()}.png`;

      const uploadDir = path.join(__dirname, "../uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const avatarPath = path.join(uploadDir, avatarName);
      fs.writeFileSync(avatarPath, png);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          avatarUrl: `/uploads/${avatarName}`,
        },
      });

      res.json(user);
    } catch (error) {
      console.error("Error in register", error);
      return generateErrorResponse(res, 500, "Internal server error");
    }
  },
  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return generateErrorResponse(res, 400, "Все поля обязательны");
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return generateErrorResponse(res, 400, "Неверный логин или пароль");
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return generateErrorResponse(res, 400, "Неверный логин или пароль");
      }

      const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY);

      res.json({ token });
    } catch (error) {
      console.error("Login error", error);
      return generateErrorResponse(res, 500, "Internal server error");
    }
  },
  current: async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: req.user.userId
        },
        include: {
          followers: {
            include: {
              follower: true
            }
          },
          following: {
            include: {
              following: true
            }
          }
        }
      })

      if (!user) {
        return generateErrorResponse(res, 400, "Не удалось найти пользователя")
      }

      res.json(user)
    } catch (error) {
      console.log("Get current error", error)
      return generateErrorResponse(res, 500, "Internal server error")
    }
  },
  getUserById: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          followers: true,
          following: true
        },
      });

      if (!user) {
        return generateErrorResponse(res, 404, "Пользователь не найден");
      }

      const isFollowingToUser = await prisma.follows.findFirst({
        where: {
          AND: [
            { followerId: userId},
            { followingId: id }
          ]
        }
      })

      res.json({...user, isFollowingToUser: Boolean(isFollowingToUser)})
    } catch (error) {
      console.log("Get Current Error", error)
      return generateErrorResponse(res, 500, "Internal Server")
    }
  },
  updateUser: async (req, res) => {
    const { id } = req.params;
    const { email, name, dateOfBirth, bio, location } = req.body;
    
    let filePath;

    if(req.file && req.file.path) {
      filePath = req.file.path
    }

    if (id !== req.user.userId) {
      return generateErrorResponse(res, 403, "Нет доступа")
    }

    try {
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: { email }
        })

        if (existingUser && existingUser.id !== id) {
            return generateErrorResponse(res, 400, "Почта уже используется")
        }
      }

      const user = await prisma.user.update({
        where: {id},
        data: {
          email: email || undefined,
          name: name || undefined,
          avatarUrl: filePath ? `/${filePath}` : undefined,
          dateOfBirth: dateOfBirth || undefined,
          bio: bio || undefined,
          location: location || undefined
        }
      })

      res.json(user)
    } catch (error) {
      console.log("Updated user error", error)
      return generateErrorResponse(res, 500, "Internal server error")
    }
  },
};

module.exports = UserController;
