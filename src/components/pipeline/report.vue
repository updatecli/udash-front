<template>
  <!-- The report is on its way. -->
  <v-container
    v-if="isLoading"
    class="d-flex justify-center align-center loading-container"
  >
    <v-progress-circular
      color="primary"
      indeterminate
      size="64"
    ></v-progress-circular>
  </v-container>

  <!-- The request never came back with a report. Saying so beats an empty page: the
       reader otherwise has no way to tell a broken API from a report with no content. -->
  <v-container v-else-if="loadError">
    <v-card variant="outlined">
      <v-card-title>
        <v-icon
          icon="mdi-alert-circle"
          color="error"
          class="mr-2"
        ></v-icon>
        Could not load this report
      </v-card-title>

      <v-card-text>
        <p>{{ loadError }}</p>
      </v-card-text>

      <v-card-actions>
        <v-btn
          variant="flat"
          prepend-icon="mdi-refresh"
          @click="getPipelineReportData"
        >
          Retry
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>

  <!-- The API answered fine, it just has nothing under that id. -->
  <v-container v-else-if="!pipeline">
    <v-card variant="outlined">
      <v-card-title>
        <v-icon
          icon="mdi-help-circle"
          color="grey"
          class="mr-2"
        ></v-icon>
        Report not found
      </v-card-title>

      <v-card-text>
        <p>
          No report exists with the id <code>{{ pipelineUUID }}</code>.
          It may have been removed since this link was created.
        </p>
      </v-card-text>

      <v-card-actions>
        <v-btn
          variant="flat"
          prepend-icon="mdi-arrow-left"
          to="/pipeline/reports"
        >
          Back to reports
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>

  <template v-else>
    <v-container>
      <v-row>
        <v-col
          class="text-right"
          cols="auto"
          lg="8"
          md="8"
          sm="12"
        >
          <h1>
            Report <v-icon icon="mdi-book-open-variant"></v-icon>
          </h1>
        </v-col>
        <v-col class="text-center">

          <v-icon
            :icon="getStatusIcon(pipeline.Pipeline.Result)"
            :color="getStatusColor(pipeline.Pipeline.Result)"
            size="80"
            ></v-icon>
        </v-col>
      </v-row>
    </v-container>
    <v-container>
      <!-- Show metadata -->
      <v-row>
        <v-col>
          <v-card
            variant="flat"
          >
            <v-card-text>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Executed</th>
                    <th>Pipeline</th>
                    <th>CI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      {{ getStatusText(pipeline.Pipeline.Result) }}
                    </td>
                    <td>{{ formatDate(pipeline.Updated_at) }}</td>
                    <td>{{ pipeline.Pipeline.Name }}</td>
                    <td>
                      <template v-if="pipelinePrimaryURL">
                        <v-btn
                          :href="pipelinePrimaryURL"
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          variant="outlined"
                          prepend-icon="mdi-open-in-new"
                        >
                          View Job
                        </v-btn>
                      </template>
                      <span
                        v-else
                        class="text-grey"
                      >
                        N/A
                      </span>
                      <span
                        v-if="hasMultiplePipelineURLs"
                        class="text-warning text-caption ci-warning"
                      >
                        Multiple CI URLs detected. Using the first one.
                      </span>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Show labels -->
      <v-row v-if="sortedLabels.length > 0">
        <v-col>
          <v-card variant="flat">
            <v-card-text class="labels-card">
              <div class="labels-header">Labels</div>
              <div class="labels-list">
                <div
                  v-for="([key, value]) in sortedLabels"
                  :key="key"
                  class="label-row"
                >
                  <div class="label-key-wrap">
                    <v-icon
                      size="18"
                      color="grey-darken-1"
                      class="label-icon"
                    >
                      mdi-label-outline
                    </v-icon>
                    <span class="label-key">{{ key }}</span>
                  </div>
                  <div class="label-value">{{ value }}</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-row v-else>
        <v-col>
          <v-card variant="flat">
            <v-card-text>
              <p class="text-grey">No labels</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Show link to latest report -->
       <v-row
          v-if="latestReportByID && !isLatestReport"
       >
        <v-col>
          <v-card
            variant="outlined"
          >
            <v-card-title>
              Newer report detected
            </v-card-title>

            <v-card-text>
              <p>
                Updated at {{ formatDate(latestReportByID.Updated_at) }}
              </p>
                <v-icon :icon="getStatusIcon(latestReportByID.Pipeline.Result)" :color="getStatusColor(latestReportByID.Pipeline.Result)"></v-icon>  {{ latestReportByID.Pipeline.Name }}
                <v-btn
                  icon="mdi-arrow-right-circle"
                  variant="flat"
                  :to=getPipelineReportLink(latestReportByID.ID)>
                </v-btn>
            <v-divider></v-divider>
            </v-card-text>
          </v-card>
        </v-col>
       </v-row>

      <v-row>
        <v-col
          cols="auto"
          lg="12"
          md="12"
          sm="12"
        >

          <v-container
            class="d-flex justify-center align-center"
          >
            <v-btn-toggle
              v-model="resourceStage"
              mandatory
            >
              <v-btn
                v-if="hasSources"
                variant="text"
                value="source"
              >Source</v-btn>
              <v-btn
                v-if="hasConditions"
                variant="text"
                value="condition"
              >Condition</v-btn>
              <v-btn
                v-if="hasTargets"
                variant="text"
                value="target"
              >Target</v-btn>
              <v-btn
                v-if="hasActions"
                variant="text"
                value="action"
              >Action</v-btn>
            </v-btn-toggle>
          </v-container>

          <!-- Show Sources -->
          <v-card
            variant="outlined"
            v-if="hasSources && resourceStage === 'source'"
          >
            <v-card-text>
                <v-card
                  variant="flat"
                  v-for="(data, key) in pipeline.Pipeline.Sources" :key="key"
                >
                  <SourceComponent
                    :id="key"
                    :data="data"
                  ></SourceComponent>
                  <LinkedReports
                    :configID="getResourceUUID('source', key)"
                    configType="source"
                    :pipelineUUID="pipelineUUID"
                  ></LinkedReports>
                </v-card>
            </v-card-text>
          </v-card>

          <!-- Show Conditions -->
          <v-card
            variant="outlined"
            v-if="hasConditions && resourceStage === 'condition'"
          >
            <v-card-text>
                <v-card
                  variant="flat"
                  v-for="(data, key) in pipeline.Pipeline.Conditions" :key="key"
                >
                  <ConditionComponent
                    :id="key"
                    :data="data"
                  ></ConditionComponent>
                  <LinkedReports
                    :configID="getResourceUUID('condition', key)"
                    configType="condition"
                    :pipelineUUID="pipelineUUID"
                  ></LinkedReports>
                </v-card>
            </v-card-text>
          </v-card>

          <!-- Show Targets -->
          <v-card
            variant="outlined"
            v-if="hasTargets && resourceStage === 'target'"
          >
            <v-card-text>
                <v-card
                  v-for="(data, key) in pipeline.Pipeline.Targets" :key="key"
                  variant="flat"
                >
                  <TargetComponent
                    :id="key"
                    :data="data"
                  ></TargetComponent>
                  <LinkedReports
                    :configID="getResourceUUID('target', key)"
                    configType="target"
                    :pipelineUUID="pipelineUUID"
                  ></LinkedReports>
                </v-card>
            </v-card-text>
          </v-card>
          <!-- Show Actions -->
          <v-card
            variant="outlined"
            v-if="hasActions && resourceStage === 'action'"
          >
            <v-card-text>
                <v-card
                  variant="flat"
                  v-for="(data, key) in pipeline.Pipeline.Actions" :key="key"
                >
                  <ActionComponent
                    :id="key"
                    :data="data"
                  ></ActionComponent>
                </v-card>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col
          cols="auto"
          lg="12"
          md="12"
          sm="12"
          class="text-center"
        >
            <v-card
              variant="flat"
              v-if="pipeline.Pipeline.Graph"
            >
                <PipelineGraphComponent :data="pipeline.Pipeline.Graph" />
            </v-card>
        </v-col>
      </v-row>
    </v-container>
  </template>
</template>

<script>
import ActionComponent from './_action.vue';
import SourceComponent from './_source.vue';
import ConditionComponent from './_condition.vue';
import TargetComponent from './_target.vue';
import PipelineGraphComponent from './_graph.vue';

import LinkedReports from './configs/_linkedReports.vue';

import { getStatusColor, getStatusIcon, getStatusText } from '@/composables/status';
import { toLocalDate } from '@/composables/date';
import { apiFetch } from '@/composables/api';

// CONFIG_ID_KEYS names, per resource stage, the field of the report holding the mapping
// from a config UUID to the resource it belongs to. Actions are absent on purpose: they
// carry no config of their own to link back to.
const CONFIG_ID_KEYS = {
  source: 'SourceConfigIDs',
  condition: 'ConditionConfigIDs',
  target: 'TargetConfigIDs',
};

export default {
  name: 'PipelineReport',

  components: {
    ActionComponent,
    SourceComponent,
    ConditionComponent,
    TargetComponent,
    PipelineGraphComponent,
    LinkedReports,
  },

  data: () => ({
    isLoading: true,
    loadError: '',
    resourceStage: "source",
    pipelineUUID: "",
    // Both start empty rather than holding a placeholder shape: the template tells the
    // three states apart by them, and a placeholder would render a report header with an
    // unknown status before anything has been fetched.
    pipeline: null,
    latestReportByID: null,
  }),

  computed: {
    pipelineURLs() {

      if (this.pipeline?.Pipeline?.CI != undefined) {
        return [this.pipeline.Pipeline.CI["URL"]]
      }

      const actions = this.pipeline?.Pipeline?.Actions
      if (!actions) {
        return []
      }

      const urls = new Set()

      for (const action of Object.values(actions)) {
        const pipelineURL = action?.pipelineURL?.URL
        if (typeof pipelineURL === 'string' && pipelineURL.trim()) {
          urls.add(pipelineURL)
        }
      }

      return Array.from(urls)
    },

    pipelinePrimaryURL() {
      return this.pipelineURLs[0]
    },

    hasMultiplePipelineURLs() {
      return this.pipelineURLs.length > 1
    },

    sortedLabels() {
      const labels = this.pipeline?.Pipeline?.Labels
      if (!labels) {
        return []
      }

      return Object.entries(labels).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    },

    hasSources() {
      return Object.keys(this.pipeline?.Pipeline?.Sources || {}).length > 0
    },

    hasConditions() {
      return Object.keys(this.pipeline?.Pipeline?.Conditions || {}).length > 0
    },

    hasTargets() {
      return Object.keys(this.pipeline?.Pipeline?.Targets || {}).length > 0
    },

    // hasActions asks for an actionUrl rather than merely for an action: an action with
    // nowhere to link to has nothing to show on its tab.
    hasActions() {
      const actions = this.pipeline?.Pipeline?.Actions
      if (!actions) {
        return false
      }

      return Object.values(actions).some((action) => action?.actionUrl !== undefined)
    },

    isLatestReport() {
      if (!this.latestReportByID || !this.pipeline) {
        return false
      }

      return this.latestReportByID.ID === this.pipeline.ID
    },

    // resourceUUIDsByName indexes each stage's config UUIDs by resource name, so the
    // template can look one up per resource instead of scanning the whole mapping.
    resourceUUIDsByName() {
      const index = (configIDs) => Object.fromEntries(
        Object.entries(configIDs || {}).map(([uuid, name]) => [name, uuid])
      )

      return Object.fromEntries(
        Object.entries(CONFIG_ID_KEYS).map(([stage, key]) => [stage, index(this.pipeline?.[key])])
      )
    },
  },

  methods: {
    getResourceUUID(type, id) {
      return this.resourceUUIDsByName[type]?.[id] || ''
    },

    formatDate(rawDate) {
      if (!rawDate) {
        return 'N/A';
      }
      try {
        return toLocalDate(rawDate);
      } catch {
        console.warn('Invalid date format:', rawDate);
        return rawDate;
      }
    },

    getDefaultStage(){
      if (this.hasActions) {
        return "action"
      } else if (this.hasSources) {
        return "source"
      } else if (this.hasConditions) {
        return "condition"
      } else if (this.hasTargets) {
        return "target"
      }

      return "source";
    },

    getPipelineReportLink: function(id){
      return "/pipeline/reports/" + id
    },

    getStatusColor: function(input){
      return getStatusColor(input);
    },

    getStatusIcon: function(status){
      return getStatusIcon(status);
    },

    getStatusText: function(status){
      return getStatusText(status);
    },

    async getPipelineReportData() {
      this.isLoading = true
      this.loadError = ''

      try {
        const data = await apiFetch(`/pipeline/reports/${this.pipelineUUID}`)

        this.pipeline = data.data ?? null
        this.latestReportByID = data.latestReportByID ?? null
        this.resourceStage = this.getDefaultStage()
      } catch (error) {
        console.error('Error fetching pipeline report:', error)
        this.pipeline = null
        this.latestReportByID = null
        // A 404 is how the API says the id has nothing behind it, which is not a failure
        // to report. Leaving loadError empty falls through to the "not found" state, which
        // tells the reader what happened better than the API's own "no rows in result set".
        this.loadError = error.status === 404 ? '' : error.message
      } finally {
        this.isLoading = false
      }
    },
  },

  async created() {
    this.pipelineUUID = this.$route.params.id

    this.$watch(
      () => this.$route.params,
      (toParams, previousParams) => {
        if (toParams.id !== previousParams.id) {
          // The UUID has to follow the route: it is also what tells LinkedReports which
          // report to leave out of the list it shows.
          this.pipelineUUID = toParams.id
          this.getPipelineReportData()
        }
      }
    )

    await this.getPipelineReportData()
  },
}
</script>

<style scoped>
.loading-container {
  min-height: 50vh;
}

.ci-warning {
  display: block;
  margin-top: 6px;
}


.labels-card {
  padding-top: 20px;
}

.labels-header {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin-bottom: 12px;
}

.labels-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  /* Themed rather than a fixed black: the dark surface would otherwise swallow it. */
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.label-key-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.label-icon {
  flex-shrink: 0;
}

.label-key {
  font-weight: 700;
  word-break: break-word;
}

.label-value {
  font-weight: 500;
  text-align: right;
  word-break: break-word;
}

@media (max-width: 700px) {
  .label-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .label-value {
    text-align: left;
  }
}
</style>
