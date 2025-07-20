import { stateOptions } from "./flows/schedule/constants";

export function mapStateToLabel(stateCode: string): string {
  return (
    stateOptions.find((state) => state.value === stateCode)?.label ?? stateCode
  );
}
