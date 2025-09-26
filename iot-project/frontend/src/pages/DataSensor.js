import React, { useEffect, useState, useRef } from "react";
import { CHeader, CContainer } from "@coreui/react";
import DataTable from "react-data-table-component";
import { CiSearch } from "react-icons/ci";
import { FaRegCopy } from "react-icons/fa";
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
  const [activeColumn, setActiveColumn] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  // Copy state
  const [copiedId, setCopiedId] = useState(null);
  const copyTimeoutRef = useRef(null);

  // new: track mounted state to avoid setState after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // updated fetchData: check isMountedRef before setState
  const fetchData = async (filters = {}) => {
    try {
      const response = await axios.get("http://localhost:8081/sensor_search", {
        params: filters,
      });
      // only update state if component still mounted
      if (!isMountedRef.current) return;
      console.log(response.data);
      setCurrentPage(1);
      setRecord(response.data.data || []);
      setTotalRows(response.data.totalRows || 0);
    } catch (error) {
      // ignore if unmounted, otherwise log
      if (isMountedRef.current) {
        console.error("Error fetching data:", error);
      }
    }
  };

  // updated handleSort: same mounted check
  const handleSort = (column) => {
    const newSortOrder =
      sort === "desc" ? "asc" : sort === "asc" ? "desc" : "desc";
    setSort(newSortOrder);
    setActiveColumn(column);

    const fetch = async () => {
      try {
        const response = await axios.get("http://localhost:8081/sort_sensor", {
          params: {
            column,
            sort: newSortOrder,
          },
        });
        if (!isMountedRef.current) return;
        setRecord(response.data || []);
      } catch (error) {
        if (isMountedRef.current)
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

  // copy handler
  const handleCopyTime = async (text, id) => {
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
          Nhiệt độ
          <span onClick={() => handleSort("temperature")}>
            {sortIcon("temperature")}
          </span>
        </>
      ),
      selector: (row) => row.temperature,
      sortable: true,
    },
    {
      name: (
        <>
          Độ ẩm
          <span onClick={() => handleSort("humidity")}>
            {sortIcon("humidity")}
          </span>
        </>
      ),
      selector: (row) => row.humidity,
      sortable: true,
    },
    {
      name: (
        <>
          Ánh sáng
          <span onClick={() => handleSort("lux")}>{sortIcon("lux")}</span>
        </>
      ),
      selector: (row) => row.lux,
      sortable: true,
    },
    {
      name: (
        <>
          Thời gian
          <span onClick={() => handleSort("date")}>{sortIcon("date")}</span>
        </>
      ),
      minWidth: "240px",
      // cập nhật: ignoreRowClick + allowOverflow + button để DataTable không trigger row click
      // render custom cell with copy button — ép 1 dòng bằng CSS inline (nowrap)
      cell: (row) => {
        const timeText = row.date || row.timestamp || row.created_at || "";
        const id = row.id ?? timeText;
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
          >
            <span style={{ display: "inline-block" }}>{timeText}</span>
            <button
              type="button"
              onClick={(e) => {
                // chặn mọi handler khác (row click, navigation, v.v.)
                e.stopPropagation();
                e.preventDefault();
                if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();
                handleCopyTime(timeText, id);
              }}
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
    },
  ];

  useEffect(() => {
    fetchData({
      searchTerm,
      dateFilter,
      parameterFilter,
    });
    // cleanup copy timeout on unmount
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    fetchData({
      searchTerm: searchTerm,
      dateFilter,
      parameterFilter,
    });
  };

  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleParameterFilterChange = (e) => {
    setParameterFilter(e.target.value);
  };

  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
  };

  const handleRowsPerPageChange = (newPageSize) => {
    setPageSize(newPageSize);
    fetchData({
      searchTerm,
      dateFilter,
      parameterFilter,
      pageSize: newPageSize,
      currentPage,
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
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    fetchData({
      searchTerm,
      parameterFilter,
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
            onChange={handleSearchTermChange}
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
          defaultValue={String(pageSize)}
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

export default DataSensor;
