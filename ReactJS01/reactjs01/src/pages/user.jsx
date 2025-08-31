import React, { useEffect, useState } from "react";
import { notification, Table } from "antd";
import { getUserApi } from "../util/api.js";

const UserPage = () => {
  const [dataSource, setDataSource] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserApi();
        if (res) {
          setDataSource(res);
        } else {
          notification.error({
            message: "unauthorized",
            description: res.message,
          });
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUser();
  }, []);

  const columns = [
    {
      title: "Id",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
    },
  ];

  return (
    <div style={{ padding: 30 }}>
      <Table bordered dataSource={dataSource} columns={columns} rowKey={"id"} />
    </div>
  );
};

export default UserPage;
