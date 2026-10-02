<template>

  <v-container class="pa-0" fluid>
    <LoadError
      v-if="loadError"
      title="Reports could not be loaded"
      :message="loadError"
      :retrying="isFetching"
      @retry="getReportsData(currentPage)"
    />

    <v-container class="pa-0" v-else-if="pipelines.length === 0 && hasLoaded">
      <v-row class="text-center pa-12">
        <v-col>
          <div class="empty-state">
            <v-icon size="96" class="text-medium-emphasis" aria-hidden="true">mdi-alert-decagram-outline</v-icon>
            <h3 class="text-headline-small mt-6 mb-2 font-weight-medium">No reports match this filter</h3>
            <p class="text-medium-emphasis mb-0">Widen the date range or clear the advanced filter.</p>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <v-container class="pa-0" v-if="pipelines.length > 0 && !loadError">
      <v-row>
        <v-col
            cols="12"
          >
          <p class="text-body-small text-medium-emphasis mb-2">
            {{ totalItems.toLocaleString() }} {{ totalItems === 1 ? 'report' : 'reports' }}
          </p>

          <!-- Phones and tablets get a stacked list: the table's columns cannot fit without scrolling
               sideways, and the name is what someone checking in needs to tap. -->
          <v-list v-if="$vuetify.display.smAndDown" class="report-list py-0" lines="two">
            <v-list-item
              v-for="item in pipelines"
              :key="item.ID"
              :to="getPipelineLink(item.ID)"
              class="report-list__item"
            >
              <template v-slot:prepend>
                <v-icon
                  :icon="getStatusIcon(item.Result)"
                  :color="getStatusColor(item.Result)"
                  class="mr-3"
                  aria-hidden="true"
                ></v-icon>
              </template>
              <v-list-item-title class="text-wrap">{{ item.Name || 'Unnamed report' }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ getResultTooltipText(item) }} · <span class="text-mono">{{ toRelativeTime(item.UpdatedAt, now) }}</span>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <v-data-table-virtual
            v-else
            v-model:items-per-page="itemsPerPage"
            :headers="pipelinesHeaders"
            :items="pipelines"
            item-value="name"
            fixed-header
            max-height="600px"
          >
            <!-- A pipeline with nothing to change reports a success even when its
                 change is already waiting in a pull request nobody merged. The result
                 glyph is the same in both cases, so the badge tells them apart from
                 the ones that are up to date. -->
            <template v-slot:item.Result="{ item }">
              <v-tooltip :text="getResultTooltipText(item)">
                <template v-slot:activator="{ props }">
                  <span
                    v-bind="props"
                    role="img"
                    tabindex="0"
                    class="result-cell"
                    :aria-label="getResultTooltipText(item)"
                  >
                    <v-badge
                      v-if="hasOpenAction(item)"
                      :icon="openActionIcon"
                      :color="openActionColor"
                      offset-x="-1"
                      offset-y="-1"
                    >
                      <v-icon
                        :icon=getStatusIcon(item.Result)
                        :color=getStatusColor(item.Result)
                        ></v-icon>
                    </v-badge>
                    <v-icon
                      v-else
                      :icon=getStatusIcon(item.Result)
                      :color=getStatusColor(item.Result)
                      ></v-icon>
                  </span>
                </template>
              </v-tooltip>
            </template>
            <template v-slot:item.Name="{ item }">
              <router-link :to="getPipelineLink(item.ID)" class="report-name">{{ item.Name || 'Unnamed report' }}</router-link>
            </template>
            <template v-slot:item.UpdatedAt="{ item }">
              <span class="text-no-wrap text-mono" :title="formatAbsoluteDate(item.UpdatedAt)">{{ toRelativeTime(item.UpdatedAt, now) }}</span>

            </template>
            <template v-slot:item.Action="{ item }">
              <div v-for="(actionURL, index) in getActionsURL(item)" :key="index">
                <v-tooltip :text="getActionTooltipText(actionURL)">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      class="mx-4"
                      variant="text"
                      :icon="getActionProviderIcon(actionURL.url)"
                      :href="actionURL.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      :aria-label="`${actionURL.title || 'Open action'} (opens in a new tab)`"
                      v-bind="props"
                    ></v-btn>
                  </template>
                </v-tooltip>
              </div>
            </template>
          </v-data-table-virtual>

          <v-pagination
            v-if="pageCount > 1"
            v-model="currentPage"
            class="mt-4"
            :length="pageCount"
            :total-visible="$vuetify.display.smAndDown ? 5 : 7"
            @update:model-value="onPageChange"
          ></v-pagination>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<script>
import { getStatusColor, getStatusIcon, getPipelineResultText, OPEN_ACTION_ICON, OPEN_ACTION_COLOR } from '@/composables/status';
import { extractGitURLInfo } from '@/composables/git'
import { apiFetch, describeLoadError } from '@/composables/api';
import { markUpdated, subscribeRefresh, useNow } from '@/composables/live';
import { formatAbsoluteDate, toRelativeTime } from '@/composables/date';
import LoadError from '../LoadError.vue';

export default {
  name: 'PipelinesTable',

  components: {
    LoadError,
  },

  // now ticks every second so the relative times stay current between refreshes.
  setup() {
    return { now: useNow() }
  },

  props: {
    filter: {},
  },

  data: () => ({
    openActionIcon: OPEN_ACTION_ICON,
    openActionColor: OPEN_ACTION_COLOR,
    pipelinesHeaders: [
      { title: "Result", align: "start", key:'Result', width: '80px'},
      {
        title: "Name",
        align: 'start',
        sortable: true,
        key: 'Name'
      },
      { title: "Time", key:'UpdatedAt', width: '200px'},
      { title: "Pull request", key: 'Action', align:'start', width: '120px'},
    ],
    pipelines: [],
    itemsPerPage: 25,
    totalItems: 0,
    currentPage: 1,
    loadError: null,
    hasLoaded: false,
    isFetching: false,
    requestId: 0,
  }),

  computed: {
    pageCount() {
      return Math.ceil(this.totalItems / this.itemsPerPage)
    },
  },

  watch: {
    filter() {
        this.currentPage = 1;
        this.getReportsData(1)
    }
  },

  methods: {
    toRelativeTime,
    formatAbsoluteDate,

    getActionProviderIcon(url) {
      const info = extractGitURLInfo(url)
      const icons = {
        'github': 'mdi-github',
        'gitlab': 'mdi-gitlab',
        'bitbucket': 'mdi-bitbucket'
      }
      return icons[info?.provider] || 'mdi-git'
    },


    getActionTooltipText(action) {
      return `${action.title} (${action.url})`
    },

    // hasOpenAction reports whether a pipeline left a pull request open. Updatecli only
    // fills actionUrl from an open one and clears it once it is closed, so its presence
    // is what says "a pull request is waiting right now" rather than "there was one".
    hasOpenAction(pipeline){
      return this.getActionsURL(pipeline).length > 0
    },

    getResultTooltipText(pipeline){
      const status = getPipelineResultText(pipeline.Result)
      if (!this.hasOpenAction(pipeline)) {
        return status
      }

      if (pipeline.Result === '✔') {
        return `${status}: nothing to change, the change is already waiting in an open pull request`
      }

      return `${status}: a pull request is still open`
    },

    getActionsURL(pipeline){
      let actionURLs = []
      if (pipeline.Report.Actions) {
        for (const [action] of Object.entries(pipeline.Report.Actions)) {
          const actionURL = pipeline.Report.Actions[action].actionUrl
          if (actionURL) {
            actionURLs.push({"url": actionURL, title: pipeline.Report.Actions[action].title} )
          }
        }
      }
      return actionURLs
    },


    // A silent refresh leaves the page's loading overlay alone and keeps the rows on
    // screen if it fails.
    async getReportsData(page = 1, { silent = false } = {}) {
      this.requestId += 1
      const requestId = this.requestId

      this.isFetching = true
      if (!silent) {
        this.$emit('loaded', false)
      }

      const requestBody = {
        limit: this.itemsPerPage,
        page,
      }

      if (this.filter?.scmid) {
        requestBody.scmid = this.filter.scmid
      }

      if (this.filter?.sourceid) {
        requestBody.sourceid = this.filter.sourceid
      }

      if (this.filter?.conditionid) {
        requestBody.conditionid = this.filter.conditionid
      }

      if (this.filter?.targetid) {
        requestBody.targetid = this.filter.targetid
      }

      if (this.filter?.startTime && this.filter?.endTime) {
        requestBody.start_time = this.filter.startTime
        requestBody.end_time = this.filter.endTime
      }

      if (typeof this.filter?.latest === 'boolean') {
        requestBody.latest = this.filter.latest
      }

      // The search API expects labels as a key/value map object.
      if (this.filter?.labels) {
        if (typeof this.filter.labels === 'object' && !Array.isArray(this.filter.labels)) {
          const labels = {}
          Object.entries(this.filter.labels).forEach(([key, value]) => {
            if (typeof key === 'string' && value !== undefined && value !== null) {
              labels[key] = String(value)
            }
          })

          if (Object.keys(labels).length > 0) {
            requestBody.labels = labels
          }
        }
      }

      // Results has to be filtered server side: this table is paginated by the API,
      // so dropping rows once they arrive would leave short pages and a total count
      // counting reports the reader was never shown.
      if (Array.isArray(this.filter?.results) && this.filter.results.length > 0) {
        requestBody.results = this.filter.results
      }

      // Same reason as the results above. The value is a tri-state: an unset filter
      // must be left out of the body, not sent as false.
      if (typeof this.filter?.openAction === 'boolean') {
        requestBody.open_action = this.filter.openAction
      }

      try {
        const data = await apiFetch('/pipeline/reports/search', {
          method: 'POST',
          body: requestBody,
        });

        if (requestId !== this.requestId) return

        this.pipelines = data.data || data.reports || [];
        this.totalItems = data.total_count || 0;
        this.currentPage = page;
        this.loadError = null;
        markUpdated();

      } catch (error) {
        if (requestId !== this.requestId) return

        console.error('Error fetching reports:', error);
        if (!silent) {
          this.loadError = describeLoadError(error, 'the pipeline reports')
        }
      } finally {
        if (requestId === this.requestId) {
          this.isFetching = false
          this.hasLoaded = true
          if (!silent) {
            this.$emit('loaded', true)
          }
        }
      }
    },

    onPageChange(page) {
      this.getReportsData(page);
    },
    getPipelineLink: function(id){
      return `/pipeline/reports/${id}`
    },
    getStatusColor: function(status){
      return getStatusColor(status);
    },
    getStatusIcon: function(status){
      return getStatusIcon(status);
    },
  },

  created() {
    this.getReportsData(1)
  },

  mounted() {
    // A silent refresh would supersede a foreground request still in flight, which
    // then never clears its loading state.
    this.stopRefresh = subscribeRefresh(() => {
      if (!this.isFetching) {
        this.getReportsData(this.currentPage, { silent: true })
      }
    })
  },

  beforeUnmount() {
    this.stopRefresh?.()
  },
}
</script>

<style scoped>
.report-name {
  display: inline-block;
  min-width: 12rem;
  color: inherit;
  font-weight: 500;
  text-decoration: none;
}

.report-name:hover,
.report-name:focus-visible {
  text-decoration: underline;
}

.report-list {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}

.report-list__item + .report-list__item {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.result-cell {
  display: inline-flex;
  border-radius: 50%;
}

.result-cell:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
</style>
