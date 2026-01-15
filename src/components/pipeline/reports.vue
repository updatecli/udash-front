<template>

  <v-container
      class="py-8 px-6"
      fluid
  >
    <v-container
      v-if="pipelines.length === 0"
    >
      <v-row class="text-center pa-12">
        <v-col>
          <div class="empty-state">
            <v-icon size="96" color="grey-lighten-2">mdi-alert-decagram-outline</v-icon>
            <h3 class="text-h5 mt-6 mb-2 font-weight-medium">No Reports Found</h3>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <v-container
      v-if="pipelines.length > 0"
    >
      <v-row>
        <v-col
            cols="auto"
            lg="6"
            md="6"
            sm="12"
            v-if="actionURLs && actionURLs.length > 0"
          >
          <div class="mb-3">
            <h4 class="d-flex align-items-center mb-2">
              Quick Actions
              <v-tooltip text="Actions extracted from your pipeline reports that may require follow-up, such as pull requests.">
                <template v-slot:activator="{ props }">
                  <v-icon
                    v-bind="props"
                    size="small"
                    class="ml-2"
                    color="grey-darken-1"
                  >
                    mdi-information-outline
                  </v-icon>
                </template>
              </v-tooltip>
            </h4>
            <p class="text-caption text-grey-darken-1 mb-0">
              {{ actionURLs.length }} action{{ actionURLs.length !== 1 ? 's' : '' }} found across your pipeline reports
            </p>
          </div>

          <!-- Enhanced Actions Card -->
          <v-card flat class="mb-4 action-summary-card">
            <v-card-text class="pa-0">
              <v-list density="compact" class="py-0">
                <v-list-item
                  v-for="(action, index) in actionURLs"
                  :key="index"
                  :href="action.url"
                  target="_blank"
                  rel="noopener"
                  class="action-list-item"
                >
                  <template v-slot:prepend>
                    <v-avatar size="32" class="mr-3">
                      <v-icon
                        :color="getProviderColor(action.url)"
                        size="18"
                      >
                        {{ getActionProviderIcon(action.url) }}
                      </v-icon>
                    </v-avatar>
                  </template>

                  <v-list-item-title class="text-body-2 font-weight-medium">
                    {{ action.title }}
                  </v-list-item-title>

                  <v-list-item-subtitle class="text-caption">
                    {{ getProviderName(action.url) }}
                  </v-list-item-subtitle>

                  <template v-slot:append>
                    <v-icon size="small" color="grey-lighten-1">
                      mdi-open-in-new
                    </v-icon>
                  </template>

                  <!-- Add divider except for last item -->
                  <template v-if="index < actionURLs.length - 1">
                    <v-divider class="my-2"></v-divider>
                  </template>
                </v-list-item>
              </v-list>
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
          <!-- Add header for reports table -->
          <div class="mb-3">
            <h4 class="d-flex align-items-center mb-2">
              Pipeline Reports
            </h4>
            <p class="text-caption text-grey-darken-1 mb-0">
              Detailed execution history and status information
            </p>
          </div>

          <v-pagination
            v-model="currentPage"
            :length="Math.ceil(totalItems / itemsPerPage)"
            :total-visible="7"
            @update:model-value="onPageChange"
          ></v-pagination>

          <div class="text-center mt-2">
            <small>Total: {{ totalItems }} reports</small>
          </div>

          <v-data-table-virtual
            v-model:items-per-page="itemsPerPage"
            :headers="pipelinesHeaders"
            :items="pipelines"
            item-value="name"
            fixed-header
            max-height="600px"
          >
            <!-- Your existing table templates -->
            <template v-slot:item.ID="{ item }">
              <v-btn
                class="mx-4"
                variant="text"
                prepend-icon="mdi-arrow-right-circle"
                :to=getPipelineLink(item.ID)></v-btn>
            </template>
            <template v-slot:item.Result="{ item }">
              <v-icon
                :icon=getStatusIcon(item.Result)
                :color=getStatusColor(item.Result)
                ></v-icon>
            </template>
            <template v-slot:item.UpdatedAt="{ item }">
              {{ toLocalDate(item.UpdatedAt) }}
            </template>
            <template v-slot:item.Action="{ item }">
              <div v-for="(actionURL, index) in getActionsURL(item)" :key="index">
                <v-tooltip :text="getActionTooltipText(actionURL)">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      class="mx-4"
                      variant="text"
                      :prepend-icon="getActionProviderIcon(actionURL.url)"
                      :href="actionURL.url"
                      target="_blank"
                      rel="noopener"
                      v-bind="props"
                    ></v-btn>
                  </template>
                </v-tooltip>
              </div>
            </template>
          </v-data-table-virtual>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<script>
import { getStatusColor, getStatusIcon } from '@/composables/status';
import { extractGitURLInfo } from '@/composables/git'
import { toLocalDate } from '@/composables/date'
import { getApiBaseURL } from '@/composables/api';

export default {
  name: 'PipelinesTable',

  props: {
    filter: {},
  },

  data: () => ({
    actionURLs: [], // Changed from {} to []
    sortBy: [{
      key: 'UpdatedAt',
      order: 'desc'
    }],
    pipelinesHeaders: [
      { title: "State", align: "start", key:'Result', width: '80px'},
      { title: "Time", key:'UpdatedAt', width: '200px'},
      { title: "Action", key: 'Action', align:'start', width: '200px'},
      {
        title: "Name",
        align: 'start',
        sortable: true,
        key: 'Name'
      },
      { key: 'ID', sortable: false, width:'80px' },
    ],
    pipelines: [],
    itemsPerPage: 25,
    totalItems: 0,
    currentPage: 1,
  }),

  watch: {
    filter() {
        this.currentPage = 1;
        this.getReportsData(1)
    }
  },

  methods: {
    toLocalDate (rawDate) {
      return toLocalDate(rawDate)
    },

    getActionProviderIcon(url) {
      const info = extractGitURLInfo(url)
      const icons = {
        'github': 'mdi-github',
        'gitlab': 'mdi-gitlab',
        'bitbucket': 'mdi-bitbucket'
      }
      return icons[info?.provider] || 'mdi-git'
    },

    // New: Get provider color for better visual distinction
    getProviderColor(url) {
      const info = extractGitURLInfo(url)
      const colors = {
        'github': 'grey-darken-2',
        'gitlab': 'orange',
        'bitbucket': 'blue'
      }
      return colors[info?.provider] || 'grey'
    },

    // New: Get provider name for subtitle
    getProviderName(url) {
      const info = extractGitURLInfo(url)
      if (info?.provider) {
        return info.provider.charAt(0).toUpperCase() + info.provider.slice(1)
      }
      return 'External Link'
    },

    getActionTooltipText(action) {
      return `${action.title} - Open ${action.url}`
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

    getPipelinesActionsURL(){
      let localActionURLs = []
      // Remove duplicates by tracking unique URL+title combinations
      const seen = new Set()

      this.pipelines.forEach(pipeline => {
        if (pipeline.Report && pipeline.Report.Actions) {
          for (const [action] of Object.entries(pipeline.Report.Actions)) {
            const actionURL = pipeline.Report.Actions[action].actionUrl
            const title = pipeline.Report.Actions[action].title
            if (actionURL && title) {
              const key = `${actionURL}-${title}`
              if (!seen.has(key)) {
                seen.add(key)
                localActionURLs.push({"url": actionURL, title: title})
              }
            }
          }
        }
      });

      this.actionURLs = localActionURLs
    },

    async getReportsData(page =1 ) {
      this.$emit('loaded', false)
      let queryURL = `${getApiBaseURL()}/pipeline/reports`

      const params = new URLSearchParams();
      if (this.filter?.scmid != undefined && this.filter?.scmid != '' && this.filter?.scmid != null) {
        params.append('scmid', this.filter.scmid);

      if (this.filter?.startTime && this.filter.endTime ) {
          params.append('start_time', this.filter.startTime);
          params.append('end_time', this.filter.endTime);
      }

      if (this.filter?.startTime && this.filter.endTime ) {
          params.append('start_time', this.filter.startTime);
          params.append('end_time', this.filter.endTime);
      }

      params.append('limit', this.itemsPerPage);
      params.append('page',  this.currentPage);

      queryURL += `?${params.toString()}`;

      const isAuthEnabled = process.env.VUE_APP_AUTH_ENABLED === 'true';

      try {
        let response;
        if (isAuthEnabled) {
          const token = await this.$auth0.getAccessTokenSilently();
          response = await fetch(queryURL, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
        } else {
          response = await fetch(queryURL);
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        this.pipelines = data.data || data.reports || [];
        this.getPipelinesActionsURL()
        this.totalItems = data.total_count || 0;
        this.currentPage = page;

      } catch (error) {
        console.error('Error fetching reports:', error);
        this.pipelines = [];
        this.totalItems = 0;
      }

      this.$emit('loaded', true)
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

  async created() {
    try {
      this.getReportsData(1)
    } catch (error) {
      console.log(error);
    }
  },
}
</script>

<style scoped>
.action-summary-card {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.action-list-item {
  transition: background-color 0.2s ease;
  border-radius: 4px;
  margin: 2px 8px;
}

.action-list-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
