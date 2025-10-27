import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import styled from "styled-components";
import { useAppSelector } from "../stores/hooks";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const LayoutContainer = styled.div`
  min-height: 100vh;
  background: #f9fafb;
`;

const MainContent = styled.main`
  margin-top: 80px;
  margin-left: ${(props) => (props.sidebarVisible ? "240px" : "0")};
  margin-bottom: 100px;
  padding: 32px;
  min-height: calc(100vh - 180px);
  transition: margin-left 0.3s ease;
`;

function Layout() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const { userType, branchId } = useAppSelector((state) => state.auth);

  const handleToggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return React.createElement(
    LayoutContainer,
    null,
    React.createElement(Header, {
      onToggleSidebar: handleToggleSidebar,
      sidebarVisible,
      userType,
      branchId,
    }),
    React.createElement(Sidebar, {
      isVisible: sidebarVisible,
      userType,
      branchId,
    }),
    React.createElement(
      MainContent,
      { sidebarVisible },
      React.createElement(Outlet, null)
    ),
    React.createElement(Footer, { sidebarVisible })
  );
}

export default Layout;
