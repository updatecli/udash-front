<template>
  <v-container fluid>
    <!-- Loading Overlay -->
    <v-overlay v-model="isLoading" class="align-center justify-center">
      <v-progress-circular color="grey-darken-3" indeterminate size="64"></v-progress-circular>
      <div class="mt-4 text-h6">Loading configuration...</div>
    </v-overlay>

    <div v-if="isLinkedReports && !isLoading">
      <!-- Linked Reports Section -->
      <v-row>
        <v-col cols="12">
          <v-card variant="flat">
            <v-card-title class="d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-link-variant</v-icon>
                Similar Reports
              </div>
              <v-chip variant="outlined" size="small">
                {{ getTotalReportsCount() }} reports
              </v-chip>
            </v-card-title>

            <v-card-subtitle
              v-if="isTypeSource"
            >
              Reports using this source configuration.
            </v-card-subtitle>
            <v-card-subtitle
              v-if="isTypeCondition"
            >
              Reports depending on this condition configuration.
            </v-card-subtitle>

            <v-card-subtitle
              v-if="isTypeTarget"
            >
              Reports with similar target configuration.
            </v-card-subtitle>

            <v-card-text>
              <!-- Git-based Reports -->
              <div v-if="Object.keys(gitReportsData).length > 0">
                <h3 class="text-h6 mb-4 d-flex align-center">
                  <v-icon class="mr-2">mdi-git</v-icon>
                  Git Repositories
                </h3>

                <GitRepositorySection
                  v-for="(scmData, scmURL) in gitReportsData"
                  :key="scmURL"
                  :scm-url="scmURL"
                  :scm-data="scmData"
                  :config-type="configType"
                />
              </div>

              <!-- Local Reports -->
              <div v-if="localReportsData.length > 0" :class="{ 'mt-6': Object.keys(gitReportsData).length > 0 }">
                <h3 class="text-h6 mb-4 d-flex align-center">
                  <v-icon class="mr-2">mdi-laptop</v-icon>
                  Local Reports
                  <v-chip class="ml-2" size="small" variant="outlined">
                    {{ localReportsData.length }}
                  </v-chip>
                </h3>

                <v-row>
                  <v-col
                    v-for="report in localReportsData"
                    :key="report.ID"
                    cols="12"
                    md="12"
                    lg="12"
                  >
                    <ReportCard
                      :report="report"
                      :config-type="configType"
                    />
                  </v-col>
                </v-row>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script>
import { extractGitURLInfo } from '@/composables/git'
import { toYAML } from '@/composables/yaml'
import GitRepositorySection from './GitRepositorySection.vue'
import ReportCard from './ReportCard.vue'

import { getApiBaseURL } from '@/composables/api';
import { isAuthEnabled } from '@/composables/runtime';
import { getStartTimeFromStorage, getEndTimeFromStorage } from '@/composables/date';

export default {
  name: 'LinkedReports',
  components: {
    GitRepositorySection,
    ReportCard
  },

  props: {
    // uuid is the unique resource identifier for the config, used to fetch associated reports
    "configID": {
      type: String,
      required: true
    },
    // type is the type of the config (source, condition, target), used to determine report parsing logic
    "configType": {
      type: String,
      required: true
    },
    "pipelineUUID": {
      type: String,
      required: false
    }
  },

  data: () => ({
    isLoading: true,
    reportsData: { data: {} },
    gitReportsData: {},
    localReportsData: [],
    configData: { data: {} },
    startTime: getStartTimeFromStorage(),
    endTime: getEndTimeFromStorage(),
  }),

  computed: {
    isLinkedReports() {
      return this.localReportsData.length > 0 || Object.keys(this.gitReportsData).length > 0
    },
    isTypeSource() {
      return this.configType === 'source'
    },
    isTypeCondition() {
      return this.configType === 'condition'
    },
    isTypeTarget() {
      return this.configType === 'target'
    },
  },

  methods: {
    extractGitURLInfo,
    toYAML,

    getKindColor(kind) {
      const colors = {
        'source': 'blue',
        'condition': 'orange',
        'target': 'green',
        'action': 'purple',
        'transform': 'teal'
      }
      return colors[kind?.toLowerCase()] || 'grey'
    },

    getKindIcon(type) {
      const icons = {
        'source': 'mdi-alpha-s-circle',
        'condition': 'mdi-alpha-c-circle',
        'target': 'mdi-alpha-t-circle',
        'action': 'mdi-alpha-a-circle',
        'transform': 'mdi-alpha-t-circle'
      }
      return icons[type] || 'mdi-cog'
    },

    getTotalReportsCount() {
      let total = this.localReportsData.length

      Object.values(this.gitReportsData).forEach(scmData => {
        Object.values(scmData).forEach(branchData => {
          total += branchData.length
        })
      })

      return total
    },

    // Consolidated report parsing
    parseReports() {
      const parsers = {
        source: this.parseSourceReport,
        condition: this.parseConditionReport,
        target: this.parseTargetReport
      }

      const parser = parsers[this.configType]
      if (parser) {
        parser()
      } else {
        console.error('Unknown config type:', this.configType)
      }
    },

    parseSourceReport() {
      const results = {}
      this.localReportsData = []

      // reportIDs is a hashmap to track unique report IDs
      const reportIDs = new Set()

      // Iterate over targets
      this.reportsData.forEach(report => {
        const sourceID = report.FilteredResourceID || ''

        Object.entries(report.Report.Targets || {}).forEach(([id, targetData]) => {
          if (targetData.SourceID !== sourceID) return
          if (reportIDs.has(report.ID)) return // Skip if report ID already processed
          reportIDs.add(report.ID)

          const reportItem = this.createReportItem(report, targetData, id, 'target')
          this.categorizeReport(targetData, reportItem, results)
        })
      })

      this.reportsData.forEach(report => {
        const sourceID = report.FilteredResourceID || ''

        Object.entries(report.Report.Targets || {}).forEach(([id, conditionData]) => {
          if (conditionData.SourceID !== sourceID) return
          if (reportIDs.has(report.ID)) return // Skip if report ID already processed
          reportIDs.add(report.ID)

          const reportItem = this.createReportItem(report, conditionData, id, 'target')
          this.categorizeReport(conditionData, reportItem, results)
        })
      })

      this.gitReportsData = results
    },

    parseConditionReport() {
      const results = {}
      this.localReportsData = []

      // reportIDs is a hashmap to track unique report IDs
      const reportIDs = new Set()

      this.reportsData.forEach(report => {
        const conditionID = report.FilteredResourceID || ''
        const conditionData = report.Report.Conditions?.[conditionID]

        if (!conditionData) return

        if (reportIDs.has(report.ID)) return // Skip if report ID already processed
        reportIDs.add(report.ID)

        const reportItem = this.createReportItem(report, conditionData, conditionID, 'condition')
        this.categorizeReport(conditionData, reportItem, results)
      })

      this.gitReportsData = results
    },

    parseTargetReport() {
      const results = {}
      this.localReportsData = []

      // reportIDs is a hashmap to track unique report IDs
      const reportIDs = new Set()

      this.reportsData.forEach(report => {
        const targetID = report.FilteredResourceID || ''
        const targetData = report.Report.Targets?.[targetID]

        if (!targetData) return

        if (reportIDs.has(report.ID)) return // Skip if report ID already processed
        reportIDs.add(report.ID)

        const reportItem = this.createReportItem(report, targetData, targetID, 'target')
        this.categorizeReport(targetData, reportItem, results)
      })

      this.gitReportsData = results
    },

    createReportItem(report, data, id, type) {
      const baseItem = {
        ID: report.ID,
        Result: data.Result,
        Description: data.Description,
        Kind: data.Config?.Kind,
        Name: data.Config?.Name,
        Type: type
      }

      // Add type-specific properties
      if (type === 'condition') {
        baseItem.ConditionID = id
        baseItem.Pass = data.Pass
      } else if (type === 'target') {
        baseItem.TargetID = id
        if (data.Information) baseItem.Information = data.Information
        if (data.NewInformation) baseItem.NewInformation = data.NewInformation
        if (data.Files) baseItem.Files = data.Files
        if (data.Changelogs) baseItem.Changelogs = data.Changelogs
      }

      return baseItem
    },

    categorizeReport(data, reportItem, results) {
      if (this.hasValidScmData(data)) {
        const scmURL = data.Scm.URL
        const scmBranch = data.Scm.Branch.Target

        if (!results[scmURL]) results[scmURL] = {}
        if (!results[scmURL][scmBranch]) results[scmURL][scmBranch] = []

        results[scmURL][scmBranch].push(reportItem)
      } else {
        this.localReportsData.push(reportItem)
      }
    },

    hasValidScmData(data) {
      return data.Scm?.URL &&
             data.Scm.URL !== "" &&
             data.Scm?.Branch &&
             data.Scm.Branch !== ""
    },

    async getConfigData() {
      this.$emit('loaded', false)

      try {
        const queryURL = `${getApiBaseURL()}/pipeline/config/${this.configType}s/search`;

        const jsonReqBody = { id: this.configID }
        const headers = { 'Content-Type': 'application/json' }

        if (isAuthEnabled) {
          const token = await this.$auth0.getAccessTokenSilently()
          headers.Authorization = `Bearer ${token}`
        }

        const response = await fetch(queryURL, {
          body: JSON.stringify(jsonReqBody),
          method: 'POST',
          headers
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.configs?.length > 0) {
          this.configData = data.configs[0]
        } else {
          console.log("No configs found")
        }
      } catch (error) {
        console.error('Error fetching config data:', error)
      } finally {
        this.$emit('loaded', true)
      }
    },

    async getPipelineConfigReportsData() {
      if (!this.configID) {
        console.error('Resource ID is not defined.')
        return
      }

      try {
        const queryURL = `${getApiBaseURL()}/pipeline/reports/search`

        const jsonReqBody = {
          latest: true
        }
        const fieldMap = {
          source: 'sourceid',
          condition: 'conditionid',
          target: 'targetid'
        }

        if (this.startTime != null ){
          jsonReqBody.start_time = this.startTime
        }

        if (this.endTime != null ){
          jsonReqBody.end_time = this.endTime
        }

        const field = fieldMap[this.configType]
        if (!field) {
          console.error('Unknown resource type:', this.configType)
          return
        }

        jsonReqBody[field] = this.configID

        const headers = { 'Content-Type': 'application/json' }
        if (isAuthEnabled) {
          const token = await this.$auth0.getAccessTokenSilently()
          headers.Authorization = `Bearer ${token}`
        }

        const response = await fetch(queryURL, {
          method: 'POST',
          body: JSON.stringify(jsonReqBody),
          headers
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        this.reportsData = data.data || []

        // Remove current pipeline ID from reportsData if pipelineUUID prop is provided
        if (this.pipelineUUID) {
          this.reportsData = this.reportsData.filter(report => report.ID !== this.pipelineUUID)
        }

        this.parseReports()
      } catch (error) {
        console.error('Error fetching reports data:', error)
      } finally {
        this.isLoading = false
      }
    },

    async loadData() {
      this.isLoading = true
      await Promise.all([
        this.getConfigData(),
        this.getPipelineConfigReportsData()
      ])
    }
  },

  async created() {
    await this.loadData()
  }
}
</script>

<style scoped>

.yaml-container {
  max-height: 500px;
  overflow-y: auto;
  border-radius: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
}

.yaml-container pre {
  margin: 0;
  padding: 16px;
  font-size: 0.875rem;
  line-height: 1.5;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.font-mono {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
}

.gap-2 {
  gap: 0.5rem;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .yaml-container {
    max-height: 300px;
  }
}

@media (max-width: 600px) {
  .config-detail-container {
    padding: 0 8px;
  }
}
</style>
