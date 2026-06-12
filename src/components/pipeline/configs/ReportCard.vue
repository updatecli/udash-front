<template>
  <v-expansion-panels
    flat
    variant="accordion"
  >
    <v-expansion-panel>
      <v-expansion-panel-title>
        <div class="d-flex align-center text-title-small justify-space-between">
          <v-chip size="small" class="mr-4 ml-4" :color="getStatusColor(report.Result)" variant="tonal">
            {{ report.Result }}
          </v-chip>
          <v-spacer></v-spacer>
          <span>{{ report.Name || 'Unnamed Report' }}</span>
          <v-spacer></v-spacer>
        </div>
      </v-expansion-panel-title>

      <v-expansion-panel-text>
        <!-- Condition -->
        <div v-if="configType === 'condition' && report.Pass !== undefined" class="mt-2">
          <v-chip size="x-small" :color="report.Pass ? 'success' : 'error'" variant="tonal">
            {{ report.Pass ? 'Passed' : 'Failed' }}
          </v-chip>
        </div>

        <!-- Source-specific info -->
        <div v-if="configType === 'source' && report.Result !== '-'">
        <v-table density="compact">
          <thead>
            <tr>
              <th>Current</th>
              <th>New</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ report.Information }}</td>
              <td>{{ report.NewInformation }}</td>
            </tr>
          </tbody>
        </v-table>
        </div>

        <!-- Target-specific info -->
        <div v-if="configType === 'target' && report.Result !== '-'">
          <v-table density="compact">
            <thead>
              <tr>
                <th>Current</th>
                <th>New</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ report.Information }}</td>
                <td>{{ report.NewInformation }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>
        <v-card-actions>
          <v-btn
            variant="text"
            size="small"
            prepend-icon="mdi-eye"
            block
            :to="navigateToReport(report.ID)"
          >
            View Details
          </v-btn>
        </v-card-actions>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script>

import { getStatusColor } from '@/composables/status'
import { getAppBasePath } from '@/composables/runtime'

export default {
  name: 'ReportCard',
  props: {
    report: {
      type: Object,
      required: true,
      validator(value) {
        return value && typeof value.ID !== 'undefined'
      }
    },
    configType: {
      type: String,
      required: true,
      validator(value) {
        return ['source', 'condition', 'target'].includes(value)
      }
    }
  },

  methods: {
    navigateToReport(reportId) {
      return `${getAppBasePath().replace(/\/$/, "")}/pipeline/reports/${reportId}`

    },
    getStatusColor(result) {
      return getStatusColor(result)
    }
  }
}
</script>