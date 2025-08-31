require("dotenv").config();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const saltRounds = 10;

const createUserService = async (name, email, password) => {
    try {
        // Kiểm tra xem người dùng đã tồn tại chưa
        const user = await User.findOne({ email: email });
        if (user) {
            console.log(`>>> user ${email} đã tồn tại, chọn 1 email khác`);
            return null;
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Lưu người dùng vào cơ sở dữ liệu
        const result = await User.create({
            name: name,
            email: email,
            password: hashedPassword,
            role: "User",
        });

        return result;
    } catch (error) {
        console.log(error);
        return null;
    }
};

const loginService = async (email, password) => {
    try {
        // Lấy người dùng theo email
        const user = await User.findOne({ email: email });

        if (user) {
            // So sánh mật khẩu
            const isMatchPassword = await bcrypt.compare(password, user.password);

            if (isMatchPassword) {
                // Tạo access token
                const payload = {
                    email: user.email,
                    name: user.name,
                };
                const accessToken = jwt.sign(
                    payload,
                    process.env.JWT_SECRET,
                    {
                        expiresIn: process.env.JWT_EXPIRE
                    }
                );

                return {
                    EC: 0,
                    EM: "Đăng nhập thành công!",
                    DT: {
                        accessToken: accessToken,
                        user: {
                            email: user.email,
                            name: user.name,
                        },
                    },
                };
            } else {
                return {
                    EC: 2,
                    EM: "Email/Password không hợp lệ",
                    DT: ""
                };
            }
        } else {
            return {
                EC: 1,
                EM: "Email/Password không hợp lệ",
                DT: ""
            };
        }
    } catch (error) {
        console.log(error);
        return null;
    }
};

const getUserService = async () => {
    try {
        // Lấy tất cả người dùng, không bao gồm mật khẩu
        let result = await User.find({}).select("-password");
        return result;
    } catch (error) {
        console.log(error);
        return null;
    }
};

module.exports = {
    createUserService,
    loginService,
    getUserService,
};