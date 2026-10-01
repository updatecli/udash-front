<template>
  <!-- What needs a human right now: the pipelines whose latest report is failing, and the
       pull requests still waiting to be merged. -->
  <div class="today-queue">
    <section class="today-queue__column" aria-labelledby="queue-failing">
      <header class="today-queue__header">
        <h3 id="queue-failing" class="text-title-medium font-weight-bold">
          <span class="text-error" aria-hidden="true">✗</span>
          Failing
        </h3>
        <router-link
          v-if="failing.total > 0"
          :to="failingLink"
          class="today-queue__count text-body-small"
        >
          <span class="text-mono">{{ failing.total.toLocaleString() }}</span>
          {{ failing.total === 1 ? 'pipeline' : 'pipelines' }} · see all
        </router-link>
      </header>

      <LoadError
        v-if="failing.error"
        compact
        :message="failing.error"
        @retry="loadFailing"
      />

      <div v-else-if="failing.rows === null" class="today-queue__list" aria-busy="true">
        <v-skeleton-loader v-for="n in 3" :key="n" type="list-item-two-line" />
      </div>

      <p v-else-if="failing.rows.length === 0" class="today-queue__empty text-body-medium text-medium-emphasis">
        No pipeline is failing.
      </p>

      <ul v-else class="today-queue__list">
        <li v-for="row in failing.rows" :key="row.id" class="today-queue__item">
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
        </li>
      </ul>
    </section>

    <PullRequestList
      class="today-queue__column"
      title="Waiting to be merged"
      heading-tag="h3"
      heading-id="queue-waiting"
      :limit="QUEUE_SIZE"
      :see-all-link="waitingLink"
    />
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import LoadError from '@/components/LoadError.vue'
import PullRequestList from '@/components/PullRequestList.vue'
import { apiFetch, describeLoadError } from '@/composables/api'
import { encodeFilterState } from '@/composables/filter'
import { formatAbsoluteDate, toRelativeTime } from '@/composables/date'
import { getStatusColor, getStatusIcon } from '@/composables/status'
import { getMaxHistoryDays } from '@/composables/runtime'
import { markUpdated, useLiveRefresh, useNow } from '@/composables/live'
import { shortRepository } from '@/composables/url'

const QUEUE_SIZE = 5
// The dashboard link spans the whole history the instance serves: "latest" reports can
// be older than the dashboard's default window of one day.
const FULL_RANGE = [0, 23 + getMaxHistoryDays()]

const failingLink = { path: '/scm/dashboard', query: { filter: encodeFilterState({ dateRange: FULL_RANGE, selectedResults: ['✗'] }) } }
const waitingLink = { path: '/scm/dashboard', query: { filter: encodeFilterState({ dateRange: FULL_RANGE, selectedOpenAction: 'open' }) } }

const now = useNow()

const failing = reactive({ rows: null, total: 0, error: null })

let generation = 0

function toRow(report) {
  const targets = Object.values(report.Report?.Targets || {})
  const scm = targets.find((target) => target?.Scm?.URL)?.Scm

  return {
    id: report.ID,
    name: report.Name || 'Unnamed report',
    result: report.Result,
    updatedAt: report.UpdatedAt,
    repository: shortRepository(scm?.URL),
    branch: scm?.Branch?.Source || '',
  }
}

async function loadFailing() {
  failing.error = null
  // A slow response must not overwrite the one from a later refresh.
  const current = ++generation

  try {
    const data = await apiFetch('/pipeline/reports/search', {
      method: 'POST',
      body: { limit: QUEUE_SIZE, page: 1, latest: true, results: ['✗'] },
    })
    if (current !== generation) return

    failing.rows = (data.data || data.reports || []).map(toRow)
    failing.total = data.total_count || 0
    markUpdated()
  } catch (error) {
    if (current !== generation) return
    // A background refresh that fails keeps what is already on screen.
    if (failing.rows === null) {
      failing.error = describeLoadError(error, 'the failing pipelines')
    }
  }
}

loadFailing()
useLiveRefresh(loadFailing)
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
