import {
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
  useMediaQuery,
  type SelectChangeEvent,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import PageHeader from "../../../shared/components/PageHeader";
import LoaderOverlay from "../../../shared/components/LoaderOverlay";
import { getUsers, type UserRow } from "../../../services/users";
import {
  PermissionsService,
  type UserPermissionRow,
  type EffectivePermissionRow,
} from "../../../services/permissions";
import { ModulesService } from "../../../services/modules";
import { ActionsService } from "../../../services/actions";
import { showError, showSuccess } from "../../../shared/utils/swal";

type CellValue = "inherit" | "allow" | "deny";

type MatrixRow = {
  MODULOID: number;
  CLAVE: string;
  NOMBRE: string;
  RUTA?: string | null;
  PADRE_ID?: number | null;
  cells: Record<number, CellValue>;
  inherited: Record<number, boolean>;
};

type GroupedRows = {
  groupName: string;
  rows: MatrixRow[];
};

export default function UserPermissionsPage() {
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery("(max-width:900px)");

  const [users, setUsers] = useState<UserRow[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [rows, setRows] = useState<MatrixRow[]>([]);
  const [moduleActionMap, setModuleActionMap] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadCatalogs = async () => {
      setLoading(true);

      try {
        const [usersData, modulesData, actionsData, actionsMapData] =
          await Promise.all([
            getUsers(),
            ModulesService.getAll(),
            ActionsService.getAll(),
            ModulesService.getActionsMap(),
          ]);

        setUsers((usersData ?? []).filter((x) => Number(x.ACTIVO) === 1));
        setModules((modulesData ?? []).filter((x: any) => Number(x.ACTIVO) === 1));
        setActions((actionsData ?? []).filter((x: any) => Number(x.ACTIVO) === 1));

        const map = new Set<string>();

        actionsMapData.forEach((item: any) => {
          if (Number(item.ASIGNADA) === 1) {
            map.add(`${item.MODULOID}-${item.ACCIONID}`);
          }
        });

        setModuleActionMap(map);
      } catch (error: any) {
        showError(
          error?.response?.data?.message ||
            "No se pudieron cargar los catálogos"
        );
      } finally {
        setLoading(false);
      }
    };

    loadCatalogs();
  }, []);

  useEffect(() => {
    if (!selectedUser || modules.length === 0 || actions.length === 0) {
      setRows([]);
      return;
    }

    const loadUserPermissions = async () => {
      setLoading(true);

      try {
        const [directPermissions, effectivePermissions] = await Promise.all([
          PermissionsService.getUserPermissions(Number(selectedUser)),
          PermissionsService.getEffectivePermissions(Number(selectedUser)),
        ]);

        const directMap = new Map<string, UserPermissionRow>();
        directPermissions.forEach((p) => {
          directMap.set(`${p.MODULOID}-${p.ACCIONID}`, p);
        });

        const effectiveMap = new Map<string, EffectivePermissionRow>();
        effectivePermissions.forEach((p) => {
          effectiveMap.set(`${p.MODULOID}-${p.ACCIONID}`, p);
        });

        const matrix: MatrixRow[] = modules.map((m: any) => {
          const cells: Record<number, CellValue> = {};
          const inherited: Record<number, boolean> = {};

          actions.forEach((a: any) => {
            const key = `${m.MODULOID}-${a.ACCIONID}`;
            const direct = directMap.get(key);
            const effective = effectiveMap.get(key);

            inherited[a.ACCIONID] =
              Number(effective?.PERMITIDO_FINAL ?? 0) === 1;

            if (direct && Number(direct.ACTIVO) === 1) {
              cells[a.ACCIONID] =
                Number(direct.PERMITIDO) === 1 ? "allow" : "deny";
            } else {
              cells[a.ACCIONID] = "inherit";
            }
          });

          return {
            MODULOID: Number(m.MODULOID),
            CLAVE: String(m.CLAVE ?? ""),
            NOMBRE: String(m.NOMBRE ?? ""),
            RUTA: m.RUTA ?? null,
            PADRE_ID: m.PADRE_ID ?? null,
            cells,
            inherited,
          };
        });

        setRows(matrix);
      } catch (error: any) {
        showError(
          error?.response?.data?.message ||
            "No se pudieron cargar los permisos del usuario"
        );
      } finally {
        setLoading(false);
      }
    };

    loadUserPermissions();
  }, [selectedUser, modules, actions]);

  const parentMap = useMemo(() => {
    const map = new Map<number, string>();
    modules.forEach((m: any) => {
      map.set(Number(m.MODULOID), String(m.NOMBRE ?? "Sin grupo"));
    });
    return map;
  }, [modules]);

  const groupedRows = useMemo<GroupedRows[]>(() => {
    const groups = new Map<string, MatrixRow[]>();

    rows
      .filter((row) => {
        const clave = row.CLAVE.toUpperCase();
        return clave !== "ADMINISTRACION" && clave !== "COMEDOR";
      })
      .forEach((row) => {
        const groupName = row.PADRE_ID
          ? parentMap.get(Number(row.PADRE_ID)) ?? "Sin grupo"
          : "Otros";

        if (!groups.has(groupName)) groups.set(groupName, []);
        groups.get(groupName)?.push(row);
      });

    return Array.from(groups.entries()).map(([groupName, groupRows]) => ({
      groupName,
      rows: groupRows,
    }));
  }, [rows, parentMap]);

  const isActionAllowedForModule = (moduloId: number, accionId: number) => {
    return moduleActionMap.has(`${moduloId}-${accionId}`);
  };

  const changeCell = (
    moduloId: number,
    accionId: number,
    value: CellValue
  ) => {
    if (!isActionAllowedForModule(moduloId, accionId)) return;

    setRows((prev) =>
      prev.map((row) =>
        row.MODULOID === moduloId
          ? {
              ...row,
              cells: {
                ...row.cells,
                [accionId]: value,
              },
            }
          : row
      )
    );
  };

  const getFinalChip = (value: CellValue, inherited: boolean) => {
    return (
      <Chip
        size="small"
        sx={{ mt: 1 }}
        color={
          value === "allow"
            ? "success"
            : value === "deny"
            ? "error"
            : inherited
            ? "success"
            : "default"
        }
        label={
          value === "allow"
            ? "Final: permitido por usuario"
            : value === "deny"
            ? "Final: bloqueado por usuario"
            : inherited
            ? "Final: permitido por perfil"
            : "Final: sin permiso por perfil"
        }
      />
    );
  };

  const save = async () => {
    if (!selectedUser) {
      showError("Selecciona un usuario");
      return;
    }

    const permissions: UserPermissionRow[] = rows.flatMap((row) =>
      actions
        .filter((action: any) =>
          isActionAllowedForModule(row.MODULOID, action.ACCIONID)
        )
        .filter((action: any) => row.cells[action.ACCIONID] !== "inherit")
        .map((action: any) => ({
          USUARIOID: Number(selectedUser),
          MODULOID: row.MODULOID,
          ACCIONID: action.ACCIONID,
          PERMITIDO: row.cells[action.ACCIONID] === "allow" ? 1 : 0,
          ORIGEN: "USUARIO",
          ACTIVO: 1,
        }))
    );

    try {
      setSaving(true);

      await PermissionsService.replaceUserPermissions(
        Number(selectedUser),
        permissions
      );

      showSuccess("Permisos especiales actualizados correctamente");

      await queryClient.invalidateQueries({ queryKey: ["my-permissions"] });
      await queryClient.invalidateQueries({ queryKey: ["modules-sidebar"] });
    } catch (error: any) {
      showError(
        error?.response?.data?.message ||
          "No se pudieron guardar los permisos del usuario"
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedUserData = users.find(
    (u) => String(u.USUARIOID) === selectedUser
  );

  return (
    <Box sx={{ width: "100%" }}>
      {(loading || saving) && (
        <LoaderOverlay
          label={saving ? "Guardando permisos..." : "Cargando permisos..."}
        />
      )}

      <PageHeader
        title="Permisos por usuario"
        subtitle="Configura solo excepciones. Si está en 'Heredar', el usuario usa los permisos de su perfil."
      />

      <Paper
        sx={{
          p: { xs: 2, md: 2.5 },
          mb: 2,
          position: { xs: "static", md: "sticky" },
          top: 76,
          zIndex: 10,
          borderRadius: 3,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <FormControl fullWidth>
              <InputLabel>Usuario</InputLabel>
              <Select
                value={selectedUser}
                label="Usuario"
                onChange={(e: SelectChangeEvent<string>) =>
                  setSelectedUser(String(e.target.value))
                }
              >
                <MenuItem value="">Seleccione</MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.USUARIOID} value={String(u.USUARIOID)}>
                    {u.NOMBRE} - {u.USUARIO}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            {selectedUserData && (
              <Chip
                label={`Perfil base: ${
                  selectedUserData.PERFIL_NOMBRE ?? "Sin perfil"
                }`}
                color="warning"
                variant="outlined"
              />
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={save}
              disabled={saving || !selectedUser}
            >
              Guardar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {selectedUser && (
        <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
          <Typography fontWeight={900}>Guía rápida</Typography>
          <Typography color="text.secondary">
            Heredar perfil = usa el permiso base. Permitir = permiso especial
            para este usuario. Bloquear = quitar permiso aunque el perfil lo
            tenga.
          </Typography>
        </Paper>
      )}

      {!selectedUser ? (
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
          <Typography fontWeight={900} variant="h6">
            Selecciona un usuario
          </Typography>
          <Typography color="text.secondary">
            Después podrás configurar excepciones individuales.
          </Typography>
        </Paper>
      ) : (
        groupedRows.map((group) => (
          <Paper
            key={group.groupName}
            sx={{ p: { xs: 2, md: 2.5 }, mb: 2.5, borderRadius: 3 }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
                alignItems: "center",
                mb: 2,
                flexWrap: "wrap",
              }}
            >
              <Typography variant="h6" fontWeight={900}>
                {group.groupName}
              </Typography>

              <Chip
                label={`${group.rows.length} módulo(s)`}
                size="small"
                variant="outlined"
              />
            </Box>

            {isMobile ? (
              <Box sx={{ display: "grid", gap: 2 }}>
                {group.rows.map((row) => (
                  <Paper
                    key={row.MODULOID}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 3 }}
                  >
                    <Typography fontWeight={900}>{row.NOMBRE}</Typography>

                    <Typography fontSize={12} color="text.secondary">
                      Ruta: {row.RUTA || "Sin ruta"}
                    </Typography>

                    <Typography fontSize={11} color="text.disabled" sx={{ mb: 2 }}>
                      Clave: {row.CLAVE}
                    </Typography>

                    <Box sx={{ display: "grid", gap: 1.5 }}>
                      {actions.map((action: any) => {
                        const allowed = isActionAllowedForModule(
                          row.MODULOID,
                          action.ACCIONID
                        );

                        if (!allowed) return null;

                        const value = row.cells[action.ACCIONID];
                        const inherited = row.inherited[action.ACCIONID];

                        return (
                          <Box
                            key={`${row.MODULOID}-${action.ACCIONID}`}
                            sx={{
                              border: "1px solid rgba(255,255,255,.12)",
                              borderRadius: 2,
                              p: 1.5,
                            }}
                          >
                            <Typography fontWeight={900} fontSize={13}>
                              {action.NOMBRE}
                            </Typography>

                            <Typography
                              fontSize={11}
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              {action.CLAVE}
                            </Typography>

                            <FormControl size="small" fullWidth>
                              <Select
                                value={value}
                                onChange={(e) =>
                                  changeCell(
                                    row.MODULOID,
                                    action.ACCIONID,
                                    e.target.value as CellValue
                                  )
                                }
                                sx={{ fontWeight: 800 }}
                              >
                                <MenuItem value="inherit">
                                  Heredar perfil {inherited ? "✅" : "❌"}
                                </MenuItem>
                                <MenuItem value="allow">Permitir ✅</MenuItem>
                                <MenuItem value="deny">Bloquear ❌</MenuItem>
                              </Select>
                            </FormControl>

                            {getFinalChip(value, inherited)}
                          </Box>
                        );
                      })}
                    </Box>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: 1100,
                  }}
                >
                  <thead>
                    <tr style={{ textAlign: "left" }}>
                      <th style={{ padding: 10, width: 320 }}>Módulo</th>

                      {actions.map((action: any) => (
                        <th
                          key={action.ACCIONID}
                          style={{
                            padding: 10,
                            textAlign: "center",
                            minWidth: 150,
                          }}
                        >
                          <Typography fontWeight={900} fontSize={13}>
                            {action.NOMBRE}
                          </Typography>
                          <Typography fontSize={10} color="text.secondary">
                            {action.CLAVE}
                          </Typography>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {group.rows.map((row) => (
                      <tr
                        key={row.MODULOID}
                        style={{ borderTop: "1px solid rgba(0,0,0,.08)" }}
                      >
                        <td style={{ padding: 10 }}>
                          <Typography fontWeight={900}>{row.NOMBRE}</Typography>
                          <Typography fontSize={12} color="text.secondary">
                            Ruta: {row.RUTA || "Sin ruta"}
                          </Typography>
                          <Typography fontSize={11} color="text.disabled">
                            Clave: {row.CLAVE}
                          </Typography>
                        </td>

                        {actions.map((action: any) => {
                          const allowed = isActionAllowedForModule(
                            row.MODULOID,
                            action.ACCIONID
                          );

                          const value = row.cells[action.ACCIONID];
                          const inherited = row.inherited[action.ACCIONID];

                          return (
                            <td
                              key={`${row.MODULOID}-${action.ACCIONID}`}
                              style={{ padding: 10, textAlign: "center" }}
                            >
                              {allowed ? (
                                <>
                                  <FormControl size="small" fullWidth>
                                    <Select
                                      value={value}
                                      onChange={(e) =>
                                        changeCell(
                                          row.MODULOID,
                                          action.ACCIONID,
                                          e.target.value as CellValue
                                        )
                                      }
                                      sx={{
                                        fontWeight: 800,
                                        opacity: value === "inherit" ? 0.75 : 1,
                                      }}
                                    >
                                      <MenuItem value="inherit">
                                        Heredar perfil {inherited ? "✅" : "❌"}
                                      </MenuItem>
                                      <MenuItem value="allow">
                                        Permitir ✅
                                      </MenuItem>
                                      <MenuItem value="deny">
                                        Bloquear ❌
                                      </MenuItem>
                                    </Select>
                                  </FormControl>

                                  {getFinalChip(value, inherited)}
                                </>
                              ) : (
                                <Typography color="text.disabled">—</Typography>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
          </Paper>
        ))
      )}
    </Box>
  );
}