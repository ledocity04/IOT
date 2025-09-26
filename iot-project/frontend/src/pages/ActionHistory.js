import React, { useEffect, useState, useRef } from "react";
import { CHeader, CContainer } from "@coreui/react";
import DataTable from "react-data-table-component";
import Pagination from "@mui/material/Pagination";
import { FaRegCopy } from "react-icons/fa";

import {
  TiArrowSortedDown as SortDown,
  TiArrowSortedUp as SortUp,
  TiArrowUnsorted as UnSort,
} from "react-icons/ti";
import { CiSearch } from "react-icons/ci";
import axios from "axios";

function ActionHistory(props) {
  const [record, setRecord] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("");
  const [sort, setSort] = useState("desc");
  const [activeColumn, setActiveColumn] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  // Copy state
  const [copiedId, setCopiedId] = useState(null);
  const copyTimeoutRef = useRef(null);

  useEffect(() => {
    fetchData({
      searchTerm,
      dateFilter,
      deviceFilter,
    });
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async (filters = {}) => {
    try {
      const response = await axios.get("http://localhost:8081/history_search", {
        params: filters,
      });
      console.log(response.data);
      setCurrentPage(1);
      setRecord(response.data.data || []);
      setTotalRows(response.data.totalRows || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSort = (column) => {
    const newSortOrder =
      sort === "desc" ? "asc" : sort === "asc" ? "desc" : "desc";
    setSort(newSortOrder);
    setActiveColumn(column);

    const fetch = async () => {
      try {
        const response = await axios.get("http://localhost:8081/sort_history", {
          params: {
            column,
            sort: newSortOrder,
          },
        });
        setRecord(response.data || []);
      } catch (error) {
        console.error("Error fetching sorted data:", error);
      }
    };

    fetch();
  };

  const sortIcon = (column) => {
    if (activeColumn === column) {
      if (sort === "asc")
        return <SortUp style={{ fontSize: "1rem", cursor: "pointer" }} />;
      if (sort === "desc")
        return <SortDown style={{ fontSize: "1rem", cursor: "pointer" }} />;
    }
    return <UnSort style={{ fontSize: "1rem", cursor: "pointer" }} />;
  };

  const handleCopyTime = async (text, id, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
      if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();
    }
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const columns = [
    {
      name: (
        <>
          ID
          <span onClick={() => handleSort("id")}>{sortIcon("id")}</span>
        </>
      ),
      selector: (row) => row.id,
      sortable: true,
    },
    {
      name: (
        <>
          Thiết bị
          <span onClick={() => handleSort("device")}>{sortIcon("device")}</span>
        </>
      ),
      selector: (row) => row.device,
      sortable: true,
    },
    {
      name: (
        <>
          Hành động
          <span onClick={() => handleSort("action")}>{sortIcon("action")}</span>
        </>
      ),
      selector: (row) => row.action,
      sortable: true,
    },
    // Thời gian column (react-data-table-component compatible)
    {
      name: (
        <>
          Thời gian
          <span onClick={() => handleSort("time")}>{sortIcon("time")}</span>
        </>
      ),
      // use `cell` to render custom content + copy button and prevent row click
      cell: (row) => {
        const timeText = row.time || row.date || row.timestamp || "";
        const id = row.id ?? row.key ?? timeText;
        return (
          <div
            className="time-cell"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span style={{ display: "inline-block" }}>{timeText}</span>
            <button
              type="button"
              onClick={(e) => handleCopyTime(timeText, id, e)}
              onMouseDown={(e) => e.stopPropagation()}
              title={copiedId === id ? "Copied" : "Copy"}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 4,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <FaRegCopy />
            </button>
            {copiedId === id ? (
              <small style={{ color: "#28a745", marginLeft: 4 }}>Copied</small>
            ) : null}
          </div>
        );
      },
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      minWidth: "220px",
    },
  ];

  const handleSearch = () => {
    fetchData({
      searchTerm,
      dateFilter,
      deviceFilter,
    });
  };

  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDeviceFilterChange = (e) => {
    setDeviceFilter(e.target.value);
  };

  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    fetchData({
      searchTerm,
      dateFilter,
      deviceFilter,
      pageSize,
      currentPage: value,
    });
  };

  const handlePageSize = (e) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    fetchData({
      searchTerm,
      deviceFilter,
      dateFilter,
      pageSize: newSize,
      currentPage,
    });
  };

  return (
    <>
      <CHeader position="sticky" className="bg-white shadow-sm mb-4">
        <CContainer className="justify-content-center">
          <div className="mx-auto">
            <strong>Action History</strong>
          </div>
        </CContainer>
      </CHeader>

      <div className="mb-4 d-flex justify-content-center">
        <select
          className="form-select me-3"
          style={{ maxWidth: "150px" }}
          onChange={handleDeviceFilterChange}
          value={deviceFilter}
        >
          <option value="">Tất cả thiết bị</option>
          <option value="đèn">Đèn</option>
          <option value="điều hoà">Điều hoà</option>
          <option value="quạt">Quạt</option>
        </select>

        <div className="input-group" style={{ maxWidth: "300px" }}>
          <span className="input-group-text">
            <CiSearch />
          </span>
          <input
            type="text"
            className="form-control"
            onChange={handleSearchTermChange}
            placeholder="Tìm kiếm..."
            value={searchTerm}
          />
        </div>
        <button
          type="button"
          className="btn btn-outline-primary ms-3"
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
        value={dateFilter}
      />

      <DataTable columns={columns} data={record} highlightOnHover />

      <div className="d-flex justify-content-center mt-3">
        <select
          className="form-select me-3"
          style={{ maxWidth: "150px" }}
          onChange={handlePageSize}
          value={String(pageSize)}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="30">30</option>
          <option value="50">50</option>
        </select>
        <Pagination
          count={Math.max(1, Math.ceil(totalRows / pageSize))}
          page={currentPage}
          siblingCount={2}
          onChange={handlePageChange}
        />
      </div>
      <br />
    </>
  );
}

export default ActionHistory;
