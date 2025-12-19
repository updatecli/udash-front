<template>
  <v-container class="py-8 px-6" fluid>
    <v-container>
      <!-- Header Section -->
      <v-row class="mb-6">
        <v-col cols="12">
          <div class="d-flex justify-space-between align-center">
            <div>
              <h1 class="text-h4 font-weight-bold">Configurations</h1>
              <p class="text-medium-emphasis mt-1">
                Manage and explore your pipeline configurations
              </p>
            </div>
            <v-chip v-if="totalCount > 0" variant="outlined" size="large">
              {{ totalCount }} total
            </v-chip>
          </div>
        </v-col>
      </v-row>

      <!-- Filters Row -->
      <v-row class="mb-4" v-if="configsFilters.kind || configsFilters.type">
        <v-col cols="12">
          <div class="d-flex gap-2 align-center">
            <span class="text-body-2 text-medium-emphasis">Filters:</span>
            <v-chip
              v-if="configsFilters.kind"
              closable
              size="small"
              variant="outlined"
              @click:close="clearFilter('kind')"
            >
              Kind: {{ configsFilters.kind }}
            </v-chip>
            <v-chip
              v-if="configsFilters.type"
              closable
              size="small"
              variant="outlined"
              @click:close="clearFilter('type')"
            >
              Type: {{ configsFilters.type }}
            </v-chip>
          </div>
        </v-col>
      </v-row>

      <!-- Loading indicator -->
      <v-row v-if="isLoading && configs.length === 0" class="text-center pa-8">
          <v-progress-circular indeterminate size="64"></v-progress-circular>
          <div class="mt-4 text-h6">Loading configurations...</div>
      </v-row>

      <!-- Configs Grid -->
      <v-row v-else>
        <v-col
          cols="12"
          sm="6"
          md="4"
          lg="3"
          v-for="config in configs"
          :key="config.ID"
          class="config-card-col"
        >
          <v-card
            class="config-card h-100 d-flex flex-column"
            variant="outlined"
            hover
            :ripple="false"
          >
            <!-- Card Header -->
            <v-card-title class="pa-4 pb-2">
              <div class="d-flex align-start justify-space-between w-100">
                <div class="config-title flex-grow-1">
                  <h3 class="text-h6 font-weight-medium line-clamp-2">
                    {{ config.Config.Name || 'Unnamed Configuration' }}
                  </h3>
                </div>
                <v-chip
                  :color="getKindColor(config.Kind)"
                  size="small"
                  variant="tonal"
                  class="ml-2"
                >
                  {{ config.Kind }}
                </v-chip>
              </div>
            </v-card-title>

            <!-- Card Metadata -->
            <v-card-subtitle class="pa-4 pt-0 pb-2">
              <div class="d-flex align-center text-caption">
                <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
                {{ toLocalDate(config.Updated_at) }}
              </div>
            </v-card-subtitle>

            <!-- YAML Content -->
            <v-card-text class="flex-grow-1 pa-4">
              <v-expansion-panels flat variant="accordion" class="yaml-expansion">
                <v-expansion-panel>
                  <v-expansion-panel-title class="text-body-2 py-2">
                    Configuration
                  </v-expansion-panel-title>
                  <v-expansion-panel-text class="pa-0">
                    <div class="yaml-container">
                      <pre><code v-highlight class="language-yaml">{{ toYAML(config.Config.Spec) }}</code></pre>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card-text>

            <!-- Card Actions -->
            <v-card-actions class="pa-4 pt-0">
              <v-btn
                variant="text"
                prepend-icon="mdi-eye"
                :to="getPipelineLink(config.ID)"
                size="small"
                color="grey-darken-3"
                block
              >
                View Details
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- Pagination Controls -->
      <v-row v-if="totalCount > 0" class="mt-6">
        <v-col cols="12">
          <v-card variant="flat" class="pa-4">
            <div class="d-flex justify-center align-center flex-column">
              <!-- Pagination -->
              <v-pagination
                v-model="currentPage"
                :length="totalPages"
                :total-visible="7"
                @update:model-value="onPageChange"
                class="mb-4"
              ></v-pagination>

              <!-- Results info and items per page -->
              <div class="d-flex align-center gap-4 flex-wrap justify-center">
                <v-chip variant="outlined" size="small">
                  {{ startItem }}-{{ endItem }} of {{ totalCount }}
                </v-chip>

                <div class="d-flex align-center">
                  <span class="text-body-2 mr-2">Per page:</span>
                  <v-select
                    v-model="itemsPerPage"
                    :items="[12, 24, 48, 96]"
                    density="compact"
                    variant="outlined"
                    style="width: 80px;"
                    @update:model-value="onItemsPerPageChange"
                  ></v-select>
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- No results message -->
      <v-row v-if="!isLoading && configs.length === 0" class="text-center pa-12">
        <v-col>
          <div class="empty-state">
            <v-icon size="96" color="grey-lighten-2">mdi-folder-open-outline</v-icon>
            <h3 class="text-h5 mt-6 mb-2 font-weight-medium">No Configurations Found</h3>
            <p class="text-body-1 text-medium-emphasis mb-4">
              {{ configsFilters.kind || configsFilters.type
                ? 'No configurations match your current filters.'
                : 'No configurations have been created yet.' }}
            </p>
            <v-btn
              v-if="configsFilters.kind || configsFilters.type"
              variant="outlined"
              @click="clearAllFilters"
              prepend-icon="mdi-filter-off"
            >
              Clear Filters
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<script>
import { toYAML } from '@/composables/yaml'
import { toLocalDate } from '@/composables/date'
import { getApiBaseURL } from '@/composables/api';

export default {
  name: 'ConfigsTable',
  props: {
    configsFilters: {
      type: Object,
      default: () => ({})
    }
  },

  data: () => ({
    configs: [],
    itemsPerPage: 24, // Adjusted for better grid layout
    currentPage: 1,
    totalCount: 0,
    isLoading: false,
    resourceKind: '',
    resourceType: '',
    loadedPages: new Set(),
  }),

  computed: {
    totalPages() {
      return Math.ceil(this.totalCount / this.itemsPerPage);
    },
    startItem() {
      return this.totalCount === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
    },
    endItem() {
      const end = this.currentPage * this.itemsPerPage;
      return Math.min(end, this.totalCount);
    }
  },

  watch: {
    // Watch the configsFilters prop for changes
    configsFilters: {
      handler(newFilters, oldFilters) {
        // Only trigger if filters actually changed
        if (JSON.stringify(newFilters) !== JSON.stringify(oldFilters)) {
          this.resetPagination();
          this.getConfigsData(true);
        }
      },
      deep: true, // Watch for nested property changes
      immediate: false // Don't trigger on component creation
    },
  },

  methods: {
    toLocalDate(rawDate) {
      return toLocalDate(rawDate)
    },

    toYAML(data) {
      return toYAML(data);
    },

    getKindColor(kind) {
      const colors = {
        'source': 'blue',
        'condition': 'orange',
        'target': 'green',
        'action': 'purple',
        'transform': 'teal',
        'default': 'grey'
      };
      return colors[kind?.toLowerCase()] || colors.default;
    },

    clearFilter(filterType) {
      this.$emit('update-filter', { ...this.configsFilters, [filterType]: '' });
    },

    clearAllFilters() {
      this.$emit('update-filter', {});
    },

    resetPagination() {
      this.currentPage = 1;
      this.totalCount = 0;
      this.configs = [];
      this.loadedPages.clear();
    },

    onPageChange(page) {
      this.currentPage = page;
      this.getConfigsData();
    },

    onItemsPerPageChange() {
      this.currentPage = 1;
      this.getConfigsData();
    },

    async getConfigsData(reset = true) {
      // Avoid duplicate requests
      if (this.loadedPages.has(this.currentPage) && !reset) {
        return;
      }

      this.resourceKind = this.configsFilters.kind;
      this.resourceType = this.configsFilters.type;

      this.isLoading = true;
      this.$emit('loaded', false);

      try {
        let queryURL = `${getApiBaseURL()}/pipeline/config/${this.resourceType}s/search`;
        const isAuthEnabled = process.env.VUE_APP_AUTH_ENABLED === 'true';

        // Build request body with pagination
        let jsonReqBody = {
          limit: this.itemsPerPage,
          page: this.currentPage,
        };

        if (this.resourceKind && this.resourceKind !== "") {
          jsonReqBody.kind = this.resourceKind;
        }

        if (this.resourceType && this.resourceType !== "") {
          jsonReqBody.type = this.resourceType;
        }

        // Request headers
        let headers = {
          'Content-Type': 'application/json'
        };

        if (isAuthEnabled) {
          const token = await this.$auth0.getAccessTokenSilently();
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(queryURL, {
          body: JSON.stringify(jsonReqBody),
          method: 'POST',
          headers: headers
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Handle response based on pagination approach
        if (data.configs) {
          if (reset) {
            // Replace configs (pagination approach)
            this.configs = data.configs;
          } else {
            // Append configs (load more approach)
            this.configs = [...this.configs, ...data.configs];
          }

          this.totalCount = data.total_count || 0;
          this.loadedPages.add(this.currentPage);
        } else {
          console.log("No configs found");
          if (reset) {
            this.configs = [];
            this.totalCount = 0;
          }
        }

      } catch (error) {
        console.error('Error fetching configs:', error);
        if (reset) {
          this.configs = [];
          this.totalCount = 0;
        }
      } finally {
        this.isLoading = false;
        this.$emit('loaded', true);
      }
    },

    getPipelineLink(id) {
      return `/pipeline/configs/${this.resourceType}/${id}`;
    },
  },

  async created() {
    try {
      await this.getConfigsData();
    } catch (error) {
      console.log(error);
    }
  },
}
</script>

<style scoped>
.config-card {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border-radius: 12px !important;
}

.config-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
}

.config-card-col {
  transition: all 0.3s ease;
}

.config-title {
  min-height: 48px;
  display: flex;
  align-items: flex-start;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.2;
}

.yaml-container {
  max-height: 200px;
  overflow-y: auto;
  border-radius: 8px;
  background: rgba(var(--v-theme-surface), 0.5);
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
}

.yaml-container pre {
  margin: 0;
  padding: 12px;
  font-size: 0.75rem;
  line-height: 1.4;
  background: transparent;
}

.yaml-expansion {
  box-shadow: none !important;
}

.yaml-expansion .v-expansion-panel {
  border: 1px solid rgba(var(--v-theme-outline), 0.2) !important;
  border-radius: 8px !important;
}

.empty-state {
  max-width: 400px;
  margin: 0 auto;
}

.gap-2 {
  gap: 0.5rem;
}

.gap-4 {
  gap: 1rem;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .config-card-col {
    padding: 8px;
  }

  .yaml-container {
    max-height: 150px;
  }
}

@media (max-width: 600px) {
  .itemsPerPage {
    display: 12;
  }

  .config-card {
    margin-bottom: 16px;
  }
}

/* Loading states */
.v-overlay {
  background: rgba(var(--v-theme-surface), 0.8);
  backdrop-filter: blur(2px);
}
</style>
