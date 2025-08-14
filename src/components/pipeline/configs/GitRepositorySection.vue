<!-- GitRepositorySection.vue -->
<template>
  <v-expansion-panels flat variant="accordion" class="mb-4">
    <v-expansion-panel>
      <v-expansion-panel-title>
        <div class="d-flex align-center">
          <v-icon class="mr-3" :icon="getGitProviderIcon(scmUrl)"></v-icon>
          <div>
            <div class="font-weight-medium">
              {{ getRepositoryDisplayName(scmUrl) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ Object.keys(scmData).length }} branch(es)
            </div>
          </div>
        </div>
      </v-expansion-panel-title>

      <v-expansion-panel-text>
        <div v-for="(branchData, branchName) in scmData" :key="branchName">
          <div class="d-flex align-center mb-3">
            <v-icon class="mr-2" size="small">mdi-source-branch</v-icon>
            <span class="font-weight-medium">{{ branchName }}</span>
            <v-chip class="ml-2" size="x-small" variant="outlined">
              {{ branchData.length }} reports
            </v-chip>
          </div>

          <v-row>
            <v-col
              v-for="report in branchData"
              :key="report.ID"
              cols="12"
              md="6"
              lg="4"
            >
              <ReportCard
                :report="report"
                :config-type="configType"
                @view-details="$emit('view-report', $event)"
              />
            </v-col>
          </v-row>
        </div>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script>
import { extractGitURLInfo } from '@/composables/git'
import ReportCard from './ReportCard.vue'

export default {
  name: 'GitRepositorySection',
  components: { ReportCard },
  props: {
    scmUrl: String,
    scmData: Object,
    configType: String
  },
  emits: ['view-report'],
  methods: {
    getGitProviderIcon(url) {
      const info = extractGitURLInfo(url)
      const icons = {
        'github': 'mdi-github',
        'gitlab': 'mdi-gitlab',
        'bitbucket': 'mdi-bitbucket'
      }
      return icons[info?.provider] || 'mdi-git'
    },
    getRepositoryDisplayName(url) {
      const info = extractGitURLInfo(url)
      return info?.provider !== 'unknown' ? `${info.owner}/${info.repo}` : url
    }
  }
}
</script>
