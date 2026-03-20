import { useEffect, useState } from "react";
import { fetchInventoryTransactions } from "../api/inventoryApi";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchInventoryTransactions();
        setTransactions(data);
      } catch (err) {
        setError(
          err.response?.data?.detail || "Failed to load transaction history.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  return (
    <section className="inventory-page">
      <div className="inventory-header">
        <h1 className="inventory-title">Transaction History</h1>
        <p className="inventory-subtitle">
          Review released medicines and inventory movement records.
        </p>
      </div>

      {error && <div className="inventory-alert-error">{error}</div>}

      <div className="inventory-card">
        {loading ? (
          <div className="inventory-empty">Loading transaction history...</div>
        ) : transactions.length === 0 ? (
          <div className="inventory-empty">No transaction history found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="inventory-table min-w-[760px]">
              <thead>
                <tr>
                  <th>Prescription</th>
                  <th>Medicine</th>
                  <th>Quantity</th>
                  <th>Type</th>
                  <th>Processed By</th>
                  <th>Released At</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.transaction_id}>
                    <td>{transaction.prescription_code}</td>
                    <td>{transaction.medicine_name}</td>
                    <td>{transaction.quantity_released}</td>
                    <td>{transaction.transaction_type}</td>
                    <td>{transaction.processed_by}</td>
                    <td>{transaction.released_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
