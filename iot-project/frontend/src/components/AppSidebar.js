import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CSidebar,
  CSidebarHeader,
  CSidebarBrand,
  CSidebarFooter,
} from "@coreui/react";

import CIcon from "@coreui/icons-react";

import { AppSidebarNav } from "./AppSidebarNav";
import navigation from "../_nav";
import logo from "../assets/logo.png";

import '@fortawesome/fontawesome-free/css/all.min.css'; // Import FontAwesome

const AppSidebar = () => {
  const dispatch = useDispatch();
  const unfoldable = useSelector((state) => state.sidebarUnfoldable);
  const sidebarShow = useSelector((state) => state.sidebarShow);

  return (
    <>
      <CSidebar
        className="border-end"
        colorScheme="dark"
        position="fixed"
        visible={sidebarShow}
        unfoldable={unfoldable}
        onVisibleChange={(visible) => {
          dispatch({ type: "set", sidebarShow: visible });
        }}
      >
        <CSidebarHeader className="border-bottom">
          <CSidebarBrand className="sidebar-brand-full" style={{ textDecoration: 'none', fontWeight: 'bold'}}>
            <img src={logo} alt="Logo" height={32} className="sidebar-brand-full" />
            &nbsp; IoT Project
          </CSidebarBrand>
        </CSidebarHeader>

        <AppSidebarNav items={navigation} className="sidebar-nav" />
        <CSidebarFooter className="border-top d-none d-lg-flex">
        </CSidebarFooter>
      </CSidebar>
    </>
  );
};

export default React.memo(AppSidebar);
