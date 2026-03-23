import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import { toast } from "react-toastify";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [amount, setAmount] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({ userName: "", roleId: "" });
  const navigate = useNavigate();
  const roleId = localStorage.getItem("roleId");
  const isSuperUser = roleId === "2";

  useEffect(() => {
    if (!isSuperUser) return;

    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch("http://localhost:7270/api/Users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Could not load users");
      }
    };

    fetchUsers();
  }, [isSuperUser]);

  if (!isSuperUser) {
    return <p className="text-center text-red-600">Unauthorized access</p>;
  }

  const fundUser = async (userId) => {
    if (!amount) {
      toast.warning("Please enter an amount.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:7270/api/Account/FundUserAccount", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usersId: userId,
          amount: parseFloat(amount),
          note: "Funded by SuperUser",
        }),
      });

      if (!response.ok) {
        throw new Error("Funding failed");
      }

      toast.success("User funded successfully");
      setAmount("");
      setSelectedUserId(null);
    } catch (error) {
      console.error("Funding error:", error);
      toast.error("Failed to fund user");
    }
  };

  const deleteUser = async (userId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:7270/api/Users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete user");

      toast.success("User deleted successfully");
      setUsers(users.filter((user) => user.id !== userId));
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Could not delete user");
    }
  };

  const handleUpdateUser = async (userId) => {
  try {
    const token = localStorage.getItem("token");

    const payload = {
      id: userId,
      userName: editFormData.userName,
      email: users.find((u) => u.id === userId)?.email ?? "", // preserve original email
      password: "Default123_", // you can choose to keep a default or prompt for it
      roleId: parseInt(editFormData.roleId),
      isActive: true,
    };

    console.log("Sending update payload:", payload); // <- Debug

    const res = await fetch(`http://localhost:7270/api/Users/${userId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Failed to update user");
    }

    const data = await res.json();
    toast.success(data.message || "User updated successfully");

    // Refresh or update user list here
    setEditingUserId(null);
  } catch (error) {
    console.error("Update error:", error);
    toast.error("Could not update user");
  }
};

  return (
    <div className="home-container">
      <nav className="navbar">
        <h1 className="usermanagement-title">User Management</h1>
        <button className="usermanagement-button" onClick={() => navigate(-1)}>
          Back
        </button>
      </nav>

      <div className="usermanagement-container">
        <div className="usermanagement-list">
          {users.map((user) => (
            <div className="usermanagement-card" key={user.id}>
              {editingUserId === user.id ? (
                <>
                  <input
                    type="text"
                    value={editFormData.userName}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, userName: e.target.value })
                    }
                    className="usermanagement-input"
                    placeholder="Username"
                  />
                  <select
                    value={editFormData.roleId}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, roleId: e.target.value })
                    }
                    className="usermanagement-input"
                  >
                    <option value="">Select Role</option>
                    <option value="1">User</option>
                    <option value="2">SuperUser</option>
                  </select>
                  <button
                    className="usermanagement-button"
                    onClick={() => handleUpdateUser(user.id)}
                  >
                    Save
                  </button>
                  <button
                    className="usermanagement-button usermanagement-cancel"
                    onClick={() => setEditingUserId(null)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <p><strong>Name:</strong> {user.userName}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>ID:</strong> {user.id}</p>
                   <p><strong>Role:</strong> {user.roleId === 2 ? "SuperUser" : "User"}</p>
                  <p><strong>Balance:</strong> R{user.balance?.toFixed(2) ?? "0.00"}</p>

                  {selectedUserId === user.id ? (
                    <div className="usermanagement-fund-form">
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="usermanagement-input"
                      />
                      <button
                        className="fund-usermanagement-button"
                        onClick={() => fundUser(user.id)}
                      >
                        Confirm Fund
                      </button>
                      <button
                        className="usermanagement-button usermanagement-cancel"
                        onClick={() => setSelectedUserId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="usermanagement-button-group">
                      <button
                        className="fund-usermanagement-button"
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        Fund
                      </button>
                     <button
                     className="usermanagement-button"
                    onClick={() => {
                    setEditingUserId(user.id);
                     setEditFormData({
                      userName: user.userName ?? "",
                     roleId: user.roleId !== undefined && user.roleId !== null
                   ? user.roleId.toString()
                   : "1", // default to "1" (User)
                         });
                        }}
                     >
                        Edit
                      </button>
                      <button
                        className="usermanagement-button usermanagement-delete"
                        onClick={() => deleteUser(user.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
