import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import LoginPage from "../modules/auth/pages/LoginPage";
import ComedorScanPage from "../modules/comedor/pages/ComedorScanPage";
import ComedorRecargasPage from "../modules/comedor/pages/ComedorRecargasPage";
import ComedorSaldoPage from "../modules/comedor/pages/ComedorSaldoPage";
import UsersPage from "../modules/users/pages/UsersPage";
import UserFormPage from "../modules/users/pages/UserFormPage";
import ProfilesPage from "../modules/profiles/pages/ProfilesPage";
import ProfileFormPage from "../modules/profiles/pages/ProfileFormPage";
import DepartmentsPage from "../modules/departments/pages/DepartmentsPage";
import DepartmentFormPage from "../modules/departments/pages/DepartmentFormPage";
import PartnersPage from "../modules/partners/pages/PartnersPage";
import PartnerFormPage from "../modules/partners/pages/PartnerFormPage";
import EmployeeTypesPage from "../modules/employee-types/pages/EmployeeTypesPage";
import EmployeeTypeFormPage from "../modules/employee-types/pages/EmployeeTypeFormPage";
import ModulesPage from "../modules/modules/pages/ModulesPage";
import ModuleFormPage from "../modules/modules/pages/ModuleFormPage";
import ActionsPage from "../modules/actions/pages/ActionsPage";
import ActionFormPage from "../modules/actions/pages/ActionFormPage";
import PermissionsPage from "../modules/permissions/pages/PermissionsPage";
import ProtectedModuleRoute from "../shared/components/ProtectedModuleRoute";
import UserPermissionsPage from "../modules/user-permissions/pages/UserPermissionsPage";
import ComedorReportesPage from "../modules/comedor/pages/ComedorReportesPage";
import MyQRPage from "../modules/comedor/pages/MyQRPage";
import { usePermissions } from "../shared/hooks/usePermissions";
import { getFirstAllowedRoute } from "../shared/utils/getFirstAllowedRoute";
import LoaderOverlay from "../shared/components/LoaderOverlay";
import PreciosComedorPage from "../modules/comedor/pages/PreciosComedorPage";
import PaquetesComedorPage from "../modules/comedor/pages/PaquetesComedorPage";
import NoAccessPage from "../modules/auth/pages/NoAccessPage";
import SharedQRPage from "../modules/comedor/pages/SharedQRPage";
import OTNormalPage from "../modules/ordenes-trabajo/pages/OTNormalPage";
import FormulariosPage from "../modules/intranet/pages/FormulariosPage";
import OTAudiPage from "../modules/ordenes-trabajo/pages/OTAudiPage";
import OTSeguridadPage from "../modules/ordenes-trabajo/pages/OTSeguridadPage";
import DashboardPage from "../modules/ordenes-trabajo/pages/DashboardPage";
import FlashReportsPage from "../modules/ordenes-trabajo/pages/FlashReportsPage";
import SeguimientoFlashPage from "../modules/ordenes-trabajo/pages/SeguimientoFlashPage";
import DetallesOTPage from "../modules/ordenes-trabajo/pages/DetallesOTPage";
import SGCDocumentsPage from "../modules/sgc/pages/SGCDocumentsPage";
import SGCDocumentFormPage from "../modules/sgc/pages/SGCDocumentFormPage";
import SGCExternalDocumentsPage from "../modules/sgc/pages/SGCExternalDocumentsPage";

export default function AppRoutes({
  authenticated,
}: {
  authenticated: boolean;
}) {
  const { permissions, isLoading } = usePermissions();

  if (!authenticated) {
    return (
      <Routes>
        <Route path="/shared-qr/:token" element={<SharedQRPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (isLoading) {
    return <LoaderOverlay label="Validando permisos..." />;
  }

  const firstAllowedRoute = getFirstAllowedRoute(permissions);

  return (
    <Routes>
      <Route path="/shared-qr/:token" element={<SharedQRPage />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to={firstAllowedRoute} replace />} />
        <Route path="/sin-acceso" element={<NoAccessPage />} />

        <Route
          path="/comedor/my-qr"
          element={
            <ProtectedModuleRoute moduleName="MY_QR" actionName="VER">
              <MyQRPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/comedor/scan"
          element={
            <ProtectedModuleRoute moduleName="ESCANEO_COMEDOR" actionName="VER">
              <ComedorScanPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/comedor/recargas"
          element={
            <ProtectedModuleRoute
              moduleName="RECARGAS_COMEDOR"
              actionName="VER"
            >
              <ComedorRecargasPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/comedor/saldo"
          element={
            <ProtectedModuleRoute moduleName="CONSUMO_COMEDOR" actionName="VER">
              <ComedorSaldoPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/comedor/precios"
          element={
            <ProtectedModuleRoute moduleName="PRECIOS_COMEDOR" actionName="VER">
              <PreciosComedorPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/comedor/paquetes"
          element={
            <ProtectedModuleRoute
              moduleName="PAQUETES_COMEDOR"
              actionName="VER"
            >
              <PaquetesComedorPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/comedor/reportes"
          element={
            <ProtectedModuleRoute
              moduleName="REPORTES_COMEDOR"
              actionName="VER"
            >
              <ComedorReportesPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedModuleRoute moduleName="USUARIOS" actionName="VER">
              <UsersPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/users/new"
          element={
            <ProtectedModuleRoute moduleName="USUARIOS" actionName="CREAR">
              <UserFormPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/users/:id"
          element={
            <ProtectedModuleRoute moduleName="USUARIOS" actionName="EDITAR">
              <UserFormPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/profiles"
          element={
            <ProtectedModuleRoute moduleName="PERFILES" actionName="VER">
              <ProfilesPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/profiles/new"
          element={
            <ProtectedModuleRoute moduleName="PERFILES" actionName="CREAR">
              <ProfileFormPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/profiles/:id"
          element={
            <ProtectedModuleRoute moduleName="PERFILES" actionName="EDITAR">
              <ProfileFormPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/departments"
          element={
            <ProtectedModuleRoute moduleName="DEPARTAMENTOS" actionName="VER">
              <DepartmentsPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/departments/new"
          element={
            <ProtectedModuleRoute moduleName="DEPARTAMENTOS" actionName="CREAR">
              <DepartmentFormPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/departments/:id"
          element={
            <ProtectedModuleRoute
              moduleName="DEPARTAMENTOS"
              actionName="EDITAR"
            >
              <DepartmentFormPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/partners"
          element={
            <ProtectedModuleRoute moduleName="SOCIOS" actionName="VER">
              <PartnersPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/partners/new"
          element={
            <ProtectedModuleRoute moduleName="SOCIOS" actionName="CREAR">
              <PartnerFormPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/partners/:id"
          element={
            <ProtectedModuleRoute moduleName="SOCIOS" actionName="EDITAR">
              <PartnerFormPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/employee-types"
          element={
            <ProtectedModuleRoute moduleName="TIPOS_EMPLEADO" actionName="VER">
              <EmployeeTypesPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/employee-types/new"
          element={
            <ProtectedModuleRoute
              moduleName="TIPOS_EMPLEADO"
              actionName="CREAR"
            >
              <EmployeeTypeFormPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/employee-types/:id"
          element={
            <ProtectedModuleRoute
              moduleName="TIPOS_EMPLEADO"
              actionName="EDITAR"
            >
              <EmployeeTypeFormPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/modules"
          element={
            <ProtectedModuleRoute moduleName="MODULOS" actionName="VER">
              <ModulesPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/modules/new"
          element={
            <ProtectedModuleRoute moduleName="MODULOS" actionName="CREAR">
              <ModuleFormPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/modules/:id"
          element={
            <ProtectedModuleRoute moduleName="MODULOS" actionName="EDITAR">
              <ModuleFormPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/actions"
          element={
            <ProtectedModuleRoute moduleName="ACCIONES" actionName="VER">
              <ActionsPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/actions/new"
          element={
            <ProtectedModuleRoute moduleName="ACCIONES" actionName="CREAR">
              <ActionFormPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/actions/:id"
          element={
            <ProtectedModuleRoute moduleName="ACCIONES" actionName="EDITAR">
              <ActionFormPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/user-permissions"
          element={
            <ProtectedModuleRoute
              moduleName="PERMISOS_USUARIO"
              actionName="VER"
            >
              <UserPermissionsPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/permissions"
          element={
            <ProtectedModuleRoute moduleName="PERMISOS" actionName="VER">
              <PermissionsPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/ordenes-trabajo"
          element={
            <ProtectedModuleRoute moduleName="VER_OT" actionName="VER">
              <DashboardPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/ordenes-trabajo/normal"
          element={
            <ProtectedModuleRoute moduleName="OT_NORMAL" actionName="VER">
              <OTNormalPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/ordenes-trabajo/audi"
          element={
            <ProtectedModuleRoute moduleName="OT_AUDI" actionName="VER">
              <OTAudiPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/ordenes-trabajo/seguridad"
          element={
            <ProtectedModuleRoute moduleName="OT_SEGURIDAD" actionName="VER">
              <OTSeguridadPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/ordenes-trabajo/flash-reports"
          element={
            <ProtectedModuleRoute moduleName="OT_SEGURIDAD" actionName="VER">
              <FlashReportsPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/ordenes-trabajo/seguridad/:docnum/seguimiento"
          element={
            <ProtectedModuleRoute moduleName="OT_SEGURIDAD" actionName="VER">
              <SeguimientoFlashPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/ordenes-trabajo/:docnum"
          element={
            <ProtectedModuleRoute moduleName="VER_OT" actionName="VER">
              <DetallesOTPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/sgc/documentos"
          element={
            <ProtectedModuleRoute moduleName="SGC_DOCUMENTOS" actionName="VER">
              <SGCDocumentsPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/sgc/documentos/new"
          element={
            <ProtectedModuleRoute
              moduleName="SGC_DOCUMENTOS"
              actionName="CREAR"
            >
              <SGCDocumentFormPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/sgc/documentos/:id"
          element={
            <ProtectedModuleRoute
              moduleName="SGC_DOCUMENTOS"
              actionName="EDITAR"
            >
              <SGCDocumentFormPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/sgc/documentos-externos"
          element={
            <ProtectedModuleRoute moduleName="SGC_DOCUMENTOS" actionName="VER">
              <SGCExternalDocumentsPage />
            </ProtectedModuleRoute>
          }
        />

        <Route
          path="/intranet/formularios"
          element={
            <ProtectedModuleRoute moduleName="FORMULARIOS" actionName="VER">
              <FormulariosPage />
            </ProtectedModuleRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={firstAllowedRoute} replace />} />
    </Routes>
  );
}
