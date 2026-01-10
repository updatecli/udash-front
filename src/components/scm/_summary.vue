<template>
    <v-container>
        <!-- SCM Cards Layout -->
        <v-row>
            <v-col
                v-for="(scmData, url) in data"
                :key="url"
                cols="12"
                :md="defaultMgCol()"
                :lg="defaultLgCol()"
                class="mb-4"
            >
                <v-card
                    flat
                    variant="flat"
                    class="h-100"
                >
                    <!-- SCM Header -->
                    <v-card-title
                        class="d-flex align-center pa-4"
                        v-if="!hideRepositoryTitle"
                    >
                        <v-icon class="mr-2">{{ getGitIcon(url) }}</v-icon>
                        <span class="text-truncate">{{ sanitizeURL(url) }}</span>
                    </v-card-title>

                    <v-divider></v-divider>

                    <!-- Branches List -->
                    <v-card-text class="pa-0">
                        <div
                            v-for="(branchData, branch) in scmData"
                            :key="branch"
                            class="branch-item"
                        >
                            <router-link
                                v-if="!hideButton"
                                :to="`/pipeline/reports?scmid=${branchData.id}`"
                                style="text-decoration: none; color: inherit;"
                            >
                                <div class="clickable-branch">
                                    <div class="d-flex align-center pa-4">

                                        <div class="branch-info flex-grow-1">
                                            <v-row>
                                                <v-col>
                                                    <div class="d-flex align-center mb-2">
                                                        <v-icon
                                                            size="small"
                                                            class="mr-2"
                                                            color="grey-darken-1"
                                                        >
                                                            mdi-source-branch
                                                        </v-icon>
                                                        <div class="flex-grow-1">
                                                            <div class="font-weight-medium">{{ branch }}</div>
                                                            <div class="text-caption text-grey-darken-1">
                                                                {{ branchData.total_result || 0 }} reports
                                                            </div>
                                                        </div>
                                                        <!-- Visual indicator that it's clickable -->
                                                        <v-icon
                                                            size="small"
                                                            color="grey-lighten-1"
                                                        >
                                                            mdi-chevron-right
                                                        </v-icon>
                                                    </div>
                                                </v-col>
                                                <v-col>
                                                    <!-- Status Summary -->
                                                    <div class="status-summary">
                                                        <v-chip
                                                            v-for="(count, status) in branchData.total_result_by_type"
                                                            :key="status"
                                                            :color="getStatusColor(status)"
                                                            size="x-small"
                                                            class="mr-1 mb-1"
                                                        >
                                                            {{ status }} {{ count }}
                                                        </v-chip>
                                                    </div>
                                                </v-col>
                                            </v-row>
                                        </div>

                                        <!-- Mini Doughnut Chart -->
                                        <div class="chart-container" v-if="hasDoughnutData(url, branch)">
                                            <SCMDoughnut
                                                :chartData="getDoughnutData(url, branch)"
                                                :chartOptions="miniDoughnutOptions"
                                                :centerText="branchData.total_result"
                                                size="small"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </router-link>

                            <!-- Non-clickable version for when hideButton is true -->
                            <div v-else class="non-clickable-branch">
                                <div class="d-flex align-center pa-4">
                                    <v-row>
                                        <v-col>
                                            <div class="branch-info flex-grow-1">
                                                <div class="d-flex align-center mb-2">
                                                    <v-icon
                                                        size="small"
                                                        class="mr-2"
                                                        color="grey-darken-1"
                                                    >
                                                        mdi-source-branch
                                                    </v-icon>
                                                    <div class="flex-grow-1">
                                                        <div class="font-weight-medium">{{ branch }}</div>
                                                        <div class="text-caption text-grey-darken-1">
                                                            {{ branchData.total_result || 0 }} reports
                                                        </div>
                                                    </div>
                                                </div>
                                                <!-- Status Summary -->
                                                <div class="status-summary">
                                                    <v-chip
                                                        v-for="(count, status) in branchData.total_result_by_type"
                                                        :key="status"
                                                        :color="getStatusColor(status)"
                                                        size="x-small"
                                                        class="mr-1 mb-1"
                                                    >
                                                        {{ status }} {{ count }}
                                                    </v-chip>
                                                </div>
                                            </div>
                                        </v-col>
                                        <v-col>
                                            <!-- Mini Doughnut Chart -->
                                            <div class="chart-container" v-if="hasDoughnutData(url, branch)">
                                                <SCMDoughnut
                                                    :chartData="getDoughnutData(url, branch)"
                                                    :chartOptions="miniDoughnutOptions"
                                                    :centerText="branchData.total_result"
                                                    size="small"
                                                />
                                            </div>
                                        </v-col>
                                    </v-row>
                                </div>
                            </div>

                            <v-divider
                                v-if="Object.keys(scmData).indexOf(branch) < Object.keys(scmData).length - 1"
                            ></v-divider>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Loading and Pagination Controls -->
        <v-row v-if="totalCount > 1" justify="center">
            <v-col cols="12" md="6">
                <v-card variant="flat" class="text-center">
                    <v-card-text>
                        <div class="mb-3">
                            <v-chip variant="outlined" size="small">
                                {{ Object.keys(data).length }} of {{ totalCount }} SCMs
                            </v-chip>
                        </div>

                        <v-progress-linear
                            :model-value="(Object.keys(data).length / totalCount) * 100"
                            color="grey-darken-3"
                            height="6"
                            rounded
                            class="mb-3"
                        ></v-progress-linear>

                        <v-btn
                            v-if="hasMoreData && !isLoading"
                            color="grey-darken-3"
                            variant="outlined"
                            @click="loadMoreData"
                            :loading="isLoading"
                        >
                            Load More
                        </v-btn>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>

import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

import router from '../../router'

import SCMDoughnut from './_scmDoughnut.vue'

import { getApiBaseURL } from '@/composables/api';

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend)

export default {
    components: {
        SCMDoughnut,
    },
    name: "SCMDashboard",
    props: {
        filter: {
            type: Object,
            default: () => ({})
        },
        hideButton: {
            type: Boolean,
            default: false
        },
        fullWidth: {
            type: Boolean,
            default: false
        },
        hideRepositoryTitle: {
            type: Boolean,
            default: false
        }
    },
    data: () => ({
        data: {},
        doughnutData: {},
        doughnutOptions: {
            responsive: true,
        },
        miniDoughnutOptions: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true
                }
            }
        },
        currentPage: 0,
        itemsPerPage: 1,
        totalCount: 0,
        isLoading: false,
        hasMoreData: true,
        loadedPages: new Set(),
    }),

    watch: {
      filter: async function(newFilter, oldFilter) {
        const newScmId = newFilter.scmid || "";
        const oldScmId = oldFilter.scmid || "";
        if (newScmId !== oldScmId) {
          this.stopSequentialLoad();    // cancel any in-flight sequential loads
          this.resetPagination();
          await this.loadSequentialPages(9); // or desired number
        }
      }
    },

    methods: {
        resetPagination() {
            this.currentPage = 0;
            this.totalCount = 0;
            this.hasMoreData = true;
            this.loadedPages.clear();
            this.data = {};
            this.doughnutData = {};
        },

        isFullWidth() {
            return this.fullWidth;
        },

        defaultLgCol() {
            return this.isFullWidth() ? 12 : 4;
        },

        defaultMgCol() {
            return this.isFullWidth() ? 12 : 6;
        },

        async loadSequentialPages(pagesToLoad = 1) {
            // create a unique id for this run so we can cancel/stale-check
            const runId = (this._sequentialRunId = (this._sequentialRunId || 0) + 1);
            try {
                for (let i = 0; i < pagesToLoad; i++) {
                    // if a newer run started, stop this one
                    if (this._sequentialRunId !== runId) return;
                    if (!this.hasMoreData) return;

                    // increment page and fetch (getSummaryData will ignore duplicates via loadedPages)
                    const next = this.currentPage + 1;
                    await this.getSummaryData(next, false);
                    this.currentPage = next;

                    if (this.currentPage == this.totalCount)  {
                        this.hasMoreData = false;
                    }

                    if (!this.hasMoreData) return;
                }
            } catch (err) {
                console.error('Sequential load error', err);
            }
        },

        // Stop any ongoing sequential load
        stopSequentialLoad() {
            this._sequentialRunId = (this._sequentialRunId || 0) + 1;
        },

        async getSummaryData(page= 1 , reset = false) {
            // Avoid duplicate requests for the same page
            if (this.loadedPages.has(page) && !reset) {
                return;
            }

            this.isLoading= true;
            this.$emit('loaded', false)

                        try {
                const auth_enabled = process.env.VUE_APP_AUTH_ENABLED === 'true';
                const restrictedSCM = router.currentRoute.value.query.filter?.scmid;

                // Build query with pagination parameters
                const params = new URLSearchParams();
                params.append('summary', 'true');
                params.append('limit', this.itemsPerPage);
                params.append('page', page);

                // Add SCM ID filter if provided
                if (restrictedSCM) {
                    params.append('scmid', restrictedSCM);
                } else if (this.filter?.scmid && this.filter?.scmid !== '') {
                    params.append('scmid', this.filter.scmid);
<<<<<<< HEAD
                }

                 // Add starttime and endtime filters if provided
                if (this.filter?.startTime && this.filter.endTime ) {
                    params.append('start_time', this.filter.startTime);
                    params.append('end_time', this.filter.endTime);
=======
>>>>>>> 5431721 (chore: rename scmid param to filter)
                }

                let query = `${getApiBaseURL()}/pipeline/scms?${params.toString()}`;

                let response;
                if (auth_enabled) {
                    const token = await this.$auth0.getAccessTokenSilently();
                    response = await fetch(query, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                } else {
                    response = await fetch(query);
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const responseData = await response.json();

                // Handle different response structures
                const scmData = responseData.data || responseData.scms || responseData;
                const totalCount = responseData.total_count || 0;

                // Update total count
                this.totalCount = totalCount;

                if (reset) {
                    // Reset data for new search
                    this.data = scmData;
                } else {
                    // Merge new data with existing data
                    this.data = { ...this.data, ...scmData };
                }

                // Mark this page as loaded
                this.loadedPages.add(page);

                // Check if there's more data to load
                this.hasMoreData = Object.keys(this.data).length < this.totalCount;

                // Update doughnut chart data
                this.updateDoughnutData();

            } catch (error) {
                console.error('Error fetching summary data:', error);
                // Handle error appropriately
            } finally {
                this.isLoading = false;
                this.$emit('loaded', true);
            }
        },

        async loadMoreData() {
          if (this.hasMoreData && !this.isLoading) {
            this.stopSequentialLoad();           // ensure previous run is stopped
            await this.loadSequentialPages(3);   // start new sequential load
          }
        },

        // Infinite scroll handler
        handleScroll() {
            const scrollHeight = document.documentElement.scrollHeight;
            const scrollTop = document.documentElement.scrollTop;
            const clientHeight = document.documentElement.clientHeight;

            // Load more data when user is near the bottom (100px threshold)
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                this.loadMoreData();
            }
        },

        resetFilter: function() {
            this.$emit('update-filter', '');
        },

        sanitizeURL: function(url) {
            if (url === undefined) {
                return "";
            }

            url = url.replace(/https?:\/\//, '');
            url = url.replace(/http?:\/\//, '');
            url = url.replace(/github.com\//, '');
            url = url.replace(/gitlab.com\//, '');
            url = url.replace(/\/$/, '');
            url = url.replace(/\.git$/, '');

            return url;
        },

        getGitIcon: function(url) {
            url = url.replace(/https?:\/\//, '');
            url = url.replace(/http?:\/\//, '');

            if (url.startsWith('github.com')) {
                return 'mdi-github';
            } else if (url.startsWith('gitlab.com')) {
                return 'mdi-gitlab';
            } else if (url.startsWith('bitbucket.org')) {
                return 'mdi-bitbucket';
            } else {
                return 'mdi-git';
            }

        },

        getDoughnutData(url, branch) {
          if (!url || !branch) return { labels: [], datasets: [] };
          const d = (this.doughnutData && this.doughnutData[url] && this.doughnutData[url][branch]) || { labels: [], datasets: [] };
          return { labels: Array.isArray(d.labels) ? d.labels : [], datasets: Array.isArray(d.datasets) ? d.datasets : [] };
        },

        hasDoughnutData(url, branch) {
          const d = this.getDoughnutData(url, branch);
          return Array.isArray(d.datasets) && d.datasets.length > 0;
        },

        updateDoughnutData: function(){
            const labels = [
                '✔ Success',
                '⚠ Warning',
                '✗ Error',
                '- Skipped',
                '? Unknown',
            ];
            const labelColors = [
               'rgba(16, 185, 129, 0.7)',  // Green
               'rgba(245, 158, 11, 0.7)',  // Amber
               'rgba(220, 38, 38, 0.7)',   // Red
               'rgba(107, 114, 128, 0.7)', // Gray
               'rgba(139, 92, 246, 0.7)',  // Purple
            ];

            if (this.data === undefined) {
                return;
            }

            for (let url in this.data) {
                for ( let branch in this.data[url] ) {
                    if (this.data[url][branch].total_result === undefined) {
                        continue;
                    }

                    let successResults = 0;
                    let warningResults = 0;
                    let errorResults = 0;
                    let skippedResults = 0;
                    let otherResults = 0;

                    for ( let result in this.data[url][branch].total_result_by_type ) {
                        if (result === '✔') {
                            successResults = this.data[url][branch].total_result_by_type[result];
                        } else if (result === '✗') {
                            errorResults = this.data[url][branch].total_result_by_type[result];
                        } else if (result === '⚠') {
                            warningResults = this.data[url][branch].total_result_by_type[result];
                        } else if (result === '-') {
                            skippedResults = this.data[url][branch].total_result_by_type[result];
                        } else {
                            otherResults += this.data[url][branch].total_result_by_type[result];
                        }
                    }

                    if (this.doughnutData[url] === undefined) {
                        this.doughnutData[url] = {};
                    }

                    if (this.doughnutData[url][branch] === undefined) {
                        this.doughnutData[url][branch] = {};
                    }

                    this.doughnutData[url][branch] = {
                        labels: labels,
                        datasets: [
                            {
                                data: [successResults,warningResults, errorResults, skippedResults, otherResults],
                                backgroundColor: labelColors
                            }
                        ]
                    }
                }
            }
        },

        getStatusColor(status) {
            switch(status) {
                case '✔': return 'success';
                case '⚠': return 'warning';
                case '✗': return 'error';
                case '-': return 'grey';
                default: return 'purple';
            }
        },
    },
    async created() {
        try {
            await this.loadSequentialPages(9);
        } catch(error) {
            console.log(error);
        }
    },
    mounted() {
        // Add infinite scroll listener
        window.addEventListener('scroll', this.handleScroll);
    },

    beforeUnmount() {
        this.stopSequentialLoad();
        // Clean up scroll listener if using infinite scroll
        window.removeEventListener('scroll', this.handleScroll);
    }
}
</script>

<style scoped>
.branch-item {
    transition: background-color 0.2s ease;
}

.branch-item:hover {
    background-color: rgba(0, 0, 0, 0.02);
}

.chart-container {
    width: 100px;
    height: 100px;
    flex-shrink: 0;
}

/* Medium screens and up */
@media (min-width: 768px) {
    .chart-container {
        width: 150px;
        height: 150px;
    }
}

/* Large screens and up */
@media (min-width: 1024px) {
    .chart-container {
        width: 200px;
        height: 140px;
    }
}

.status-summary {
    max-width: 200px;
}

.branch-info {
    min-width: 0; /* Allows text-truncate to work in flex */
}
</style>
