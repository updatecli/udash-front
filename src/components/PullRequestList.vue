<template>
  <!-- The actions left open by the latest report of every pipeline, one row per pull
       request however many pipelines feed it. Each row leads with the worst result among
       those pipelines, so a pull request fed by a failing pipeline stands out unopened.

       A pull request somebody acknowledged leaves the list for every viewer, until the
       acknowledgement expires or its worst result changes. The list says how many it
       leaves out, and lists them on demand. -->
  <section class="pull-requests" :aria-labelledby="headingId">
    <header class="pull-requests__header">
      <component :is="headingTag" :id="headingId" ref="heading" :class="headingClass" tabindex="-1">
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
      {{ showAcknowledged ? 'No pull request is acknowledged.' : empty }}
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
            <span v-if="row.acknowledgement">
              Acknowledged<template v-if="row.acknowledgement.by"> by {{ row.acknowledgement.by }}</template>,
              back <span :title="formatAbsoluteDate(row.acknowledgement.until)">{{ toRelativeTime(row.acknowledgement.until, now) }}</span>
            </span>
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

        <!-- Shown to every viewer. Only the API knows whether acknowledging needs a sign-in,
             and describeChangeError explains a refusal. -->
        <v-btn
          v-if="showAcknowledged"
          icon="mdi-undo-variant"
          variant="text"
          size="small"
          class="pull-requests__ack"
          :aria-label="`Unacknowledge ${row.title}`"
          title="Unacknowledge"
          :loading="!!busy[row.key]"
          @click="unacknowledge(row)"
        ></v-btn>
        <v-menu v-else location="bottom end">
          <template #activator="{ props: menu }">
            <v-btn
              v-bind="menu"
              icon="mdi-eye-check-outline"
              variant="text"
              size="small"
              class="pull-requests__ack"
              :aria-label="`Acknowledge ${row.title}`"
              title="Acknowledge"
              :loading="!!busy[row.key]"
            ></v-btn>
          </template>
          <v-list density="compact">
            <v-list-subheader>Acknowledge for</v-list-subheader>
            <v-list-item
              v-for="days in ACKNOWLEDGE_DAYS"
              :key="days"
              :title="daysLabel(days)"
              @click="acknowledge(row, days)"
            ></v-list-item>
          </v-list>
        </v-menu>
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

    <p v-if="changeError" class="pull-requests__page-error pull-requests__change-error text-body-small text-error" role="status">
      {{ changeError.text }}
      <button v-if="changeError.signIn" type="button" class="pull-requests__link" @click="signIn">Sign in</button>
    </p>

    <p v-if="lastAcknowledged" class="pull-requests__notice text-body-small">
      Acknowledged {{ lastAcknowledged.title }} for {{ daysLabel(lastAcknowledged.days) }}.
      <button
        ref="undoButton"
        type="button"
        class="pull-requests__link"
        :disabled="!!busy[lastAcknowledged.key]"
        @click="undo"
      >Undo</button>
    </p>

    <button
      v-if="showAcknowledged || (!error && acknowledgedCount > 0)"
      ref="toggleButton"
      type="button"
      class="pull-requests__link pull-requests__acknowledged text-body-small"
      @click="toggleAcknowledged"
    >
      {{ showAcknowledged ? 'Hide acknowledged' : `Show ${acknowledgedCount.toLocaleString()} acknowledged` }}
    </button>

    <p class="d-sr-only" aria-live="polite">{{ announcement }}</p>
  </section>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import LoadError from '@/components/LoadError.vue'
import { apiFetch, describeLoadError } from '@/composables/api'
import { currentReturnTo, login, useAuth } from '@/composables/auth'
import { filterRequestBody } from '@/composables/filter'
import { formatAbsoluteDate, toRelativeTime } from '@/composables/date'
import { extractGitURLInfo } from '@/composables/git'
import { getPipelineResultText, getStatusColor, getStatusIcon, OPEN_ACTION_ICON } from '@/composables/status'
import { markUpdated, useLiveRefresh, useNow } from '@/composables/live'
import { isAuthEnabled } from '@/composables/runtime'
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

// The durations the API accepts, in days.
const ACKNOWLEDGE_DAYS = [1, 7, 30]

const openActionIcon = OPEN_ACTION_ICON
const now = useNow()
const { xs } = useDisplay()
const { isAuthenticated } = useAuth()

const rows = ref(null)
const total = ref(0)
const error = ref(null)
const loading = ref(false)
const page = ref(1)
const announcement = ref('')
const pageError = ref('')
const expanded = reactive({})
const acknowledgedCount = ref(0)
// When true, the list shows the acknowledged pull requests instead of the waiting ones.
const showAcknowledged = ref(false)
// Pull request urls with an acknowledgement request in flight.
const busy = reactive({})
// The pull request the Undo notice refers to.
const lastAcknowledged = ref(null)
// { text, signIn } for the last acknowledgement request that failed.
const changeError = ref(null)
const heading = ref(null)
const undoButton = ref(null)
const toggleButton = ref(null)

const pageCount = computed(() => Math.ceil(total.value / props.limit))
const countLabel = computed(() => [
  showAcknowledged.value ? 'acknowledged' : '',
  total.value === 1 ? 'pull request' : 'pull requests',
  props.countQualifier,
  props.seeAllLink ? '· see all' : '',
].filter(Boolean).join(' '))

let generation = 0
// view is bumped each time the list starts over, so an acknowledgement request that
// settles later does not post its notice on a list the reader already left.
let view = 0
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

  const worst = pipelines[0]?.result

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
    worst,
    // The API stores the worst result with the acknowledgement and only accepts known
    // results, so an unknown one is sent as '?'.
    acknowledgeResult: SEVERITY.includes(worst) ? worst : '?',
    acknowledgement: action.acknowledgement || null,
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
        ...(showAcknowledged.value ? { acknowledged: true } : {}),
        limit: props.limit,
        page: target,
      },
    })
    if (current !== generation) return

    total.value = data.total_count || 0
    acknowledgedCount.value = data.acknowledged_count || 0
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

// reload starts the list over from its first page, for example after a filter change.
function reload() {
  rows.value = null
  total.value = 0
  page.value = 1
  requested = null
  pageError.value = ''
  changeError.value = null
  lastAcknowledged.value = null
  view++
  load()
}

function daysLabel(days) {
  return days === 1 ? '1 day' : `${days} days`
}

// describeChangeError explains why an acknowledgement request failed. what names the
// change, such as "acknowledge Bump dependency". A 401 offers to sign in only when this
// frontend has sign-in enabled and the reader is signed out; signing in again would only
// return the session the API just refused.
function describeChangeError(failure, what) {
  const status = failure?.status

  if (!status) {
    return { text: `Could not ${what}: the Udash API could not be reached. Check your connection, then try again.` }
  }

  if (status === 401) {
    if (!isAuthEnabled) {
      return { text: `Could not ${what}: the Udash API wants somebody signed in, and sign-in is turned off in this frontend (AUTH_ENABLED).` }
    }
    if (isAuthenticated.value) {
      return { text: `Could not ${what}: the Udash API did not accept your session. Sign out, then sign in again.` }
    }
    return { text: `Sign in to ${what}.`, signIn: true }
  }

  if (status === 403) {
    return { text: `Your account is not allowed to ${what}.` }
  }

  const detail = failure.message && !failure.message.startsWith('HTTP error!') ? ` ${failure.message}` : ''
  return { text: `Could not ${what} (HTTP ${status}).${detail}` }
}

// signIn returns to this page after login so the reader can try again.
function signIn() {
  login(currentReturnTo()).catch(() => {
    changeError.value = { text: 'Could not reach the sign-in page. Try again in a moment.' }
  })
}

// focusAfterChange moves the focus off a row that just left the list, so it does not
// fall back to the top of the page.
async function focusAfterChange(target) {
  await nextTick()
  const element = target?.value?.$el || target?.value || toggleButton.value || heading.value?.$el || heading.value
  element?.focus?.()
}

// changeAcknowledgement sends an acknowledgement request, then reloads the list. It
// returns true only if the request succeeded and the reader is still on the same list,
// so the caller can post its notice and move the focus.
async function changeAcknowledgement(row, what, request) {
  const started = view
  busy[row.key] = true
  changeError.value = null

  try {
    await request()
  } catch (failure) {
    // A failure is reported even if the reader moved to another list.
    changeError.value = describeChangeError(failure, `${what} ${row.title}`)
    return false
  } finally {
    delete busy[row.key]
  }

  await load()
  return started === view
}

async function acknowledge(row, days) {
  const done = await changeAcknowledgement(row, 'acknowledge', () => apiFetch('/pipeline/actions/ack', {
    method: 'PUT',
    body: { url: row.key, days, result: row.acknowledgeResult },
    signInOnUnauthorized: false,
  }))
  if (!done) return

  lastAcknowledged.value = { key: row.key, title: row.title, days }
  announcement.value = `Acknowledged ${row.title} for ${daysLabel(days)}.`
  focusAfterChange(undoButton)
}

function unacknowledgeRequest(key) {
  return apiFetch(`/pipeline/actions/ack?url=${encodeURIComponent(key)}`, { method: 'DELETE', signInOnUnauthorized: false })
}

async function unacknowledge(row) {
  if (!await changeAcknowledgement(row, 'unacknowledge', () => unacknowledgeRequest(row.key))) return

  announcement.value = `${row.title} is waiting again.`
  focusAfterChange()
}

async function undo() {
  const row = lastAcknowledged.value
  // Ignore a second click while the first request is still running.
  if (busy[row.key]) return
  if (!await changeAcknowledgement(row, 'unacknowledge', () => unacknowledgeRequest(row.key))) return

  lastAcknowledged.value = null
  announcement.value = `${row.title} is waiting again.`
  focusAfterChange()
}

function toggleAcknowledged() {
  showAcknowledged.value = !showAcknowledged.value
  reload()
  focusAfterChange(toggleButton)
}

watch(() => props.filter, reload, { deep: true })

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

/* The heading receives the focus when the focused row leaves the list. */
.pull-requests__header [tabindex="-1"]:focus:not(:focus-visible) {
  outline: none;
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

/* Muted until hovered: rows are read far more often than acknowledged. */
.pull-requests__ack {
  flex-shrink: 0;
  margin: -6px 0;
  opacity: var(--v-medium-emphasis-opacity);
}

.pull-requests__ack:hover,
.pull-requests__ack:focus-visible {
  opacity: 1;
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
  .pull-requests__toggle,
  .pull-requests__link {
    min-height: 44px;
  }

  .pull-requests__ack {
    width: 44px;
    height: 44px;
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

.pull-requests__page-error,
.pull-requests__notice {
  margin: 4px 0 0;
}

.pull-requests__link {
  min-height: 24px;
  padding: 2px 0;
  border: 0;
  background: none;
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-color: rgba(var(--v-theme-on-surface), 0.4);
}

.pull-requests__link:hover,
.pull-requests__link:focus-visible {
  text-decoration-color: currentColor;
}

.pull-requests__acknowledged {
  display: block;
  margin-top: 4px;
  opacity: var(--v-medium-emphasis-opacity);
}

.pull-requests__acknowledged:hover,
.pull-requests__acknowledged:focus-visible {
  opacity: 1;
}

.pull-requests__pagination :deep(.v-pagination__list) {
  justify-content: flex-start;
}

</style>
