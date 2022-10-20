<script setup lang="ts">
import type {Dataset, SchemeInfo, Document} from "@/plugins/api/api-backend";
import {API} from "@/plugins/api";
import {computed, ref, watch} from "vue";
import {useRouteQuery} from "@vueuse/router";
import {useRoute, useRouter} from "vue-router";
import DocItem from "@/components/DocItem.vue";


const queryDataset = useRouteQuery('dataset', 'test1');
const querySecret = useRouteQuery('secret', undefined);
const queryLabel = useRouteQuery('label', undefined);
const queryChoice = useRouteQuery('choice', undefined);
const queryPage = useRouteQuery('page', '1');
const queryLimit = useRouteQuery('limit', '40');

const dataset = ref<Dataset | null>(null);
const schema = ref<Record<number, SchemeInfo>>({});
const documents = ref<Document[]>([]);
const isSchemaLoaded = computed(() => Object.keys(schema.value).length > 0);

const selectedLabel = ref<number | undefined>((queryLabel.value) ? parseInt(queryLabel.value) : undefined);
const selectedChoice = ref<number | undefined>((queryChoice.value) ? parseInt(queryChoice.value) : undefined);
const limit = ref<number>(parseInt(queryLimit.value));
const page = ref<number>(parseInt(queryPage.value));

watch(queryLabel, (newT) => {
  selectedLabel.value = (newT) ? parseInt(newT) : newT;
  loadDocuments();
});
watch(queryChoice, (newT) => {
  selectedChoice.value = (newT) ? parseInt(newT) : newT;
  loadDocuments();
});
watch(queryPage, (newP) => {
  page.value = parseInt(newP);
  loadDocuments();
});
watch(queryLimit, (newL) => {
  limit.value = parseInt(newL);
  loadDocuments();
});
watch(limit, (newL) => {
  updateRouter({limit: newL})
});

API.datasets.getDatasetApiDatasetsDatasetGet({dataset: queryDataset.value})
  .then((response) => {
    dataset.value = response.data;
  })
  .catch(() => {
    dataset.value = null;
  });

API.data.getSchemeWithNumbersApiDataDatasetSchemeGet({dataset: queryDataset.value, secret: querySecret.value})
  .then((response) => {
    schema.value = {};
    response.data.forEach((schemaInfo) => {
      schema.value[schemaInfo.scheme_id] = schemaInfo;
    })
    loadDocuments();
  })
  .catch(() => {
    schema.value = {};
  });


function isActive(lab: number, choice: number) {
  return selectedLabel.value === lab && selectedChoice.value === choice;
}

function assertNum(v: number | null | undefined) {
  return v !== undefined && v !== null && typeof v === 'number';
}

function loadDocuments() {
  if (dataset.value !== null) {
    documents.value = [];

    if (page.value > 0 && assertNum(selectedLabel.value) && assertNum(selectedChoice.value)) {
      API.data.getLabelPagedApiDataDatasetPagedLabelChoiceGet({
        dataset: queryDataset.value,
        secret: querySecret.value,
        page: page.value,
        limit: limit.value,
        label: selectedLabel.value as number,
        choice: selectedChoice.value as number,
      })
        .then((response) => {
          documents.value = response.data;
        })
        .catch((reason) => {
          console.error(reason);
        });
    } else if (assertNum(selectedLabel.value) && assertNum(selectedChoice.value)) {
      API.data.getLabelSampleApiDataDatasetSampleLabelChoiceGet({
        dataset: queryDataset.value,
        secret: queryDataset.value,
        label: selectedLabel.value as number,
        choice: selectedChoice.value as number,
        // ...(selectedLabel.value !== undefined) && {label: selectedLabel.value},
        // ...(selectedChoice.value !== undefined) && {choice: selectedChoice.value},
        limit: limit.value,
      })
        .then((response) => {
          documents.value = response.data;
        })
        .catch((reason) => {
          console.error(reason);
        });
    }
  }
}

const router = useRouter();
const route = useRoute();


function updateRouter(update: Record<string, string | number | undefined | null>) {
  const query = JSON.parse(JSON.stringify(route.query));
  for (const key in update) {
    if (update[key] === null || update[key] === undefined) {
      delete query[key];
    } else {
      query[key] = '' + update[key];
    }
  }
  router.push({query});
}

function selectLabelChoice(label: number, choice: number) {
  updateRouter({
    label, choice, page: 1
  });
}

function goToPage(v: number) {
  updateRouter({page: v});
}

const numPages = computed(() => {
  if (selectedLabel.value === undefined || selectedChoice.value === undefined) return 0;
  if (limit.value === 0) return 0;
  if (!isSchemaLoaded.value) return 0;
  const label = schema.value[selectedLabel.value];
  return Math.ceil(label.choices[label.i2s[selectedChoice.value]] / limit.value);
});
const isSamplePage = computed(() => page.value === 0);
const hasNextPage = computed(() => page.value < (numPages.value - 1) && page.value > 0);
const hasPrevPage = computed(() => page.value > 1);
const navigablePages = computed(() => {
  const PAGES_WINDOW = 3;
  const PAGES_TO_SHOW = Math.min((PAGES_WINDOW * 2) + 1, numPages.value);
  let start = Math.max(page.value - PAGES_WINDOW, 1);
  if (page.value <= PAGES_WINDOW) {
    start = 1;
  } else if (page.value > (numPages.value - PAGES_TO_SHOW)) {
    start = Math.max(numPages.value - PAGES_TO_SHOW, 1);
  }
  return [...Array(PAGES_TO_SHOW).keys()].map((v) => v + start);
});

const pageNav = {
  prev: () => goToPage((page.value > 0) ? page.value - 1 : 0),
  next: () => goToPage(page.value < (numPages.value - 1) ? page.value + 1 : page.value),
  first: () => goToPage(1),
  last: () => goToPage(numPages.value - 1),
  sample: () => goToPage(0),
};
</script>

<template>
  <nav id="sidebarMenu" class="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse scrollarea" style="">

    <ul class="list-group list-group-flush border-bottom" id="topic-list">
      <li v-for="label in schema" :key="label.scheme_id">
        <div class="fw-bold">{{ label.scheme_id }} {{ label.label }}</div>
        <ul class="list-group list-group-flush border-bottom">
          <li v-for="(count, choice) in label.choices" :key="choice"
              :class="{ active: isActive(label.scheme_id, label.s2i[choice]) }"
              @click="selectLabelChoice(label.scheme_id, label.s2i[choice])"
              class="list-group-item d-flex justify-content-between align-items-start list-group-item-action">
            <div class="ms-2 me-auto">
              <div class="fw-normal">{{ choice }}</div>
            </div>
            <span class="badge bg-primary rounded-pill">{{ count.toLocaleString('en') }}</span>
          </li>
        </ul>
      </li>
      <template v-if="!isSchemaLoaded">
        <li v-for="n in 4" :key="n"
            class="list-group-item">
          <div class="ms-2 me-auto placeholder-wave">
            <span class="placeholder col-4 placeholder-lg"></span><br/>
            <span class="placeholder col-7 placeholder-xs"></span>
            <span class="placeholder col-8 placeholder-xs"></span>
          </div>
        </li>
      </template>
    </ul>
  </nav>

  <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">

    <!-- PAGINATION -->
    <nav class="d-flex flex-row justify-content-center mt-2" v-if="limit > 0 && numPages > 0">
      <ul class="pagination">
        <!--        <li class="page-item" :class="{ disabled: isSamplePage }">-->
        <!--          <span class="page-link" aria-label="Previous" role="button"-->
        <!--                @click="pageNav.sample">-->
        <!--              <span class="bi bi-calendar4-week"></span>-->
        <!--          </span>-->
        <!--        </li>-->
        <li class="page-item" :class="{ disabled: !hasPrevPage }">
          <span class="page-link" aria-label="Previous" role="button"
                @click="pageNav.prev">
              <span aria-hidden="true">&laquo;</span>
          </span>
        </li>
        <li class="page-item" v-for="page_ in navigablePages"
            :key="page_"
            :class="{active: page_ === page}">
          <span role="button" class="page-link"
                @click="goToPage(page_)">{{ page_ }}</span>
        </li>
        <li class="page-item" :class="{ disabled: !hasNextPage }">
          <span class="page-link" aria-label="Next" role="button"
                @click="pageNav.next">
              <span aria-hidden="true">&raquo;</span>
          </span>
        </li>
      </ul>
      <div class="ms-3">
        <select class="form-select" aria-label="Numer of items per page" v-model.number="limit">
          <option disabled>Page limit</option>
          <option value="20">20</option>
          <option value="100">100</option>
          <option value="250">250</option>
          <option value="500">500</option>
        </select>
      </div>
    </nav>
    <!-- /PAGINATION -->

    <!-- Dataset View (aka tweet listing) -->
    <div v-if="documents.length > 0 && dataset!==null" class="d-flex flex-row flex-wrap p-2 scrollarea">
      <DocItem
        v-for="doc in documents"
        :key="doc.doc_id"
        :dataset="dataset"
        :doc="doc"/>
    </div>
    <div v-else>
      <div class="card" aria-hidden="true" style="width: 20rem;">
        <div class="card-body">
          <h5 class="card-title placeholder-glow">
            <span class="placeholder col-6"></span>
          </h5>
          <p class="card-text placeholder-glow">
            <span class="placeholder col-7"></span>
            <span class="placeholder col-4"></span>
            <span class="placeholder col-4"></span>
            <span class="placeholder col-6"></span>
            <span class="placeholder col-8"></span>
          </p>
        </div>
      </div>
    </div>
    <!-- /Dataset View -->

  </main>
</template>