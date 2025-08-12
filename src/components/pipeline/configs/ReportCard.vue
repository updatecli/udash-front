<template>
  <v-card variant="outlined" class="report-card h-100" hover>
    <v-card-title class="pb-2">
      <div class="d-flex align-center">
        <v-icon class="mr-2" size="small">mdi-file-document-outline</v-icon>
        <span class="text-truncate">{{ report.Name || 'Unnamed Report' }}</span>
      </div>
    </v-card-title>

    <v-card-subtitle class="pb-1">
      <div class="d-flex align-center flex-wrap gap-1">
        <v-chip size="x-small" :color="getResultColor(report.Result)" variant="tonal">
          {{ report.Result }}
        </v-chip>
        <v-chip size="x-small" color="grey" variant="outlined">
          {{ report.Kind }}
        </v-chip>
      </div>
    </v-card-subtitle>

    <v-card-text class="flex-grow-1">
      <p class="text-body-2 line-clamp-3 mb-2">
        {{ report.Description || 'No description available' }}
      </p>

      <!-- Condition-specific info -->
      <div v-if="configType === 'condition' && report.Pass !== undefined" class="mt-2">
        <v-chip size="x-small" :color="report.Pass ? 'success' : 'error'" variant="tonal">
          {{ report.Pass ? 'Passed' : 'Failed' }}
        </v-chip>
      </div>

      <!-- Source-specific info -->
      <div v-if="configType === 'source' && report.NewInformation" class="mt-2">
        <div class="text-caption text-medium-emphasis">
          <strong>New:</strong> {{ report.NewInformation }}
        </div>
      </div>

      <!-- Target-specific info -->
      <div v-if="configType === 'target'" class="mt-2">
        <div v-if="report.Information" class="text-caption text-medium-emphasis mb-1">
          <strong>Info:</strong> {{ report.Information }}
        </div>
        <div v-if="report.NewInformation" class="text-caption text-medium-emphasis mb-1">
          <strong>New:</strong> {{ report.NewInformation }}
        </div>
        <div v-if="report.Files && report.Files.length > 0" class="text-caption text-medium-emphasis">
          <strong>Files:</strong> {{ report.Files.length }} file(s)
        </div>
      </div>

      <!-- Report metadata -->
      <div class="mt-2 pt-2 border-t-thin">
        <div class="d-flex align-center text-caption text-medium-emphasis">
          <v-icon size="12" class="mr-1">mdi-identifier</v-icon>
          ID: {{ report.ID }}
        </div>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-btn
        variant="text"
        size="small"
        prepend-icon="mdi-eye"
        @click="$emit('view-details', report.ID)"
        block
        color="grey-darken-3"
      >
        View Details
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
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

  emits: ['view-details'],

  methods: {
    getResultColor(result) {
      const colors = {
        'success': 'success',
        'skipped': 'grey',
        'changed': 'warning',
        'failure': 'error',
        'attention': 'orange',
        'failed': 'error',
        'passed': 'success'
      }
      return colors[result?.toLowerCase()] || 'grey'
    }
  }
}
</script>

<style scoped>
.report-card {
  border-radius: 8px;
  transition: all 0.2s ease;
  min-height: 200px;
}

.report-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.gap-1 {
  gap: 0.25rem;
}

.border-t-thin {
  border-top: 1px solid rgba(var(--v-theme-outline), 0.2);
}

/* Ensure card takes full height */
.h-100 {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.flex-grow-1 {
  flex-grow: 1;
}
</style>
