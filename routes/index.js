const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  UserController,
  PostController,
  CommentController,
  LikeController,
  FollowController,
} = require("../controllers/index.js");
const authenticationToken = require("../middleware/checkAuth.js");

const uploadDestination = "uploads";

//Показываем, где хранить файлы
const storage = multer.diskStorage({
  destination: uploadDestination,
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const uploads = multer({ storage: storage });

//Роуты для пользователя
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/current", authenticationToken, UserController.current);
router.get("/users/:id", authenticationToken, UserController.getUserById);
router.put("/users/:id", authenticationToken, uploads.single('avatar'), UserController.updateUser);

//Роуты постов
router.post("/posts", authenticationToken, PostController.createPost);
router.get("/posts", authenticationToken, PostController.getAllPosts);
router.get("/posts/:id", authenticationToken, PostController.getPostById);
router.delete("/posts/:id", authenticationToken, PostController.deletePost);

//Роуты комментариев
router.post("/comments", authenticationToken, CommentController.createComment);
router.delete(
  "/comments/:id",
  authenticationToken,
  CommentController.deleteComment
);

//Роуты для лайков
router.post("/likes", authenticationToken, LikeController.likePost);
router.delete("/likes/:id", authenticationToken, LikeController.unlikePost);

//Роуты для подписок/отписок
router.post("/follow", authenticationToken, FollowController.followUser);
router.delete(
  "/follow/:id",
  authenticationToken,
  FollowController.unFollowUser
);

module.exports = router;
