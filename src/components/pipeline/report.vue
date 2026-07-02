<template>
  <v-container
    v-if="pipeline"
  >
      <v-overlay
      :model-value="isLoading"
      class="align-center justify-center"
      :disabled="true"
      :eager="true"
      :no-click-animation="true"
      :persistent="true"
      :opacity="0"
    >
      <v-progress-circular
        color="black"
        indeterminate
        size="64"
      ></v-progress-circular>
    </v-overlay>

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
  <v-container
    v-if="pipeline"
  >
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
    <v-row v-if="pipeline.Pipeline.Labels && Object.keys(pipeline.Pipeline.Labels).length > 0">
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
        v-if="latestReportByID"
     >
      <v-col>
        <v-card
          variant="outlined"
          v-show="!isLatestReport()"
        >
          <v-card-title>
            Newer report detected
          </v-card-title>

          <v-card-text>
            <p>
              Updated at {{ latestReportByID.Updated_at }}
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
          <v-btn-toggle v-model="resourceStage">
            <v-btn
              v-if="isSources()"
              variant="text"
              value="source"
              :class="{ 'v-btn--active': resourceStage === 'source' }"
            >Source</v-btn>
            <v-btn
              v-if="isConditions()"
              variant="text"
              value="condition"
              :class="{ 'v-btn--active': resourceStage === 'condition' }"
            >Condition</v-btn>
            <v-btn
              v-if="isTargets()"
              variant="text"
              value="target"
              :class="{ 'v-btn--active': resourceStage === 'target' }"
            >Target</v-btn>
            <v-btn
              v-if="isActions()"
              variant="text"
              value="action"
              :class="{ 'v-btn--active': resourceStage === 'action' }"
            >Action</v-btn>
          </v-btn-toggle>
        </v-container>

        <!-- Show Sources -->
        <v-card
          variant="outlined"
          v-if="isSources() && resourceStage === 'source'"
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
          v-if="isConditions() && resourceStage === 'condition'"
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
          v-if="isTargets() && resourceStage === 'target'"
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
          v-if="isActions() && resourceStage === 'action'"
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

<script>
import ActionComponent from './_action.vue';
import SourceComponent from './_source.vue';
import ConditionComponent from './_condition.vue';
import TargetComponent from './_target.vue';
import PipelineGraphComponent from './_graph.vue';

import LinkedReports from './configs/_linkedReports.vue';

import { getStatusColor, getStatusIcon, getStatusText } from '@/composables/status';
import { toLocalDate } from '@/composables/date';
import { getApiBaseURL } from '@/composables/api';
import { isAuthEnabled } from '@/composables/runtime';

export default {
  name: 'PipelineReportView',

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
    resourceStage: "source",
    pipelineUUID: "",
    pipeline: {
      "Pipeline": {}
    },
    latestReportByID: {
      "Pipeline": {}
    },
  }),

  beforeUnmount() {
    this.cancelAutoUpdate();
  },

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
  },

  methods: {
    getResourceUUID(type, id) {
      if (type === "source") {
        if (this.pipeline.SourceConfigIDs === undefined) {
          return ""
        }

        for (const [uuid, name] of Object.entries(this.pipeline.SourceConfigIDs)) {
          if (name === id) {
            return uuid
          }
        }
      }

      if (type === "condition") {
        if (this.pipeline.ConditionConfigIDs === undefined) {
          return ""
        }

        for (const [uuid, name] of Object.entries(this.pipeline.ConditionConfigIDs)) {
          if (name === id) {
            return uuid
          }
        }
      }

      if (type === "target") {
        if (this.pipeline.TargetConfigIDs === undefined) {
          return ""
        }

        for (const [uuid, name] of Object.entries(this.pipeline.TargetConfigIDs)) {
          if (name === id) {
            return uuid
          }
        }
      }

      return ``
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
      if (this.isActions()) {
        return "action"
      } else if (this.isSources()) {
        return "source"
      } else if (this.isConditions()) {
        return "condition"
      } else if (this.isTargets()) {
        return "target"
      }

      return "source";
    },

    isActions(){
      for (const action in this.pipeline.Pipeline.Actions) {
        if (this.pipeline.Pipeline.Actions[action].actionUrl !== undefined){
          return true
        }
      }
      return false;
    },

    isLatestReport(){
      if (this.latestReportByID !== null) {
        return this.latestReportByID.ID == this.pipeline.ID
      }
      return ""
    },

    isConditions(){
      for (const condition in this.pipeline.Pipeline.Conditions) {
        return true
      }
      return false;
    },

    isSources(){
      for (const source in this.pipeline.Pipeline.Sources) {
        return true
      }
      return false;
    },

    isTargets(){
      for (const target in this.pipeline.Pipeline.Targets) {
        return true
      }
      return false;
    },

    getPipelineReportLink: function(id){
      return "/pipeline/reports/" + id
    },

    cancelAutoUpdate() {
      clearInterval(this.timer);
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
      if (isAuthEnabled) {
        const token = await this.$auth0.getAccessTokenSilently();
        const response = await fetch(`${getApiBaseURL()}/pipeline/reports/` + this.$route.params.id, {
            headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();

        this.pipeline = data.data;
        this.isLoading = false;

        if (this.pipeline !== null) {
          this.latestReportByID = data.latestReportByID
          this.isLatestReport()
        }
      } else {
        const response = await fetch(`${getApiBaseURL()}/pipeline/reports/` + this.$route.params.id);
        const data = await response.json();

        this.pipeline = data.data;
        this.isLoading = false;

        if (this.pipeline !== null) {
          this.latestReportByID = data.latestReportByID
          this.isLatestReport()
        }
      }

      this.resourceStage = this.getDefaultStage();
    },
  },

  watch: {
      isLoading (val) {
        val && setTimeout(() => {
          this.isLoading = false
        }, 3000)
      },
  },

  async created() {
    this.pipelineUUID = this.$route.params.id

    this.$watch(
      () => this.$route.params,
      (toParams, previousParams) => {
        if (toParams.id != previousParams.id) {
          try {
            this.getPipelineReportData()
          } catch (error) {
            console.log(error);
          }
        }
      }
    )
    try {
      this.getPipelineReportData()
    } catch (error) {
      console.log(error);
    }
  },
}
</script>

<style scoped>
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
  border: 1px solid rgba(0, 0, 0, 0.06);
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
