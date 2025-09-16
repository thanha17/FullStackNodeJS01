import React, { useContext, useState } from "react";
import {
  UsergroupAddOutlined,
  HomeOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Menu } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth.context.jsx";

const Header = () => {
  const navigate = useNavigate();
  const { auth, setAuth } = useContext(AuthContext);

  const items = [
    {
      label: <Link to="/">Home Page</Link>,
      key: "home",
      icon: <HomeOutlined />,
    },
    auth.isAuthenticated
      ? {
          label: <Link to="/users">Users Page</Link>,
          key: "user",
          icon: <UsergroupAddOutlined />,
        }
      : null,
    {
      label: "Welcome " + (auth?.user?.email ?? ""),
      key: "SubMenu",
      icon: <SettingOutlined />,
      children: [
        auth.isAuthenticated
          ? {
              label: (
                <span
                  onClick={() => {
                    localStorage.removeItem("access_token");
                    setAuth({
                      isAuthenticated: false,
                      user: { email: "", name: "" },
                    });
                    navigate("/");
                  }}
                >
                  Đăng xuất
                </span>
              ),
              key: "logout",
            }
          : {
              label: <Link to="/login">Đăng nhập</Link>,
              key: "login",
            },
      ],
    },
  ];

  const [current, setCurrent] = useState("home");
  const onClick = (e) => {
    setCurrent(e.key);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 1000,
      }}
    >
      <Menu
        onClick={onClick}
        selectedKeys={[current]}
        mode="horizontal"
        items={items}
      />
    </div>
  );
};

export default Header;
