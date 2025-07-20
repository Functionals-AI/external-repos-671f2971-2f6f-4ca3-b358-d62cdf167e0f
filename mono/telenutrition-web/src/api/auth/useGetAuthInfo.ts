import useGet from '../useGet';

type UseGetAuthInfoParams =
  | {
      email: string;
    }
  | {
      phone: string;
    };

interface UseGetAuthInfoReturn {
  recoveryRequired: boolean;
}

export default function useGetAuthInfo(
  props:
    | {
        params: UseGetAuthInfoParams;
        doInitialGet?: true;
      }
    | {
        doInitialGet: false;
      },
) {
  return useGet<UseGetAuthInfoReturn, UseGetAuthInfoParams>({
    path: '/auth/info',
    params: 'params' in props ? props.params : undefined,
    ...('doInitialGet' in props ? { doInitialGet: props.doInitialGet } : {}),
  });
}
