const { createUserService, loginService, getUserService } = require("../services/userService");

const createUser = async (req, res) => {
    const data = await createUserService(req.body.name, req.body.email, req.body.password);
    return res.status(200).json(data);
};

const handleLogin = async (req, res) => {
    const data = await loginService(req.body.email, req.body.password);
    return res.status(200).json(data);
};

const getUser = async (req, res) => {
    const data = await getUserService();
    return res.status(200).json(data);
};

const getAccount = async (req, res) => {
    return res.status(200).json(req.user);
};

module.exports = { createUser, handleLogin, getUser, getAccount };
