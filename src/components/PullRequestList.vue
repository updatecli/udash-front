<template>
  <!-- The actions left open by the latest report of every pipeline, one row per pull
       request however many pipelines feed it. Each row leads with the worst result among
       those pipelines, so a pull request fed by a failing pipeline stands out unopened. -->
  <section class="pull-requests" :aria-labelledby="headingId">
    <header class="pull-requests__header">
      <component :is="headingTag" :id="headingId" :class="headingClass">
        <v-icon :icon="openActionIcon" color="result-waiting" size="small" aria-hidden="true"></v-icon>
        {{ title }}
      </component>
      <component
        :is="seeAllLink ? 'router-link' : 'span'"
        v-if="total > 0"
        :to="seeAllLink || undefined"
        class="pull-requests__count text-body-small"
      >
        <span class="text-mono">{{ total.toLocaleString() }}</span>
        {{ countLabel }}
      </component>
    </header>

    <LoadError v-if="error" compact :message="error" @retry="load" />

    <div v-else-if="rows === null" class="pull-requests__list" aria-busy="true">
      <v-skeleton-loader v-for="n in Math.min(limit, 3)" :key="n" type="list-item-two-line" />
    </div>

    <p v-else-if="rows.length === 0" class="pull-requests__empty text-body-medium text-medium-emphasis">
      {{ empty }}
    </p>

    <ul v-else class="pull-requests__list" :aria-busy="loading">
      <li v-for="(row, index) in rows" :key="row.key" class="pull-requests__item">
        <v-icon
          :icon="getStatusIcon(row.worst)"
          :color="getStatusColor(row.worst)"
          size="small"
          class="pull-requests__icon"
          aria-hidden="true"
        ></v-icon>
        <div class="pull-requests__body">
          <a
            v-if="row.url"
            :href="row.url"
            target="_blank"
            rel="noopener noreferrer"
            class="pull-requests__title text-body-medium"
            :class="{ 'text-mono': !row.hasTitle }"
          >
            {{ row.title }}<span class="d-sr-only"> (opens the {{ row.noun }} in a new tab)</span>
            <v-icon icon="mdi-open-in-new" size="x-small" class="pull-requests__external" aria-hidden="true"></v-icon>
          </a>
          <!-- A link which is not http(s) is still a pull request waiting, so it is listed and
               counted, only not offered as a link. -->
          <span
            v-else
            class="pull-requests__title text-body-medium"
            :class="{ 'text-mono': !row.hasTitle }"
          >{{ row.title }}</span>
          <div class="pull-requests__meta text-body-small text-medium-emphasis">
            <span v-if="row.repository" class="text-mono">{{ row.repository }}<template v-if="row.branch"> · {{ row.branch }}</template></span>
            <span class="text-mono" :title="formatAbsoluteDate(row.updatedAt)">{{ toRelativeTime(row.updatedAt, now) }}</span>
          </div>

          <button
            v-if="row.pipelines.length > 1"
            type="button"
            class="pull-requests__toggle text-body-small"
            :aria-expanded="String(!!expanded[row.key])"
            :aria-controls="pipelinesId(index)"
            :aria-label="`${row.pipelines.length} pipelines feeding ${row.title}: ${row.tallyText}`"
            @click="expanded[row.key] = !expanded[row.key]"
          >
            <span
              v-for="entry in row.tally"
              :key="entry.result"
              :class="entry.textClass"
              class="pull-requests__tally"
            >{{ entry.result }} {{ entry.count }}</span>
            <span class="pull-requests__toggle-label">{{ row.pipelines.length }} pipelines</span>
            <v-icon icon="$expand" size="x-small" class="pull-requests__chevron" aria-hidden="true"></v-icon>
          </button>

          <ul
            v-show="row.pipelines.length === 1 || expanded[row.key]"
            :id="pipelinesId(index)"
            class="pull-requests__pipelines text-body-small"
            :aria-label="`Pipelines feeding ${row.title}`"
          >
            <li
              v-for="pipeline in row.pipelines"
              :key="pipeline.id"
              :class="{ 'pull-requests__pipeline--unmatched': !pipeline.matches }"
            >
              <v-icon
                :icon="getStatusIcon(pipeline.result)"
                :color="getStatusColor(pipeline.result)"
                size="x-small"
                aria-hidden="true"
              ></v-icon>
              <span class="d-sr-only">{{ getPipelineResultText(pipeline.result) }}:</span>
              <router-link :to="`/pipeline/reports/${pipeline.id}`">{{ pipeline.name || 'Unnamed pipeline' }}</router-link>
            </li>
          </ul>
        </div>
      </li>
    </ul>

    <v-pagination
      v-if="paginated && rows !== null && pageCount > 1"
      :model-value="page"
      :length="pageCount"
      :total-visible="xs ? 3 : 5"
      density="compact"
      class="pull-requests__pagination"
      @update:model-value="goTo"
    ></v-pagination>

    <p v-if="pageError" class="pull-requests__page-error text-body-small text-error" role="status">
      {{ pageError }}
    </p>

    <p class="d-sr-only" aria-live="polite">{{ announcement }}</p>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import LoadError from '@/components/LoadError.vue'
import { apiFetch, describeLoadError } from '@/composables/api'
import { filterRequestBody } from '@/composables/filter'
import { formatAbsoluteDate, toRelativeTime } from '@/composables/date'
import { extractGitURLInfo } from '@/composables/git'
import { getPipelineResultText, getStatusColor, getStatusIcon, OPEN_ACTION_ICON } from '@/composables/status'
import { markUpdated, useLiveRefresh, useNow } from '@/composables/live'
import { safeHttpUrl, shortRepository } from '@/composables/url'

const props = defineProps({
  title: { type: String, default: 'Waiting to be merged' },
  headingTag: { type: String, default: 'h2' },
  headingId: { type: String, default: 'pull-requests' },
  // headingClass lets a page match the list's heading to its other section headings.
  headingClass: { type: String, default: 'text-title-medium font-weight-bold' },
  // filter is the filter the dashboard or the reports page emits. Its date range, labels,
  // results and scm apply.
  filter: { type: Object, default: null },
  // limit is how many pull requests a page holds.
  limit: { type: Number, default: 5 },
  // paginated pages through every pull request. Without it, only the first page shows.
  paginated: { type: Boolean, default: false },
  seeAllLink: { type: [Object, String], default: null },
  // countQualifier follows the count, such as "in this period" when a filter narrows it.
  countQualifier: { type: String, default: '' },
  empty: { type: String, default: 'No pull request is waiting.' },
})

// The order a triager reads results in: what failed, what changed, what nobody can tell,
// what was skipped, and last what is fine.
const SEVERITY = ['✗', '⚠', '?', '-', '✔']
const TALLY_CLASSES = {
  '✗': 'text-error',
  '⚠': 'text-warning',
  '?': 'text-result-unknown',
  '-': 'text-result-skipped',
  '✔': 'text-medium-emphasis',
}

const openActionIcon = OPEN_ACTION_ICON
const now = useNow()
const { xs } = useDisplay()

const rows = ref(null)
const total = ref(0)
const error = ref(null)
const loading = ref(false)
const page = ref(1)
const announcement = ref('')
const pageError = ref('')
const expanded = reactive({})

const pageCount = computed(() => Math.ceil(total.value / props.limit))
const countLabel = computed(() => [
  total.value === 1 ? 'pull request' : 'pull requests',
  props.countQualifier,
  props.seeAllLink ? '· see all' : '',
].filter(Boolean).join(' '))

let generation = 0
// The page the reader asked for, until its request settled. A refresh meanwhile loads
// it too, so it does not drop the page the reader is waiting on.
let requested = null

function severity(result) {
  const rank = SEVERITY.indexOf(result)
  return rank === -1 ? SEVERITY.indexOf('?') : rank
}

function pipelinesId(index) {
  return `${props.headingId}-pipelines-${index}`
}

function toRow(action) {
  const url = safeHttpUrl(action.url)
  const results = props.filter?.results || []
  const pipelines = (action.pipelines || [])
    .map((pipeline) => ({
      ...pipeline,
      // Without a result filter every pipeline matches. With one, only those it kept.
      matches: results.length === 0 || results.includes(pipeline.result),
    }))
    .sort((a, b) => severity(a.result) - severity(b.result))

  const counts = {}
  pipelines.forEach((pipeline) => {
    const result = SEVERITY.includes(pipeline.result) ? pipeline.result : '?'
    counts[result] = (counts[result] || 0) + 1
  })
  const tally = SEVERITY
    .filter((result) => counts[result])
    .map((result) => ({ result, count: counts[result], textClass: TALLY_CLASSES[result] }))

  return {
    key: action.url,
    // url is empty when the link is not http(s), which the row then shows as plain text.
    url,
    hasTitle: Boolean(action.title),
    title: action.title || String(action.url || '').replace(/^https?:\/\//i, ''),
    noun: extractGitURLInfo(url)?.provider === 'gitlab' ? 'merge request' : 'pull request',
    repository: shortRepository(action.repository),
    branch: action.branch || '',
    updatedAt: action.updated_at,
    pipelines,
    worst: pipelines[0]?.result,
    tally,
    tallyText: tally.map((entry) => `${entry.count} ${getPipelineResultText(entry.result).toLowerCase()}`).join(', '),
  }
}

// load fetches a page, the one the reader asked for or else the current one. The page
// only becomes the current one once it arrived, so a page that fails to load leaves the
// pager on the rows shown. announce says whether the reader asked for that page, which
// warrants telling screen readers what it holds, or that it could not be loaded.
async function load({ target = requested ?? page.value, announce = requested !== null } = {}) {
  error.value = null
  // Only a page the reader asks for replaces the message: a background refresh, even one
  // that succeeds, still leaves the pager short of the page that could not be loaded.
  if (announce) pageError.value = ''
  loading.value = true
  // A slow response must not overwrite the one from a later refresh.
  const current = ++generation

  try {
    const data = await apiFetch('/pipeline/actions/search', {
      method: 'POST',
      body: {
        ...filterRequestBody(props.filter),
        ...(props.filter?.scmid ? { scmid: props.filter.scmid } : {}),
        limit: props.limit,
        page: target,
      },
    })
    if (current !== generation) return

    total.value = data.total_count || 0
    // A refresh can leave the page past the last one, once pull requests got merged.
    if ((data.data || []).length === 0 && total.value > 0 && target > pageCount.value) {
      load({ target: pageCount.value, announce })
      return
    }

    requested = null
    page.value = target
    rows.value = (data.data || []).map(toRow)
    markUpdated()

    if (announce) {
      const first = (page.value - 1) * props.limit + 1
      const last = first + rows.value.length - 1
      announcement.value = `Page ${page.value} of ${pageCount.value}, pull requests ${first} to ${last} of ${total.value}`
    }
  } catch (loadError) {
    if (current !== generation) return
    requested = null
    // A background refresh that fails keeps what is already on screen. A page the reader
    // asked for says it could not be loaded, next to the pager still on the rows shown.
    if (rows.value === null) {
      error.value = describeLoadError(loadError, 'the pull requests')
    } else if (announce) {
      pageError.value = `Page ${target} could not be loaded. ${describeLoadError(loadError, 'it')}`
    }
  } finally {
    if (current === generation) loading.value = false
  }
}

// goTo moves to a page the reader asked for, so what it now holds is announced.
function goTo(nextPage) {
  requested = nextPage
  load()
}

watch(() => props.filter, () => {
  rows.value = null
  total.value = 0
  page.value = 1
  requested = null
  pageError.value = ''
  load()
}, { deep: true })

load()
useLiveRefresh(() => load())
</script>

<style scoped>
.pull-requests__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 12px;
  margin-bottom: 8px;
}

.pull-requests__header h2,
.pull-requests__header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.pull-requests__count {
  color: rgb(var(--v-theme-on-surface));
  opacity: var(--v-medium-emphasis-opacity);
  text-decoration: none;
}

a.pull-requests__count:hover,
a.pull-requests__count:focus-visible {
  opacity: 1;
  text-decoration: underline;
}

.pull-requests__list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  background: rgb(var(--v-theme-surface));
}

.pull-requests__list[aria-busy="true"] {
  opacity: 0.7;
}

/* Same rhythm as the failing column next to it on the home page. */
.pull-requests__item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 8px 10px 16px;
}

.pull-requests__item + .pull-requests__item {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.pull-requests__icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.pull-requests__body {
  flex: 1 1 auto;
  min-width: 0;
}

.pull-requests__title {
  color: inherit;
  font-weight: 500;
  text-decoration: none;
  overflow-wrap: anywhere;
}

.pull-requests__title:hover,
.pull-requests__title:focus-visible {
  text-decoration: underline;
}

.pull-requests__external {
  margin-left: 2px;
  opacity: var(--v-medium-emphasis-opacity);
}

.pull-requests__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
  margin-top: 2px;
}

/* A neutral control: the tally inside it carries the colour, the button itself must
   not read as one more status. */
.pull-requests__toggle {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 8px;
  min-height: 24px;
  margin-top: 4px;
  padding: 2px 0;
  border: 0;
  background: none;
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
}

.pull-requests__toggle-label {
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-color: rgba(var(--v-theme-on-surface), 0.4);
}

.pull-requests__toggle:hover .pull-requests__toggle-label,
.pull-requests__toggle:focus-visible .pull-requests__toggle-label {
  text-decoration-color: currentColor;
}

.pull-requests__tally {
  font-weight: 600;
  white-space: nowrap;
}

.pull-requests__chevron {
  transition: transform 150ms ease-out;
}

.pull-requests__toggle[aria-expanded="true"] .pull-requests__chevron {
  transform: rotate(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .pull-requests__chevron {
    transition: none;
  }
}

@media (pointer: coarse) {
  .pull-requests__toggle {
    min-height: 44px;
  }
}

.pull-requests__pipelines {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pull-requests__pipelines li {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.pull-requests__pipelines a {
  color: inherit;
  overflow-wrap: anywhere;
}

.pull-requests__pipeline--unmatched {
  opacity: var(--v-medium-emphasis-opacity);
}

.pull-requests__empty {
  margin: 0;
  padding: 16px;
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}



/* Page numbers start under the list rather than floating in the middle of it. */
.pull-requests__pagination {
  margin-top: 8px;
}

.pull-requests__page-error {
  margin: 4px 0 0;
}

.pull-requests__pagination :deep(.v-pagination__list) {
  justify-content: flex-start;
}

</style>
