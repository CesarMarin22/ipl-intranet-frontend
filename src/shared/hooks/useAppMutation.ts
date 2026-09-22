import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { showError, showSuccess } from "../utils/swal";

type AppMutationOptions<TData, TVariables> = {
  successMessage?: string;
  invalidateKeys?: QueryKey[];
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: unknown) => void;
};

export function useAppMutation<TData = unknown, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: AppMutationOptions<TData, TVariables>
) {
  const queryClient = useQueryClient();

  return useMutation<TData, unknown, TVariables>({
    mutationFn,

    onSuccess: async (data, variables) => {
      if (options?.invalidateKeys?.length) {
        await Promise.all(
          options.invalidateKeys.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey })
          )
        );
      }

      showSuccess(options?.successMessage ?? "Operación exitosa");
      await options?.onSuccess?.(data, variables);
    },

    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Ocurrió un error inesperado";

      showError(message);
      options?.onError?.(error);
    },
  });
}