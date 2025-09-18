import React, { useEffect, useState } from "react";
import { CHeader, CContainer } from "@coreui/react";
import DataTable from "react-data-table-component";
import { CiSearch } from "react-icons/ci";
import axios from "axios";
import Pagination from "@mui/material/Pagination";

import {
  TiArrowSortedDown as SortDown,
  TiArrowSortedUp as SortUp,
  TiArrowUnsorted as UnSort,
} from "react-icons/ti";

function DataSensor() {
  const [record, setRecord] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const [parameterFilter, setParameterFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState("desc");
  const [activeColumn, setActiveColumn] = useState(null); // Track the active column

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {}, [activeColumn, sort, currentPage, pageSize]);

  const handleSort = (column) => {
    const newSortOrder =
      sort === "desc" ? "asc" : sort === "asc" ? "desc" : "desc";
    setSort(newSortOrder);
    setActiveColumn(column); // Set the column as active

    const fetch = async () => {
      try {
        const response = await axios.get("http://localhost:8081/sort_sensor", {
          params: {
            column,
            sort: newSortOrder, // Send sort order (asc, desc, or all)
          },
        });
        setRecord(response.data); // Update data with sorted results
      } catch (error) {
        console.error("Error fetching sorted data:", error);
      }
    };

    fetch(); // Fetch sorted data from backend
  };

  const sortIcon = (column) => {
    // Show the correct icon only for the active column
    if (activeColumn === column) {
      if (sort === "asc")
        return <SortUp style={{ fontSize: "1rem", cursor: "pointer" }} />;
      if (sort === "desc")
        return <SortDown style={{ fontSize: "1rem", cursor: "pointer" }} />;
    }
    // Default icon for columns that aren't currently sorted
    return <UnSort style={{ fontSize: "1rem", cursor: "pointer" }} />;
  };

  const columns = [
    {
      name: (
        <>
          ID
          <span onClick={() => handleSort("id")}>{sortIcon("id")}</span>{" "}
        </>
      ),
      selector: (row) => row.id,
    },
    {
      name: (
        <>
          Nhiệt độ
          <span onClick={() => handleSort("temperature")}>
            {sortIcon("temperature")}
          </span>{" "}
        </>
      ),
      selector: (row) => row.temperature,
    },
    {
      name: (
        <>
          Độ ẩm
          <span onClick={() => handleSort("humidity")}>
            {sortIcon("humidity")}
          </span>{" "}
        </>
      ),
      selector: (row) => row.humidity,
    },
    {
      name: (
        <>
          Ánh sáng
          <span onClick={() => handleSort("lux")}>{sortIcon("lux")}</span>{" "}
        </>
      ),
      selector: (row) => row.lux,
    },
    {
      name: (
        <>
          Thời gian
          <span onClick={() => handleSort("date")}>
            {sortIcon("date")}
          </span>{" "}
        </>
      ),
      selector: (row) => row.date,
    },
  ];

  useEffect(() => {
    fetchData({
      searchTerm,
      dateFilter,
      parameterFilter,
    });
  }, []);

  const fetchData = async (filters = {}) => {
    try {
      const response = await axios.get("http://localhost:8081/sensor_search", {
        params: filters,
      });
      console.log(response.data);
      setCurrentPage(1)
      setRecord(response.data.data);
      setTotalRows(response.data.totalRows);
      // handlePageChange(currentPage);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSearch = () => {
    fetchData({
      searchTerm: searchTerm,
      dateFilter,
      parameterFilter,
    });
  };

  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value); // Search term will be debounced
  };

  const handleParameterFilterChange = (e) => {
    setParameterFilter(e.target.value);
  };

  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
  };

  const handleRowsPerPageChange = (newPageSize) => {
    setPageSize(newPageSize);
    fetchData(currentPage, newPageSize, {
      searchTerm,
      dateFilter,
      parameterFilter,
    });
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    fetchData({
      searchTerm,
      dateFilter,
      parameterFilter,
      pageSize, 
      currentPage: value, 
    });
  };

  const handlePageSize = (e) => {
    console.log(e.target.value);
    setPageSize(e.target.value);
    fetchData({
      searchTerm,
      parameterFilter,
      dateFilter,
      pageSize: e.target.value,
      currentPage,
    });
  };

  return (
    <>
      <CHeader position="sticky" className="bg-white shadow-sm mb-4">
        <CContainer className="justify-content-center">
          <div className="mx-auto">
            <strong>Datasensor</strong>
          </div>
        </CContainer>
      </CHeader>

      <div className="mb-4 d-flex justify-content-center">
        <select
          className="form-select me-3"
          style={{ maxWidth: "160px" }}
          defaultValue=""
          onChange={handleParameterFilterChange}
        >
          <option value="">Tất cả thông số</option>
          <option value="temp">Nhiệt độ</option>
          <option value="humidity">Độ ẩm</option>
          <option value="lux">Ánh sáng</option>
        </select>

        <div
          className="input-group"
          style={{ maxWidth: "300px", marginRight: "8px" }}
        >
          <span className="input-group-text">
            <CiSearch />
          </span>
          <input
            type="text"
            className="form-control"
            onChange={handleSearchTermChange} // Search will be debounced
            placeholder="Tìm kiếm..."
          />
        </div>
        <button
          type="button"
          className="btn btn-outline-primary ms-1"
          onClick={handleSearch}
        >
          Tìm kiếm
        </button>
      </div>

      <input
        type="date"
        className="form-control me-3"
        style={{ maxWidth: "200px" }}
        onChange={handleDateFilterChange}
      />

      <DataTable
        columns={columns}
        data={record}
        onChangePage={handlePageChange}
        onChangeRowsPerPage={handleRowsPerPageChange}
        highlightOnHover
      />

      <div className="d-flex justify-content-center mt-3">
        <select
          className="form-select me-3"
          style={{ maxWidth: "150px" }}
          onChange={handlePageSize}
          defaultValue=""
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="30">30</option>
          <option value="50">50</option>
        </select>
        <Pagination
          count={Math.ceil(totalRows / pageSize)}
          defaultPage={1}
          siblingCount={2} // Increase to show more sibling pages
          onChange={handlePageChange}
        />
      </div>
      <br />
    </>
  );
}

export default DataSensor;
