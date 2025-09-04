/*import React, { useState } from 'react';

import React, { useEffect, useState } from "react";
import axios from "axios";

function AccountModal({ usersId }) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`https://localhost:7271/api/Account/Balance/${usersId}`)
      .then((res) => {
        setBalance(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch balance:", err);
        setBalance("Error");
        setLoading(false);
      });
  }, [usersId]);

  if (loading) return <p>Loading balance...</p>;

  return (
    <div>
      <h2>Account Balance</h2>
      <p>{balance !== "Error" ? `R ${balance.toFixed(2)}` : "Could not load balance."}</p>
    </div>
  );
}


export default AccountModal; */
