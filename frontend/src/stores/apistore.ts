import {defineStore} from "pinia";
import {computed, ref} from "vue";

export const useApiStore = defineStore('api', () => {
  const requests = ref<number[]>([]);
  const counter = ref<number>(0);

  function startRequest(): number {
    requests.value.push(counter.value);
    counter.value += 1;
    return counter.value;
  }

  function finishRequest(cnt: number) {
    const index = requests.value.indexOf(cnt);
    if (cnt >= 0) {
      requests.value.splice(index, 1);
    }
  }

  const isLoading = computed(() => requests.value.length > 0);
  return {startRequest, finishRequest, isLoading};
});
