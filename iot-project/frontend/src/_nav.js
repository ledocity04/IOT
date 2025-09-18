import React from 'react';
import CIcon from '@coreui/icons-react';
import { CNavTitle} from '@coreui/react';
import { cilHome, cilDescription, cilHistory, cilUser } from '@coreui/icons';
const _nav = [
  {
    component: CNavTitle,
    icon: <CIcon icon={cilHome} customClassName="nav-icon"/>,
    to: '/',
    name: 'Dashboard',
  },
  {
    component: CNavTitle,
    icon: <CIcon icon={cilDescription} customClassName="nav-icon"/>,
    to: '/datasensor',
    name: 'Data Sensor',
  },
  {
    component: CNavTitle,
    icon: <CIcon icon={cilHistory} customClassName="nav-icon"/>,
    to: '/actionhistory',
    name: 'Action History',
  },
  {
    component: CNavTitle,
    icon: <CIcon icon={cilUser} customClassName="nav-icon"/>,
    to: '/profile',
    name: 'Profile',
  }
];

export default _nav
