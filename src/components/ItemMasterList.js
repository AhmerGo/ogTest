import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useSpring, animated } from "react-spring";
import Modal from "react-modal";
import axios from "axios";
import { useTheme } from "./ThemeContext";

Modal.setAppElement("#root");

const MasterList = () => {
  const { theme } = useTheme();
  const [data, setData] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    item_description: "",
    uom: "",
    use_quantity: "",
    use_cost: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(
        "https://test.ogfieldticket.com/api/jobitem.php?item_types=true"
      );
      if (response.data.success) {
        setData(response.data.itemTypes);
      }
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  const tableAnimation = useSpring({
    to: { opacity: 1, transform: "translateY(0)" },
    from: { opacity: 0, transform: "translateY(-20px)" },
    config: { tension: 220, friction: 20 },
  });

  const openModal = (item) => {
    setSelectedItem(item);
    setFormData({
      item_description: item.ItemDescription,
      uom: item.UOM,
      use_quantity: item.UseQuantity,
      use_cost: item.UseCost,
    });
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedItem(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.patch(
        "https://test.ogfieldticket.com/api/jobitem.php",
        {
          item_id: selectedItem.ItemID,
          ...formData,
        }
      );
      if (response.data.success) {
        fetchData();
        closeModal();
      } else {
        console.error("Error updating item", response.data.message);
      }
    } catch (error) {
      console.error("Error updating item", error);
    }
  };

  const tableClass =
    theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black";
  const headerClass =
    theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-200 text-black";
  const rowClass = theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100";
  const borderClass = theme === "dark" ? "border-gray-700" : "border-gray-200";
  const modalBgClass =
    theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black";
  const inputClass =
    theme === "dark"
      ? "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-900 text-white"
      : "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline";

  return (
    <animated.div style={tableAnimation} className="mt-8">
      <div
        className={`bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-xl rounded-lg overflow-hidden ${tableClass}`}
      >
        <div className="p-5 text-center">
          <h2 className="text-2xl font-bold">Master List</h2>
        </div>
        <table className={`min-w-full ${tableClass}`}>
          <thead>
            <tr className={headerClass}>
              <th className="w-1/6 py-3 px-4 uppercase font-semibold text-sm">
                Item ID
              </th>
              <th className="w-1/2 py-3 px-4 uppercase font-semibold text-sm">
                Description
              </th>
              <th className="w-1/6 py-3 px-4 uppercase font-semibold text-sm">
                UOM
              </th>
              <th className="w-1/12 py-3 px-4 uppercase font-semibold text-sm">
                Use Qty
              </th>
              <th className="w-1/12 py-3 px-4 uppercase font-semibold text-sm">
                Use Cost
              </th>
              <th className="w-1/12 py-3 px-4 uppercase font-semibold text-sm">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item.ItemID}
                className={`transition duration-300 ease-in-out transform hover:scale-105 ${rowClass}`}
              >
                <td className={`py-3 px-4 border-b ${borderClass}`}>
                  {item.ItemID}
                </td>
                <td className={`py-3 px-4 border-b ${borderClass}`}>
                  {item.ItemDescription}
                </td>
                <td className={`py-3 px-4 border-b ${borderClass}`}>
                  {item.UOM}
                </td>
                <td className={`py-3 px-4 border-b ${borderClass}`}>
                  {item.UseQuantity}
                </td>
                <td className={`py-3 px-4 border-b ${borderClass}`}>
                  {item.UseCost}
                </td>
                <td className={`py-3 px-4 border-b ${borderClass}`}>
                  <button
                    className="text-blue-500 hover:text-blue-700 transition duration-300 ease-in-out transform hover:scale-125 mr-2"
                    onClick={() => openModal(item)}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button className="text-red-500 hover:text-red-700 transition duration-300 ease-in-out transform hover:scale-125">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className="fixed inset-0 flex items-center justify-center p-4 mt-16"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        <div
          className={`rounded-lg overflow-hidden shadow-xl max-w-md w-full p-6 ${modalBgClass}`}
        >
          <h2 className="text-2xl mb-4">Edit Item</h2>
          {selectedItem && (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  className="block text-sm font-bold mb-2"
                  htmlFor="item_description"
                >
                  Description
                </label>
                <input
                  id="item_description"
                  name="item_description"
                  type="text"
                  value={formData.item_description}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2" htmlFor="uom">
                  UOM
                </label>
                <input
                  id="uom"
                  name="uom"
                  type="text"
                  value={formData.uom}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-sm font-bold mb-2"
                  htmlFor="use_quantity"
                >
                  Use Quantity
                </label>
                <input
                  id="use_quantity"
                  name="use_quantity"
                  type="text"
                  value={formData.use_quantity}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-sm font-bold mb-2"
                  htmlFor="use_cost"
                >
                  Use Cost
                </label>
                <input
                  id="use_cost"
                  name="use_cost"
                  type="text"
                  value={formData.use_cost}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="ml-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </animated.div>
  );
};

export default MasterList;
