import { Routes, Route, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import Dashboard from './pages/Dashboard'
import PersonnelRegistry from './pages/PersonnelRegistry'
import PersonnelCard from './pages/PersonnelCard'
import ExcludedPersonnel from './pages/ExcludedPersonnel'
import OrgStructure from './pages/OrgStructure'
import StaffingTable from './pages/StaffingTable'
import PositionRegistry from './pages/PositionRegistry'
import StaffRoster from './pages/StaffRoster'
import Movements from './pages/Movements'
import StatusBoard from './pages/StatusBoard'
import MonthlyAttendance from './pages/MonthlyAttendance'
import FormationReport from './pages/FormationReport'
import Orders from './pages/Orders'
import MissingDocuments from './pages/MissingDocuments'
import LeaveRecords from './pages/LeaveRecords'
import InjuriesLosses from './pages/InjuriesLosses'
import DocumentGenerator from './pages/DocumentGenerator'
import DocumentArchive from './pages/DocumentArchive'
import Statistics from './pages/Statistics'
import ImportExport from './pages/ImportExport'
import Settings from './pages/Settings'
import StatusTypesAdmin from './pages/StatusTypesAdmin'
import BrRolesAdmin from './pages/BrRolesAdmin'

// PageWrap — обгортка з key={pathname}, щоб React перемонтував контент при
// зміні роуту і CSS-анімація .alvares-page (fade+slide) зіграла кожного разу.
function PageWrap({ children }: { children: ReactNode }): JSX.Element {
  const loc = useLocation()
  return (
    <div key={loc.pathname} className="alvares-page">
      {children}
    </div>
  )
}

export default function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<PageWrap><Dashboard /></PageWrap>} />
      <Route path="/personnel" element={<PageWrap><PersonnelRegistry /></PageWrap>} />
      <Route path="/personnel/excluded" element={<PageWrap><ExcludedPersonnel /></PageWrap>} />
      <Route path="/personnel/:id" element={<PageWrap><PersonnelCard /></PageWrap>} />
      <Route path="/org-structure" element={<PageWrap><OrgStructure /></PageWrap>} />
      <Route path="/staffing" element={<PageWrap><StaffingTable /></PageWrap>} />
      <Route path="/positions" element={<PageWrap><PositionRegistry /></PageWrap>} />
      <Route path="/staff-roster" element={<PageWrap><StaffRoster /></PageWrap>} />
      <Route path="/movements" element={<PageWrap><Movements /></PageWrap>} />
      <Route path="/statuses" element={<PageWrap><StatusBoard /></PageWrap>} />
      <Route path="/attendance" element={<PageWrap><MonthlyAttendance /></PageWrap>} />
      <Route path="/formation-report" element={<PageWrap><FormationReport /></PageWrap>} />
      <Route path="/orders" element={<PageWrap><Orders /></PageWrap>} />
      <Route path="/missing-docs" element={<PageWrap><MissingDocuments /></PageWrap>} />
      <Route path="/leave" element={<PageWrap><LeaveRecords /></PageWrap>} />
      <Route path="/injuries" element={<PageWrap><InjuriesLosses /></PageWrap>} />
      <Route path="/documents/generate" element={<PageWrap><DocumentGenerator /></PageWrap>} />
      <Route path="/documents/archive" element={<PageWrap><DocumentArchive /></PageWrap>} />
      <Route path="/statistics" element={<PageWrap><Statistics /></PageWrap>} />
      <Route path="/import-export" element={<PageWrap><ImportExport /></PageWrap>} />
      <Route path="/settings" element={<PageWrap><Settings /></PageWrap>} />
      <Route path="/settings/statuses" element={<PageWrap><StatusTypesAdmin /></PageWrap>} />
      <Route path="/settings/br-roles" element={<PageWrap><BrRolesAdmin /></PageWrap>} />
    </Routes>
  )
}
