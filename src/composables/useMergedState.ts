import type { MaybeRefOrGetter, Ref } from "vue";
import { computed, isRef, toValue, watch } from "vue";

export function useMergedState<T>(controlledRef: MaybeRefOrGetter<T | undefined>, uncontrolledRef: Ref<T | undefined>, onSet?: (value: T | undefined) => void) {
  watch(() => toValue(controlledRef), (value) => {
    // if (value !== undefined) {
    uncontrolledRef.value = value;
    // }
  });

  return computed({
    get() {
      const value = toValue(controlledRef);
      if (value === undefined) {
        return uncontrolledRef.value;
      }
      return value;
    },
    set(value) {
      if (isRef(controlledRef)) {
        // @ts-expect-error ignore
        controlledRef.value = value;
      }
      onSet?.(value);
      uncontrolledRef.value = value;
    },
  });
}
