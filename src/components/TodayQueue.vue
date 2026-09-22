<template>
  <!-- What needs a human right now, from the latest report of every pipeline: the ones
       failing and the ones whose change is waiting in an open pull request. -->
  <div class="today-queue">
    <section
      v-for="queue in queues"
      :key="queue.key"
      class="today-queue__column"
      :aria-labelledby="`queue-${queue.key}`"
    >
      <header class="today-queue__header">
        <h3 :id="`queue-${queue.key}`" class="text-title-medium font-weight-bold">
          <v-icon v-if="queue.icon" :icon="queue.icon" :color="queue.color" size="small" aria-hidden="true"></v-icon>
          <span v-else :class="`text-${queue.color}`" aria-hidden="true">{{ queue.glyph }}</span>
          {{ queue.title }}
        </h3>
        <router-link
          v-if="state[queue.key].total > 0"
          :to="queue.link"
          class="today-queue__count text-body-small"
        >
          <span class="text-mono">{{ state[queue.key].total.toLocaleString() }}</span>
          {{ queue.noun(state[queue.key].total) }} · see all
        </router-link>
      </header>

      <LoadError
        v-if="state[queue.key].error"
        compact
        :message="state[queue.key].error"
        @retry="load(queue)"
      />

      <div v-else-if="state[queue.key].rows === null" class="today-queue__list" aria-busy="true">
        <v-skeleton-loader v-for="n in 3" :key="n" type="list-item-two-line" />
      </div>

      <p v-else-if="state[queue.key].rows.length === 0" class="today-queue__empty text-body-medium text-medium-emphasis">
        {{ queue.empty }}
      </p>

      <ul v-else class="today-queue__list">
        <li v-for="row in state[queue.key].rows" :key="row.id" class="today-queue__item">
          <v-icon
            :icon="getStatusIcon(row.result)"
            :color="getStatusColor(row.result)"
            size="small"
            class="today-queue__icon"
            aria-hidden="true"
          ></v-icon>
          <div class="today-queue__body">
            <router-link :to="`/pipeline/reports/${row.id}`" class="today-queue__name text-body-medium">
              {{ row.name }}
            </router-link>
            <div class="today-queue__meta text-body-small text-medium-emphasis">
              <span v-if="row.repository" class="text-mono">{{ row.repository }}<template v-if="row.branch"> · {{ row.branch }}</template></span>
              <span class="text-mono" :title="formatAbsoluteDate(row.updatedAt)">{{ toRelativeTime(row.updatedAt, now) }}</span>
            </div>
          </div>
          <v-btn
            v-if="row.actionUrl"
            :href="row.actionUrl"
            target="_blank"
            rel="noopener noreferrer"
            :icon="openActionIcon"
            variant="text"
            size="small"
            :aria-label="`Open the pull request for ${row.name} (opens in a new tab)`"
          ></v-btn>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import LoadError from '@/components/LoadError.vue'
import { apiFetch, describeLoadError } from '@/composables/api'
import { encodeFilterState } from '@/composables/filter'
import { formatAbsoluteDate, toRelativeTime } from '@/composables/date'
import { getStatusColor, getStatusIcon, OPEN_ACTION_ICON } from '@/composables/status'
import { getMaxHistoryDays } from '@/composables/runtime'
import { markUpdated, useLiveRefresh, useNow } from '@/composables/live'

const QUEUE_SIZE = 5
// The dashboard link spans the whole history the instance serves: "latest" reports can
// be older than the dashboard's default window of one day.
const FULL_RANGE = [0, 23 + getMaxHistoryDays()]

const openActionIcon = OPEN_ACTION_ICON
const now = useNow()

const queues = [
  {
    key: 'failing',
    title: 'Failing',
    glyph: '✗',
    color: 'error',
    body: { results: ['✗'] },
    noun: (count) => (count === 1 ? 'pipeline' : 'pipelines'),
    empty: 'No pipeline is failing.',
    link: { path: '/scm/dashboard', query: { filter: encodeFilterState({ dateRange: FULL_RANGE, selectedResults: ['✗'] }) } },
  },
  {
    key: 'waiting',
    title: 'Waiting to be merged',
    icon: OPEN_ACTION_ICON,
    color: 'result-waiting',
    body: { open_action: true },
    noun: (count) => (count === 1 ? 'pull request' : 'pull requests'),
    empty: 'No pull request is waiting.',
    link: { path: '/scm/dashboard', query: { filter: encodeFilterState({ dateRange: FULL_RANGE, selectedOpenAction: 'open' }) } },
  },
]

const state = reactive(Object.fromEntries(queues.map((queue) => [queue.key, { rows: null, total: 0, error: null }])))

function toRow(report) {
  const targets = Object.values(report.Report?.Targets || {})
  const scm = targets.find((target) => target?.Scm?.URL)?.Scm
  const action = Object.values(report.Report?.Actions || {}).find((item) => item?.actionUrl)

  return {
    id: report.ID,
    name: report.Name || 'Unnamed report',
    result: report.Result,
    updatedAt: report.UpdatedAt,
    repository: scm?.URL?.replace(/^https?:\/\/[^/]+\//, '').replace(/\.git$/, '') || '',
    branch: scm?.Branch?.Source || '',
    actionUrl: action?.actionUrl || '',
  }
}

async function load(queue) {
  const entry = state[queue.key]
  entry.error = null

  try {
    const data = await apiFetch('/pipeline/reports/search', {
      method: 'POST',
      body: { limit: QUEUE_SIZE, page: 1, latest: true, ...queue.body },
    })

    entry.rows = (data.data || data.reports || []).map(toRow)
    entry.total = data.total_count || 0
    markUpdated()
  } catch (error) {
    // A quiet refresh that fails keeps what is already on screen.
    if (entry.rows === null) {
      entry.error = describeLoadError(error, `the ${queue.title.toLowerCase()} pipelines`)
    }
  }
}

function loadAll() {
  queues.forEach(load)
}

loadAll()
useLiveRefresh(loadAll)
</script>

<style scoped>
.today-queue {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: 24px;
}

.today-queue__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 12px;
  margin-bottom: 8px;
}

.today-queue__header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.today-queue__count {
  color: rgb(var(--v-theme-on-surface));
  opacity: var(--v-medium-emphasis-opacity);
  text-decoration: none;
}

.today-queue__count:hover,
.today-queue__count:focus-visible {
  opacity: 1;
  text-decoration: underline;
}

.today-queue__list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  background: rgb(var(--v-theme-surface));
}

.today-queue__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 8px 10px 16px;
}

.today-queue__item + .today-queue__item {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.today-queue__icon {
  flex-shrink: 0;
}

.today-queue__body {
  flex: 1 1 auto;
  min-width: 0;
}

.today-queue__name {
  display: block;
  color: inherit;
  font-weight: 500;
  text-decoration: none;
  overflow-wrap: anywhere;
}

.today-queue__name:hover,
.today-queue__name:focus-visible {
  text-decoration: underline;
}

.today-queue__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
  margin-top: 2px;
}

.today-queue__empty {
  margin: 0;
  padding: 16px;
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}
</style>
