import {
  Box,
  Button,
  Checkbox,
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
import {
  PermissionsService,
  type ProfilePermissionRow,
} from "../../../services/permissions";
import { getProfiles } from "../../../services/catalog";
import { ModulesService } from "../../../services/modules";
import { ActionsService } from "../../../services/actions";
import { showError, showSuccess } from "../../../shared/utils/swal";

type MatrixRow = {
  MODULOID: number;
  CLAVE: string;
  NOMBRE: string;
  RUTA?: string | null;
  PADRE_ID?: number | null;
  ORDEN?: number | null;
  checks: Record<number, boolean>;
};

type GroupedRows = {
  groupName: string;
  rows: MatrixRow[];
};

export default function PermissionsPage() {
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery("(max-width:900px)");

  const [profiles, setProfiles] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [rows, setRows] = useState<MatrixRow[]>([]);
  const [moduleActionMap, setModuleActionMap] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadCatalogs = async () => {
      setLoading(true);

      try {
        const [profilesData, modulesData, actionsData, actionsMapData] =
          await Promise.all([
            getProfiles(),
            ModulesService.getAll(),
            ActionsService.getAll(),
            ModulesService.getActionsMap(),
          ]);

        setProfiles((profilesData ?? []).filter((x: any) => Number(x.ACTIVO) === 1));
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
    if (!selectedProfile || modules.length === 0 || actions.length === 0) {
      setRows([]);
      return;
    }

    const loadPermissions = async () => {
      setLoading(true);

      try {
        const current = await PermissionsService.getProfilePermissions(
          Number(selectedProfile)
        );

        const matrix: MatrixRow[] = modules.map((m: any) => {
          const checks: Record<number, boolean> = {};

          actions.forEach((a: any) => {
            const found = current.find(
              (p: ProfilePermissionRow) =>
                Number(p.MODULOID) === Number(m.MODULOID) &&
                Number(p.ACCIONID) === Number(a.ACCIONID) &&
                Number(p.PERMITIDO) === 1 &&
                Number(p.ACTIVO) === 1
            );

            checks[a.ACCIONID] = Boolean(found);
          });

          return {
            MODULOID: Number(m.MODULOID),
            CLAVE: String(m.CLAVE ?? ""),
            NOMBRE: String(m.NOMBRE ?? ""),
            RUTA: m.RUTA ?? null,
            PADRE_ID: m.PADRE_ID ?? null,
            ORDEN: m.ORDEN ?? null,
            checks,
          };
        });

        setRows(matrix);
      } catch (error: any) {
        showError(
          error?.response?.data?.message ||
            "No se pudieron cargar los permisos"
        );
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [selectedProfile, modules, actions]);

  const parentMap = useMemo(() => {
    const map = new Map<number, string>();

    modules.forEach((m: any) => {
      map.set(Number(m.MODULOID), String(m.NOMBRE ?? "Sin grupo"));
    });

    return map;
  }, [modules]);

  const visibleActions = useMemo(() => actions, [actions]);

  const isParentModule = (moduloId: number) => {
    return modules.some((m: any) => Number(m.PADRE_ID) === Number(moduloId));
  };

  const isParentAllowedAction = (action: any) => {
    const clave = String(action.CLAVE ?? action.NOMBRE ?? "").toUpperCase();
    return clave === "VER";
  };

  const isActionAllowedForModule = (moduloId: number, accionId: number) => {
    const action = visibleActions.find(
      (a: any) => Number(a.ACCIONID) === Number(accionId)
    );

    if (isParentModule(moduloId)) {
      return isParentAllowedAction(action);
    }

    return moduleActionMap.has(`${moduloId}-${accionId}`);
  };

  const groupedRows = useMemo<GroupedRows[]>(() => {
    const groups = new Map<string, MatrixRow[]>();

    const hasChildren = (moduloId: number) => {
      return rows.some((row) => Number(row.PADRE_ID) === Number(moduloId));
    };

    rows.forEach((row) => {
      const moduloId = Number(row.MODULOID);
      const padreId = row.PADRE_ID ? Number(row.PADRE_ID) : null;

      if (!padreId && hasChildren(moduloId)) {
        return;
      }

      const groupName = padreId
        ? parentMap.get(padreId) ?? "Sin grupo"
        : "Módulos independientes";

      if (!groups.has(groupName)) groups.set(groupName, []);
      groups.get(groupName)?.push(row);
    });

    return Array.from(groups.entries())
      .map(([groupName, groupRows]) => ({
        groupName,
        rows: groupRows.sort(
          (a, b) =>
            Number(a.ORDEN ?? 999999) - Number(b.ORDEN ?? 999999) ||
            Number(a.MODULOID) - Number(b.MODULOID)
        ),
      }))
      .sort((a, b) => {
        if (a.groupName === "Módulos independientes") return -1;
        if (b.groupName === "Módulos independientes") return 1;
        return a.groupName.localeCompare(b.groupName);
      });
  }, [rows, parentMap]);

  const toggleCheck = (moduloId: number, accionId: number) => {
    if (!isActionAllowedForModule(moduloId, accionId)) return;

    const action = visibleActions.find(
      (a: any) => Number(a.ACCIONID) === Number(accionId)
    );

    const actionClave = String(
      action?.CLAVE ?? action?.NOMBRE ?? ""
    ).toUpperCase();

    setRows((prev) =>
      prev.map((r) => {
        if (Number(r.MODULOID) !== Number(moduloId)) return r;

        const currentValue = Boolean(r.checks[accionId]);
        const nextValue = !currentValue;

        const newChecks = {
          ...r.checks,
          [accionId]: nextValue,
        };

        const verAction = visibleActions.find(
          (a: any) => String(a.CLAVE ?? a.NOMBRE ?? "").toUpperCase() === "VER"
        );

        if (verAction) {
          const verId = verAction.ACCIONID;

          if (actionClave === "VER" && nextValue === false) {
            visibleActions.forEach((a: any) => {
              newChecks[a.ACCIONID] = false;
            });
          }

          if (actionClave !== "VER" && nextValue === true) {
            newChecks[verId] = true;
          }
        }

        return {
          ...r,
          checks: newChecks,
        };
      })
    );
  };

  const save = async () => {
    if (!selectedProfile) {
      showError("Selecciona un perfil");
      return;
    }

    const permissions: ProfilePermissionRow[] = rows.flatMap((row) =>
      visibleActions
        .filter((action: any) =>
          isActionAllowedForModule(row.MODULOID, action.ACCIONID)
        )
        .map((action: any) => ({
          PERFILID: Number(selectedProfile),
          MODULOID: row.MODULOID,
          ACCIONID: action.ACCIONID,
          PERMITIDO: row.checks[action.ACCIONID] ? 1 : 0,
          ACTIVO: 1,
        }))
    );

    try {
      setSaving(true);

      await PermissionsService.replaceProfilePermissions(
        Number(selectedProfile),
        permissions
      );

      showSuccess("Permisos actualizados correctamente");

      await queryClient.invalidateQueries({ queryKey: ["my-permissions"] });
      await queryClient.invalidateQueries({ queryKey: ["modules-sidebar"] });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["profiles"] });
      await queryClient.invalidateQueries({ queryKey: ["modules"] });
      await queryClient.invalidateQueries({ queryKey: ["actions"] });
    } catch (error: any) {
      showError(
        error?.response?.data?.message || "No se pudieron guardar los permisos"
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedProfileName =
    profiles.find((p) => String(p.PERFILID) === selectedProfile)?.NOMBRE ?? "";

  return (
    <Box sx={{ width: "100%" }}>
      {(loading || saving) && (
        <LoaderOverlay
          label={saving ? "Guardando permisos..." : "Cargando permisos..."}
        />
      )}

      <PageHeader
        title="Permisos por perfil"
        subtitle="Asigna permisos base por perfil. Los permisos por usuario pueden permitir o bloquear excepciones."
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
              <InputLabel>Perfil</InputLabel>
              <Select
                value={selectedProfile}
                label="Perfil"
                onChange={(e: SelectChangeEvent<string>) =>
                  setSelectedProfile(String(e.target.value))
                }
              >
                <MenuItem value="">Seleccione</MenuItem>
                {profiles.map((item) => (
                  <MenuItem key={item.PERFILID} value={String(item.PERFILID)}>
                    {item.NOMBRE}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            {selectedProfileName && (
              <Chip
                label={`Editando: ${selectedProfileName}`}
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
              disabled={saving || !selectedProfile}
            >
              Guardar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {selectedProfile && (
        <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
          <Typography fontWeight={900}>Guía rápida</Typography>
          <Typography color="text.secondary">
            Estos permisos son la base del perfil. Si activas una acción como
            crear, editar o eliminar, automáticamente se activa ver.
          </Typography>
        </Paper>
      )}

      {!selectedProfile ? (
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
          <Typography fontWeight={900} variant="h6">
            Selecciona un perfil
          </Typography>
          <Typography color="text.secondary">
            Después podrás modificar los permisos por área.
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
                      {visibleActions.map((action: any) => {
                        const allowed = isActionAllowedForModule(
                          row.MODULOID,
                          action.ACCIONID
                        );

                        if (!allowed) return null;

                        const checked = Boolean(row.checks[action.ACCIONID]);

                        return (
                          <Box
                            key={`${row.MODULOID}-${action.ACCIONID}`}
                            sx={{
                              border: "1px solid rgba(255,255,255,.12)",
                              borderRadius: 2,
                              p: 1.5,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Box>
                              <Typography fontWeight={900} fontSize={13}>
                                {action.NOMBRE}
                              </Typography>
                              <Typography fontSize={11} color="text.secondary">
                                {action.CLAVE ?? ""}
                              </Typography>
                            </Box>

                            <Checkbox
                              checked={checked}
                              onChange={() =>
                                toggleCheck(row.MODULOID, action.ACCIONID)
                              }
                            />
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
                    minWidth: 980,
                  }}
                >
                  <thead>
                    <tr style={{ textAlign: "left" }}>
                      <th style={{ padding: 10, width: 320 }}>Módulo</th>

                      {visibleActions.map((action: any) => (
                        <th
                          key={action.ACCIONID}
                          style={{ padding: 10, textAlign: "center" }}
                        >
                          <Typography fontWeight={900} fontSize={13}>
                            {action.NOMBRE}
                          </Typography>

                          <Typography fontSize={10} color="text.secondary">
                            {action.CLAVE ?? ""}
                          </Typography>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {group.rows.map((row) => (
                      <tr
                        key={row.MODULOID}
                        style={{
                          borderTop: "1px solid rgba(0,0,0,.08)",
                        }}
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

                        {visibleActions.map((action: any) => {
                          const allowed = isActionAllowedForModule(
                            row.MODULOID,
                            action.ACCIONID
                          );

                          return (
                            <td
                              key={`${row.MODULOID}-${action.ACCIONID}`}
                              style={{ padding: 10, textAlign: "center" }}
                            >
                              {allowed ? (
                                <Checkbox
                                  checked={Boolean(row.checks[action.ACCIONID])}
                                  onChange={() =>
                                    toggleCheck(row.MODULOID, action.ACCIONID)
                                  }
                                />
                              ) : (
                                <Typography
                                  color="text.disabled"
                                  fontWeight={800}
                                >
                                  —
                                </Typography>
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