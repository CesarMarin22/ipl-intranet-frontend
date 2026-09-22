import { Button, Tooltip } from "@mui/material";
import type { ButtonProps } from "@mui/material/Button";
import type { ReactNode } from "react";

type Props = ButtonProps & {
  allowed: boolean;
  denyMessage?: string;
  children: ReactNode;
};

export default function PermissionButton({
  allowed,
  denyMessage = "No tienes permiso para realizar esta acción",
  children,
  ...props
}: Props) {
  if (allowed) {
    return <Button {...props}>{children}</Button>;
  }

  return (
    <Tooltip title={denyMessage}>
      <span>
        <Button {...props} disabled>
          {children}
        </Button>
      </span>
    </Tooltip>
  );
}