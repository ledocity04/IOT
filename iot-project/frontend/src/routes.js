import React from 'react'

const Dashboard = React.lazy(() => import("./pages/Dashboard"))
const DataSensor = React.lazy(() => import("./pages/DataSensor"))
const ActionHistory = React.lazy(() => import("./pages/ActionHistory"))
const Profile = React.lazy(() => import("./pages/Profile"))

const routes = [
    {path: '/', name: 'Dashboard', element: Dashboard},
    {path: '/datasensor', name: 'DataSensor', element: DataSensor},
    {path: '/actionhistory', name: 'ActionHistory', element: ActionHistory},
    {path: '/profile', name: 'Profile', element: Profile},
]

export default routes